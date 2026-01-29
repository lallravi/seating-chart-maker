import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-6 bg-white shadow-2xl rounded-2xl border-2 border-slate-200 hover:bg-slate-50 active:scale-90 transition-all"><ZoomIn size={32} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut(0.2)} className="p-6 bg-white shadow-2xl rounded-2xl border-2 border-slate-200 hover:bg-slate-50 active:scale-90 transition-all"><ZoomOut size={32} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="p-6 bg-indigo-600 shadow-2xl rounded-2xl text-white hover:bg-indigo-700 active:scale-90 transition-all"><Maximize size={32}/></button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v15-nosnap');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [newClassName, setNewClassName] = useState("");
  const [activeTab, setActiveTab] = useState('layout');
  const [name, setName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const floorRef = useRef(null);
  const [currentScale, setCurrentScale] = useState(0.15);

  useEffect(() => {
    localStorage.setItem('compass-v15-nosnap', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];
  
  const updateStudents = (newList) => {
    setClasses(prev => ({ ...prev, [currentClassName]: newList }));
  };

  // FIXED DRAG: Using "onDrag" instead of "onDragEnd" to prevent the snap-back glitch
  const handleDrag = (id, info) => {
    const factor = 1 / currentScale;
    const updated = students.map(s => 
      s.id === id ? { 
        ...s, 
        x: s.x + (info.delta.x * factor), 
        y: s.y + (info.delta.y * factor) 
      } : s
    );
    updateStudents(updated);
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const columns = 5;
    const xGap = 900; 
    const yGap = 600; 

    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 1000 + (i % columns * xGap),
      y: 1000 + (Math.floor(i / columns) * yGap),
      rotation: 0
    }));

    updateStudents([...students, ...newEntries]);
    setBulkNames("");
    setShowBulk(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="h-24 bg-white border-b-4 border-slate-100 px-10 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-600" size={40} />
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">
            {currentClassName} <span className="text-indigo-600 text-lg">PRO</span>
          </h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'classroom.png'; a.href = d; a.click(); })} 
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">
          Export Map
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[450px] bg-white border-r-4 border-slate-100 p-10 flex flex-col z-[60] shrink-0 shadow-2xl overflow-y-auto">
          <div className="mb-10">
            <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">Class List</label>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-xl outline-none">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-6">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="STUDENT NAME" className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl font-black text-2xl outline-none focus:border-indigo-600" />
            <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), x: 1200, y: 1200, rotation: 0 }]); setName(""); } }} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest">Add Student</button>
            
            <div className="pt-4">
              <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="PASTE LIST HERE" className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl font-bold text-lg outline-none" />
              <button onClick={processRoster} className="w-full py-6 mt-4 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest">Process Roster</button>
            </div>
          </div>

          <div className="mt-12 border-t-4 border-slate-50 pt-10">
            <h3 className="text-xs font-black text-slate-300 uppercase mb-6 tracking-widest text-center">Roster Management</h3>
            {students.map(s => (
              <div key={s.id} className="flex justify-between items-center p-5 mb-3 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                <span className="font-bold text-slate-700 text-lg">{s.name}</span>
                <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={24}/></button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-200 overflow-hidden">
          <TransformWrapper 
            centerOnInit={true} 
            minScale={0.01} 
            initialScale={0.15} 
            limitToBounds={false}
            panning={{ excluded: ["desk-handle"] }}
            onZoom={(ref) => setCurrentScale(ref.state.scale)}
          >
            <Controls />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white" style={{ width: '15000px', height: '12000px' }}>
                <div className="absolute top-0 w-full h-[500px] bg-slate-900 flex items-center justify-center z-10">
                   <h2 className="text-white text-[250px] font-black uppercase tracking-[10rem]">WHITEBOARD</h2>
                </div>

                <div className="relative w-full h-full bg-[radial-gradient(#cbd5e1_10px,transparent_10px)] [background-size:300px_300px]">
                  {students.map((student) => (
                    <motion.div 
                      key={student.id} 
                      drag 
                      dragMomentum={false}
                      onDrag={(e, info) => handleDrag(student.id, info)}
                      style={{ x: student.x, y: student.y, rotate: student.rotation, position: 'absolute' }}
                      className="desk-handle cursor-grab active:cursor-grabbing z-20"
                    >
                      <div className="w-[800px] h-[550px] bg-white border-[20px] border-indigo-600 rounded-[8rem] shadow-2xl flex items-center justify-center p-12 relative group">
                        <span className="text-[100px] font-black uppercase text-center select-none text-slate-900 tracking-tighter">
                          {student.name}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-16 -right-16 p-12 bg-indigo-600 text-white rounded-full shadow-2xl">
                          <RotateCw size={64}/>
                        </button>
                        <div className="absolute -bottom-24 w-64 h-24 bg-slate-300 rounded-t-[4rem] -z-10 border-t-[15px] border-slate-400"></div>
                      </div>
                    </motion.div>
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