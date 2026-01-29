import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCw, Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-6 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-8 bg-white shadow-2xl rounded-3xl border-4 border-slate-100 hover:bg-slate-50 active:scale-90 transition-all"><ZoomIn size={48} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut(0.2)} className="p-8 bg-white shadow-2xl rounded-3xl border-4 border-slate-100 hover:bg-slate-50 active:scale-90 transition-all"><ZoomOut size={48} className="text-indigo-600"/></button>
      <button onClick={() => resetTransform()} className="p-8 bg-indigo-600 shadow-2xl rounded-3xl text-white hover:bg-indigo-700 active:scale-90 transition-all border-4 border-indigo-400"><Maximize size={48}/></button>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v25-pro');
    return saved ? JSON.parse(saved) : { "PERIOD 1": [] };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [newClassName, setNewClassName] = useState("");
  const [activeTab, setActiveTab] = useState('roster');
  const [bulkNames, setBulkNames] = useState("");
  const [pickedStudent, setPickedStudent] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.12);
  const floorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('compass-v25-pro', JSON.stringify(classes));
  }, [classes]);

  const students = classes[currentClassName] || [];

  const updateStudents = useCallback((newList) => {
    setClasses(prev => ({ ...prev, [currentClassName]: newList }));
  }, [currentClassName]);

  const addNewClass = () => {
    if (newClassName.trim()) {
      const name = newClassName.toUpperCase();
      setClasses(prev => ({ ...prev, [name]: [] }));
      setCurrentClassName(name);
      setNewClassName("");
    }
  };

  // LAG-FREE DRAG: Updates only the relevant student coordinates
  const handleDrag = (id, info) => {
    const factor = 1 / currentScale;
    updateStudents(students.map(s => 
      s.id === id ? { ...s, x: s.x + (info.delta.x * factor), y: s.y + (info.delta.y * factor) } : s
    ));
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    // HUGE SPREAD: 5 columns, massive gaps to fill the canvas
    const columns = 5;
    const xGap = 1600; 
    const yGap = 1000; 

    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 2000 + (i % columns * xGap),
      y: 2500 + (Math.floor(i / columns) * yGap),
      rotation: 0
    }));

    updateStudents([...students, ...newEntries]);
    setBulkNames("");
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-32 bg-white border-b-8 border-slate-50 px-12 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-6">
          <Compass className="text-indigo-600" size={56} />
          <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-900">
            {currentClassName} <span className="text-indigo-600">PRO</span>
          </h1>
        </div>
        <button onClick={() => toPng(floorRef.current, { canvasWidth: 10000, canvasHeight: 8000 }).then(d => { const a = document.createElement('a'); a.download = 'classroom.png'; a.href = d; a.click(); })} 
          className="bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
          Export HD Map
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[550px] bg-white border-r-8 border-slate-50 p-12 flex flex-col z-[60] shrink-0 shadow-2xl overflow-y-auto">
          
          <div className="mb-12">
            <label className="text-sm font-black text-slate-300 uppercase mb-4 block tracking-[0.2em]">Add Class Period</label>
            <div className="flex gap-4">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="PERIOD 1..." className="flex-1 p-6 rounded-3xl bg-slate-50 border-4 border-slate-100 font-black text-xl outline-none focus:border-indigo-600" />
              <button onClick={addNewClass} className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl hover:bg-indigo-700 transition-all"><Plus size={32}/></button>
            </div>
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full mt-6 p-6 bg-slate-900 text-white border-none rounded-3xl font-black text-2xl outline-none cursor-pointer">
              {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <nav className="flex bg-slate-100 p-2 rounded-3xl mb-12">
            {['roster', 'randomizer'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-6 rounded-2xl text-sm font-black uppercase transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}>{t}</button>
            ))}
          </nav>

          {activeTab === 'roster' ? (
            <div className="space-y-8">
              <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="PASTE NAMES SEPARATED BY COMMAS OR LINES..." className="w-full h-[500px] p-10 bg-slate-50 border-4 border-slate-100 rounded-[4rem] font-bold text-2xl outline-none focus:border-indigo-600" />
              <button onClick={processRoster} className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Spread Students</button>
              
              <div className="pt-10 border-t-8 border-slate-50">
                <h3 className="text-sm font-black text-slate-300 uppercase mb-6 tracking-widest">Active List ({students.length})</h3>
                {students.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-6 mb-4 bg-slate-50 rounded-3xl border-4 border-transparent hover:border-red-500 transition-all group">
                    <span className="font-black text-slate-800 text-2xl">{s.name}</span>
                    <button onClick={() => updateStudents(students.filter(x => x.id !== s.id))} className="text-slate-200 group-hover:text-red-500 transition-colors"><Trash2 size={32}/></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              <button onClick={() => {
                let count = 0;
                const interval = setInterval(() => {
                  setPickedStudent(students[Math.floor(Math.random() * students.length)]);
                  count++;
                  if (count > 30) clearInterval(interval);
                }, 70);
              }} className="w-full py-32 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-[5rem] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all text-2xl">Spin Randomizer</button>
              {pickedStudent && (
                <div className="p-16 bg-white border-[12px] border-indigo-600 rounded-[5rem] text-center shadow-2xl animate-bounce">
                  <h2 className="text-7xl font-black text-indigo-900 uppercase tracking-tighter">{pickedStudent.name}</h2>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* MASSIVE CANVAS AREA */}
        <main className="flex-1 relative bg-slate-100 overflow-hidden">
          <TransformWrapper 
            centerOnInit={true} 
            minScale={0.01} 
            initialScale={0.08} 
            limitToBounds={false}
            panning={{ excluded: ["desk-lock"] }}
            onZoom={(ref) => setCurrentScale(ref.state.scale)}
          >
            <Controls />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white" style={{ width: '25000px', height: '18000px' }}>
                
                {/* MASSIVE WHITEBOARD */}
                <div className="absolute top-0 w-full h-[1200px] bg-slate-900 flex items-center justify-center z-10 shadow-[0_50px_100px_rgba(0,0,0,0.4)]">
                   <h2 className="text-white text-[600px] font-black uppercase tracking-[25rem] translate-x-[12.5rem] select-none">Whiteboard</h2>
                </div>

                {/* GRID PATTERN */}
                <div className="relative w-full h-full bg-[radial-gradient(#e2e8f0_15px,transparent_15px)] [background-size:600px_600px]">
                  {students.map((student) => (
                    <motion.div 
                      key={student.id} 
                      drag 
                      dragMomentum={false}
                      onDrag={(e, info) => handleDrag(student.id, info)}
                      style={{ x: student.x, y: student.y, rotate: student.rotation, position: 'absolute' }}
                      className="desk-lock cursor-grab active:cursor-grabbing z-20"
                    >
                      {/* HUGE DESKS: 1400px wide for massive names */}
                      <div className="w-[1400px] h-[900px] bg-white border-[40px] border-indigo-600 rounded-[15rem] shadow-[0_120px_200px_-50px_rgba(0,0,0,0.5)] flex items-center justify-center p-24 relative group transition-all active:scale-95 active:shadow-inner">
                        <span className="text-[200px] font-black uppercase text-center select-none text-slate-900 leading-none tracking-tighter drop-shadow-2xl">
                          {student.name}
                        </span>
                        
                        {/* ROTATE */}
                        <button onClick={(e) => { e.stopPropagation(); updateStudents(students.map(s => s.id === student.id ? {...s, rotation: (s.rotation||0)+90} : s)) }} className="absolute -top-24 -right-24 p-20 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-slate-900 transition-all hover:scale-110 active:rotate-180">
                          <RotateCw size={120}/>
                        </button>

                        {/* CHAIR VISUAL */}
                        <div className="absolute -bottom-48 w-[400px] h-48 bg-slate-200 rounded-t-[8rem] -z-10 border-t-[30px] border-slate-300"></div>
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