import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Compass, Target, FileDown, ZoomIn, ZoomOut, Maximize, Square, Play } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const ZoomTools = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-[100] no-print">
      <button onClick={() => zoomIn()} className="p-4 bg-white shadow-xl rounded-xl border-2 border-slate-200 hover:bg-slate-50"><ZoomIn size={24}/></button>
      <button onClick={() => zoomOut()} className="p-4 bg-white shadow-xl rounded-xl border-2 border-slate-200 hover:bg-slate-50"><ZoomOut size={24}/></button>
      <button onClick={() => resetTransform()} className="p-4 bg-indigo-600 text-white shadow-xl rounded-xl hover:bg-indigo-700"><Maximize size={24}/></button>
    </div>
  );
};

const Desk = ({ student, isTeacher, updatePosition, rotate, remove, scale }) => {
  const [pos, setPos] = useState({ x: student.x, y: student.y });
  const isDragging = useRef(false);

  useEffect(() => { if (!isDragging.current) setPos({ x: student.x, y: student.y }); }, [student.x, student.y]);

  const onMouseDown = (e) => {
    e.stopPropagation(); // Stops the background from dragging when you touch a seat
    isDragging.current = true;
    const startX = e.clientX; const startY = e.clientY;
    const initialX = pos.x; const initialY = pos.y;
    
    const onMouseMove = (m) => {
      if (!isDragging.current) return;
      const dx = (m.clientX - startX) * (1 / scale);
      const dy = (m.clientY - startY) * (1 / scale);
      setPos({ x: initialX + dx, y: initialY + dy });
    };
    
    const onMouseUp = (m) => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      updatePosition(student.id, initialX + (m.clientX - startX) * (1 / scale), initialY + (m.clientY - startY) * (1 / scale), isTeacher);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div onMouseDown={onMouseDown} style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${student.rotation || 0}deg)`, position: 'absolute', zIndex: isDragging.current ? 1000 : (isTeacher ? 50 : 20) }} className="cursor-grab active:cursor-grabbing">
        <div className={`w-[400px] h-[220px] rounded-2xl shadow-2xl flex items-center justify-center relative border-[12px] ${isTeacher ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-900'}`}>
          <span className={`text-5xl font-black uppercase text-center px-6 select-none ${isTeacher ? 'text-indigo-900' : 'text-slate-900'}`}>{student.name}</span>
          <div className="absolute -top-10 -right-10 flex gap-3 no-print">
              <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id, isTeacher)} className="p-4 bg-indigo-600 text-white rounded-full shadow-lg"><RotateCw size={28}/></button>
              {!isTeacher && <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="p-4 bg-red-600 text-white rounded-full shadow-lg"><Trash2 size={28}/></button>}
          </div>
          <div className={`absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-16 rounded-b-3xl border-x-8 border-b-8 opacity-40 ${isTeacher ? 'bg-indigo-200 border-indigo-600' : 'bg-slate-200 border-slate-900'}`}></div>
        </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('seating');
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-lallravi-v3');
    return saved ? JSON.parse(saved) : { "PERIOD 1": { students: [], teacherDesk: { id: 't1', name: 'TEACHER', x: 2300, y: 300, rotation: 0 } } };
  });
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0]);
  const [newClassName, setNewClassName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentScale, setCurrentScale] = useState(0.4);
  const [volume, setVolume] = useState(0);
  const [threshold, setThreshold] = useState(60);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const floorRef = useRef(null);
  const audioContext = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => { localStorage.setItem('compass-lallravi-v3', JSON.stringify(classes)); }, [classes]);
  const currentData = classes[currentClassName] || { students: [], teacherDesk: null };

  const addClass = () => {
    if (!newClassName) return;
    const name = newClassName.toUpperCase();
    setClasses(prev => ({ ...prev, [name]: { students: [], teacherDesk: { id: Date.now().toString(), name: 'TEACHER', x: 2300, y: 300, rotation: 0 } } }));
    setCurrentClassName(name); setNewClassName("");
  };

  const updatePosition = (id, x, y, isTeacher) => {
    setClasses(p => ({ ...p, [currentClassName]: { ...p[currentClassName], 
      students: isTeacher ? p[currentClassName].students : p[currentClassName].students.map(s => s.id === id ? { ...s, x, y } : s),
      teacherDesk: isTeacher ? { ...p[currentClassName].teacherDesk, x, y } : p[currentClassName].teacherDesk
    }}));
  };

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext)();
      const source = audioContext.current.createMediaStreamSource(stream);
      const analyser = audioContext.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsMonitoring(true); 
      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        let v = 0; for (let i = 0; i < dataArray.length; i++) v += dataArray[i];
        setVolume(v / dataArray.length);
        animationRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (e) { alert("Mic required"); }
  };

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col overflow-hidden font-sans">
      <header className="h-24 bg-white border-b-4 border-slate-200 px-8 flex justify-between items-center z-50 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black uppercase text-indigo-600 italic">CLASSROOM COMPASS BY LALL RAVI</h1>
          <div className="flex gap-4 mt-1">
            <button onClick={() => setActiveTab('seating')} className={`text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-tighter ${activeTab === 'seating' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>Seating</button>
            <button onClick={() => setActiveTab('noise')} className={`text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-tighter ${activeTab === 'noise' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>Noise Monitor</button>
          </div>
        </div>
        {activeTab === 'seating' && (
          <div className="flex gap-3">
            <button onClick={() => {
                toPng(floorRef.current, { backgroundColor: '#ffffff' }).then(url => {
                    const pdf = new jsPDF('l', 'px', [floorRef.current.scrollWidth, floorRef.current.scrollHeight]);
                    pdf.addImage(url, 'PNG', 0, 0, floorRef.current.scrollWidth, floorRef.current.scrollHeight);
                    pdf.save(`${currentClassName}.pdf`);
                });
            }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"><FileDown size={20}/> Save PDF</button>
            <button onClick={() => { if(currentData.students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(currentData.students[Math.floor(Math.random()*currentData.students.length)]);c++;if(c>20)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"><Target size={20}/> Randomizer</button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold">{isSidebarOpen ? "Hide Menu" : "Show Menu"}</button>
          </div>
        )}
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {activeTab === 'seating' ? (
          <>
            <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-r-4 border-slate-100 transition-all duration-300 overflow-hidden z-40 shadow-2xl`}>
              <div className="p-6 w-80 space-y-6">
                <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-500">
                  {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                  <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="NEW CLASS NAME" className="flex-1 p-4 bg-slate-50 border-2 rounded-2xl font-bold text-xs" />
                  <button onClick={addClass} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700"><Plus/></button>
                </div>
                <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste student names..." className="w-full h-48 p-4 bg-slate-50 border-2 rounded-3xl font-medium outline-none" />
                <button onClick={() => {
                  const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
                  const newEntries = names.map((n, i) => ({ id: Date.now() + i, name: n.toUpperCase(), x: 500 + (i % 5 * 600), y: 700 + (Math.floor(i / 5) * 450), rotation: 0 }));
                  setClasses(p => ({ ...p, [currentClassName]: { ...p[currentClassName], students: [...p[currentClassName].students, ...newEntries] } }));
                  setBulkNames("");
                }} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">Generate Students</button>
              </div>
            </aside>
            <main className="flex-1 relative bg-slate-200 overflow-hidden">
              <TransformWrapper 
                initialScale={0.3} 
                minScale={0.05} 
                centerOnInit={true} 
                limitToBounds={false} 
                panning={{ velocityDisabled: true }} 
                onZoom={(ref) => setCurrentScale(ref.state.scale)}
              >
                <ZoomTools />
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%", cursor: "move" }}>
                  <div ref={floorRef} className="relative bg-white shadow-inner" style={{ width: '5000px', height: '4000px' }}>
                    <div className="absolute top-0 w-full h-48 bg-slate-900 flex items-center justify-center border-b-[20px] border-slate-700">
                      <span className="text-white font-black tracking-[1.5em] uppercase text-6xl opacity-40">FRONT OF CLASSROOM</span>
                    </div>
                    {currentData.teacherDesk && <Desk student={currentData.teacherDesk} isTeacher={true} scale={currentScale} updatePosition={updatePosition} rotate={() => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], teacherDesk: {...p[currentClassName].teacherDesk, rotation: (p[currentClassName].teacherDesk.rotation || 0)+90}}}))} />}
                    {currentData.students.map((s) => (
                      <Desk key={s.id} student={s} isTeacher={false} scale={currentScale} updatePosition={updatePosition} rotate={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.map(x=>x.id===id?{...x, rotation:(x.rotation||0)+90}:x)}}))} remove={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.filter(x=>x.id!==id)}}))} />
                    ))}
                  </div>
                </TransformComponent>
              </TransformWrapper>
              {isRandomizing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl">
                  <div className="bg-white p-24 rounded-[5rem] text-center border-[25px] border-indigo-600 shadow-2xl">
                    <h2 className="text-[12rem] font-black text-slate-900 uppercase mb-8 tracking-tighter leading-none">{pickedStudent?.name}</h2>
                    <button onClick={() => setIsRandomizing(false)} className="px-20 py-6 bg-slate-900 text-white rounded-full font-black text-4xl uppercase tracking-widest shadow-2xl">CLOSE</button>
                  </div>
                </div>
              )}
            </main>
          </>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center transition-colors duration-500 ${volume > threshold ? 'bg-red-600 animate-pulse' : 'bg-slate-50'}`}>
            <div className="text-[250px] mb-8">{volume > threshold ? "🤬" : volume > threshold * 0.7 ? "😟" : "😇"}</div>
            <h2 className={`text-9xl font-black mb-12 tracking-tighter ${volume > threshold ? 'text-white' : 'text-slate-900'}`}>{volume > threshold ? "TOO LOUD!" : "SILENCE COMPASS"}</h2>
            <div className="w-[800px] h-16 bg-white rounded-full overflow-hidden border-8 border-slate-200 relative shadow-2xl">
              <div className={`h-full transition-all duration-75 ${volume > threshold ? 'bg-white' : 'bg-indigo-600'}`} style={{ width: `${Math.min((volume/120)*100, 100)}%` }}></div>
            </div>
            <div className="mt-20 flex items-center gap-12">
              {!isMonitoring ? 
                <button onClick={startMonitoring} className="px-16 py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-4xl shadow-2xl hover:scale-105 transition-all">START MONITORING</button> :
                <button onClick={() => { setIsMonitoring(false); cancelAnimationFrame(animationRef.current); if (audioContext.current) audioContext.current.close(); setVolume(0); }} className="px-16 py-8 bg-slate-900 text-white rounded-[3rem] font-black text-4xl shadow-2xl">STOP</button>
              }
              <div className="flex flex-col bg-white p-8 rounded-[2rem] shadow-xl border-4 border-slate-100">
                <span className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Sensitivity</span>
                <input type="range" min="10" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-64 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}