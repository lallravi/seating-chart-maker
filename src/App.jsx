import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Award, RotateCw, Download, Menu, X, ZoomIn, ZoomOut, Maximize, Layout, Group, Sparkles } from 'lucide-react';
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
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('seating-chart-data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState('layout'); // layout, groups, randomizer
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [name, setName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('seating-chart-data', JSON.stringify(students));
  }, [students]);

  const saveAsImage = () => {
    if (floorRef.current === null) return;
    toPng(floorRef.current, { cacheBust: true, backgroundColor: '#f1f5f9' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Seating-Chart.png`;
        link.href = dataUrl;
        link.click();
      });
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
        groupColor: groupIndex % 2 === 0 ? 'border-blue-500 bg-blue-50' : 'border-emerald-500 bg-emerald-50'
      };
    });
    setStudents(updated);
  };

  const pickRandomStudent = () => {
    if (students.length === 0) return;
    setIsSpinning(true);
    setPickedStudent(null);
    
    // Fun "Cycling" effect
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

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <header className="bg-slate-900 text-white py-3 px-4 flex justify-between items-center z-50 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 bg-slate-800 rounded">
            {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <h1 className="text-sm font-black tracking-tighter flex items-center gap-2 uppercase">
            <Award className="text-blue-400" /> SEATING MAKER <span className="text-blue-400 font-normal italic opacity-80 text-xs ml-2">by Lall Ravi</span>
          </h1>
        </div>
        <button onClick={saveAsImage} className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
          <Download size={14}/> Export PNG
        </button>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* SIDEBAR WITH TABS */}
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 absolute lg:relative w-full lg:w-80 h-full bg-white p-6 border-r border-slate-300 shadow-xl z-40 flex flex-col`}>
          
          {/* TAB NAVIGATION */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => setActiveTab('layout')} className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${activeTab === 'layout' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}>
              <Layout size={18} /><span className="text-[8px] font-bold uppercase mt-1">Layout</span>
            </button>
            <button onClick={() => setActiveTab('groups')} className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${activeTab === 'groups' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:bg-slate-200'}`}>
              <Group size={18} /><span className="text-[8px] font-bold uppercase mt-1">Groups</span>
            </button>
            <button onClick={() => setActiveTab('randomizer')} className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${activeTab === 'randomizer' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:bg-slate-200'}`}>
              <Sparkles size={18} /><span className="text-[8px] font-bold uppercase mt-1">Fun</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {activeTab === 'layout' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xs font-black mb-4 text-slate-500 uppercase tracking-widest">Add Students</h2>
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setShowBulk(false)} className={`flex-1 py-2 text-[10px] font-black rounded ${!showBulk ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Single</button>
                    <button onClick={() => setShowBulk(true)} className={`flex-1 py-2 text-[10px] font-black rounded ${showBulk ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Bulk</button>
                  </div>
                  {!showBulk ? (
                    <form onSubmit={(e) => { e.preventDefault(); if(name) { setStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 50, defaultY: 50, rotation: 0 }]); setName(""); } }} className="flex gap-2">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name..." className="flex-1 p-2 border-2 rounded-lg text-sm" />
                      <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Plus /></button>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names..." className="w-full h-24 p-2 border-2 rounded-lg text-sm bg-slate-50" />
                      <button onClick={() => {/* bulk add logic */}} className="w-full bg-slate-800 text-white py-2 rounded-lg font-black text-[10px] uppercase">Add List</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-wider">Pod Generator</h3>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Students per Pod:</span>
                    <input type="number" min="1" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} className="w-12 p-1 border rounded text-xs text-center font-bold" />
                </div>
                <button onClick={createGroups} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all active:scale-95">
                    Snap Students into Groups
                </button>
              </div>
            )}

            {activeTab === 'randomizer' && (
              <div className="text-center space-y-6">
                <div className="p-6 bg-purple-50 rounded-2xl border-2 border-purple-200">
                  <Sparkles className="mx-auto text-purple-600 mb-2" size={32} />
                  <h3 className="text-xs font-black text-purple-800 uppercase tracking-widest">Student Picker</h3>
                  <p className="text-[9px] text-purple-400 mt-1 uppercase font-bold">Pick someone at random!</p>
                </div>
                <button 
                  onClick={pickRandomStudent} 
                  disabled={isSpinning || students.length === 0}
                  className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isSpinning ? "Picking..." : "Roll the Dice!"}
                </button>
              </div>
            )}
          </div>

          {/* SHARED ROSTER LIST */}
          <div className="mt-auto border-t pt-4">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Class Roster ({students.length})</span>
             </div>
             <div className="max-h-48 overflow-y-auto">
               {students.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 mb-1 bg-white border rounded text-[10px] font-bold">
                  {s.name} <button onClick={() => setStudents(students.filter(x => x.id !== s.id))} className="text-red-300 hover:text-red-500"><Trash2 size={12}/></button>
                </div>
              ))}
             </div>
          </div>
        </aside>

        {/* MAIN CANVAS / DISPLAY AREA */}
        <main className="flex-1 bg-slate-200 relative overflow-hidden">
          {activeTab === 'randomizer' ? (
            /* FUN RANDOMIZER DISPLAY */
            <div className="w-full h-full flex items-center justify-center bg-slate-900 relative">
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500 via-transparent to-transparent"></div>
               <AnimatePresence mode='wait'>
                 {pickedStudent && (
                   <motion.div 
                     key={pickedStudent.id}
                     initial={{ scale: 0, rotate: -10 }}
                     animate={{ scale: 1, rotate: 0 }}
                     exit={{ scale: 0, opacity: 0 }}
                     className="bg-white p-12 rounded-[3rem] shadow-[0_0_50px_rgba(168,85,247,0.4)] border-8 border-purple-500 text-center"
                   >
                     <p className="text-purple-600 font-black uppercase tracking-widest mb-4">The Winner is:</p>
                     <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">{pickedStudent.name}</h2>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          ) : (
            /* STANDARD CLASSROOM FLOOR */
            <TransformWrapper initialScale={0.6} minScale={0.1} maxScale={2.5} centerOnInit={true} panning={{ excluded: ["motion-div", "button"] }}>
              <Controls />
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                <div ref={floorRef} className="bg-white rounded-xl shadow-2xl relative" style={{ width: '1400px', height: '1000px' }}>
                  <div className="w-full h-14 bg-slate-800 text-white flex items-center justify-center font-black uppercase tracking-[0.5em]">Whiteboard Area</div>
                  <div className="relative w-full h-full bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:40px_40px]">
                    {students.map((student) => (
                      <motion.div key={student.id} drag dragMomentum={false} animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} className="absolute cursor-move motion-div">
                        <div className="w-8 h-3.5 bg-slate-300 rounded-t-lg mx-auto mb-[-2px] border-x border-t border-slate-400"></div>
                        <div className={`w-28 h-16 border-2 rounded-lg shadow-lg flex items-center justify-center p-2 relative ${student.groupColor || 'bg-amber-50 border-amber-900/20'}`}>
                          <span className="text-[9px] font-black text-slate-800 uppercase text-center leading-tight select-none pointer-events-none">{student.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); setStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-2 -right-2 p-1 bg-blue-600 text-white rounded-full"><RotateCw size={10}/></button>
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