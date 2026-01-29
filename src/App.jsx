import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Download, Menu, Layout, Group, Sparkles, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
      <button onClick={() => zoomIn()} className="p-3 bg-white shadow-lg rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"><ZoomIn size={20} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut()} className="p-3 bg-white shadow-lg rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"><ZoomOut size={20} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="p-3 bg-indigo-600 shadow-lg rounded-xl text-white hover:bg-indigo-700 transition-all"><Maximize size={20}/></button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('lall-ravi-compass-stable');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0]);
  const [newClassName, setNewClassName] = useState("");
  const [activeTab, setActiveTab] = useState('layout');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [name, setName] = useState("");
  const [groupSize, setGroupSize] = useState(4);
  const [pickedStudent, setPickedStudent] = useState(null);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('lall-ravi-compass-stable', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];
  const updateStudents = (newList) => setClasses(prev => ({ ...prev, [currentClassName]: newList }));

  const addNewClass = () => {
    if (newClassName.trim() && !classes[newClassName]) {
      setClasses(prev => ({ ...prev, [newClassName.toUpperCase()]: [] }));
      setCurrentClassName(newClassName.toUpperCase());
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

  const createGroups = () => {
    if (students.length === 0) return;
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const updated = shuffled.map((student, index) => {
      const groupIndex = Math.floor(index / groupSize);
      const posInGroup = index % groupSize;
      return {
        ...student,
        defaultX: 100 + (Math.floor(groupIndex % 4) * 320) + ((posInGroup % 2) * 130),
        defaultY: 150 + (Math.floor(groupIndex / 4) * 250) + (Math.floor(posInGroup / 2) * 100),
        rotation: 0
      };
    });
    updateStudents(updated);
  };

  const pickRandomStudent = () => {
    if (students.length === 0) return;
    let count = 0;
    const interval = setInterval(() => {
      setPickedStudent(students[Math.floor(Math.random() * students.length)]);
      count++;
      if (count > 20) clearInterval(interval);
    }, 80);
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      {/* BIG MODERN HEADER */}
      <header className="bg-white border-b-2 border-slate-200 px-8 py-5 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-600" size={32} />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Classroom Compass <span className="text-indigo-600">by Lall Ravi</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">Pro Management Suite</p>
          </div>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'chart.png'; a.href = d; a.click(); })} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
          <Download size={18}/> Export
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-80 bg-white border-r-2 border-slate-200 p-6 flex flex-col shadow-xl z-40">
          
          {/* ADD CLASS SECTION - FIXED */}
          <div className="mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Active Class</label>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold mb-3">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class Name" className="flex-1 p-2 border rounded-lg text-sm" />
              <button onClick={addNewClass} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={20}/></button>
              <button onClick={() => deleteClass(currentClassName)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => setActiveTab('layout')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeTab === 'layout' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Map</button>
            <button onClick={() => setActiveTab('groups')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeTab === 'groups' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Groups</button>
            <button onClick={() => setActiveTab('randomizer')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeTab === 'randomizer' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Picker</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student Name" className="w-full p-3 border rounded-xl font-bold" />
                <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 100, defaultY: 100, rotation: 0 }]); setName(""); } }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Add Student</button>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="p-4 bg-indigo-50 rounded-2xl text-center">
                <p className="text-xs font-bold text-indigo-900 mb-2">Group Size</p>
                <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="w-16 p-2 rounded-lg text-center font-black mb-4" />
                <button onClick={createGroups} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Shuffle</button>
              </div>
            )}

            {activeTab === 'randomizer' && (
              <button onClick={pickRandomStudent} className="w-full py-6 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-purple-700">Spin The Wheel</button>
            )}

            <div className="mt-8">
              <p className="text-[10px] font-black text-slate-300 uppercase mb-3">Roster</p>
              {students.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 mb-2 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100">
                  {s.name} <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN STAGE */}
        <main className="flex-1 relative bg-slate-200 p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-slate-900 rounded-[3rem] shadow-inner">
                {pickedStudent && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-20 rounded-[4rem] text-center shadow-2xl border-[10px] border-indigo-500">
                    <h2 className="text-8xl font-black uppercase text-slate-900">{pickedStudent.name}</h2>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden relative border-4 border-white">
                <TransformWrapper 
                  centerOnInit={true} 
                  minScale={0.2} 
                  initialScale={0.7}
                  limitToBounds={false} // This stops the "moving a lot" feeling
                >
                  <Controls />
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div ref={floorRef} className="relative bg-white" style={{ width: '2000px', height: '1500px' }}>
                      <div className="w-full h-20 bg-slate-900 text-white flex items-center justify-center font-black uppercase tracking-[1em] text-xs">
                        Front / Whiteboard
                      </div>
                      <div className="relative w-full h-full bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:40px_40px]">
                        {students.map((student) => (
                          <motion.div key={student.id} drag dragMomentum={false} animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} className="absolute cursor-move motion-div">
                            <div className="w-32 h-20 bg-white border-2 border-slate-200 rounded-2xl shadow-lg flex items-center justify-center p-4 group hover:border-indigo-500 transition-colors">
                              <span className="text-xs font-black uppercase text-center select-none">{student.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-2 -right-2 p-1.5 bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><RotateCw size={12}/></button>
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