import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCw, Compass, ZoomIn, ZoomOut, Maximize, Target, ChevronLeft, ChevronRight, Users, GraduationCap } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

const Controls = ({ students, teacherDesk }) => {
  const { zoomIn, zoomOut, setTransform } = useControls();

  const handleFitWindow = () => {
    const allItems = teacherDesk ? [...students, teacherDesk] : students;
    if (allItems.length === 0) return;

    const padding = 3000;
    const minX = Math.min(...allItems.map(s => s.x)) - padding;
    const maxX = Math.max(...allItems.map(s => s.x + 6000)) + padding;
    const minY = Math.min(...allItems.map(s => s.y)) - padding;
    const maxY = Math.max(...allItems.map(s => s.y + 4000)) + padding;

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.min(window.innerWidth / width, window.innerHeight / height) * 0.9;
    
    setTransform(-minX * scale + (window.innerWidth - width * scale) / 2, -minY * scale + (window.innerHeight - height * scale) / 2, scale, 800);
  };

  return (
    <div className="absolute bottom-10 right-10 flex flex-col gap-6 z-[100]">
      <button onClick={() => zoomIn(0.2)} className="p-8 bg-white shadow-2xl rounded-3xl border-4 border-slate-200 hover:bg-slate-50 transition-all"><ZoomIn size={48} className="text-indigo-600"/></button>
      <button onClick={() => zoomOut(0.2)} className="p-8 bg-white shadow-2xl rounded-3xl border-4 border-slate-200 hover:bg-slate-50 transition-all"><ZoomOut size={48} className="text-indigo-600"/></button>
      <button onClick={handleFitWindow} className="p-8 bg-indigo-600 shadow-2xl rounded-3xl text-white hover:bg-indigo-700 transition-all border-4 border-indigo-400">
        <Maximize size={48}/>
      </button>
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
    <div onMouseDown={onMouseDown} style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${student.rotation || 0}deg)`, position: 'absolute', transition: isDragging.current ? 'none' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: isDragging.current ? 100 : (isTeacher ? 50 : 20) }} className="cursor-grab active:cursor-grabbing">
      <div className={`w-[6000px] h-[3000px] rounded-[30rem] shadow-[0_400px_700px_-50px_rgba(0,0,0,0.7)] flex items-center justify-center relative border-[150px] ${isTeacher ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-900'}`}>
        {isTeacher && <GraduationCap size={400} className="absolute top-20 left-1/2 -translate-x-1/2 text-indigo-200" />}
        <span className={`text-[900px] font-black uppercase text-center select-none tracking-tighter leading-none ${isTeacher ? 'text-indigo-900' : 'text-slate-900'}`}>
          {student.name}
        </span>
        <div className="absolute -top-64 -right-64 flex gap-12">
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => rotate(student.id, isTeacher)} className="p-40 bg-indigo-600 text-white rounded-full shadow-2xl"><RotateCw size={300}/></button>
            {!isTeacher && <button onMouseDown={(e) => e.stopPropagation()} onClick={() => remove(student.id)} className="p-40 bg-red-600 text-white rounded-full shadow-2xl"><Trash2 size={300}/></button>}
        </div>
        <div className={`absolute -bottom-[600px] w-[2000px] h-[600px] rounded-b-[35rem] border-x-[120px] border-b-[120px] shadow-2xl ${isTeacher ? 'bg-indigo-800 border-indigo-950' : 'bg-slate-800 border-slate-900'}`}></div>
      </div>
    </div>
  );
};

