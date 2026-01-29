import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Target, FileDown, ZoomIn, ZoomOut, Maximize, Square, Play, Users, Shuffle } from 'lucide-react';
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

  useEffect(() => { 
    if (!isDragging.current) setPos({ x: student.x, y: student.y }); 
  }, [student.x, student.y]);

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
    const saved = localStorage.getItem('compass-lallravi-v6');
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
  
  const floorRef = useRef(null);
  const audioContext = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => { localStorage.setItem('compass-lallravi-v6', JSON.stringify(classes)); }, [classes]);
  const currentData = classes[currentClassName] || { students: [], teacherDesk: null };

  const arrangeIntoGroups = () => {
    const students = [...currentData.students].sort(() => 0.5 - Math.random());
    const updatedStudents = students.map((student, index) => {
      const groupIndex = Math.floor(index / groupSize);
      const indexInGroup = index % groupSize;
      
      // Grid settings for groups
      const groupsPerRow = 3;
      const groupSpacingX = 1200;
      const groupSpacingY = 1000;
      const deskSpacing = 450;

      const groupX = (groupIndex % groupsPerRow) * groupSpacingX + 500;
      const groupY = Math.floor(groupIndex / groupsPerRow) * groupSpacingY + 800;

      // Arrange desks within the group cluster
      const offsetX = (indexInGroup % 2) * deskSpacing;
      const offsetY = Math.floor(indexInGroup / 2) * 300;

      return { ...student, x: groupX + offsetX, y: groupY + offsetY };
    });

    setClasses(p => ({
      ...p,
      [currentClassName]: { ...p[currentClassName], students: updatedStudents }
    }));
  };

  const updatePosition = (id, x, y, isTeacher) => {
    setClasses(p => ({ ...p, [currentClassName]: { ...p[currentClassName], 
        students: isTeacher ? p[currentClassName].students : p[currentClassName].students.map(s => s.id === id ? { ...s, x, y } : s),
        teacherDesk: isTeacher ? { ...p[currentClassName].teacherDesk, x, y } : p[currentClassName].teacherDesk
    }}));
  };

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col overflow-hidden font-sans">
      <header className="h-24 bg-white border-b-4 border-slate-200 px-8 flex justify-between items-center z-50 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black uppercase text-indigo-600 italic leading-none">CLASSROOM COMPASS BY LALL RAVI</h1>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setActiveTab('seating')} className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase transition-all ${activeTab === 'seating' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200'}`}>Seating & Groups</button>
            <button onClick={() => setActiveTab('noise')} className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase transition-all ${activeTab === 'noise' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200'}`}>Noise Alarm</button>
          </div>
        </div>
        {activeTab === 'seating' && (
          <div className="flex gap-3">
            <button onClick={() => toPng(floorRef.current, { width: 5000, height: 4000 }).then(u => { const p=new jsPDF('l','px',[5000,4000]); p.addImage(u,'PNG',0,0,5000,4000); p.save(`${currentClassName}.pdf`); })} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-colors">Save PDF</button>
            <button onClick={() => { if(currentData.students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(currentData.students[Math.floor(Math.random()*currentData.students.length)]);c++;if(c>20)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-indigo-800 transition-colors"><Target size={20}/> Randomizer</button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-black transition-colors">{isSidebarOpen ? "Hide Menu" : "Show Menu"}</button>
          </div>
        )}
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {activeTab === 'seating' && (
          <>
            <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-r-4 border-slate-100 transition-all duration-300 overflow-y-auto z-40 shadow-xl`}>
              <div className="p-6 w-80 space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Class</label>
                    <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-500">
                    {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* INTEGRATED GROUP REARRANGER */}
                <div className="p-5 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 space-y-4">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2"><Users size={14}/> Group Creator</label>
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-indigo-900">Size:</span>
                        <input type="number" min="2" max="10" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} className="w-12 bg-transparent text-2xl font-black text-indigo-600 text-right outline-none" />
                    </div>
                    <button onClick={arrangeIntoGroups} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                        <Shuffle size={16}/> Rearrange into Groups
                    </button>
                    <p className="text-[9px] text-indigo-400 font-bold text-center leading-tight uppercase">This will move all desks into clusters</p>
                </div>

                <div className="space-y-1 pt-4 border-t-2 border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roster Import</label>
                    <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Names..." className="w-full h-32 p-4 bg-slate-50 border-2 rounded-2xl text-xs font-medium outline-none" />
                    <button onClick={() => {
                      const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
                      const newEntries = names.map((n, i) => ({ id: Date.now() + i, name: n.toUpperCase(), x: 500 + (i % 5 * 600), y: 700 + (Math.floor(i / 5) * 450), rotation: 0 }));
                      setClasses(p => ({ ...p, [currentClassName]: { ...p[currentClassName], students: [...p[currentClassName].students, ...newEntries] } }));
                      setBulkNames("");
                    }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-2 hover:bg-black transition-colors">Add to Floor</button>
                </div>

                <button onClick={() => { const n=prompt("CLASS NAME:")?.toUpperCase(); if(n) {setClasses(p=>({...p,[n]:{students:[],teacherDesk:{id:Date.now(),name:'TEACHER',x:2300,y:300,rotation:0}}})); setCurrentClassName(n);}}} className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-colors">Add New Period</button>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
                  <div className="bg-white p-24 rounded-[5rem] text-center border-[25px] border-indigo-600 shadow-2xl">
                    <h2 className="text-[12rem] font-black text-slate-900 uppercase mb-8 leading-none tracking-tighter">{pickedStudent?.name}</h2>
                    <button onClick={() => setIsRandomizing(false)} className="px-20 py-6 bg-slate-900 text-white rounded-full font-black text-4xl uppercase tracking-widest shadow-2xl">CLOSE</button>
                  </div>
                </div>
              )}
            </main>
          </>
        )}

        {activeTab === 'noise' && (
          <div className={`flex-1 flex flex-col items-center justify-center transition-colors duration-500 ${volume > threshold ? 'bg-red-600 animate-pulse' : 'bg-slate-50'}`}>
            <div className="text-[250px] mb-8">{volume > threshold ? "🤬" : "😇"}</div>
            <h2 className={`text-9xl font-black mb-12 tracking-tighter ${volume > threshold ? 'text-white' : 'text-slate-900'}`}>{volume > threshold ? "TOO LOUD!" : "SILENCE COMPASS"}</h2>
            <div className="w-[800px] h-16 bg-white rounded-full overflow-hidden border-8 border-slate-200 relative shadow-2xl">
              <div className={`h-full transition-all duration-75 ${volume > threshold ? 'bg-white' : 'bg-indigo-600'}`} style={{ width: `${Math.min((volume/120)*100, 100)}%` }}></div>
            </div>
            <button onClick={isMonitoring ? () => { setIsMonitoring(false); cancelAnimationFrame(animationRef.current); audioContext.current.close(); setVolume(0); } : async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const ctx = new AudioContext(); audioContext.current = ctx;
                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser(); analyser.fftSize = 256; source.connect(analyser);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                setIsMonitoring(true); 
                const update = () => { analyser.getByteFrequencyData(dataArray); let v=0; for(let i=0;i<dataArray.length;i++) v+=dataArray[i]; setVolume(v/dataArray.length); animationRef.current = requestAnimationFrame(update); };
                update();
            }} className="mt-20 px-16 py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-4xl shadow-2xl uppercase">
              {isMonitoring ? "Stop Mic" : "Start Monitor"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}