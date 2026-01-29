export default function App() {
  // 1. New State for multiple classes
  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('teacher-classes');
    return saved ? JSON.parse(saved) : { "My First Class": [] };
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

  // 2. Sync students from the selected class
  const students = classes[currentClassName] || [];

  const setStudents = (newStudentList) => {
    const updatedClasses = { ...classes, [currentClassName]: newStudentList };
    setClasses(updatedClasses);
    localStorage.setItem('teacher-classes', JSON.stringify(updatedClasses));
  };

  const addNewClass = () => {
    if (newClassName && !classes[newClassName]) {
      const updated = { ...classes, [newClassName]: [] };
      setClasses(updated);
      setCurrentClassName(newClassName);
      setNewClassName("");
      localStorage.setItem('teacher-classes', JSON.stringify(updated));
    }
  };

  const deleteClass = (nameToDelete) => {
    if (Object.keys(classes).length <= 1) return alert("You must have at least one class.");
    if (window.confirm(`Delete ${nameToDelete} forever?`)) {
      const { [nameToDelete]: removed, ...remaining } = classes;
      setClasses(remaining);
      setCurrentClassName(Object.keys(remaining)[0]);
      localStorage.setItem('teacher-classes', JSON.stringify(remaining));
    }
  };

  // ... rest of your existing functions (createGroups, pickRandomStudent, etc.) ...