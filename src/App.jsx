import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Target, FileDown, ZoomIn, ZoomOut, Maximize, Square, Play, Users } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const ZoomTools = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-[100] no-print">
      <button onClick={() => zoomIn()} className="p-4 bg-white shadow-xl rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-600"><ZoomIn size={24}/></button>
      <button onClick={() => zoomOut()} className="p-4 bg-white shadow-xl rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-600"><ZoomOut size={24}/></button>
      <button onClick={() => resetTransform()} className="p-4 bg-indigo-600 text-white shadow-xl rounded-xl hover:bg-indigo-700"><Maximize size={24}/></button>
    </div>
  );
};

const Desk = ({ student, isTeacher, updatePosition, rotate, remove, scale }) => {
  const [pos, setPos] = useState({ x: student.x, y: student.y });
  const isDragging = useRef(false);
  useEffect(() => { if (!isDragging.current) setPos({ x: student.x, y: student.y }); }, [student.x, student.y]);

  const onMouseDown = (e) => {
    e.stopPropagation();
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
    const saved = localStorage.getItem('compass-lallravi-v4');
    return saved ? JSON.parse(saved) : { "PERIOD 1": { students: [], teacherDesk: { id: 't1', name: 'TEACHER', x: 2300, y: 300, rotation: 0 } } };
  });
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [newClassName, setNewClassName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentScale, setCurrentScale] = useState(0.4);
  const [volume, setVolume] = useState(0);
  const [threshold, setThreshold] = useState(60);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState([]);
  
  const floorRef = useRef(null);
  const audioContext = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => { localStorage.setItem('compass-lallravi-v4', JSON.stringify(classes)); }, [classes]);
  const currentData = classes[currentClassName] || { students: [], teacherDesk: null };

  const addClass = () => {
    if (!newClassName) return;
    const name = newClassName.toUpperCase();
    setClasses(prev => ({ ...prev, [name]: { students: [], teacherDesk: { id: Date.now().toString(), name: 'TEACHER', x: 2300, y: 300, rotation: 0 } } }));
    setCurrentClassName(name); setNewClassName("");
  };

  const updatePosition = (id, x, y, isTeacher) => {
    setClasses(p => {
        const classData = p[currentClassName];
        if (!classData) return p;
        return { ...p, [currentClassName]: { ...classData, 
            students: isTeacher ? classData.students : classData.students.map(s => s.id === id ? { ...s, x, y } : s),
            teacherDesk: isTeacher ? { ...classData.teacherDesk, x, y } : classData.teacherDesk
        }};
    });
  };

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
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
    } catch (e) { alert("Mic required for Noise Monitor"); }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContext.current) audioContext.current.close();
    setVolume(0);
  };

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col overflow-hidden font-sans">
      <header className="h-24 bg-white border-b-4 border-slate-200 px-8 flex justify-between items-center z-50 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black uppercase text-indigo-600 italic leading-none">CLASSROOM COMPASS BY LALL RAVI</h1>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setActiveTab('seating')} className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter transition-all ${activeTab === 'seating' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>Seating Chart</button>
            <button onClick={() => setActiveTab('noise')} className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter transition-all ${activeTab === 'noise' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>Noise Alarm</button>
            <button onClick={() => setActiveTab('groups')} className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter transition-all ${activeTab === 'groups' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>Group Maker</button>
          </div>
        </div>
        {activeTab === 'seating' && (
          <div className="flex gap-3">
            <button onClick={() => {
                toPng(floorRef.current, { cacheBust: true, width: 5000, height: 4000 }).then(u => { 
                    const p = new jsPDF('l', 'px', [5000, 4000]); 
                    p.addImage(u, 'PNG', 0, 0, 5000, 4000); 
                    p.save(`${currentClassName}-LallRavi.pdf`); 
                });
            }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-md transition-colors">Save PDF</button>
            <button onClick={() => { if(currentData.students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(currentData.students[Math.floor(Math.random()*currentData.students.length)]);c++;if(c>20)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-800 shadow-md transition-colors"><Target size={20}/> Randomizer</button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-black transition-colors">{isSidebarOpen ? "Hide Menu" : "Show Menu"}</button>
          </div>
        )}
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {activeTab === 'seating' && (
          <>
            <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-r-4 border-slate-100 transition-all duration-300 overflow-hidden z-40 shadow-xl`}>
              <div className="p-6 w-80 space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Current Class</label>
                    <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-500">
                    {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">New Class</label>
                    <div className="flex gap-2">
                    <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="PERIOD 2" className="flex-1 p-4 bg-slate-50 border-2 rounded-2xl font-bold text-xs outline-none focus:border-indigo-500" />
                    <button onClick={addClass} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors"><Plus/></button>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Add Students</label>
                    <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names separated by commas..." className="w-full h-40 p-4 bg-slate-50 border-2 rounded-3xl outline-none focus:border-indigo-500 font-medium" />
                </div>
                <button onClick={() => {
                  const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
                  const newEntries = names.map((n, i) => ({ id: Date.now() + i, name: n.toUpperCase(), x: 500 + (i % 5 * 600), y: 700 + (Math.floor(i / 5) * 450), rotation: 0 }));
                  setClasses(p => ({ ...p, [currentClassName]: { ...p[currentClassName], students: [...p[currentClassName].students, ...newEntries] } }));
                  setBulkNames("");
                }} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">Generate Students</button>
              </div>
            </aside>
            <main className="flex-1 relative bg-slate-200 overflow-hidden">
              <TransformWrapper initialScale={0.3} minScale={0.05} centerOnInit={true} limitToBounds={false} onZoom={(ref) => setCurrentScale(ref.state.scale)}>
                <ZoomTools />
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%", cursor: "move" }}>
                  <div ref={floorRef} className="relative bg-white shadow-inner" style={{ width: '5000px', height: '4000px' }}>
                    <div className="absolute top-0 w-full h-48 bg-slate-900 flex items-center justify-center border-b-[20px] border-slate-700">
                      <span className="text-white font-black tracking-[1.5em] uppercase text-6xl opacity-40 select-none">FRONT OF CLASSROOM</span>
                    </div>
                    {currentData.teacherDesk && <Desk student={currentData.teacherDesk} isTeacher={true} scale={currentScale} updatePosition={updatePosition} rotate={() => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], teacherDesk: {...p[currentClassName].teacherDesk, rotation: (p[currentClassName].teacherDesk.rotation || 0)+90}}}))} />}
                    {currentData.students.map((s) => (
                      <Desk key={s.id} student={s} isTeacher={false} scale={currentScale} updatePosition={updatePosition} rotate={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.map(x=>x.id===id?{...x, rotation:(x.rotation||0)+90}:x)}}))} remove={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.filter(x=>x.id!==id)}}))} />
                    ))}
                  </div>
                </TransformComponent>
              </TransformWrapper>
              {isRandomizing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
                  <div className="bg-white p-24 rounded-[5rem] text-center border-[25px] border-indigo-600 shadow-2xl">
                    <h2 className="text-[12rem] font-black text-slate-900 uppercase mb-8 leading-none tracking-tighter">{pickedStudent?.name}</h2>
                    <button onClick={() => setIsRandomizing(false)} className="px-20 py-6 bg-slate-900 text-white rounded-full font-black text-4xl uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform">CLOSE</button>
                  </div>
                </div>
              )}
            </main>
          </>
        )}

        {activeTab === 'noise' && (
          <div className={`flex-1 flex flex-col items-center justify-center transition-colors duration-500 ${volume > threshold ? 'bg-red-600 animate-pulse' : 'bg-slate-50'}`}>
            <div className="text-[250px] mb-8 drop-shadow-2xl">{volume > threshold ? "🤬" : "😇"}</div>
            <h2 className={`text-9xl font-black mb-12 tracking-tighter ${volume > threshold ? 'text-white' : 'text-slate-900'}`}>{volume > threshold ? "TOO LOUD!" : "SILENCE COMPASS"}</h2>
            <div className="w-[800px] h-16 bg-white rounded-full overflow-hidden border-8 border-slate-200 relative shadow-2xl">
              <div className={`h-full transition-all duration-75 ${volume > threshold ? 'bg-white' : 'bg-indigo-600'}`} style={{ width: `${Math.min((volume/120)*100, 100)}%` }}></div>
            </div>
            <div className="mt-16 flex items-center gap-10">
                <button onClick={isMonitoring ? stopMonitoring : startMonitoring} className="px-16 py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-4xl shadow-2xl hover:bg-indigo-800 transition-all uppercase">
                {isMonitoring ? "Stop Mic" : "Start Monitor"}
                </button>
                <div className="flex flex-col bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Sensitivity Threshold</span>
                    <input type="range" min="10" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-64 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="flex-1 bg-slate-50 p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">Random Groups</h2>
                <div className="flex items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Per Group</span>
                    <input type="number" min="1" max="10" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} className="w-20 text-4xl font-black text-indigo-600 border-b-4 border-indigo-600 outline-none" />
                  </div>
                  <button onClick={() => {
                    const shuffled = [...currentData.students].sort(() => 0.5 - Math.random());
                    const groups = [];
                    for (let i = 0; i < shuffled.length; i += groupSize) groups.push(shuffled.slice(i, i + groupSize));
                    setGeneratedGroups(groups);
                  }} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-indigo-800 transition-colors">Shuffle Now</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {generatedGroups.map((group, idx) => (
                  <div key={idx} className="bg-white p-10 rounded-[3rem] shadow-xl border-t-[15px] border-indigo-600 transform hover:-translate-y-2 transition-transform">
                    <h3 className="text-3xl font-black text-indigo-600 mb-8 uppercase tracking-tighter">Group {idx + 1}</h3>
                    <div className="space-y-5">
                      {group.map(s => <div key={s.id} className="text-4xl font-black text-slate-800 uppercase border-l-8 border-slate-100 pl-6 leading-none py-2">{s.name}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}