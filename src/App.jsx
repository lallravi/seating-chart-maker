import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Award, RotateCw, Download, Menu, X, Layout, Group, Sparkles, Compass, Map, UserMinus } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-50">
      <button onClick={() => zoomIn()} className="p-4 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl border border-white hover:bg-white transition-all active:scale-90"><Compass size={20} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="px-5 py-3 bg-indigo-600 text-white shadow-xl rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 active:scale-95 transition-all">Reset View</button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('lall-ravi-compass-pro');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0]);
  const [newClassName, setNewClassName] = useState("");
  const [activeTab, setActiveTab] = useState('layout');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [name, setName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('lall-ravi-compass-pro', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];
  const updateStudents = (newList) => setClasses(prev => ({ ...prev, [currentClassName]: newList }));

  const addNewClass = () => {
    if (newClassName && !classes[newClassName]) {
      setClasses(prev => ({ ...prev, [newClassName]: [] }));
      setCurrentClassName(newClassName);
      setNewClassName("");
    }
  };

  const deleteClass = (nameToDelete) => {
    if (Object.keys(classes).length <= 1) return;
    if (window.confirm(`Archive ${nameToDelete}?`)) {
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
      const podCol = groupIndex % 4;
      const podRow = Math.floor(groupIndex / 4);
      return {
        ...student,
        defaultX: 100 + (podCol * 350) + ((posInGroup % 2) * 150),
        defaultY: 150 + (podRow * 280) + (Math.floor(posInGroup / 2) * 110),
        rotation: 0,
        groupColor: groupIndex % 2 === 0 ? 'border-indigo-500 bg-indigo-50/80 shadow-indigo-100' : 'border-slate-300 bg-white shadow-slate-100'
      };
    });
    updateStudents(updated);
  };

  const pickRandomStudent = () => {
    if (students.length === 0) return;
    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      setPickedStudent(students[Math.floor(Math.random() * students.length)]);
      count++;
      if (count > 25) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 70);
  };

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden text-[#1E293B]">
      {/* MODERN BIG HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"><Menu size={24}/></button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-[-0.05em] leading-none text-slate-900">
              CLASSROOM COMPASS <span className="text-indigo-600">BY LALL RAVI</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Management Console</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'compass-export.png'; a.href = d; a.click(); })} 
            className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-indigo-200 flex items-center gap-2">
            <Download size={16}/> Export Project
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-500 absolute lg:relative w-full lg:w-96 h-full bg-white/80 backdrop-blur-xl p-8 border-r border-slate-200 z-40 flex flex-col`}>
          
          <div className="mb-10">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Navigation Point</label>
            <div className="flex gap-2">
              <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="flex-1 bg-slate-50 p-4 rounded-2xl text-sm font-bold border border-slate-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer">
                {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => deleteClass(currentClassName)} className="p-4 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-2xl border border-slate-100"><Trash2 size={20}/></button>
            </div>
          </div>

          {/* TAB SYSTEM */}
          <div className="flex bg-slate-100 p-1.5 rounded-[2rem] mb-10 border border-slate-200">
            {['layout', 'groups', 'randomizer'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-[1.5rem] transition-all flex flex-col items-center gap-1 ${activeTab === tab ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab === 'layout' && <Map size={18}/>}
                {tab === 'groups' && <Group size={18}/>}
                {tab === 'randomizer' && <Sparkles size={18}/>}
                <span className="text-[9px] font-black uppercase tracking-tighter">{tab}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'layout' && (
              <div className="space-y-6">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student Name" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold mb-3 focus:border-indigo-500 transition-all" />
                    <button onClick={() => { if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 200, defaultY: 200, rotation: 0 }]); setName(""); } }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Add to Map</button>
                 </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-center text-white shadow-2xl shadow-indigo-200">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 opacity-80">Formation Intelligence</p>
                <div className="flex items-center justify-center gap-6 mb-8">
                   <div className="h-px w-8 bg-white/30"></div>
                   <input type="number" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} className="w-16 bg-transparent text-4xl text-center font-black outline-none" />
                   <div className="h-px w-8 bg-white/30"></div>
                </div>
                <button onClick={createGroups} className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform">Optimize Layout</button>
              </div>
            )}

            {activeTab === 'randomizer' && (
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-center shadow-2xl">
                <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="text-indigo-400" size={32} />
                </div>
                <button onClick={pickRandomStudent} disabled={isSpinning} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50">Engage Picker</button>
              </div>
            )}

            <div className="mt-12">
              <h3 className="text-[10px] font-black text-slate-300 uppercase mb-6 tracking-[0.3em] flex items-center gap-3">
                <span className="h-1 w-1 bg-indigo-400 rounded-full"></span> ROSTER ARCHIVE
              </h3>
              {students.map(s => (
                <div key={s.id} className="flex justify-between items-center p-4 mb-3 bg-white border border-slate-100 rounded-2xl text-xs font-black shadow-sm group hover:border-indigo-300 transition-all">
                  <span className="text-slate-500 group-hover:text-slate-900">{s.name}</span>
                  <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-200 hover:text-red-500"><UserMinus size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN STAGE */}
        <main className="flex-1 bg-[#F1F5F9] relative overflow-hidden p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'randomizer' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center bg-[#0F172A] rounded-[4rem] relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.2)]">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.15),transparent)] animate-pulse"></div>
                 {pickedStudent && (
                   <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/10 backdrop-blur-xl p-24 rounded-[5rem] border border-white/10 text-center z-10 shadow-2xl">
                     <p className="text-indigo-400 font-black mb-8 uppercase tracking-[0.8em] text-[10px]">Identified</p>
                     <h2 className="text-[120px] font-black uppercase tracking-tighter text-white leading-none">{pickedStudent.name}</h2>
                   </motion.div>
                 )}
              </motion.div>
            ) : (
              <div className="w-full h-full relative border-[12px] border-white rounded-[4rem] shadow-2xl overflow-hidden bg-white">
                <TransformWrapper initialScale={0.5} minScale={0.1} maxScale={2} centerOnInit={true} panning={{ excluded: ["motion-div", "button"] }}>
                  <Controls />
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div ref={floorRef} className="relative bg-white" style={{ width: '1800px', height: '1200px' }}>
                      <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_2px,transparent_2px)] [background-size:60px_60px] opacity-50"></div>
                      <div className="w-full h-24 bg-slate-900 text-white flex items-center justify-center font-black uppercase tracking-[1em] text-[11px] relative z-10">
                        Primary Instruction Zone
                      </div>
                      <div className="relative w-full h-full p-20">
                        {students.map((student) => (
                          <motion.div key={student.id} drag dragMomentum={false} animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} className="absolute cursor-grab active:cursor-grabbing motion-div group">
                            <div className={`w-36 h-24 border-2 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-6 relative transition-all ${student.groupColor || 'bg-white border-slate-100 hover:border-indigo-400'}`}>
                               <div className="w-8 h-1.5 bg-slate-200 rounded-full mb-3 group-hover:bg-indigo-200"></div>
                               <span className="text-xs font-black text-center select-none uppercase tracking-tighter text-slate-700">{student.name}</span>
                               <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-3 -right-3 p-2.5 bg-slate-900 text-white rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 scale-75 group-hover:scale-100"><RotateCw size={14}/></button>
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