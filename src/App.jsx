import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Download, Layout, Group, Sparkles, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

// These are the buttons you needed back
const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-[100]">
      <button onClick={() => zoomIn()} className="p-3 bg-white shadow-lg rounded-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-90">
        <ZoomIn size={20} className="text-indigo-600"/>
      </button>
      <button onClick={() => zoomOut()} className="p-3 bg-white shadow-lg rounded-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-90">
        <ZoomOut size={20} className="text-indigo-600"/>
      </button>
      <button onClick={() => resetTransform()} className="p-3 bg-indigo-600 shadow-lg rounded-xl text-white hover:bg-indigo-700 transition-all active:scale-90">
        <Maximize size={20}/>
      </button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('lall-ravi-final-stable');
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
    localStorage.setItem('lall-ravi-final-stable', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];
  const updateStudents = (newList) => setClasses(prev => ({ ...prev, [currentClassName]: newList }));

  const addNewClass = () => {
    if (newClassName.trim() && !classes[newClassName.toUpperCase()]) {
      const nameCaps = newClassName.toUpperCase();
      setClasses(prev => ({ ...prev, [nameCaps]: [] }));
      setCurrentClassName(nameCaps);
      setNewClassName("");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-20 bg-white border-b-2 border-slate-100 px-8 flex justify-between items-center z-[60] shrink-0">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-600" size={32} />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Classroom Compass <span className="text-indigo-600">by Lall Ravi</span>
          </h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'map.png'; a.href = d; a.click(); })} 
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all">
          Export Map
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - Fixed width so map can't cover it */}
        <aside className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col z-[50] shrink-0">
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* CLASS SELECTOR */}
            <div className="mb-8">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Select Class</label>
              <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold mb-4 outline-none">
                {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Period Name" className="flex-1 p-2 border rounded-lg text-sm" />
                <button onClick={addNewClass} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">
                  <Plus size={20}/>
                </button>
              </div>
            </div>

            {/* TAB BUTTONS */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              {['layout', 'groups', 'randomizer'].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* INPUT AREA */}
            <div className="space-y-6">
              {activeTab === 'layout' && (
                <div className="space-y-4">
                  <div className="flex gap-2 p-1 bg-slate-50 border rounded-lg">
                    <button onClick={() => setShowBulk(false)} className={`flex-1 py-2 text-[10px] font-black rounded uppercase ${!showBulk ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Single</button>
                    <button onClick={() => setShowBulk(true)} className={`flex-1 py-2 text-[10px] font-black rounded uppercase ${showBulk ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Bulk</button>
                  </div>
                  {!showBulk ? (
                    <div className="space-y-3">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ENTER STUDENT NAME" className="w-full p-4 border-2 rounded-xl font-bold text-lg outline-none focus:border-indigo-500" />
                      <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 200, defaultY: 200, rotation: 0 }]); setName(""); } }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest">Add Student</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names here..." className="w-full h-48 p-3 border rounded-xl text-sm font-medium outline-none" />
                      <button onClick={() => {
                        const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
                        updateStudents([...students, ...names.map((n, i) => ({ id: Date.now()+i, name: n.toUpperCase(), defaultX: 200, defaultY: 200 }))]);
                        setBulkNames(""); setShowBulk(false);
                      }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest">Import All</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="p-6 bg-indigo-50 rounded-2xl text-center border">
                  <p className="text-[10px] font-black text-indigo-900 mb-4 uppercase">Group Size</p>
                  <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="w-16 p-2 rounded-lg text-center font-black text-xl mb-4" />
                  <button onClick={() => {
                    const shuffled = [...students].sort(() => Math.random() - 0.5);
                    const updated = shuffled.map((s, i) => ({
                      ...s,
                      defaultX: 100 + (Math.floor(i / groupSize) % 4 * 350) + (i % 2 * 140),
                      defaultY: 150 + (Math.floor(Math.floor(i / groupSize) / 4) * 280) + (Math.floor((i % groupSize) / 2) * 110)
                    }));
                    updateStudents(updated);
                  }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs">Shuffle Pods</button>
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
                }} className="w-full py-10 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl">Spin Picker</button>
              )}

              <div className="mt-6 border-t pt-4">
                <p className="text-[10px] font-black text-slate-300 uppercase mb-3">Manifest ({students.length})</p>
                {students.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 mb-2 bg-slate-50 rounded-xl text-xs font-bold border">
                    {s.name} <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN STAGE - The Map is contained inside here */}
        <main className="flex-1 relative bg-slate-200 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-slate-900">
                {pickedStudent && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-20 rounded-[4rem] text-center shadow-2xl border-[12px] border-indigo-500">
                    <h2 className="text-7xl font-black uppercase text-slate-900">{pickedStudent.name}</h2>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full relative">
                <TransformWrapper centerOnInit={true} minScale={0.1} initialScale={0.4} limitToBounds={false}>
                  <Controls />
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div ref={floorRef} className="relative bg-white shadow-2xl rounded-[3rem]" style={{ width: '2500px', height: '1800px' }}>
                      <div className="w-full h-24 bg-slate-900 text-white flex items-center justify-center font-black uppercase tracking-[1.5em] text-xs rounded-t-[3rem]">
                        Whiteboard Area
                      </div>
                      <div className="relative w-full h-full bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:60px_60px]">
                        {students.map((student) => (
                          <motion.div key={student.id} drag dragMomentum={false} animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} className="absolute cursor-move">
                            <div className="w-40 h-24 bg-white border-2 border-slate-200 rounded-2xl shadow-xl flex items-center justify-center p-4 group hover:border-indigo-500">
                              <span className="text-xs font-black uppercase text-center select-none">{student.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-3 -right-3 p-2 bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><RotateCw size={14}/></button>
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