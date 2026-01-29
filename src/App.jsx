import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, Award, RotateCw, Group, Download, Menu, X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
      <button onClick={() => zoomIn()} className="p-3 bg-white shadow-xl rounded-full border border-slate-200 hover:bg-slate-50"><ZoomIn size={18}/></button>
      <button onClick={() => zoomOut()} className="p-3 bg-white shadow-xl rounded-full border border-slate-200 hover:bg-slate-50"><ZoomOut size={18}/></button>
      <button onClick={() => resetTransform()} className="p-3 bg-white shadow-xl rounded-full border border-slate-200 hover:bg-slate-50"><Maximize size={18}/></button>
    </div>
  );
};

export default function App() {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('seating-chart-data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [name, setName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('seating-chart-data', JSON.stringify(students));
  }, [students]);

  const saveAsImage = () => {
    if (floorRef.current === null) return;
    toPng(floorRef.current, { cacheBust: true, backgroundColor: '#f1f5f9' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Seating-Chart-${new Date().toLocaleDateString()}.png`;
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
      const podCol = groupIndex % 4; // 4 pods across instead of 3
      const podRow = Math.floor(groupIndex / 4);
      
      // Adjusted spacing for smaller desks
      return {
        ...student,
        defaultX: 100 + (podCol * 320) + ((posInGroup % 2) * 140),
        defaultY: 100 + (podRow * 240) + (Math.floor(posInGroup / 2) * 100),
        rotation: 0,
        groupColor: groupIndex % 2 === 0 ? 'border-blue-500 bg-blue-50' : 'border-emerald-500 bg-emerald-50'
      };
    });
    setStudents(updated);
  };

  const handleBulkAdd = () => {
    const namesArray = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const newStudents = namesArray.map((n, index) => ({
        id: Date.now() + index,
        name: n.toUpperCase(),
        defaultX: 50 + ((index % 6) * 150), 
        defaultY: 50 + (Math.floor(index / 6) * 120),
        rotation: 0
    }));
    setStudents([...students, ...newStudents]);
    setBulkNames("");
    setShowBulk(false);
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      <header className="bg-slate-900 text-white py-3 px-4 flex justify-between items-center z-50 border-b-2 border-blue-600">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 bg-slate-800 rounded">
            {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <h1 className="text-sm font-black tracking-tighter flex items-center gap-2">
            <Award className="text-blue-400" size={18} /> SEATING MAKER <span className="hidden sm:inline text-blue-400 font-normal ml-1 italic opacity-80 text-xs">by Lall Ravi</span>
          </h1>
        </div>
        <button onClick={saveAsImage} className="bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Download size={14}/> Export Image
        </button>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 absolute lg:relative w-full lg:w-72 h-full bg-white p-5 border-r border-slate-300 shadow-2xl z-40 flex flex-col`}>
          <div className="mb-6">
            <h2 className="text-[10px] font-black mb-4 text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={14} /> Class Roster</h2>
            <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-lg">
              <button onClick={() => setShowBulk(false)} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all ${!showBulk ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Single</button>
              <button onClick={() => setShowBulk(true)} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all ${showBulk ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Bulk Add</button>
            </div>
            
            {!showBulk ? (
              <form onSubmit={(e) => { e.preventDefault(); if(name) { setStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 50, defaultY: 50, rotation: 0 }]); setName(""); } }} className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student Name" className="flex-1 p-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={18}/></button>
              </form>
            ) : (
              <div className="space-y-2">
                <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names separated by commas..." className="w-full h-24 p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                <button onClick={handleBulkAdd} className="w-full bg-slate-800 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-700">Add All Students</button>
              </div>
            )}
          </div>

          <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
             <h3 className="text-[9px] font-black text-blue-800 uppercase mb-3 tracking-wider">Arrangement Tools</h3>
             <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Size:</span>
                <input type="number" min="1" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} className="w-12 p-1 border rounded text-xs font-bold text-center" />
             </div>
             <button onClick={createGroups} className="w-full py-2 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-sm">Generate Pods</button>
          </div>

          <div className="flex-1 overflow-y-auto border-t border-slate-100 pt-4">
             {students.map(s => (
              <div key={s.id} className="flex justify-between items-center p-2 mb-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-700 group">
                <span className="truncate">{s.name}</span>
                <button onClick={() => setStudents(students.filter(x => x.id !== s.id))} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 bg-slate-200 relative overflow-hidden">
          <TransformWrapper 
            initialScale={0.6} 
            minScale={0.2} 
            maxScale={2.5} 
            centerOnInit={true}
          >
            <Controls />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              {/* THE CLASSROOM FLOOR */}
              <div ref={floorRef} className="bg-white rounded-xl shadow-2xl relative" style={{ width: '1400px', height: '1000px' }}>
                <div className="w-full h-12 bg-slate-800 text-white flex items-center justify-center font-black uppercase tracking-[0.6em] text-sm border-b-4 border-slate-700">
                  Whiteboard / Front of Class
                </div>
                <div className="relative w-full h-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:30px_30px]">
                  {students.map((student) => (
                    <motion.div 
                      key={student.id} 
                      drag 
                      dragMomentum={false} 
                      animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} 
                      className="absolute cursor-grab active:cursor-grabbing group"
                    >
                      {/* CHAIR */}
                      <div className="w-8 h-3.5 bg-slate-300 rounded-t-md mx-auto mb-[-1px] border-x border-t border-slate-400"></div>
                      {/* DESK (Smaller Size) */}
                      <div className={`w-28 h-16 border-2 rounded-lg shadow-md flex items-center justify-center p-2 relative transition-colors ${student.groupColor || 'bg-amber-50/50 border-amber-900/10 hover:border-blue-300'}`}>
                        <span className="text-[8px] font-black text-slate-800 uppercase text-center leading-tight select-none pointer-events-none">{student.name}</span>
                        
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) 
                          }} 
                          className="absolute -top-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <RotateCw size={10}/>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TransformComponent>
          </TransformWrapper>
        </main>
      </div>
    </div>
  );
}