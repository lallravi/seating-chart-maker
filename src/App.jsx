import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Compass, ZoomIn, ZoomOut, Maximize, Target, ChevronLeft, ChevronRight, Users, LayoutGrid } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-6 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-8 bg-white shadow-2xl rounded-3xl border-4 border-slate-200 hover:bg-slate-50 transition-all"><ZoomIn size={48} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut(0.2)} className="p-8 bg-white shadow-2xl rounded-3xl border-4 border-slate-200 hover:bg-slate-50 transition-all"><ZoomOut size={48} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="p-8 bg-indigo-600 shadow-2xl rounded-3xl text-white hover:bg-indigo-700 transition-all border-4 border-indigo-400"><Maximize size={48}/></button>
    </div>
  );
};

const Desk = ({ student, updatePosition, rotate, remove, scale }) => {
  const [pos, setPos] = useState({ x: student.x, y: student.y });
  const isDragging = useRef(false);

  useEffect(() => { setPos({ x: student.x, y: student.y }); }, [student.x, student.y]);

  const onMouseDown = (e) => {
    isDragging.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = pos.x;
    const initialY = pos.y;

    const onMouseMove = (moveEvent) => {
      if (!isDragging.current) return;
      const dx = (moveEvent.clientX - startX) * (1 / scale);
      const dy = (moveEvent.clientY - startY) * (1 / scale);
      setPos({ x: initialX + dx, y: initialY + dy });
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      updatePosition(student.id, pos.x, pos.y);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div onMouseDown={onMouseDown} style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${student.rotation || 0}deg)`, position: 'absolute', transition: isDragging.current ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)', zIndex: isDragging.current ? 100 : 20 }} className="cursor-grab active:cursor-grabbing">
      <div className="w-[4500px] h-[2200px] bg-white border-[100px] border-slate-900 rounded-[20rem] shadow-[0_300px_500px_-50px_rgba(0,0,0,0.6)] flex items-center justify-center relative">
        <span className="text-[650px] font-black uppercase text-center select-none text-slate-900 tracking-tighter">{student.name}</span>
        <div className="absolute -top-48 -right-48 flex gap-10">
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id)} className="p-32 bg-indigo-600 text-white rounded-full shadow-2xl"><RotateCw size={250}/></button>
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="p-32 bg-red-600 text-white rounded-full shadow-2xl"><Trash2 size={250}/></button>
        </div>
        <div className="absolute -bottom-[450px] w-[1500px] h-[450px] bg-slate-800 rounded-b-[25rem] border-x-[80px] border-b-[80px] border-slate-900 shadow-2xl"></div>
      </div>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v70-ultimate');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [activeTab, setActiveTab] = useState('roster');
  const [newClassName, setNewClassName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.04);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [groupSize, setGroupSize] = useState(4);
  const floorRef = useRef(null);

  useEffect(() => { localStorage.setItem('compass-v70-ultimate', JSON.stringify(classes)); }, [classes]);
  const students = classes[currentClassName] || [];

  const updatePosition = (id, x, y) => {
    setClasses(prev => ({ ...prev, [currentClassName]: prev[currentClassName].map(s => s.id === id ? { ...s, x, y } : s) }));
  };

  const rotate = (id) => {
    setClasses(prev => ({ ...prev, [currentClassName]: prev[currentClassName].map(s => s.id === id ? { ...s, rotation: (s.rotation || 0) + 90 } : s) }));
  };

  const remove = (id) => {
    setClasses(prev => ({ ...prev, [currentClassName]: prev[currentClassName].filter(s => s.id !== id) }));
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const columns = 4;
    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 3000 + (i % columns * 6000),
      y: 5000 + (Math.floor(i / columns) * 4500),
      rotation: 0
    }));
    setClasses(prev => ({ ...prev, [currentClassName]: [...(prev[currentClassName] || []), ...newEntries] }));
    setBulkNames("");
  };

  const makeGroups = () => {
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const newStudents = shuffled.map((s, i) => {
        const groupIndex = Math.floor(i / groupSize);
        const memberIndex = i % groupSize;
        const row = Math.floor(groupIndex / 3);
        const col = groupIndex % 3;
        return {
            ...s,
            x: 4000 + (col * 15000) + (memberIndex % 2 * 4800),
            y: 6000 + (row * 10000) + (Math.floor(memberIndex / 2) * 2500)
        };
    });
    setClasses(prev => ({ ...prev, [currentClassName]: newStudents }));
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden">
      <header className="h-32 bg-white border-b-8 border-slate-100 px-12 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 bg-slate-100 rounded-2xl hover:bg-indigo-100 transition-colors">
            {isSidebarOpen ? <ChevronLeft size={48} /> : <ChevronRight size={48} />}
          </button>
          <Compass className="text-indigo-600" size={56} />
          <h1 className="text-5xl font-black uppercase text-slate-900">{currentClassName}</h1>
        </div>
        <div className="flex gap-4">
            <button onClick={() => { if(students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(students[Math.floor(Math.random()*students.length)]);c++;if(c>30)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-10 py-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl">Randomizer</button>
            <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'map.png'; a.href = d; a.click(); })} className="bg-slate-900 text-white px-10 py-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl">Export</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`bg-white border-r-8 border-slate-50 p-10 flex flex-col z-[60] shrink-0 shadow-2xl transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-[550px]' : 'w-0 -translate-x-full p-0 border-none'}`}>
          <div className={`${!isSidebarOpen && 'hidden'}`}>
            <nav className="flex bg-slate-100 p-2 rounded-3xl mb-8">
                {['roster', 'groups'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-sm transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>{t}</button>
                ))}
            </nav>

            {activeTab === 'roster' ? (
                <div className="space-y-6">
                    <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="CLASS NAME..." className="w-full p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 font-black text-xl outline-none" />
                    <button onClick={() => { if(newClassName) { setClasses(p => ({...p, [newClassName.toUpperCase()]: []})); setCurrentClassName(newClassName.toUpperCase()); setNewClassName(""); }}} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase">Add New Period</button>
                    <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black text-xl outline-none">
                        {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="PASTE ROSTER..." className="w-full h-[300px] p-8 bg-slate-50 border-4 border-slate-100 rounded-[3rem] font-bold text-2xl outline-none" />
                    <button onClick={processRoster} className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl">Generate Grid</button>
                </div>
            ) : (
                <div className="space-y-10 py-10">
                    <div className="bg-slate-50 p-8 rounded-[3rem] border-4 border-slate-100">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 block">Students Per Group</label>
                        <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="w-full p-6 rounded-2xl bg-white border-4 border-slate-200 font-black text-4xl text-indigo-600 outline-none" />
                    </div>
                    <button onClick={makeGroups} className="w-full py-12 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4">
                        <Users size={48}/> Mix Groups
                    </button>
                </div>
            )}
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-100 overflow-hidden">
          {isRandomizing && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl">
              <div className="bg-white p-32 rounded-[6rem] text-center border-[40px] border-indigo-600 shadow-2xl">
                <h2 className="text-[300px] font-black text-slate-900 uppercase leading-none mb-12 animate-bounce">{pickedStudent?.name}</h2>
                <button onClick={() => setIsRandomizing(false)} className="px-20 py-8 bg-slate-900 text-white rounded-full font-black text-3xl uppercase">Close</button>
              </div>
            </div>
          )}

          <TransformWrapper centerOnInit={true} minScale={0.001} initialScale={0.04} limitToBounds={false} panning={{ excluded: ["cursor-grab"] }} onZoom={(ref) => setCurrentScale(ref.state.scale)}>
            <Controls />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white" style={{ width: '80000px', height: '60000px' }}>
                <div className="absolute top-0 w-full h-[5000px] bg-slate-900 flex items-center justify-center z-10 shadow-2xl">
                   <h2 className="text-white text-[1800px] font-black uppercase tracking-[60rem] translate-x-[30rem]">Whiteboard</h2>
                </div>
                <div className="relative w-full h-full bg-[radial-gradient(#cbd5e1_80px,transparent_80px)] [background-size:10000px_10000px]">
                  {students.map((s) => (
                    <Desk key={s.id} student={s} scale={currentScale} updatePosition={updatePosition} rotate={rotate} remove={remove} />
                  ))}
                </div>
              </div>
            </TransformComponent>
          </TransformWrapper>
        </main>
      </div>
    </div>
  );
}