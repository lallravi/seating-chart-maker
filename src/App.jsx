import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Compass, ZoomIn, ZoomOut, Maximize, Target, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-6 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-8 bg-white shadow-2xl rounded-3xl border-4 border-slate-100 hover:bg-slate-50 transition-all"><ZoomIn size={48} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut(0.2)} className="p-8 bg-white shadow-2xl rounded-3xl border-4 border-slate-100 hover:bg-slate-50 transition-all"><ZoomOut size={48} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="p-8 bg-indigo-600 shadow-2xl rounded-3xl text-white hover:bg-indigo-700 transition-all border-4 border-indigo-400"><Maximize size={48}/></button>
    </div>
  );
};

const Desk = ({ student, updatePosition, rotate, remove, scale }) => {
  const [pos, setPos] = useState({ x: student.x, y: student.y });
  const isDragging = useRef(false);

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
    <div 
      onMouseDown={onMouseDown}
      style={{ 
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${student.rotation || 0}deg)`,
        position: 'absolute',
        transition: isDragging.current ? 'none' : 'transform 0.1s ease-out' 
      }}
      className="cursor-grab active:cursor-grabbing z-20"
    >
      {/* COLOSSAL DESK DESIGN */}
      <div className="w-[3000px] h-[1800px] bg-white border-[80px] border-slate-900 rounded-[15rem] shadow-[0_250px_400px_-50px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center relative">
        <span className="text-[450px] font-black uppercase text-center select-none text-slate-900 tracking-tighter leading-none">
          {student.name}
        </span>

        {/* CONTROLS */}
        <div className="absolute -top-40 -right-40 flex gap-8">
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id)} className="p-32 bg-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 active:rotate-180 transition-all">
                <RotateCw size={200}/>
            </button>
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="p-32 bg-red-500 text-white rounded-full shadow-2xl hover:scale-110 transition-all">
                <Trash2 size={200}/>
            </button>
        </div>

        {/* CHAIR VISUAL */}
        <div className="absolute -bottom-[400px] w-[1000px] h-[400px] bg-slate-800 rounded-b-[20rem] border-x-[60px] border-b-[60px] border-slate-900 shadow-2xl"></div>
      </div>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v40-colossal');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [newClassName, setNewClassName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.04);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('compass-v40-colossal', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];

  const updatePosition = (id, x, y) => {
    setClasses(prev => ({
      ...prev,
      [currentClassName]: prev[currentClassName].map(s => s.id === id ? { ...s, x, y } : s)
    }));
  };

  const rotate = (id) => {
    setClasses(prev => ({
      ...prev,
      [currentClassName]: prev[currentClassName].map(s => s.id === id ? { ...s, rotation: (s.rotation || 0) + 90 } : s)
    }));
  };

  const remove = (id) => {
    setClasses(prev => ({
      ...prev,
      [currentClassName]: prev[currentClassName].filter(s => s.id !== id)
    }));
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    // HUGE SPREAD FOR HUGE DESKS
    const columns = 5;
    const xGap = 4500; 
    const yGap = 3500; 

    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 5000 + (i % columns * xGap),
      y: 6000 + (Math.floor(i / columns) * yGap),
      rotation: 0
    }));

    setClasses(prev => ({ ...prev, [currentClassName]: [...(prev[currentClassName] || []), ...newEntries] }));
    setBulkNames("");
  };

  const startRandomizer = () => {
    if (students.length === 0) return;
    setIsRandomizing(true);
    let count = 0;
    const interval = setInterval(() => {
      setPickedStudent(students[Math.floor(Math.random() * students.length)]);
      count++;
      if (count > 40) {
        clearInterval(interval);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-32 bg-white border-b-8 border-slate-100 px-12 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-6">
          <Compass className="text-indigo-600" size={56} />
          <h1 className="text-5xl font-black uppercase text-slate-900">{currentClassName}</h1>
        </div>
        <div className="flex gap-4">
            <button onClick={startRandomizer} className="bg-indigo-600 text-white px-10 py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl flex items-center gap-3">
                <Target size={32}/> Pick Student
            </button>
            <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'classroom.png'; a.href = d; a.click(); })} className="bg-slate-900 text-white px-10 py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl">
                Export
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[500px] bg-white border-r-8 border-slate-50 p-10 flex flex-col z-[60] shrink-0 shadow-2xl">
          <div className="mb-8">
            <label className="text-xs font-black text-slate-400 uppercase mb-4 block tracking-widest">Period Setup</label>
            <div className="flex gap-4 mb-4">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="PERIOD..." className="flex-1 p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 font-black text-xl outline-none" />
              <button onClick={() => { if(newClassName) { setClasses(p => ({...p, [newClassName.toUpperCase()]: []})); setCurrentClassName(newClassName.toUpperCase()); setNewClassName(""); }}} className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg"><Plus size={32}/></button>
            </div>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black text-xl outline-none">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="PASTE NAMES..." className="w-full h-full p-8 bg-slate-50 border-4 border-slate-100 rounded-[3rem] font-bold text-2xl outline-none mb-6" />
          <button onClick={processRoster} className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl">Generate Grid</button>
        </aside>

        {/* MAIN CANVAS */}
        <main className="flex-1 relative bg-slate-100 overflow-hidden">
          {/* CENTER OVERLAY RANDOMIZER */}
          <AnimatePresence>
            {isRandomizing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-32 rounded-[6rem] text-center border-[40px] border-indigo-600 shadow-[0_0_200px_rgba(79,70,229,0.5)]">
                  <p className="text-indigo-500 font-black text-4xl mb-8 uppercase tracking-[1em]">Picking...</p>
                  <h2 className="text-[250px] font-black text-slate-900 uppercase leading-none mb-16">{pickedStudent?.name}</h2>
                  <button onClick={() => setIsRandomizing(false)} className="px-20 py-8 bg-slate-900 text-white rounded-full font-black text-3xl uppercase tracking-widest">Close</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <TransformWrapper 
            centerOnInit={true} 
            minScale={0.001} 
            initialScale={0.04} 
            limitToBounds={false}
            panning={{ excluded: ["cursor-grab"] }}
            onZoom={(ref) => setCurrentScale(ref.state.scale)}
          >
            <Controls />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white" style={{ width: '60000px', height: '40000px' }}>
                <div className="absolute top-0 w-full h-[4000px] bg-slate-900 flex items-center justify-center z-10">
                   <h2 className="text-white text-[1500px] font-black uppercase tracking-[50rem] translate-x-[25rem]">Whiteboard</h2>
                </div>
                <div className="relative w-full h-full bg-[radial-gradient(#cbd5e1_50px,transparent_50px)] [background-size:4000px_4000px]">
                  {students.map((student) => (
                    <Desk 
                      key={student.id} 
                      student={student} 
                      scale={currentScale} 
                      updatePosition={updatePosition} 
                      rotate={rotate} 
                      remove={remove} 
                    />
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