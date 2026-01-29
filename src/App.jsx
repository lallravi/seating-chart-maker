import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Download, Layout, Group, Sparkles, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-4 bg-white shadow-2xl rounded-2xl border-2 border-slate-100 hover:bg-slate-50 active:scale-90 transition-all"><ZoomIn size={24} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut(0.2)} className="p-4 bg-white shadow-2xl rounded-2xl border-2 border-slate-100 hover:bg-slate-50 active:scale-90 transition-all"><ZoomOut size={24} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="p-4 bg-indigo-600 shadow-2xl rounded-2xl text-white hover:bg-indigo-700 active:scale-90 transition-all"><Maximize size={24}/></button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-pro-v7');
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
    localStorage.setItem('compass-pro-v7', JSON.stringify(classes));
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

  const handleBulkAdd = () => {
    const namesArray = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const newStudents = namesArray.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 300 + (i % 5 * 250),
      y: 300 + (Math.floor(i / 5) * 180),
      rotation: 0
    }));
    updateStudents([...students, ...newStudents]);
    setBulkNames("");
    setShowBulk(false);
  };

  // Fixed dragging: updates state only when drag ends to prevent "canvas lag"
  const handleDragEnd = (id, info) => {
    const updated = students.map(s => 
      s.id === id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s
    );
    updateStudents(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col font-sans overflow-hidden">
      <header className="h-20 bg-white border-b-2 border-slate-200 px-8 flex justify-between items-center z-[60] shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-600" size={32} />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Classroom Compass <span className="text-indigo-600">by Lall Ravi</span>
          </h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'classroom.png'; a.href = d; a.click(); })} 
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">
          Export Map
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 bg-white border-r-2 border-slate-200 flex flex-col z-[50] shrink-0 shadow-xl">
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
            
            <div className="mb-8">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Active Period</label>
              <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 mb-4 outline-none focus:border-indigo-500 transition-all">
                {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class Name" className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold outline-none" />
                <button onClick={addNewClass} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-90"><Plus size={24}/></button>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border-2 border-slate-200">
              {['layout', 'groups', 'randomizer'].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>{t}</button>
              ))}
            </div>

            {activeTab === 'layout' && (
              <div className="space-y-6">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button onClick={() => setShowBulk(false)} className={`flex-1 py-2 text-[10px] font-black rounded-lg uppercase ${!showBulk ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Single</button>
                  <button onClick={() => setShowBulk(true)} className={`flex-1 py-2 text-[10px] font-black rounded-lg uppercase ${showBulk ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bulk Add</button>
                </div>
                {!showBulk ? (
                  <div className="space-y-4">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ENTER STUDENT NAME" className="w-full p-5 border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-indigo-500 outline-none shadow-inner" />
                    <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), x: 400, y: 400, rotation: 0 }]); setName(""); } }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Add to Map</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names here..." className="w-full h-64 p-4 border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none shadow-inner" />
                    <button onClick={handleBulkAdd} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Import Roster</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'groups' && (
               <div className="p-8 bg-indigo-50 rounded-[2.5rem] text-center border-2 border-indigo-100">
                  <p className="text-[11px] font-black text-indigo-900 mb-4 uppercase tracking-[0.2em]">Group Size</p>
                  <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="w-20 p-4 rounded-2xl text-center font-black text-2xl border-2 border-indigo-200 mb-6 bg-white shadow-inner" />
                  <button onClick={() => {
                    const shuffled = [...students].sort(() => Math.random() - 0.5);
                    const updated = shuffled.map((s, i) => ({
                      ...s,
                      x: 300 + (Math.floor(i / groupSize) % 3 * 550) + (i % 2 * 220),
                      y: 350 + (Math.floor(Math.floor(i / groupSize) / 3) * 400) + (Math.floor((i % groupSize) / 2) * 160)
                    }));
                    updateStudents(updated);
                  }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Shuffle Pods</button>
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
              }} className="w-full py-16 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-[3rem] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Spin Picker</button>
            )}

            <div className="mt-12 border-t-2 border-slate-50 pt-8">
              <h3 className="text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">Roster ({students.length})</h3>
              <div className="space-y-3">
                {students.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl text-xs font-black border-2 border-slate-100 group">
                    <span className="text-slate-600 group-hover:text-indigo-600">{s.name}</span>
                    <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-200 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-slate-900">
                {pickedStudent && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-24 rounded-[5rem] text-center shadow-2xl border-[16px] border-indigo-500">
                    <h2 className="text-8xl font-black uppercase text-slate-900 leading-none tracking-tighter">{pickedStudent.name}</h2>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full relative">
                {/* Fixed the Pan/Drag conflict: Panning only works on the background dots */}
                <TransformWrapper 
                  centerOnInit={true} 
                  minScale={0.1} 
                  maxScale={2}
                  initialScale={0.4} 
                  limitToBounds={false}
                  panning={{ disabled: false, excluded: ["motion-div"] }}
                >
                  <Controls />
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div ref={floorRef} className="relative bg-white shadow-2xl rounded-[4rem] border-[20px] border-white" style={{ width: '4000px', height: '3000px' }}>
                      <div className="w-full h-32 bg-slate-900 text-white flex items-center justify-center font-black uppercase tracking-[2em] text-sm sticky top-0 z-10">
                        Whiteboard / Presentation Area
                      </div>
                      <div className="relative w-full h-full bg-[radial-gradient(#cbd5e1_3px,transparent_3px)] [background-size:80px_80px]">
                        {students.map((student) => (
                          <motion.div 
                            key={student.id} 
                            drag 
                            dragMomentum={false} 
                            onDragEnd={(e, info) => handleDragEnd(student.id, info)}
                            style={{ x: student.x, y: student.y, rotate: student.rotation }}
                            className="absolute cursor-grab active:cursor-grabbing motion-div"
                          >
                            <div className="w-60 h-36 bg-white border-4 border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center p-6 group hover:border-indigo-500 transition-colors">
                              <div className="w-12 h-2 bg-slate-100 rounded-full mb-4 group-hover:bg-indigo-100"></div>
                              <span className="text-[15px] font-black uppercase text-center select-none text-slate-800 leading-tight tracking-tighter">{student.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-4 -right-4 p-3 bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-indigo-600"><RotateCw size={18}/></button>
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