import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Award, RotateCw, Download, Menu, X, Layout, Group, Sparkles, Box } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
      <button onClick={() => zoomIn()} className="p-3 bg-white shadow-xl rounded-full border border-slate-200 hover:bg-slate-50 transition-all active:scale-90"><ZoomIn size={18}/></button>
      <button onClick={() => zoomOut()} className="p-3 bg-white shadow-xl rounded-full border border-slate-200 hover:bg-slate-50 transition-all active:scale-90"><ZoomOut size={18}/></button>
      <button onClick={() => resetTransform()} className="px-4 py-2 bg-blue-600 text-white shadow-xl rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all">Reset View</button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('lall-ravi-organizer-data');
    return saved ? JSON.parse(saved) : { "Period 1": [] };
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
    localStorage.setItem('lall-ravi-organizer-data', JSON.stringify(classes));
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
    if (Object.keys(classes).length <= 1) return alert("Keep at least one class roster!");
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
      const podCol = groupIndex % 4;
      const podRow = Math.floor(groupIndex / 4);
      return {
        ...student,
        defaultX: 100 + (podCol * 320) + ((posInGroup % 2) * 140),
        defaultY: 120 + (podRow * 260) + (Math.floor(posInGroup / 2) * 100),
        rotation: 0,
        groupColor: groupIndex % 2 === 0 ? 'border-blue-600 bg-blue-50/50' : 'border-slate-400 bg-slate-50/50'
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
    }, 80);
  };

  const saveAsImage = () => {
    if (floorRef.current === null) return;
    toPng(floorRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Lall-Ravi-Organizer-${currentClassName}.png`;
        link.href = dataUrl;
        link.click();
      });
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-900">
      {/* HEADER */}
      <header className="bg-white text-slate-900 py-4 px-6 flex justify-between items-center z-50 border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"><Menu size={24}/></button>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tighter flex items-center gap-2">
              <Box className="text-blue-600" size={20}/>
              LALL RAVI'S <span className="text-blue-600 uppercase">Classroom Seat Organizer</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-[-2px]">Built-in Name Picker & Group Maker</p>
          </div>
        </div>
        <button onClick={saveAsImage} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95">
          <Download size={16}/> Export Layout
        </button>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 absolute lg:relative w-full lg:w-80 h-full bg-white p-6 border-r border-slate-200 shadow-xl z-40 flex flex-col`}>
          
          <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 text-blue-600">Active Roster</h2>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-slate-200 shadow-sm outline-none mb-4 cursor-pointer">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Period Name..." className="flex-1 bg-white p-2 rounded-lg text-xs border border-slate-200 outline-none" />
              <button onClick={addNewClass} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-colors"><Plus size={18}/></button>
              <button onClick={() => deleteClass(currentClassName)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button onClick={() => setActiveTab('layout')} className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${activeTab === 'layout' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}><Layout size={20} /><span className="text-[9px] font-black uppercase mt-1">Setup</span></button>
            <button onClick={() => setActiveTab('groups')} className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${activeTab === 'groups' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}><Group size={20} /><span className="text-[9px] font-black uppercase mt-1">Groups</span></button>
            <button onClick={() => setActiveTab('randomizer')} className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${activeTab === 'randomizer' ? 'bg-white shadow-md text-purple-600' : 'text-slate-400'}`}><Sparkles size={20} /><span className="text-[9px] font-black uppercase mt-1">Picker</span></button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                  <button onClick={() => setShowBulk(false)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded ${!showBulk ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Manual</button>
                  <button onClick={() => setShowBulk(true)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded ${showBulk ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Bulk</button>
                </div>
                {!showBulk ? (
                  <form onSubmit={(e) => { e.preventDefault(); if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 100, defaultY: 100, rotation: 0 }]); setName(""); } }} className="flex gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add Name" className="flex-1 p-3 border rounded-xl text-sm font-medium" />
                    <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl"><Plus/></button>
                  </form>
                ) : (
                  <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} onBlur={() => {
                    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
                    updateStudents([...students, ...names.map((n, i) => ({ id: Date.now()+i, name: n.toUpperCase(), defaultX: 100, defaultY: 100 }))]);
                    setBulkNames(""); setShowBulk(false);
                  }} placeholder="Type names & click away..." className="w-full h-32 p-3 border rounded-xl text-sm bg-slate-50 outline-blue-500" />
                )}
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <label className="text-[10px] font-black text-emerald-800 uppercase block mb-3">Pod Size</label>
                <input type="number" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} className="w-12 p-2 border-2 border-emerald-200 rounded-lg text-lg text-center font-black mb-4" />
                <button onClick={createGroups} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Shuffle Groups</button>
              </div>
            )}

            {activeTab === 'randomizer' && (
              <div className="text-center p-8 bg-purple-50 rounded-3xl border border-purple-100 space-y-6">
                <button onClick={pickRandomStudent} disabled={isSpinning || students.length === 0} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-purple-700 active:scale-95 transition-all">Spin The Picker</button>
              </div>
            )}

            <div className="mt-10 border-t pt-4">
              <h3 className="text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">Student List ({students.length})</h3>
              {students.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 mb-2 bg-white border border-slate-100 rounded-xl text-xs font-bold shadow-sm group">
                  {s.name} <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-200 group-hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-slate-100 text-center opacity-40">
             <p className="text-[9px] font-black uppercase tracking-widest">Created by Lall Ravi</p>
          </div>
        </aside>

        {/* MAIN DISPLAY */}
        <main className="flex-1 bg-slate-100 relative overflow-hidden">
          {activeTab === 'randomizer' ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 relative">
               <AnimatePresence mode='wait'>
                 {pickedStudent && (
                   <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="bg-white p-20 rounded-[4rem] border-[12px] border-purple-500 shadow-2xl text-center z-10">
                     <p className="text-purple-500 font-black mb-4 uppercase tracking-[0.5em] text-xs">Chosen Student</p>
                     <h2 className="text-8xl font-black uppercase tracking-tighter text-slate-900">{pickedStudent.name}</h2>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          ) : (
            <TransformWrapper initialScale={0.6} minScale={0.1} maxScale={2} centerOnInit={true} panning={{ excluded: ["motion-div", "button"] }}>
              <Controls />
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                <div ref={floorRef} className="bg-white rounded-[2rem] shadow-2xl relative border-4 border-slate-200" style={{ width: '1400px', height: '1000px' }}>
                  <div className="w-full h-16 bg-slate-900 text-white flex items-center justify-center font-black uppercase tracking-[0.6em] text-xs">
                    FRONT - {currentClassName} - LALL RAVI ORGANIZER
                  </div>
                  <div className="relative w-full h-full bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:40px_40px]">
                    {students.map((student) => (
                      <motion.div key={student.id} drag dragMomentum={false} animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} className="absolute cursor-move motion-div">
                        <div className="w-8 h-3 bg-slate-400 rounded-t-lg mx-auto mb-[-2px] border-x border-t border-slate-500 opacity-20"></div>
                        <div className={`w-28 h-16 border-2 rounded-xl shadow-lg flex items-center justify-center p-3 relative transition-all ${student.groupColor || 'bg-white border-slate-200 hover:border-blue-400'}`}>
                          <span className="text-[10px] font-black text-center select-none uppercase tracking-tighter">{student.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-2 -right-2 p-1.5 bg-slate-900 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"><RotateCw size={12}/></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TransformComponent>
            </TransformWrapper>
          )}
        </main>
      </div>
    </div>
  );
}