import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Compass, Users, GraduationCap, Target, FileDown, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const ZoomTools = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-[100] no-print">
      <button onClick={() => zoomIn()} className="p-4 bg-white shadow-xl rounded-xl border-2 border-slate-200 hover:bg-slate-50"><ZoomIn size={24}/></button>
      <button onClick={() => zoomOut()} className="p-4 bg-white shadow-xl rounded-xl border-2 border-slate-200 hover:bg-slate-50"><ZoomOut size={24}/></button>
      <button onClick={() => resetTransform()} className="p-4 bg-indigo-600 text-white shadow-xl rounded-xl hover:bg-indigo-700"><Maximize size={24}/></button>
    </div>
  );
};

const Desk = ({ student, isTeacher, updatePosition, rotate, remove, scale }) => {
  const [pos, setPos] = useState({ x: student.x, y: student.y });
  const isDragging = useRef(false);

  // Sync state if student prop changes externally
  useEffect(() => { 
    if (!isDragging.current) {
      setPos({ x: student.x, y: student.y }); 
    }
  }, [student.x, student.y]);

  const onMouseDown = (e) => {
    isDragging.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = pos.x;
    const initialY = pos.y;

    const onMouseMove = (moveEvent) => {
      if (!isDragging.current) return;
      const dx = (moveEvent.clientX - startX) * (1 / scale);
      const dy = (moveEvent.clientY - startY) * (1 / scale);
      setPos({ x: initialX + dx, y: initialY + dy });
    };

    const onMouseUp = (moveEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      const finalX = initialX + (moveEvent.clientX - startX) * (1 / scale);
      const finalY = initialY + (moveEvent.clientY - startY) * (1 / scale);
      updatePosition(student.id, finalX, finalY, isTeacher);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      onMouseDown={onMouseDown} 
      style={{ 
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${student.rotation || 0}deg)`, 
        position: 'absolute', 
        zIndex: isDragging.current ? 1000 : (isTeacher ? 50 : 20) 
      }} 
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="relative group">
        {/* Desk Body */}
        <div className={`w-[400px] h-[220px] rounded-2xl shadow-2xl flex items-center justify-center relative border-[12px] ${isTeacher ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-900'}`}>
          <span className={`text-5xl font-black uppercase text-center px-6 leading-tight select-none ${isTeacher ? 'text-indigo-900' : 'text-slate-900'}`}>
            {student.name}
          </span>
          
          {/* Desk Ledge Decoration */}
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-32 h-2 rounded-full opacity-20 ${isTeacher ? 'bg-indigo-900' : 'bg-slate-900'}`}></div>
          
          <div className="absolute -top-10 -right-10 flex gap-3 no-print">
              <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id, isTeacher)} className="p-4 bg-indigo-600 text-white rounded-full shadow-lg"><RotateCw size={28}/></button>
              {!isTeacher && <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="p-4 bg-red-600 text-white rounded-full shadow-lg"><Trash2 size={28}/></button>}
          </div>
        </div>
        {/* Chair Silhouette */}
        <div className={`absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-16 rounded-b-3xl border-x-8 border-b-8 opacity-40 ${isTeacher ? 'bg-indigo-200 border-indigo-600' : 'bg-slate-200 border-slate-900'}`}></div>
      </div>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-lallravi-v1');
    return saved ? JSON.parse(saved) : { "PERIOD 1": { students: [], teacherDesk: { id: 't1', name: 'TEACHER', x: 1800, y: 150, rotation: 0 } } };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0]);
  const [newClassName, setNewClassName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentScale, setCurrentScale] = useState(0.4);
  const floorRef = useRef(null);

  useEffect(() => { localStorage.setItem('compass-lallravi-v1', JSON.stringify(classes)); }, [classes]);
  const currentData = classes[currentClassName] || { students: [], teacherDesk: null };

  const addClass = () => {
    if (!newClassName) return;
    const name = newClassName.toUpperCase();
    setClasses(prev => ({ ...prev, [name]: { students: [], teacherDesk: { id: Date.now().toString(), name: 'TEACHER', x: 1800, y: 150, rotation: 0 } } }));
    setCurrentClassName(name);
    setNewClassName("");
  };

  const updatePosition = (id, x, y, isTeacher) => {
    setClasses(prev => ({
      ...prev,
      [currentClassName]: {
        ...prev[currentClassName],
        students: isTeacher ? prev[currentClassName].students : prev[currentClassName].students.map(s => s.id === id ? { ...s, x, y } : s),
        teacherDesk: isTeacher ? { ...prev[currentClassName].teacherDesk, x, y } : prev[currentClassName].teacherDesk
      }
    }));
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 500 + (i % 5 * 600),
      y: 600 + (Math.floor(i / 5) * 450),
      rotation: 0
    }));
    setClasses(prev => ({ ...prev, [currentClassName]: { ...prev[currentClassName], students: [...prev[currentClassName].students, ...newEntries] } }));
    setBulkNames("");
  };

  const exportPDF = async () => {
    const element = floorRef.current;
    const dataUrl = await toPng(element, { backgroundColor: '#ffffff' });
    const pdf = new jsPDF('l', 'px', [element.scrollWidth, element.scrollHeight]);
    pdf.addImage(dataUrl, 'PNG', 0, 0, element.scrollWidth, element.scrollHeight);
    pdf.save(`${currentClassName}-Seating-LallRavi.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col font-sans overflow-hidden">
      <header className="h-24 bg-white border-b-4 border-slate-200 px-8 flex justify-between items-center z-50 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black uppercase text-indigo-600 tracking-tighter leading-none">CLASSROOM COMPASS BY LALL RAVI</h1>
          <span className="text-xl font-bold text-slate-400 mt-1">{currentClassName}</span>
        </div>
        <div className="flex gap-3">
            <button onClick={exportPDF} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors"><FileDown size={20}/> Save PDF</button>
            <button onClick={() => { if(currentData.students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(currentData.students[Math.floor(Math.random()*currentData.students.length)]);c++;if(c>20)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors"><Target size={20}/> Randomizer</button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold shadow-md">{isSidebarOpen ? "Close Menu" : "Open Menu"}</button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-r-4 border-slate-100 transition-all duration-300 overflow-hidden z-40 shadow-xl`}>
          <div className="p-6 w-80 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Class</label>
              <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl font-bold outline-none border-2 border-transparent focus:border-indigo-500">
                  {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2 pt-4 border-t-2 border-slate-50">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Create New Class</label>
              <div className="flex gap-2">
                <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="NAME (e.g. PER 2)" className="flex-1 p-3 bg-slate-50 border-2 rounded-xl font-bold text-sm outline-none focus:border-indigo-500" />
                <button onClick={addClass} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><Plus/></button>
              </div>
            </div>
            <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Paste student names..." className="w-full h-48 p-4 bg-slate-50 border-2 rounded-2xl font-medium outline-none focus:border-indigo-500" />
            <button onClick={processRoster} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Generate Students</button>
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-200 overflow-hidden">
          <TransformWrapper initialScale={0.4} minScale={0.1} centerOnInit={true} limitToBounds={false} panning={{ excluded: ["cursor-grab"] }} onZoom={(ref) => setCurrentScale(ref.state.scale)}>
            <ZoomTools />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white shadow-inner" style={{ width: '5000px', height: '4000px' }}>
                <div className="absolute top-0 w-full h-24 bg-slate-900 flex items-center justify-center">
                    <span className="text-white font-black tracking-[2em] uppercase opacity-30">Whiteboard Area</span>
                </div>
                {currentData.teacherDesk && <Desk student={currentData.teacherDesk} isTeacher={true} scale={currentScale} updatePosition={updatePosition} rotate={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], teacherDesk: {...p[currentClassName].teacherDesk, rotation: (p[currentClassName].teacherDesk.rotation || 0)+90}}}))} />}
                {currentData.students.map((s) => (
                    <Desk key={s.id} student={s} isTeacher={false} scale={currentScale} updatePosition={updatePosition} rotate={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.map(x=>x.id===id?{...x, rotation:(x.rotation||0)+90}:x)}}))} remove={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.filter(x=>x.id!==id)}}))} />
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>

          {isRandomizing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="bg-white p-20 rounded-[4rem] text-center border-[20px] border-indigo-600 shadow-2xl scale-in-center">
                    <h2 className="text-9xl font-black text-slate-900 uppercase mb-8 tracking-tighter">{pickedStudent?.name}</h2>
                    <button onClick={() => setIsRandomizing(false)} className="px-16 py-5 bg-slate-900 text-white rounded-full font-black text-2xl uppercase tracking-widest shadow-xl">CLOSE</button>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}