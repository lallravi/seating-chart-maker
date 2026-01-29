import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Download, Layout, Group, Sparkles, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

// These are the buttons you were missing - Re-added and stabilized
const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-50">
      <button onClick={() => zoomIn()} className="p-4 bg-white shadow-xl rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all active:scale-90">
        <ZoomIn size={24} className="text-indigo-600"/>
      </button>
      <button onClick={() => zoomOut()} className="p-4 bg-white shadow-xl rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all active:scale-90">
        <ZoomOut size={24} className="text-indigo-600"/>
      </button>
      <button onClick={() => resetTransform()} className="p-4 bg-indigo-600 shadow-xl rounded-2xl text-white hover:bg-indigo-700 transition-all active:scale-90">
        <Maximize size={24}/>
      </button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('lall-ravi-stable-v5');
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
    localStorage.setItem('lall-ravi-stable-v5', JSON.stringify(classes));
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

  const deleteClass = (nameToDelete) => {
    if (Object.keys(classes).length <= 1) return;
    if (window.confirm(`Delete ${nameToDelete}?`)) {
      const remaining = { ...classes };
      delete remaining[nameToDelete];
      setClasses(remaining);
      setCurrentClassName(Object.keys(remaining)[0]);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* HEADER - BIG AND BOLD */}
      <header className="bg-white border-b-2 border-slate-100 px-8 py-5 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-600" size={32} />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Classroom Compass <span className="text-indigo-600">by Lall Ravi</span>
          </h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'classroom-map.png'; a.href = d; a.click(); })} 
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all">
          Export Map
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-80 lg:w-96 bg-white border-r border-slate-200 p-8 flex flex-col z-40 overflow-y-auto">
          
          {/* ADD CLASS SECTION */}
          <div className="mb-8">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Selected Period</label>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-700 mb-4 outline-none focus:border-indigo-500">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class Name..." className="flex-1 p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none" />
              <button onClick={addNewClass} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-90">
                <Plus size={24}/>
              </button>
              <button onClick={() => deleteClass(currentClassName)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={24}/>
              </button>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            {['layout', 'groups', 'randomizer'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* INPUT AREA */}
          <div className="space-y-6">
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button onClick={() => setShowBulk(false)} className={`flex-1 py-2 text-[10px] font-black rounded-lg uppercase ${!showBulk ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Single</button>
                  <button onClick={() => setShowBulk(true)} className={`flex-1 py-2 text-[10px] font-black rounded-lg uppercase ${showBulk ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bulk Add</button>
                </div>
                {!showBulk ? (
                  <div className="space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ENTER STUDENT NAME" className="w-full p-5 border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-indigo-500 outline-none" />
                    <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 250, defaultY: 250, rotation: 0 }]); setName(""); } }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Add to Map</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names (one per line)..." className="w-full h-64 p-4 border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none" />
                    <button onClick={() => {
                      const namesArray = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
                      updateStudents([...students, ...namesArray.map((n, i) => ({ id: Date.now()+i, name: n.toUpperCase(), defaultX: 250, defaultY: 250 }))]);
                      setBulkNames(""); setShowBulk(false);
                    }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Import Roster</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="p-6 bg-indigo-50 rounded-3xl text-center border-2 border-indigo-100">
                <p className="text-[10px] font-black text-indigo-900 mb-4 uppercase tracking-widest">Group Size</p>
                <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="w-20 p-4 rounded-xl text-center font-black text-2xl border-2 border-indigo-200 mb-6" />
                <button onClick={() => {
                  const shuffled = [...students].sort(() => Math.random() - 0.5);
                  const updated = shuffled.map((s, i) => ({
                    ...s,
                    defaultX: 200 + (Math.floor(i / groupSize) % 4 * 380) + (i % 2 * 150),
                    defaultY: 250 + (Math.floor(Math.floor(i / groupSize) / 4) * 300) + (Math.floor((i % groupSize) / 2) * 110)
                  }));
                  updateStudents(updated);
                }} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Auto-Arrange</button>
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
              }} className="w-full py-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Spin Picker</button>
            )}

            {/* ROSTER DISPLAY */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">Roster ({students.length})</h3>
              <div className="space-y-2">
                {students.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100">
                    <span className="text-slate-600">{s.name}</span>
                    <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* MAP STAGE */}
        <main className="flex-1 relative bg-slate-200 p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden">
                {pickedStudent && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-20 rounded-[4rem] text-center shadow-2xl border-[12px] border-indigo-500">
                    <h2 className="text-8xl font-black uppercase text-slate-900">{pickedStudent.name}</h2>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden relative border-4 border-white">
                <TransformWrapper centerOnInit={true} minScale={0.1} initialScale={0.5} limitToBounds={false}>
                  <Controls />
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div ref={floorRef} className="relative bg-white" style={{ width: '2500px', height: '1800px' }}>
                      <div className="w-full h-24 bg-slate-900 text-white flex items-center justify-center font-black uppercase tracking-[1.5em] text-xs">
                        FRONT / WHITEBOARD
                      </div>
                      <div className="relative w-full h-full bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:60px_60px]">
                        {students.map((student) => (
                          <motion.div key={student.id} drag dragMomentum={false} animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} className="absolute cursor-move motion-div">
                            <div className="w-44 h-28 bg-white border-2 border-slate-200 rounded-[2rem] shadow-xl flex flex-col items-center justify-center p-4 group hover:border-indigo-500 transition-all">
                              <span className="text-sm font-black uppercase text-center select-none text-slate-700 tracking-tighter">{student.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-3 -right-3 p-2 bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-indigo-600 scale-90 hover:scale-100"><RotateCw size={14}/></button>
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