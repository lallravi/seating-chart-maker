import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Compass, Users, GraduationCap, Target, FileDown, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

// Zoom Controls Component
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

  useEffect(() => { setPos({ x: student.x, y: student.y }); }, [student.x, student.y]);

  const onMouseDown = (e) => {
    isDragging.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = pos.x;
    const initialY = pos.y;

    const onMouseMove = (moveEvent) => {
      if (!isDragging.current) return;
      // Adjust movement based on current zoom scale
      const dx = (moveEvent.clientX - startX) * (1 / scale);
      const dy = (moveEvent.clientY - startY) * (1 / scale);
      setPos({ x: initialX + dx, y: initialY + dy });
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      updatePosition(student.id, pos.x, pos.y, isTeacher);
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
        zIndex: isTeacher ? 50 : 20 
      }} 
      className="cursor-grab active:cursor-grabbing"
    >
      <div className={`w-[400px] h-[220px] rounded-[2rem] shadow-2xl flex items-center justify-center relative border-[10px] ${isTeacher ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-900'}`}>
        <span className={`text-5xl font-black uppercase text-center px-6 leading-tight ${isTeacher ? 'text-indigo-900' : 'text-slate-900'}`}>
          {student.name}
        </span>
        <div className="absolute -top-10 -right-10 flex gap-3 no-print">
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id, isTeacher)} className="p-4 bg-indigo-600 text-white rounded-full shadow-lg"><RotateCw size={30}/></button>
            {!isTeacher && <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="p-4 bg-red-600 text-white rounded-full shadow-lg"><Trash2 size={30}/></button>}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-movable-v1');
    return saved ? JSON.parse(saved) : { "PERIOD 1": { students: [], teacherDesk: { id: 't1', name: 'TEACHER', x: 1800, y: 200, rotation: 0 } } };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0]);
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentScale, setCurrentScale] = useState(1);
  const floorRef = useRef(null);

  useEffect(() => { localStorage.setItem('compass-movable-v1', JSON.stringify(classes)); }, [classes]);
  const currentData = classes[currentClassName] || { students: [], teacherDesk: null };

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
      y: 600 + (Math.floor(i / 5) * 400),
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
    pdf.save(`Seating-Chart-${currentClassName}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col font-sans overflow-hidden">
      <header className="h-20 bg-white border-b-4 border-slate-200 px-8 flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-600" size={32} />
          <h1 className="text-2xl font-black uppercase text-slate-900">{currentClassName}</h1>
        </div>
        <div className="flex gap-3">
            <button onClick={exportPDF} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2"><FileDown size={20}/> Save PDF</button>
            <button onClick={() => { if(currentData.students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(currentData.students[Math.floor(Math.random()*currentData.students.length)]);c++;if(c>20)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2"><Target size={20}/> Randomizer</button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold">{isSidebarOpen ? "Close Menu" : "Open Menu"}</button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-r-4 border-slate-100 transition-all duration-300 overflow-hidden z-40`}>
          <div className="p-6 w-80 space-y-6">
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl font-bold outline-none">
                {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Student Names..." className="w-full h-64 p-4 bg-slate-50 border-2 rounded-2xl outline-none" />
            <button onClick={processRoster} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase">Generate Grid</button>
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-200 overflow-hidden">
          <TransformWrapper 
            initialScale={0.4} 
            minScale={0.1} 
            centerOnInit={true}
            limitToBounds={false}
            panning={{ excluded: ["cursor-grab"] }}
            onZoom={(ref) => setCurrentScale(ref.state.scale)}
          >
            <ZoomTools />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white shadow-inner" style={{ width: '5000px', height: '4000px' }}>
                {/* Whiteboard Area */}
                <div className="absolute top-0 w-full h-24 bg-slate-900 flex items-center justify-center">
                    <span className="text-white font-black tracking-[2em] uppercase opacity-30">Whiteboard</span>
                </div>
                {/* Student and Teacher Desks */}
                {currentData.teacherDesk && <Desk student={currentData.teacherDesk} isTeacher={true} scale={currentScale} updatePosition={updatePosition} rotate={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], teacherDesk: {...p[currentClassName].teacherDesk, rotation: (p[currentClassName].teacherDesk.rotation || 0)+90}}}))} />}
                {currentData.students.map((s) => (
                    <Desk key={s.id} student={s} isTeacher={false} scale={currentScale} updatePosition={updatePosition} rotate={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.map(x=>x.id===id?{...x, rotation:(x.rotation||0)+90}:x)}}))} remove={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.filter(x=>x.id!==id)}}))} />
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>

          {isRandomizing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
                <div className="bg-white p-20 rounded-[4rem] text-center border-[20px] border-indigo-600 shadow-2xl">
                    <h2 className="text-8xl font-black text-slate-900 uppercase mb-8">{pickedStudent?.name}</h2>
                    <button onClick={() => setIsRandomizing(false)} className="px-12 py-4 bg-slate-900 text-white rounded-full font-black text-xl uppercase">CLOSE</button>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}