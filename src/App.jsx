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
    const saved = localStorage.getItem('compass-final-white-v1');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0]);
  const [newClassName, setNewClassName] = useState("");
  const [activeTab, setActiveTab] = useState('layout');
  const [name, setName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('compass-final-white-v1', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];
  const updateStudents = (newList) => setClasses(prev => ({ ...prev, [currentClassName]: newList }));

  // Instant Dragging Fix: No lag because we only update state when finished
  const handleDragEnd = (id, info) => {
    const updated = students.map(s => 
      s.id === id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s
    );
    updateStudents(updated);
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    // MASSIVE SPREAD: Distributes students across a huge 5000px area
    const columns = 5;
    const xGap = 800; 
    const yGap = 500; 

    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 600 + (i % columns * xGap),
      y: 600 + (Math.floor(i / columns) * yGap),
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
            Classroom Compass <span className="text-indigo-600 text-lg">PRO</span>
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
            <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">Select Class</label>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-xl outline-none focus:border-indigo-600">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <nav className="flex bg-slate-100 p-2 rounded-2xl mb-10 border-2 border-slate-200">
            {['layout', 'randomizer'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}>{t}</button>
            ))}
          </nav>

          {activeTab === 'layout' ? (
            <div className="space-y-8">
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl border-2 border-slate-200">
                <button onClick={() => setShowBulk(false)} className={`flex-1 py-3 text-xs font-black rounded-lg uppercase ${!showBulk ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Single</button>
                <button onClick={() => setShowBulk(true)} className={`flex-1 py-3 text-xs font-black rounded-lg uppercase ${showBulk ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Bulk Import</button>
              </div>

              {showBulk ? (
                <div className="space-y-4">
                  <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names here..." className="w-full h-96 p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl font-bold text-lg outline-none focus:border-indigo-600" />
                  <button onClick={processRoster} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl">Process Roster</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ENTER NAME" className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl font-black text-2xl outline-none" />
                  <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), x: 800, y: 800, rotation: 0 }]); setName(""); } }} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest">Add To Floor</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => {
              let count = 0;
              const interval = setInterval(() => {
                setPickedStudent(students[Math.floor(Math.random() * students.length)]);
                count++;
                if (count > 25) clearInterval(interval);
              }, 80);
            }} className="w-full py-24 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-[4rem] font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95">Spin Wheel</button>
          )}

          <div className="mt-12 border-t-4 border-slate-50 pt-10">
            <h3 className="text-xs font-black text-slate-300 uppercase mb-6 tracking-widest text-center">Current Roster ({students.length})</h3>
            {students.map(s => (
              <div key={s.id} className="flex justify-between items-center p-5 mb-3 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                <span className="font-bold text-slate-700 text-lg">{s.name}</span>
                <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={24}/></button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-200 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' && pickedStudent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-slate-900/90 backdrop-blur-xl z-[100] absolute inset-0">
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-white p-40 rounded-[6rem] text-center shadow-[0_0_150px_rgba(255,255,255,0.2)] border-[20px] border-indigo-600">
                  <h2 className="text-[180px] font-black uppercase text-slate-900 leading-none tracking-tighter">{pickedStudent.name}</h2>
                </motion.div>
              </motion.div>
            ) : null}

            <div className="w-full h-full relative">
              <TransformWrapper 
                centerOnInit={true} 
                minScale={0.02} 
                initialScale={0.15} 
                limitToBounds={false}
                panning={{ excluded: ["desk-drag"] }}
              >
                <Controls />
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                  <div ref={floorRef} className="relative bg-white shadow-2xl" style={{ width: '10000px', height: '8000px' }}>
                    {/* GIANT WHITEBOARD LABEL */}
                    <div className="absolute top-0 w-full h-64 bg-slate-900 flex items-center justify-center z-10">
                       <h2 className="text-white text-9xl font-black uppercase tracking-[5rem] translate-x-[2.5rem]">Whiteboard</h2>
                    </div>

                    <div className="relative w-full h-full bg-[radial-gradient(#e2e8f0_6px,transparent_6px)] [background-size:200px_200px]">
                      {students.map((student) => (
                        <motion.div 
                          key={student.id} 
                          drag 
                          dragMomentum={false}
                          onDragEnd={(e, info) => handleDragEnd(student.id, info)}
                          animate={{ x: student.x, y: student.y, rotate: student.rotation }}
                          className="absolute desk-drag cursor-grab active:cursor-grabbing z-20"
                        >
                          {/* MASSIVE DESK VISUAL */}
                          <div className="w-[600px] h-[400px] bg-white border-[12px] border-indigo-600 rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-12 group hover:scale-105 transition-all relative">
                            <span className="text-7xl font-black uppercase text-center select-none text-slate-900 leading-none tracking-tighter">
                              {student.name}
                            </span>
                            {/* Rotate Button */}
                            <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-10 -right-10 p-8 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-slate-900 transition-colors">
                              <RotateCw size={48}/>
                            </button>
                            {/* Visual Chair */}
                            <div className="absolute -bottom-16 w-48 h-20 bg-slate-200 rounded-t-[3rem] -z-10 border-x-[12px] border-t-[12px] border-slate-300"></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TransformComponent>
              </TransformWrapper>
            </div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}