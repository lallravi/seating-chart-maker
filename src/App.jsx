import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Plus, Trash2, RotateCw, Download, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-5 bg-slate-900 shadow-2xl rounded-2xl border border-slate-700 hover:bg-indigo-600 active:scale-90 transition-all text-white"><ZoomIn size={28}/></button>
      <button onClick={() => zoomOut(0.2)} className="p-5 bg-slate-900 shadow-2xl rounded-2xl border border-slate-700 hover:bg-indigo-600 active:scale-90 transition-all text-white"><ZoomOut size={28}/></button>
      <button onClick={() => resetTransform()} className="p-5 bg-indigo-600 shadow-2xl rounded-2xl text-white hover:bg-indigo-500 active:scale-90 transition-all border border-indigo-400"><Maximize size={28}/></button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('lall-ravi-modern-v10');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0]);
  const [newClassName, setNewClassName] = useState("");
  const [activeTab, setActiveTab] = useState('layout');
  const [name, setName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const [pickedStudent, setPickedStudent] = useState(null);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('lall-ravi-modern-v10', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];
  const updateStudents = (newList) => setClasses(prev => ({ ...prev, [currentClassName]: newList }));

  // FAST DRAGGING: Updates state only on release to keep movement smooth
  const handleDragEnd = (id, info) => {
    const updated = students.map(s => 
      s.id === id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s
    );
    updateStudents(updated);
  };

  const handleProcessRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const cols = 6;
    const spacingX = 450;
    const spacingY = 300;
    
    const newStudents = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 400 + (i % cols * spacingX),
      y: 400 + (Math.floor(i / cols) * spacingY),
      rotation: 0
    }));
    
    updateStudents([...students, ...newStudents]);
    setBulkNames("");
    setShowBulk(false);
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col font-sans overflow-hidden text-slate-200">
      {/* MODERN HEADER */}
      <header className="h-20 bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-800 px-10 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Compass size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">
            Compass <span className="text-indigo-400">Pro</span>
          </h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'map.png'; a.href = d; a.click(); })} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">
          Export Blueprint
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-80 lg:w-96 bg-[#1e293b] border-r border-slate-800 flex flex-col z-[60] shrink-0 shadow-2xl">
          <div className="p-8 overflow-y-auto flex-1">
            
            <div className="mb-8">
              <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block tracking-widest">Active Class</label>
              <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-4 bg-slate-900 border border-slate-700 rounded-2xl font-bold text-slate-200 outline-none focus:border-indigo-500">
                {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <nav className="flex bg-slate-900 p-1.5 rounded-2xl mb-8 border border-slate-800">
              {['layout', 'groups', 'randomizer'].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
              ))}
            </nav>

            <div className="space-y-6">
              {activeTab === 'layout' && (
                <div className="space-y-4">
                  <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                    <button onClick={() => setShowBulk(false)} className={`flex-1 py-2 text-[10px] font-black rounded-lg uppercase ${!showBulk ? 'bg-slate-800 text-indigo-400' : 'text-slate-600'}`}>Single</button>
                    <button onClick={() => setShowBulk(true)} className={`flex-1 py-2 text-[10px] font-black rounded-lg uppercase ${showBulk ? 'bg-slate-800 text-indigo-400' : 'text-slate-600'}`}>Bulk</button>
                  </div>
                  {!showBulk ? (
                    <div className="space-y-3">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="STUDENT NAME" className="w-full p-5 bg-slate-900 border border-slate-700 rounded-2xl font-black text-lg focus:border-indigo-500 outline-none" />
                      <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), x: 500, y: 500, rotation: 0 }]); setName(""); } }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest">Add To Floor</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names (one per line)..." className="w-full h-64 p-5 bg-slate-900 border border-slate-700 rounded-2xl font-medium text-sm focus:border-indigo-500 outline-none" />
                      <button onClick={handleProcessRoster} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Process Roster</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'randomizer' && (
                <button onClick={() => {
                  let count = 0;
                  const interval = setInterval(() => {
                    setPickedStudent(students[Math.floor(Math.random() * students.length)]);
                    count++;
                    if (count > 20) clearInterval(interval);
                  }, 80);
                }} className="w-full py-16 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">Spin Picker</button>
              )}

              <div className="mt-8 border-t border-slate-800 pt-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Manifest ({students.length})</h3>
                <div className="space-y-2">
                  {students.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-xs font-bold group">
                      <span className="text-slate-400 group-hover:text-indigo-400">{s.name}</span>
                      <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-600 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CANVAS */}
        <main className="flex-1 relative bg-[#0f172a] overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-slate-950">
                {pickedStudent && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-slate-900 p-24 rounded-[5rem] text-center shadow-[0_0_100px_rgba(99,102,241,0.2)] border-8 border-indigo-500">
                    <h2 className="text-[120px] font-black uppercase text-white leading-none tracking-tighter">{pickedStudent.name}</h2>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full relative">
                <TransformWrapper 
                  centerOnInit={true} 
                  minScale={0.05} 
                  initialScale={0.3} 
                  limitToBounds={false}
                  panning={{ excluded: ["student-desk"] }}
                >
                  <Controls />
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div ref={floorRef} className="relative bg-[#0f172a] shadow-inner" style={{ width: '6000px', height: '4000px' }}>
                      {/* GRID PATTERN */}
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_2px,transparent_2px)] [background-size:100px_100px]"></div>
                      
                      {/* FRONT OF CLASS */}
                      <div className="absolute top-0 w-full h-32 bg-slate-900 border-b-4 border-indigo-500 flex items-center justify-center font-black uppercase tracking-[3em] text-sm text-indigo-400 z-10">
                        Whiteboard Area
                      </div>

                      {students.map((student) => (
                        <motion.div 
                          key={student.id} 
                          drag 
                          dragMomentum={false}
                          onDragEnd={(e, info) => handleDragEnd(student.id, info)}
                          initial={false}
                          animate={{ x: student.x, y: student.y, rotate: student.rotation }}
                          className="absolute student-desk cursor-grab active:cursor-grabbing z-20"
                        >
                          {/* THE DESK - MODERN COLORED THEME */}
                          <div className="w-[340px] h-[220px] bg-slate-800 border-4 border-slate-700 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-8 group hover:border-indigo-500 hover:bg-slate-750 transition-colors relative">
                            
                            {/* Desk Top Detail */}
                            <div className="absolute top-4 w-28 h-2 bg-slate-700 rounded-full group-hover:bg-indigo-900"></div>
                            
                            <span className="text-3xl font-black uppercase text-center select-none text-white leading-tight tracking-tighter drop-shadow-md">
                              {student.name}
                            </span>

                            {/* Rotate Button */}
                            <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-4 -right-4 p-4 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-indigo-500 scale-90 hover:scale-100">
                              <RotateCw size={24}/>
                            </button>
                            
                            {/* Chair indicator (Visual Only) */}
                            <div className="absolute -bottom-8 w-24 h-10 bg-slate-700 rounded-t-2xl -z-10 border-t-4 border-slate-600 group-hover:bg-indigo-900 group-hover:border-indigo-800 transition-colors"></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TransformComponent>
                </TransformWrapper>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}