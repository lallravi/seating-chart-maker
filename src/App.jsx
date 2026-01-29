import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Award, RotateCw, Download, Menu, X, ZoomIn, ZoomOut, Maximize, Layout, Group, Sparkles, FolderPlus } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
      <button onClick={() => zoomIn()} className="p-3 bg-white shadow-xl rounded-full border border-slate-200 hover:bg-slate-50"><ZoomIn size={18}/></button>
      <button onClick={() => zoomOut()} className="p-3 bg-white shadow-xl rounded-full border border-slate-200 hover:bg-slate-50"><ZoomOut size={18}/></button>
      <button onClick={() => resetTransform()} className="px-4 py-2 bg-slate-900 text-white shadow-xl rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-800">Reset View</button>
    </div>
  );
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('teacher-tools-data');
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

  // Sync with LocalStorage whenever classes change
  useEffect(() => {
    localStorage.setItem('teacher-tools-data', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];

  const updateStudents = (newList) => {
    setClasses(prev => ({ ...prev, [currentClassName]: newList }));
  };

  // --- CLASS ACTIONS ---
  const addNewClass = () => {
    if (newClassName && !classes[newClassName]) {
      setClasses(prev => ({ ...prev, [newClassName]: [] }));
      setCurrentClassName(newClassName);
      setNewClassName("");
    }
  };

  const deleteClass = (nameToDelete) => {
    if (Object.keys(classes).length <= 1) return alert("Keep at least one class!");
    if (window.confirm(`Delete ${nameToDelete}?`)) {
      const remaining = { ...classes };
      delete remaining[nameToDelete];
      setClasses(remaining);
      setCurrentClassName(Object.keys(remaining)[0]);
    }
  };

  // --- FEATURE ACTIONS ---
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
        groupColor: groupIndex % 2 === 0 ? 'border-blue-500 bg-blue-50' : 'border-emerald-500 bg-emerald-50'
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
      if (count > 20) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const saveAsImage = () => {
    if (floorRef.current === null) return;
    toPng(floorRef.current, { cacheBust: true, backgroundColor: '#f1f5f9' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${currentClassName}-Seating.png`;
        link.href = dataUrl;
        link.click();
      });
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-900">
      {/* HEADER */}
      <header className="bg-slate-900 text-white py-3 px-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 bg-slate-800 rounded"><Menu size={20}/></button>
          <h1 className="text-sm font-black tracking-tighter flex items-center gap-2 uppercase">
            <Award className="text-blue-400" /> SEATING MAKER <span className="text-blue-400 font-normal italic opacity-60 text-[10px] ml-1">LALL RAVI</span>
          </h1>
        </div>
        <button onClick={saveAsImage} className="bg-blue-600 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Download size={14}/> Export</button>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 absolute lg:relative w-full lg:w-80 h-full bg-white p-6 border-r border-slate-300 shadow-xl z-40 flex flex-col`}>
          
          {/* CLASS SELECTOR */}
          <div className="mb-6 p-4 bg-slate-900 rounded-xl text-white">
            <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Classroom Name</label>
            <select 
              value={currentClassName} 
              onChange={(e) => setCurrentClassName(e.target.value)}
              className="w-full bg-slate-800 p-2 rounded text-xs font-bold outline-none mb-3 border border-slate-700"
            >
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <input 
                value={newClassName} 
                onChange={(e) => setNewClassName(e.target.value)} 
                placeholder="New Class..." 
                className="flex-1 bg-slate-800 p-2 rounded text-[10px] outline-none border border-slate-700"
              />
              <button onClick={addNewClass} className="p-2 bg-blue-600 rounded hover:bg-blue-500"><Plus size={14}/></button>
              <button onClick={() => deleteClass(currentClassName)} className="p-2 bg-red-900/50 rounded text-red-400 hover:bg-red-900"><Trash2 size={14}/></button>
            </div>
          </div>

          {/* MODE TABS */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => setActiveTab('layout')} className={`flex-1 flex flex-col items-center py-2 rounded-lg ${activeTab === 'layout' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Layout size={18} /><span className="text-[8px] font-bold uppercase mt-1">Layout</span></button>
            <button onClick={() => setActiveTab('groups')} className={`flex-1 flex flex-col items-center py-2 rounded-lg ${activeTab === 'groups' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}><Group size={18} /><span className="text-[8px] font-bold uppercase mt-1">Groups</span></button>
            <button onClick={() => setActiveTab('randomizer')} className={`flex-1 flex flex-col items-center py-2 rounded-lg ${activeTab === 'randomizer' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}><Sparkles size={18} /><span className="text-[8px] font-bold uppercase mt-1">Picker</span></button>
          </div>

          {/* TAB CONTENT */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setShowBulk(false)} className={`flex-1 py-1 text-[10px] font-bold rounded ${!showBulk ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>Single</button>
                  <button onClick={() => setShowBulk(true)} className={`flex-1 py-1 text-[10px] font-bold rounded ${showBulk ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>Bulk</button>
                </div>
                {!showBulk ? (
                  <form onSubmit={(e) => { e.preventDefault(); if(name) { updateStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 50, defaultY: 50, rotation: 0 }]); setName(""); } }} className="flex gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student Name" className="flex-1 p-2 border-2 rounded text-sm" />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded"><Plus/></button>
                  </form>
                ) : (
                  <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} onBlur={() => {
                    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
                    updateStudents([...students, ...names.map((n, i) => ({ id: Date.now()+i, name: n.toUpperCase(), defaultX: 50, defaultY: 50 }))]);
                    setBulkNames(""); setShowBulk(false);
                  }} placeholder="Paste names & click away..." className="w-full h-24 p-2 border-2 rounded text-sm bg-slate-50" />
                )}
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-100 text-center">
                <input type="number" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} className="w-16 p-2 border-2 rounded mb-4 text-center font-bold" />
                <button onClick={createGroups} className="w-full py-3 bg-emerald-600 text-white rounded font-black text-[10px] uppercase tracking-widest shadow-md">Create Random Pods</button>
              </div>
            )}

            {activeTab === 'randomizer' && (
              <div className="text-center space-y-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
                <Sparkles className="mx-auto text-purple-600" size={30} />
                <button onClick={pickRandomStudent} disabled={isSpinning || students.length === 0} className="w-full py-4 bg-purple-600 text-white rounded font-black text-xs uppercase tracking-widest shadow-lg">Roll Random Name</button>
              </div>
            )}

            {/* ROSTER LIST */}
            <div className="mt-8 border-t pt-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Roster: {currentClassName}</h3>
              {students.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 mb-1 bg-white border rounded text-[10px] font-bold">
                  {s.name} <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-red-300 hover:text-red-500"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY */}
        <main className="flex-1 bg-slate-200 relative overflow-hidden">
          {activeTab === 'randomizer' ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 relative">
               <AnimatePresence mode='wait'>
                 {pickedStudent && (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="bg-white p-16 rounded-[4rem] border-8 border-purple-500 shadow-2xl text-center">
                     <p className="text-purple-500 font-black mb-2 uppercase tracking-widest">Selected Student</p>
                     <h2 className="text-7xl font-black uppercase tracking-tighter">{pickedStudent.name}</h2>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          ) : (
            <TransformWrapper initialScale={0.6} minScale={0.1} maxScale={2} centerOnInit={true} panning={{ excluded: ["motion-div", "button"] }}>
              <Controls />
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                <div ref={floorRef} className="bg-white rounded shadow-2xl relative" style={{ width: '1400px', height: '1000px' }}>
                  <div className="w-full h-14 bg-slate-800 text-white flex items-center justify-center font-black uppercase tracking-[0.5em] text-sm italic">
                    {currentClassName} - Whiteboard Area
                  </div>
                  <div className="relative w-full h-full bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:40px_40px]">
                    {students.map((student) => (
                      <motion.div key={student.id} drag dragMomentum={false} animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} className="absolute cursor-move motion-div">
                        <div className="w-8 h-3.5 bg-slate-300 rounded-t-lg mx-auto mb-[-2px] border-x border-t border-slate-400"></div>
                        <div className={`w-28 h-16 border-2 rounded shadow-lg flex items-center justify-center p-2 relative ${student.groupColor || 'bg-amber-50 border-amber-900/10'}`}>
                          <span className="text-[9px] font-black text-center select-none">{student.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-2 -right-2 p-1 bg-blue-600 text-white rounded-full"><RotateCw size={10}/></button>
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