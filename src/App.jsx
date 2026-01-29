import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Download, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-5 bg-slate-800 shadow-2xl rounded-2xl border border-slate-700 hover:bg-indigo-600 active:scale-90 transition-all text-white"><ZoomIn size={28}/></button>
      <button onClick={() => zoomOut(0.2)} className="p-5 bg-slate-800 shadow-2xl rounded-2xl border border-slate-700 hover:bg-indigo-600 active:scale-90 transition-all text-white"><ZoomOut size={28}/></button>
      <button onClick={() => resetTransform()} className="p-5 bg-indigo-600 shadow-2xl rounded-2xl text-white hover:bg-indigo-500 active:scale-90 transition-all border border-indigo-400"><Maximize size={28}/></button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v12-stable');
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
    localStorage.setItem('compass-v12-stable', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];
  const updateStudents = (newList) => setClasses(prev => ({ ...prev, [currentClassName]: newList }));

  const handleDragEnd = (id, info) => {
    const updated = students.map(s => 
      s.id === id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s
    );
    updateStudents(updated);
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const columns = 6;
    const xGap = 480; 
    const yGap = 320; 

    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 400 + (i % columns * xGap),
      y: 500 + (Math.floor(i / columns) * yGap),
      rotation: 0
    }));

    updateStudents([...students, ...newEntries]);
    setBulkNames("");
    setShowBulk(false);
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
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col font-sans overflow-hidden text-slate-100">
      <header className="h-20 bg-[#1e293b] border-b border-slate-800 px-10 flex justify-between items-center z-[70] shrink-0 shadow-xl">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-500" size={32} />
          <h1 className="text-xl font-black tracking-tighter uppercase">Classroom Compass <span className="text-indigo-500 text-sm">PRO</span></h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'map.png'; a.href = d; a.click(); })} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all">
          Export Map
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 bg-[#1e293b] border-r border-slate-800 p-8 flex flex-col z-[60] shrink-0 shadow-2xl overflow-y-auto">
          <div className="mb-8">
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Active Class</label>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-4 bg-[#0f172a] border border-slate-700 rounded-xl font-bold text-white outline-none">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2 mt-4">
                <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class..." className="flex-1 p-3 bg-[#0f172a] border border-slate-700 rounded-lg text-sm" />
                <button onClick={addNewClass} className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"><Plus size={20}/></button>
            </div>
          </div>

          <nav className="flex bg-[#0f172a] p-1 rounded-xl mb-8 border border-slate-800">
            {['layout', 'randomizer'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>{t}</button>
            ))}
          </nav>

          <div className="space-y-6">
            {activeTab === 'layout' && (
              <div className="space-y-6">
                <div className="flex gap-2 p-1 bg-[#0f172a] rounded-lg border border-slate-800">
                  <button onClick={() => setShowBulk(false)} className={`flex-1 py-2 text-[10px] font-black rounded uppercase ${!showBulk ? 'bg-slate-800 text-indigo-400' : 'text-slate-600'}`}>Single</button>
                  <button onClick={() => setShowBulk(true)} className={`flex-1 py-2 text-[10px] font-black rounded uppercase ${showBulk ? 'bg-slate-800 text-indigo-400' : 'text-slate-600'}`}>Bulk</button>
                </div>

                {showBulk ? (
                  <div className="space-y-4">
                    <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste list..." className="w-full h-80 p-5 bg-[#0f172a] border border-slate-700 rounded-2xl font-medium text-sm text-white outline-none focus:border-indigo-500" />
                    <button onClick={processRoster} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Process Roster</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="STUDENT NAME" className="w-full p-5 bg-[#0f172a] border border-slate-700 rounded-xl font-black text-xl text-white outline-none" />
                    <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), x: 600, y: 600, rotation: 0 }]); setName(""); } }} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest">Add Student</button>
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
              }} className="w-full py-20 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-[3rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Spin Randomizer</button>
            )}

            <div className="mt-10 border-t border-slate-800 pt-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Roster ({students.length})</h3>
                {students.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 mb-2 bg-[#0f172a]/50 border border-slate-800 rounded-lg text-xs font-bold">
                    <span className="text-slate-400">{s.name}</span>
                    <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 relative bg-[#0f172a] overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-slate-950">
                {pickedStudent && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#1e293b] p-24 rounded-[5rem] text-center shadow-[0_0_100px_rgba(99,102,241,0.3)] border-8 border-indigo-500">
                    <h2 className="text-[100px] font-black uppercase text-white leading-none tracking-tighter">{pickedStudent.name}</h2>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full relative">
                <TransformWrapper 
                  centerOnInit={true} 
                  minScale={0.05} 
                  initialScale={0.2} 
                  limitToBounds={false}
                  panning={{ excluded: ["student-desk"] }}
                >
                  <Controls />
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div ref={floorRef} className="relative bg-[#0b1121]" style={{ width: '8000px', height: '6000px' }}>
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_2px,transparent_2px)] [background-size:120px_120px]"></div>
                      
                      <div className="absolute top-0 w-full h-40 bg-slate-950 border-b-8 border-indigo-600 flex items-center justify-center font-black uppercase tracking-[3em] text-xl text-indigo-400">
                        FRONT OF CLASSROOM
                      </div>

                      {students.map((student) => (
                        <motion.div 
                          key={student.id} 
                          drag 
                          dragMomentum={false}
                          onDragEnd={(e, info) => handleDragEnd(student.id, info)}
                          animate={{ x: student.x, y: student.y, rotate: student.rotation }}
                          className="absolute student-desk cursor-grab active:cursor-grabbing z-20"
                        >
                          <div className="w-[380px] h-[240px] bg-slate-800 border-4 border-slate-600 rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center p-8 group hover:border-indigo-500 hover:bg-slate-750 transition-all relative">
                            <span className="text-4xl font-black uppercase text-center select-none text-white tracking-tighter drop-shadow-lg">
                              {student.name}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-6 -right-6 p-5 bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90">
                              <RotateCw size={24}/>
                            </button>
                            <div className="absolute -bottom-8 w-28 h-12 bg-slate-700 rounded-t-3xl -z-10 border-t-4 border-slate-600 group-hover:bg-indigo-900 group-hover:border-indigo-800 transition-colors"></div>
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