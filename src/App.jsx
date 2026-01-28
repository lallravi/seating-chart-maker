import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, FileText, RotateCcw, Shuffle, LayoutGrid, Award, RotateCw, Group } from 'lucide-react';

export default function App() {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('seating-chart-data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [name, setName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [groupSize, setGroupSize] = useState(4);

  useEffect(() => {
    localStorage.setItem('seating-chart-data', JSON.stringify(students));
  }, [students]);

  const resetAll = () => {
    if (window.confirm("Delete everything and start over?")) {
      setStudents([]);
      localStorage.removeItem('seating-chart-data');
    }
  };

  const rotateDesk = (id) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, rotation: (s.rotation || 0) + 90 } : s
    ));
  };

  // NEW: RANDOM GROUPING LOGIC
  const createGroups = () => {
    if (students.length === 0) return;
    
    // 1. Shuffle students
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    
    // 2. Assign positions in "Pods"
    const updated = shuffled.map((student, index) => {
      const groupIndex = Math.floor(index / groupSize);
      const posInGroup = index % groupSize;
      
      // Pod spacing math
      const podCol = groupIndex % 3;
      const podRow = Math.floor(groupIndex / 3);
      
      const baseX = 150 + (podCol * 400);
      const baseY = 100 + (podRow * 300);
      
      // Position desks within the pod
      const offsetX = (posInGroup % 2) * 170;
      const offsetY = Math.floor(posInGroup / 2) * 110;

      return {
        ...student,
        defaultX: baseX + offsetX,
        defaultY: baseY + offsetY,
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
        defaultX: 100 + ((index % 5) * 200), 
        defaultY: 80 + (Math.floor(index / 5) * 180),
        rotation: 0
    }));
    setStudents([...students, ...newStudents]);
    setBulkNames("");
    setShowBulk(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white py-4 px-8 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
          <Award className="text-blue-400" /> SEATING CHART MAKER <span className="text-blue-400 text-sm font-normal ml-2 italic">by Lall Ravi</span>
        </h1>
        <div className="text-[10px] text-slate-400 font-mono italic">Group Edition v4.0</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white p-6 border-r border-slate-300 shadow-xl z-10 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xs font-black flex items-center gap-2 mb-4 text-slate-500 uppercase tracking-widest"><Users size={16} /> Roster</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setShowBulk(false)} className={`flex-1 py-2 text-[10px] font-black rounded ${!showBulk ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Single</button>
              <button onClick={() => setShowBulk(true)} className={`flex-1 py-2 text-[10px] font-black rounded ${showBulk ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Bulk</button>
            </div>
            
            {showBulk ? (
              <div className="space-y-2">
                <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste names..." className="w-full h-32 p-3 border-2 rounded-lg text-sm bg-slate-50" />
                <button onClick={handleBulkAdd} className="w-full bg-slate-800 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-700">Add List</button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if(name) { setStudents([...students, { id: Date.now(), name: name.toUpperCase(), defaultX: 50, defaultY: 50, rotation: 0 }]); setName(""); } }} className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name..." className="flex-1 p-2 border-2 rounded-lg text-sm font-bold" />
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Plus /></button>
              </form>
            )}
          </div>

          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h2 className="text-xs font-black mb-3 text-slate-500 uppercase flex items-center gap-2"><Group size={14}/> Random Grouping</h2>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Size:</label>
              <input type="number" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} className="w-full p-1 border rounded font-bold text-center" />
            </div>
            <button onClick={createGroups} className="w-full py-2 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2">
              <Shuffle size={14}/> Create & Place Pods
            </button>
          </div>

          <div className="flex-1 overflow-y-auto border-t pt-4">
             {students.map(s => (
              <div key={s.id} className="flex justify-between items-center p-2 mb-1 bg-white border rounded text-[10px] font-bold">
                {s.name} <button onClick={() => setStudents(students.filter(x => x.id !== s.id))} className="text-red-300"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>

          <button onClick={resetAll} className="mt-4 py-2 w-full text-red-500 text-[10px] font-black uppercase border border-red-100 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
            <RotateCcw size={12}/> Reset App
          </button>
        </aside>

        <main className="flex-1 relative bg-slate-200 p-10 overflow-auto">
          <div className="w-full h-12 bg-slate-800 text-white flex items-center justify-center font-black uppercase tracking-[0.4em] rounded-t-xl shadow-xl">Whiteboard / Front</div>
          <div className="relative w-[1600px] h-[1200px] border-x-4 border-b-4 border-slate-300 bg-white rounded-b-xl shadow-inner bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:40px_40px]">
            {students.map((student) => (
              <motion.div key={student.id} drag dragMomentum={false} initial={{ x: student.defaultX, y: student.defaultY }} animate={{ x: student.defaultX, y: student.defaultY, rotate: student.rotation || 0 }} className="absolute cursor-move group">
                <div className="w-12 h-6 bg-slate-300 rounded-t-lg mx-auto mb-[-2px] border-x border-t border-slate-400"></div>
                <div className={`w-40 h-24 border-2 rounded-lg shadow-lg flex flex-col items-center justify-center p-2 relative ${student.groupColor || 'border-amber-900/30 bg-amber-50'}`}>
                    <span className="text-[10px] font-black text-slate-800 uppercase text-center px-2">{student.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); rotateDesk(student.id); }} className="absolute top-1 right-1 p-1 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><RotateCw size={12} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
      <footer className="bg-white border-t border-slate-200 py-3 px-8 text-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Copyright @lallravi 2026</p></footer>
    </div>
  );
}