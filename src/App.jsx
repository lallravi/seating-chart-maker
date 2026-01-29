import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
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

// INDIVIDUAL DESK COMPONENT: This isolates the logic so one desk doesn't lag the others
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
      // Multiplying by (1/scale) ensures the desk follows the mouse perfectly regardless of zoom
      const dx = (moveEvent.clientX - startX) * (1 / scale);
      const dy = (moveEvent.clientY - startY) * (1 / scale);
      setPos({ x: initialX + dx, y: initialY + dy });
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Only sync back to the main app state when the user lets go
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
      <div className="w-[1400px] h-[900px] bg-white border-[40px] border-indigo-600 rounded-[15rem] shadow-[0_120px_200px_-50px_rgba(0,0,0,0.5)] flex items-center justify-center p-24 relative group">
        <span className="text-[200px] font-black uppercase text-center select-none text-slate-900 tracking-tighter">
          {student.name}
        </span>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id)} className="absolute -top-24 -right-24 p-20 bg-indigo-600 text-white rounded-full shadow-2xl">
          <RotateCw size={120}/>
        </button>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="absolute -top-24 -left-24 p-10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 size={80}/>
        </button>
        <div className="absolute -bottom-48 w-[400px] h-48 bg-slate-200 rounded-t-[8rem] -z-10 border-t-[30px] border-slate-300"></div>
      </div>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v30-ultra');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [newClassName, setNewClassName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [currentScale, setCurrentScale] = useState(0.08);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('compass-v30-ultra', JSON.stringify(classes));
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
    const columns = 5;
    const xGap = 1800; 
    const yGap = 1200; 

    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 2000 + (i % columns * xGap),
      y: 2500 + (Math.floor(i / columns) * yGap),
      rotation: 0
    }));

    setClasses(prev => ({ ...prev, [currentClassName]: [...(prev[currentClassName] || []), ...newEntries] }));
    setBulkNames("");
  };

  const addNewClass = () => {
    if (newClassName.trim()) {
      const name = newClassName.toUpperCase();
      setClasses(prev => ({ ...prev, [name]: [] }));
      setCurrentClassName(name);
      setNewClassName("");
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden">
      <header className="h-32 bg-white border-b-8 border-slate-50 px-12 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-6">
          <Compass className="text-indigo-600" size={56} />
          <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-900">{currentClassName}</h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'classroom.png'; a.href = d; a.click(); })} className="bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Export Map</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[550px] bg-white border-r-8 border-slate-50 p-12 flex flex-col z-[60] shrink-0 shadow-2xl overflow-y-auto">
          <div className="mb-12">
            <label className="text-sm font-black text-slate-300 uppercase mb-4 block tracking-[0.2em]">Class Periods</label>
            <div className="flex gap-4 mb-4">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="PERIOD 2..." className="flex-1 p-6 rounded-3xl bg-slate-50 border-4 border-slate-100 font-black text-xl outline-none focus:border-indigo-600" />
              <button onClick={addNewClass} className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl hover:bg-indigo-700 transition-all"><Plus size={32}/></button>
            </div>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-6 bg-slate-900 text-white rounded-3xl font-black text-2xl outline-none cursor-pointer">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-8">
            <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="PASTE NAMES..." className="w-full h-[600px] p-10 bg-slate-50 border-4 border-slate-100 rounded-[4rem] font-bold text-2xl outline-none focus:border-indigo-600" />
            <button onClick={processRoster} className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Process Roster</button>
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-100 overflow-hidden">
          <TransformWrapper 
            centerOnInit={true} 
            minScale={0.01} 
            initialScale={0.08} 
            limitToBounds={false}
            panning={{ excluded: ["cursor-grab"] }}
            onZoom={(ref) => setCurrentScale(ref.state.scale)}
          >
            <Controls />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white" style={{ width: '30000px', height: '20000px' }}>
                <div className="absolute top-0 w-full h-[1500px] bg-slate-900 flex items-center justify-center z-10 shadow-2xl">
                   <h2 className="text-white text-[800px] font-black uppercase tracking-[30rem] translate-x-[15rem]">Whiteboard</h2>
                </div>
                <div className="relative w-full h-full bg-[radial-gradient(#e2e8f0_20px,transparent_20px)] [background-size:1000px_1000px]">
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