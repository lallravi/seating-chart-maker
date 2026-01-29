import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Compass, ZoomIn, ZoomOut, Maximize, Users } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-6 bg-white shadow-2xl rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-all"><ZoomIn size={32} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut(0.2)} className="p-6 bg-white shadow-2xl rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-all"><ZoomOut size={32} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="p-6 bg-indigo-600 shadow-2xl rounded-2xl text-white hover:bg-indigo-700 transition-all"><Maximize size={32}/></button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v20-clean');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [newClassName, setNewClassName] = useState("");
  const [activeTab, setActiveTab] = useState('roster');
  const [bulkNames, setBulkNames] = useState("");
  const [pickedStudent, setPickedStudent] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.15);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('compass-v20-clean', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];

  const updateStudents = (newList) => {
    setClasses(prev => ({ ...prev, [currentClassName]: newList }));
  };

  const addNewClass = () => {
    if (newClassName.trim()) {
      const name = newClassName.toUpperCase();
      setClasses(prev => ({ ...prev, [name]: [] }));
      setCurrentClassName(name);
      setNewClassName("");
    }
  };

  const handleDrag = (id, info) => {
    const factor = 1 / currentScale;
    const updated = students.map(s => 
      s.id === id ? { 
        ...s, 
        x: s.x + (info.delta.x * factor), 
        y: s.y + (info.delta.y * factor) 
      } : s
    );
    updateStudents(updated);
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const columns = 5;
    const xGap = 1000; 
    const yGap = 700; 

    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 1200 + (i % columns * xGap),
      y: 1500 + (Math.floor(i / columns) * yGap),
      rotation: 0
    }));

    updateStudents([...students, ...newEntries]);
    setBulkNames("");
  };

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-24 bg-white border-b-4 border-slate-200 px-10 flex justify-between items-center z-[70] shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-600" size={44} />
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">
            {currentClassName} <span className="text-indigo-600 ml-2">MAP</span>
          </h1>
        </div>
        <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'classroom.png'; a.href = d; a.click(); })} 
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          Export Map
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[480px] bg-white border-r-4 border-slate-200 p-10 flex flex-col z-[60] shrink-0 shadow-2xl">
          
          {/* CLASS MANAGEMENT TAB */}
          <div className="mb-10 p-6 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100">
            <label className="text-xs font-black text-slate-400 uppercase mb-4 block tracking-widest">Manage Classes</label>
            <div className="flex gap-2 mb-4">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class Name..." className="flex-1 p-4 rounded-xl border-2 border-slate-200 font-bold outline-none focus:border-indigo-500" />
              <button onClick={addNewClass} className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg"><Plus size={24}/></button>
            </div>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-5 bg-white border-2 border-slate-200 rounded-2xl font-black text-xl outline-none cursor-pointer">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <nav className="flex bg-slate-100 p-2 rounded-2xl mb-10 border-2 border-slate-200">
            {['roster', 'randomizer'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>{t}</button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto pr-2">
            {activeTab === 'roster' ? (
              <div className="space-y-6">
                <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="PASTE ROSTER NAMES HERE..." className="w-full h-80 p-8 bg-slate-50 border-2 border-slate-200 rounded-[3rem] font-bold text-xl outline-none focus:border-indigo-600" />
                <button onClick={processRoster} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Process Roster</button>
                
                <div className="mt-10">
                  <h3 className="text-xs font-black text-slate-300 uppercase mb-6 tracking-widest">Active Students ({students.length})</h3>
                  {students.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-5 mb-3 bg-slate-50 border-2 border-slate-100 rounded-2xl group hover:border-red-200 transition-colors">
                      <span className="font-bold text-slate-700 text-lg">{s.name}</span>
                      <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-300 group-hover:text-red-500"><Trash2 size={24}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <button onClick={() => {
                  let count = 0;
                  const interval = setInterval(() => {
                    setPickedStudent(students[Math.floor(Math.random() * students.length)]);
                    count++;
                    if (count > 25) clearInterval(interval);
                  }, 80);
                }} className="w-full py-24 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-[4rem] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">Spin Randomizer</button>
                {pickedStudent && (
                  <div className="p-10 bg-indigo-50 border-4 border-indigo-200 rounded-[3rem] text-center">
                    <p className="text-indigo-400 font-black text-xs uppercase mb-2 tracking-widest">Selected:</p>
                    <h2 className="text-4xl font-black text-indigo-900">{pickedStudent.name}</h2>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CANVAS */}
        <main className="flex-1 relative bg-slate-200 overflow-hidden">
          <TransformWrapper 
            centerOnInit={true} 
            minScale={0.01} 
            initialScale={0.12} 
            limitToBounds={false}
            panning={{ excluded: ["desk-item"] }}
            onZoom={(ref) => setCurrentScale(ref.state.scale)}
          >
            <Controls />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white" style={{ width: '20000px', height: '15000px' }}>
                
                {/* GIANT WHITEBOARD HEADER */}
                <div className="absolute top-0 w-full h-[800px] bg-slate-900 flex items-center justify-center z-10 shadow-2xl">
                   <h2 className="text-white text-[400px] font-black uppercase tracking-[15rem] translate-x-[7.5rem]">WHITEBOARD</h2>
                </div>

                {/* DOT GRID */}
                <div className="relative w-full h-full bg-[radial-gradient(#cbd5e1_12px,transparent_12px)] [background-size:400px_400px]">
                  {students.map((student) => (
                    <motion.div 
                      key={student.id} 
                      drag 
                      dragMomentum={false}
                      onDrag={(e, info) => handleDrag(student.id, info)}
                      style={{ x: student.x, y: student.y, rotate: student.rotation, position: 'absolute' }}
                      className="desk-item cursor-grab active:cursor-grabbing z-20"
                    >
                      <div className="w-[1000px] h-[650px] bg-white border-[25px] border-indigo-600 rounded-[10rem] shadow-[0_80px_150px_-20px_rgba(0,0,0,0.3)] flex items-center justify-center p-16 relative group transition-transform active:scale-95">
                        <span className="text-[130px] font-black uppercase text-center select-none text-slate-900 leading-none tracking-tighter">
                          {student.name}
                        </span>
                        
                        {/* ROTATE */}
                        <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-20 -right-20 p-14 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-slate-900 transition-colors">
                          <RotateCw size={80}/>
                        </button>

                        {/* CHAIR */}
                        <div className="absolute -bottom-32 w-80 h-32 bg-slate-300 rounded-t-[5rem] -z-10 border-t-[20px] border-slate-400"></div>
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