import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCw, Compass, Users, GraduationCap, Target, FileDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const Desk = ({ student, isTeacher, updatePosition, rotate, remove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: student.x, y: student.y });

  const onMouseDown = (e) => {
    setIsDragging(true);
    const startX = e.clientX - pos.x;
    const startY = e.clientY - pos.y;

    const onMouseMove = (moveEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;
      setPos({ x: newX, y: newY });
    };

    const onMouseUp = (moveEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      updatePosition(student.id, moveEvent.clientX - startX, moveEvent.clientY - startY, isTeacher);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      onMouseDown={onMouseDown}
      style={{ 
        left: `${pos.x}px`, 
        top: `${pos.y}px`, 
        transform: `rotate(${student.rotation || 0}deg)`,
        position: 'absolute',
        zIndex: isDragging ? 100 : (isTeacher ? 50 : 20)
      }}
      className="cursor-grab active:cursor-grabbing select-none"
    >
      <div className={`w-80 h-44 rounded-3xl shadow-xl flex items-center justify-center relative border-8 ${isTeacher ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-900'}`}>
        <span className={`text-3xl font-black uppercase text-center px-4 ${isTeacher ? 'text-indigo-900' : 'text-slate-900'}`}>
          {student.name}
        </span>
        <div className="absolute -top-6 -right-6 flex gap-2 no-print">
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id, isTeacher)} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><RotateCw size={20}/></button>
            {!isTeacher && <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><Trash2 size={20}/></button>}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-fixed-v2');
    return saved ? JSON.parse(saved) : { "PERIOD 1": { students: [], teacherDesk: { id: 'teacher-1', name: 'TEACHER', x: 500, y: 50, rotation: 0 } } };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0]);
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => { localStorage.setItem('compass-fixed-v2', JSON.stringify(classes)); }, [classes]);

  const currentData = classes[currentClassName] || { students: [], teacherDesk: null };
  const students = currentData.students;

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

  const rotate = (id, isTeacher) => {
    setClasses(prev => ({
      ...prev,
      [currentClassName]: {
        ...prev[currentClassName],
        students: isTeacher ? prev[currentClassName].students : prev[currentClassName].students.map(s => s.id === id ? { ...s, rotation: (s.rotation || 0) + 90 } : s),
        teacherDesk: isTeacher ? { ...prev[currentClassName].teacherDesk, rotation: (prev[currentClassName].teacherDesk.rotation || 0) + 90 } : prev[currentClassName].teacherDesk
      }
    }));
  };

  const processRoster = () => {
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 100 + (i % 4 * 350),
      y: 300 + (Math.floor(i / 4) * 200),
      rotation: 0
    }));
    setClasses(prev => ({ ...prev, [currentClassName]: { ...prev[currentClassName], students: [...prev[currentClassName].students, ...newEntries] } }));
    setBulkNames("");
  };

  const exportPDF = async () => {
    const element = document.getElementById('classroom-canvas');
    const buttons = document.querySelectorAll('.no-print');
    buttons.forEach(b => b.style.display = 'none');
    
    const dataUrl = await toPng(element, { backgroundColor: '#ffffff' });
    
    buttons.forEach(b => b.style.display = 'flex');

    const pdf = new jsPDF('l', 'px', [element.scrollWidth, element.scrollHeight]);
    pdf.addImage(dataUrl, 'PNG', 0, 0, element.scrollWidth, element.scrollHeight);
    pdf.save(`${currentClassName}-Seating-Chart.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="h-20 bg-white border-b-4 border-slate-200 px-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <Compass className="text-indigo-600" size={32} />
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">{currentClassName}</h1>
        </div>
        <div className="flex gap-3">
            <button onClick={exportPDF} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-md">
                <FileDown size={20}/> Save PDF
            </button>
            <button onClick={() => { if(students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(students[Math.floor(Math.random()*students.length)]);c++;if(c>25)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md">
                <Target size={20}/> Randomizer
            </button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold shadow-md">
                {isSidebarOpen ? "Close Menu" : "Open Menu"}
            </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-r-4 border-slate-100 transition-all duration-300 overflow-hidden flex flex-col p-6 shadow-xl z-40`}>
          <div className="space-y-6 min-w-[280px]">
            <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none">
                {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="Enter student names..." className="w-full h-64 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-medium outline-none" />
            <button onClick={processRoster} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg hover:bg-indigo-700 transition-all">Generate Grid</button>
          </div>
        </aside>

        <main id="classroom-canvas" className="flex-1 relative bg-white overflow-auto p-10">
            <div className="w-full max-w-2xl mx-auto h-10 bg-slate-900 rounded-b-2xl mb-16 flex items-center justify-center shadow-lg">
                <span className="text-white text-[10px] font-bold tracking-[1em] uppercase opacity-40">Front / Whiteboard</span>
            </div>

            <div className="relative w-[2400px] h-[1600px]">
                {currentData.teacherDesk && (
                    <Desk key={currentData.teacherDesk.id} student={currentData.teacherDesk} isTeacher={true} updatePosition={updatePosition} rotate={rotate} />
                )}
                {students.map((s) => (
                    <Desk key={s.id} student={s} isTeacher={false} updatePosition={updatePosition} rotate={rotate} remove={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.filter(x=>x.id!==id)}}))} />
                ))}
            </div>

            {isRandomizing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
                    <div className="bg-white p-16 rounded-[3rem] text-center border-[16px] border-indigo-600 shadow-2xl">
                        <h2 className="text-7xl font-black text-slate-900 uppercase mb-8">{pickedStudent?.name}</h2>
                        <button onClick={() => setIsRandomizing(false)} className="px-10 py-3 bg-slate-900 text-white rounded-full font-black text-lg uppercase">CLOSE</button>
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}