export default function App() {
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('compass-v90-teacher');
    return saved ? JSON.parse(saved) : { "PERIOD 1": { students: [], teacherDesk: { id: 'teacher-main', name: 'TEACHER', x: 25000, y: 10000, rotation: 0 } } };
  });
  
  const [currentClassName, setCurrentClassName] = useState(Object.keys(classes)[0] || "PERIOD 1");
  const [activeTab, setActiveTab] = useState('roster');
  const [bulkNames, setBulkNames] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.015);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [groupSize, setGroupSize] = useState(4);
  const floorRef = useRef(null);

  useEffect(() => { localStorage.setItem('compass-v90-teacher', JSON.stringify(classes)); }, [classes]);

  const currentData = classes[currentClassName] || { students: [], teacherDesk: null };
  const students = currentData.students;
  const teacherDesk = currentData.teacherDesk;

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
    const columns = 3; 
    const newEntries = names.map((n, i) => ({
      id: Date.now() + i,
      name: n.toUpperCase(),
      x: 5000 + (i % columns * 9000),
      y: 18000 + (Math.floor(i / columns) * 6000), // Start below the teacher/whiteboard area
      rotation: 0
    }));
    setClasses(prev => ({ ...prev, [currentClassName]: { ...prev[currentClassName], students: [...prev[currentClassName].students, ...newEntries] } }));
    setBulkNames("");
  };

  const makeGroups = () => {
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const newStudents = shuffled.map((s, i) => {
        const groupIndex = Math.floor(i / groupSize);
        const memberIndex = i % groupSize;
        const row = Math.floor(groupIndex / 2);
        const col = groupIndex % 2;
        return {
            ...s,
            x: 5000 + (col * 25000) + (memberIndex % 2 * 7000),
            y: 20000 + (row * 15000) + (Math.floor(memberIndex / 2) * 4000)
        };
    });
    setClasses(prev => ({ ...prev, [currentClassName]: { ...prev[currentClassName], students: newStudents } }));
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden">
      <header className="h-32 bg-white border-b-8 border-slate-100 px-12 flex justify-between items-center z-[70] shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 bg-slate-100 rounded-2xl">
            {isSidebarOpen ? <ChevronLeft size={48} /> : <ChevronRight size={48} />}
          </button>
          <h1 className="text-5xl font-black uppercase text-slate-900 tracking-tighter">{currentClassName}</h1>
        </div>
        <div className="flex gap-4">
            <button onClick={() => { if(students.length){ setIsRandomizing(true); let c=0; const i=setInterval(()=>{setPickedStudent(students[Math.floor(Math.random()*students.length)]);c++;if(c>30)clearInterval(i)},80);}}} className="bg-indigo-600 text-white px-10 py-6 rounded-3xl font-black text-xl uppercase tracking-widest">Randomizer</button>
            <button onClick={() => toPng(floorRef.current).then(d => { const a = document.createElement('a'); a.download = 'classroom.png'; a.href = d; a.click(); })} className="bg-slate-900 text-white px-10 py-6 rounded-3xl font-black text-xl uppercase tracking-widest">Export</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`bg-white border-r-8 border-slate-50 p-10 flex flex-col z-[60] shrink-0 shadow-2xl transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-[550px]' : 'w-0 -translate-x-full p-0 border-none'}`}>
          <div className={`${!isSidebarOpen && 'hidden'}`}>
            <nav className="flex bg-slate-100 p-2 rounded-3xl mb-8">
                {['roster', 'groups'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-sm transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>{t}</button>
                ))}
            </nav>
            {activeTab === 'roster' ? (
                <div className="space-y-6">
                    <select value={currentClassName} onChange={(e) => setCurrentClassName(e.target.value)} className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black text-xl outline-none">
                        {Object.keys(classes).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} placeholder="PASTE NAMES..." className="w-full h-[350px] p-8 bg-slate-50 border-4 border-slate-100 rounded-[3rem] font-bold text-2xl outline-none" />
                    <button onClick={processRoster} className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl">Generate Students</button>
                </div>
            ) : (
                <div className="space-y-10 py-10">
                    <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="w-full p-6 rounded-2xl bg-white border-4 border-slate-200 font-black text-6xl text-indigo-600 text-center" />
                    <button onClick={makeGroups} className="w-full py-12 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl uppercase shadow-2xl flex items-center justify-center gap-4">
                        <Users size={48}/> Mix Groups
                    </button>
                </div>
            )}
          </div>
        </aside>

        <main className="flex-1 relative bg-slate-100 overflow-hidden">
          {isRandomizing && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl">
              <div className="bg-white p-32 rounded-[6rem] text-center border-[40px] border-indigo-600 shadow-2xl animate-in zoom-in-75 duration-300">
                <h2 className="text-[400px] font-black text-slate-900 uppercase leading-none mb-12">{pickedStudent?.name}</h2>
                <button onClick={() => setIsRandomizing(false)} className="px-20 py-8 bg-slate-900 text-white rounded-full font-black text-3xl uppercase tracking-widest">Close</button>
              </div>
            </div>
          )}

          <TransformWrapper centerOnInit={true} minScale={0.0001} initialScale={0.015} limitToBounds={false} panning={{ excluded: ["cursor-grab"] }} onZoom={(ref) => setCurrentScale(ref.state.scale)}>
            <Controls students={students} teacherDesk={teacherDesk} />
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div ref={floorRef} className="relative bg-white" style={{ width: '150000px', height: '120000px' }}>
                <div className="absolute top-0 w-full h-[10000px] bg-slate-900 flex items-center justify-center z-10">
                   <h2 className="text-white text-[3500px] font-black uppercase tracking-[120rem] translate-x-[60rem]">Whiteboard</h2>
                </div>
                <div className="relative w-full h-full bg-[radial-gradient(#cbd5e1_200px,transparent_200px)] [background-size:20000px_20000px]">
                  {teacherDesk && <Desk key={teacherDesk.id} student={teacherDesk} isTeacher={true} scale={currentScale} updatePosition={updatePosition} rotate={rotate} />}
                  {students.map((s) => (
                    <Desk key={s.id} student={s} isTeacher={false} scale={currentScale} updatePosition={updatePosition} rotate={rotate} remove={(id) => setClasses(p=>({...p, [currentClassName]: {...p[currentClassName], students: p[currentClassName].students.filter(x=>x.id!==id)}}))} />
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