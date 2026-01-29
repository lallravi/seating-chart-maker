import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Compass, ZoomIn, ZoomOut, Maximize, Target } from 'lucide-react';
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
        transition: isDragging.current ? 'none' : 'transform 0.15s ease-out',
        zIndex: isDragging.current ? 100 : 20
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="w-[2800px] h-[1600px] bg-white border-[60px] border-slate-900 rounded-[12rem] shadow-[0_200px_350px_-50px_rgba(0,0,0,0.5)] flex items-center justify-center relative">
        <span className="text-[400px] font-black uppercase text-center select-none text-slate-900 tracking-tighter">
          {student.name}
        </span>
        <div className="absolute -top-32 -right-32 flex gap-6">
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id)} className="p-24 bg-indigo-600 text-white rounded-full shadow-2xl"><RotateCw size={150}/></button>
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="p-24 bg-red-600 text-white rounded-full shadow-2xl"><Trash2 size={150}/></button>
        </div>
        <div className="absolute -bottom-[350px] w-[900px] h-[350px] bg-slate-800 rounded-b-[18rem] border-x-[50px] border-b-[50px] border-slate-900 shadow-2xl"></div>
      </div>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v45-final');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [newClassName, setNewClassName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.1);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('compass-v45-final', JSON.stringify(classes));
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
    const xSpacing = 3500; 
    const ySpacing = 2800; 

    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 1000 + (i % columns * xSpacing),
      y: 1500 + (Math.floor(i / columns) * ySpacing),
      rotation: 0
    }));

    setClasses(prev => ({ ...prev, [currentClassName]: [...(prev[currentClassName] || []), ...newEntries] }));
    setBulkNames("");
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden">
      <header className="h-32 bg-white border-b-8 border-slate-100 px-12 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-6">
          <Compass className="text-indigo-600" size={56} />
          <h1 className="text-5xl font-black uppercase text-slate-900">{currentClassName}</h1>
        </div>
        <div className="flex gap-4">
            <button onClick={() => { if(students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(students[Math.floor(Math.random()*students.length)]);c++;if(c>30)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-10 py-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl">Randomizer</button>
            <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'map.png'; a.href = d; a.click(); })} className="bg-slate-900 text-white px-10 py-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl">Export</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[500px] bg-white border-r-8 border-slate-50 p-10 flex flex-col z-[60] shrink-0 shadow-2xl">
          <div className="mb-8">
            <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="NEW CLASS..." className="w-full p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 font-black text-xl mb-4 outline-none" />
            <button onClick={() => { if(newClassName) { setClasses(p => ({...p, [newClassName.toUpperCase()]: []})); setCurrentClassName(newClassName.toUpperCase()); setNewClassName(""); }}} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg">Add Period</button>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full mt-4 p-5 bg-slate-900 text-white rounded-2xl font-black text-xl outline-none">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="PASTE NAMES..." className="w-full flex-1 p-8 bg-slate-50 border-4 border-slate-100 rounded-[3rem] font-bold text-2xl outline-none mb-6" />
          <button onClick={processRoster} className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl">Generate Map</button>
        </aside>

        <main className="flex-1 relative bg-slate-100 overflow-hidden">
          {isRandomizing && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white p-24 rounded-[5rem] text-center border-[30px] border-indigo-600 shadow-2xl">
                <h2 className="text-[200px] font-black text-slate-900 uppercase leading-none mb-12">{pickedStudent?.name}</h2>
                <button onClick={() => setIsRandomizing(false)} className="px-16 py-6 bg-slate-900 text-white rounded-full font-black text-2xl uppercase">Close</button>
              </div>
            </div>
          )}

          <TransformWrapper centerOnInit={true} minScale={0.001} initialScale={0.08} limitToBounds={false} panning={{ excluded: ["cursor-grab"] }} onZoom={(ref) => setCurrentScale(ref.state.scale)}>
            <Controls />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white" style={{ width: '50000px', height: '40000px' }}>
                <div className="absolute top-0 w-full h-[3000px] bg-slate-900 flex items-center justify-center z-10">
                   <h2 className="text-white text-[1200px] font-black uppercase tracking-[40rem] translate-x-[20rem]">Whiteboard</h2>
                </div>
                <div className="relative w-full h-full bg-[radial-gradient(#e2e8f0_40px,transparent_40px)] [background-size:3000px_3000px]">
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