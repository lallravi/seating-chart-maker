import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Download, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-5 bg-white shadow-2xl rounded-2xl border-2 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"><ZoomIn size={28} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut(0.2)} className="p-5 bg-white shadow-2xl rounded-2xl border-2 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"><ZoomOut size={28} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="p-5 bg-indigo-600 shadow-2xl rounded-2xl text-white hover:bg-indigo-700 active:scale-95 transition-all"><Maximize size={28}/></button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('lall-ravi-final-v9');
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
    localStorage.setItem('lall-ravi-final-v9', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];
  
  const updateStudents = (newList) => {
    setClasses(prev => ({ ...prev, [currentClassName]: newList }));
  };

  const handleDragUpdate = (id, info) => {
    const updated = students.map(s => 
      s.id === id ? { ...s, x: s.x + info.delta.x, y: s.y + info.delta.y } : s
    );
    updateStudents(updated);
  };

  const addNewClass = () => {
    if (newClassName.trim()) {
      const caps = newClassName.toUpperCase();
      setClasses(prev => ({ ...prev, [caps]: [] }));
      setCurrentClassName(caps);
      setNewClassName("");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-200 flex flex-col font-sans overflow-hidden">
      {/* BRANDED HEADER */}
      <header className="h-24 bg-white border-b-4 border-slate-300 px-10 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
            <Compass size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
            Classroom Compass <span className="text-indigo-600">by Lall Ravi</span>
          </h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'classroom-layout.png'; a.href = d; a.click(); })} 
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">
          Export Image
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[400px] bg-white border-r-4 border-slate-300 flex flex-col z-[60] shrink-0 shadow-2xl">
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
            
            <div className="mb-10">
              <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Current Period</label>
              <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-xl text-slate-800 mb-5 outline-none focus:border-indigo-500">
                {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-3">
                <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Add Period..." className="flex-1 p-4 bg-slate-100 border-2 border-transparent rounded-xl font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" />
                <button onClick={addNewClass} className="p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg active:scale-90"><Plus size={28}/></button>
              </div>
            </div>

            <div className="flex bg-slate-100 p-2 rounded-[2rem] mb-10 border-2 border-slate-200">
              {['layout', 'groups', 'randomizer'].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white shadow-xl text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
              ))}
            </div>

            <div className="space-y-8">
              {activeTab === 'layout' && (
                <div className="space-y-6">
                  <div className="flex gap-3 p-1.5 bg-slate-100 rounded-2xl border-2 border-slate-200">
                    <button onClick={() => setShowBulk(false)} className={`flex-1 py-3 text-[11px] font-black rounded-xl uppercase transition-all ${!showBulk ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Single</button>
                    <button onClick={() => setShowBulk(true)} className={`flex-1 py-3 text-[11px] font-black rounded-xl uppercase transition-all ${showBulk ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Bulk Import</button>
                  </div>

                  {!showBulk ? (
                    <div className="space-y-4">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ENTER STUDENT NAME" className="w-full p-6 border-4 border-slate-100 rounded-3xl font-black text-2xl focus:border-indigo-500 outline-none shadow-inner" />
                      <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), x: 500, y: 500, rotation: 0 }]); setName(""); } }} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Add To Floor</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste list here..." className="w-full h-80 p-6 border-4 border-slate-100 rounded-3xl font-bold text-lg focus:border-indigo-500 outline-none shadow-inner leading-relaxed" />
                      <button onClick={() => {
                        const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
                        updateStudents([...students, ...names.map((n, i) => ({ id: Date.now()+i, name: n.toUpperCase(), x: 500 + (i*10), y: 500 + (i*10), rotation: 0 }))]);
                        setBulkNames(""); setShowBulk(false);
                      }} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Process Roster</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="p-8 bg-indigo-50 rounded-[3rem] text-center border-4 border-indigo-100 shadow-inner">
                  <p className="text-xs font-black text-indigo-900 mb-5 uppercase tracking-[0.3em]">Students Per Group</p>
                  <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="w-24 p-5 rounded-3xl text-center font-black text-4xl border-4 border-indigo-200 mb-8 bg-white shadow-xl text-indigo-600" />
                  <button onClick={() => {
                    const shuffled = [...students].sort(() => Math.random() - 0.5);
                    const updated = shuffled.map((s, i) => ({
                      ...s,
                      x: 400 + (Math.floor(i / groupSize) % 3 * 700) + (i % 2 * 280),
                      y: 400 + (Math.floor(Math.floor(i / groupSize) / 3) * 500) + (Math.floor((i % groupSize) / 2) * 200)
                    }));
                    updateStudents(updated);
                  }} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:scale-105 transition-all">Shuffle Formations</button>
                </div>
              )}

              {activeTab === 'randomizer' && (
                <div className="text-center">
                  <button onClick={() => {
                    let count = 0;
                    const interval = setInterval(() => {
                      setPickedStudent(students[Math.floor(Math.random() * students.length)]);
                      count++;
                      if (count > 25) clearInterval(interval);
                    }, 60);
                  }} className="w-full py-20 bg-gradient-to-br from-indigo-600 to-purple-800 text-white rounded-[4rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Spin The Wheel</button>
                </div>
              )}

              <div className="mt-12 border-t-4 border-slate-50 pt-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Roster ({students.length})</h3>
                  <button onClick={() => { if(window.confirm("Delete entire roster?")) updateStudents([]); }} className="text-xs font-bold text-red-400 uppercase">Clear All</button>
                </div>
                <div className="space-y-4">
                  {students.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] text-sm font-black border-2 border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                      <span className="text-slate-600 group-hover:text-indigo-600">{s.name}</span>
                      <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={22}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN STAGE */}
        <main className="flex-1 relative bg-slate-300 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-slate-900">
                {pickedStudent && (
                  <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white p-32 rounded-[6rem] text-center shadow-[0_0_150px_rgba(0,0,0,0.5)] border-[24px] border-indigo-600">
                    <p className="text-indigo-600 font-black mb-8 uppercase tracking-[1em] text-sm">Now Speaking</p>
                    <h2 className="text-[160px] font-black uppercase text-slate-900 leading-none tracking-tighter">{pickedStudent.name}</h2>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full relative cursor-crosshair">
                <TransformWrapper 
                  centerOnInit={true} 
                  minScale={0.05} 
                  maxScale={1.5}
                  initialScale={0.3} 
                  limitToBounds={false}
                  panning={{ excluded: ["motion-div"] }} // This stops the floor from moving when dragging names
                >
                  <Controls />
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div ref={floorRef} className="relative bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] rounded-[5rem] border-[40px] border-white" style={{ width: '5000px', height: '4000px' }}>
                      <div className="w-full h-40 bg-slate-900 text-white flex items-center justify-center font-black uppercase tracking-[3em] text-xl sticky top-0 z-20">
                        Front Of Classroom / Whiteboard
                      </div>
                      <div className="relative w-full h-full bg-[radial-gradient(#e2e8f0_4px,transparent_4px)] [background-size:100px_100px]">
                        {students.map((student) => (
                          <motion.div 
                            key={student.id} 
                            drag 
                            dragMomentum={false} 
                            onDrag={(e, info) => handleDragUpdate(student.id, info)}
                            style={{ x: student.x, y: student.y, rotate: student.rotation }}
                            className="absolute cursor-grab active:cursor-grabbing motion-div z-10"
                          >
                            {/* THE DESK VISUAL */}
                            <div className="w-[320px] h-[200px] bg-white border-8 border-slate-100 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-8 group hover:border-indigo-500 transition-colors relative">
                              {/* Desk Top Detail */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-2 bg-slate-100 rounded-b-full group-hover:bg-indigo-100 transition-colors"></div>
                              
                              <span className="text-2xl font-black uppercase text-center select-none text-slate-800 leading-none tracking-tighter w-full overflow-hidden whitespace-nowrap overflow-ellipsis">
                                {student.name}
                              </span>

                              {/* Rotation Button */}
                              <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-6 -right-6 p-4 bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:bg-indigo-600 scale-90 hover:scale-100 active:scale-75">
                                <RotateCw size={24}/>
                              </button>
                              
                              {/* Chair Indicator */}
                              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20 h-8 bg-slate-200 rounded-t-xl group-hover:bg-indigo-200 transition-colors -z-10"></div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
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