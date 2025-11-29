
import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, Check, X, RefreshCw, Sun, Moon, Clock, ArrowRight, Pause, MessageSquare, Calendar, Zap } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Task, TaskLog, DayLog } from '../types';

export const Daily: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDayActive, setIsDayActive] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDDL, setNewTaskDDL] = useState('');
  
  // Workflow / Focus Modal State
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [workflowPhase, setWorkflowPhase] = useState<'planning' | 'working' | 'review'>('planning');
  const [currentStepInput, setCurrentStepInput] = useState('');
  const [timerDuration, setTimerDuration] = useState(10); // minutes
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  // End Day Modal State
  const [showEndDayModal, setShowEndDayModal] = useState(false);
  const [endDayMood, setEndDayMood] = useState('');
  const [endDayReflection, setEndDayReflection] = useState('');

  // --- Initialization ---
  useEffect(() => {
    setTasks(StorageService.getTasks());
    setIsDayActive(StorageService.isDayActive());
  }, []);

  useEffect(() => {
    StorageService.saveTasks(tasks);
  }, [tasks]);

  // --- Timer Logic ---
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      // Timer finished, move to review
      setWorkflowPhase('review');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  // --- Day Cycle Management ---
  const startDay = () => {
    setIsDayActive(true);
    StorageService.setDayActive(true);
    // Reset routine tasks to todo, but KEEP streaks
    setTasks(prev => prev.map(t => 
      t.type === 'routine' ? { ...t, status: 'todo', logs: [] } : t
    ));
  };

  const confirmEndDay = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt?.startsWith(todayStr));
    
    // 1. Calculate Streaks for Routines
    const updatedTasks = tasks.map(t => {
      if (t.type === 'routine') {
        const isDoneToday = t.status === 'done' && t.completedAt?.startsWith(todayStr);
        let newStreak = t.currentStreak || 0;
        
        if (isDoneToday) {
          // If done today, increment streak (unless already incremented today which shouldn't happen with logic, but safety check)
          if (t.lastCompletedDate !== todayStr) {
             newStreak += 1;
          }
        } else {
          // If not done today, reset streak
          newStreak = 0;
        }

        const newLongest = Math.max(t.longestStreak || 0, newStreak);
        
        return {
          ...t,
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastCompletedDate: isDoneToday ? todayStr : t.lastCompletedDate
        };
      }
      return t;
    });

    // 2. Save Day Log
    const log: DayLog = {
      date: todayStr,
      mood: endDayMood,
      reflection: endDayReflection,
      completedCount: completedTasks.length,
      completedTaskTitles: completedTasks.map(t => t.title)
    };
    
    StorageService.saveDayLog(log);
    
    // 3. Cleanup: Archive one-time tasks, Keep Routines (with updated stats)
    const finalTasks = updatedTasks.filter(t => !(t.type === 'task' && t.status === 'done'));
    
    setTasks(finalTasks);
    setIsDayActive(false);
    StorageService.setDayActive(false);
    setShowEndDayModal(false);
    setEndDayMood('');
    setEndDayReflection('');
  };

  // --- Task Management ---
  const addTask = (type: 'task' | 'routine') => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: 'todo',
      type: type,
      deadline: newTaskDDL || undefined,
      logs: [],
      currentStreak: 0,
      longestStreak: 0
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDDL('');
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- Workflow / Scaffolding System ---
  const startWorkflow = (task: Task) => {
    setActiveTask(task);
    setWorkflowPhase('planning');
    setCurrentStepInput('');
    setTimerDuration(10);
  };

  const startStep = () => {
    if (!activeTask || !currentStepInput.trim()) return;
    
    const newLog: TaskLog = {
      id: Date.now().toString(),
      step: currentStepInput,
      timestamp: new Date().toISOString(),
      duration: timerDuration
    };

    const updatedTask = { ...activeTask, logs: [...activeTask.logs, newLog] };
    setActiveTask(updatedTask);
    
    // Update global task state
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    // Start Timer
    setTimeLeft(timerDuration * 60);
    setWorkflowPhase('working');
    setIsTimerRunning(true);
  };

  const finishStep = () => {
    setIsTimerRunning(false);
    setWorkflowPhase('review');
  };

  const handleReviewDecision = (decision: 'continue' | 'break' | 'complete') => {
    if (!activeTask) return;

    if (decision === 'complete') {
      const updated = { 
        ...activeTask, 
        status: 'done' as const, 
        completedAt: new Date().toISOString() 
      };
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setActiveTask(null);
    } else if (decision === 'break') {
      setActiveTask(null); 
    } else if (decision === 'continue') {
      setWorkflowPhase('planning');
      setCurrentStepInput('');
      setTimerDuration(10);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getDeadlineColor = (dateStr?: string) => {
    if (!dateStr) return 'text-gray-500';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr < today) return 'text-red-500 font-bold';
    if (dateStr === today) return 'text-gold font-bold';
    return 'text-cyan';
  };

  // --- Render Helpers ---
  const renderLogHistory = (logs: TaskLog[]) => (
    <div className="space-y-3 mb-6 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 text-sm">
          <div className="w-1 bg-gray-700 rounded-full"></div>
          <div>
            <div className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            <div className="text-gray-200">{log.step}</div>
          </div>
        </div>
      ))}
      {logs.length === 0 && <div className="text-gray-600 text-sm italic">No previous steps logged. Start now.</div>}
    </div>
  );

  return (
    // Outer Container: Grows with content, main page handles scrolling
    <div className="flex flex-col gap-4 animate-fade-in pb-20">
      
      {/* Header / Day Cycle */}
      <div className="shrink-0 flex justify-between items-center bg-card p-3 md:p-4 rounded-2xl border border-gray-800 sticky top-0 z-30 shadow-xl">
        <div>
          <h2 className="text-base md:text-xl font-bold text-white">Daily Ops</h2>
          <p className="text-[10px] md:text-xs text-gray-400">{new Date().toDateString()}</p>
        </div>
        <div>
          {!isDayActive ? (
            <button onClick={startDay} className="bg-green-600 text-white px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-base rounded-xl font-bold flex items-center gap-2 hover:bg-green-500 shadow-lg shadow-green-900/20 active:scale-95 transition-transform">
              <Sun size={14} className="md:w-4 md:h-4" /> <span>START DAY</span>
            </button>
          ) : (
            <button onClick={() => setShowEndDayModal(true)} className="bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-base rounded-xl font-bold flex items-center gap-2 hover:bg-gray-700 hover:text-white active:scale-95 transition-transform">
              <Moon size={14} className="md:w-4 md:h-4" /> <span>END DAY</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area - Stacks vertically on mobile, Grid on desktop */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
        
        {/* Top/Left: Daily Routines - Height adjusts to content */}
        <div className="flex flex-col">
          <div className="shrink-0 flex items-center gap-2 text-cyan mb-2 pl-1">
            <RefreshCw size={14} className="md:w-[18px]" />
            <h3 className="font-bold uppercase tracking-wider text-[10px] md:text-sm">Daily Routines</h3>
          </div>
          
          <div className="flex flex-col bg-card border border-gray-800 rounded-2xl p-3 md:p-4 h-full">
            {/* Input */}
            <div className="flex gap-2 mb-4">
               <input 
                value={newTaskTitle} 
                onChange={e => setNewTaskTitle(e.target.value)} 
                placeholder="Add daily routine..."
                className="flex-1 bg-bg border border-gray-700 rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:border-cyan outline-none"
              />
              <button onClick={() => addTask('routine')} className="bg-cyan/20 text-cyan p-2 rounded-lg font-bold text-xs md:text-base">+</button>
            </div>
            
            {/* List - No internal scroll, expands parent */}
            <div className="space-y-2">
              {tasks.filter(t => t.type === 'routine').map(task => {
                const isDone = task.status === 'done';
                return (
                  <div key={task.id} className={`flex items-center justify-between p-2 md:p-3 rounded-xl border transition ${isDone ? 'bg-gray-900/30 border-gray-800 opacity-60' : 'bg-bg border-gray-700'}`}>
                    <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                      <button 
                        onClick={() => startWorkflow(task)}
                        className={`w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-lg flex items-center justify-center transition-all ${isDone ? 'bg-cyan text-black' : 'bg-cyan/10 text-cyan hover:bg-cyan hover:text-black'}`}
                      >
                         {isDone ? <Check size={14}/> : <Play size={12} fill="currentColor"/>}
                      </button>
                      <div className="flex flex-col min-w-0">
                        <span className={`truncate text-xs md:text-sm ${isDone ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{task.title}</span>
                        {/* Streak Badge */}
                        <div className="flex items-center gap-1 mt-0.5">
                           <span className="text-[9px] md:text-[10px] text-orange-500 flex items-center gap-0.5" title="Current Streak">
                             <Zap size={10} fill="currentColor" /> {task.currentStreak || 0}
                           </span>
                           {task.longestStreak !== undefined && task.longestStreak > 0 && (
                             <span className="hidden md:flex text-[10px] text-gray-600 items-center gap-0.5" title="Best Streak">
                               (Best: {task.longestStreak})
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-gray-600 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
                  </div>
                );
              })}
              {tasks.filter(t => t.type === 'routine').length === 0 && <div className="text-gray-600 text-center text-[10px] md:text-xs py-10">No routines set.</div>}
            </div>
          </div>
        </div>

        {/* Bottom/Right: One-Time Tasks - Height adjusts to content */}
        <div className="flex flex-col">
          <div className="shrink-0 flex items-center gap-2 text-gold mb-2 pl-1">
            <Check size={14} className="md:w-[18px]" />
            <h3 className="font-bold uppercase tracking-wider text-[10px] md:text-sm">One-Time Tasks</h3>
          </div>

          <div className="flex flex-col bg-card border border-gray-800 rounded-2xl p-3 md:p-4 h-full">
             {/* Input Area */}
             <div className="flex flex-col gap-2 mb-4">
               <div className="flex gap-2">
                 <input 
                  value={newTaskTitle} 
                  onChange={e => setNewTaskTitle(e.target.value)} 
                  placeholder="Add task..."
                  className="flex-1 bg-bg border border-gray-700 rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:border-gold outline-none"
                />
                <button onClick={() => addTask('task')} className="bg-gold/20 text-gold p-2 rounded-lg font-bold text-xs md:text-base">+</button>
               </div>
               <div className="flex items-center gap-2">
                 <Calendar size={12} className="text-gray-500" />
                 <input 
                    type="date" 
                    value={newTaskDDL}
                    onChange={e => setNewTaskDDL(e.target.value)}
                    className="bg-bg border border-gray-700 rounded px-2 py-1 text-[10px] md:text-xs text-gray-400 focus:border-gold outline-none w-full"
                 />
               </div>
            </div>

            {/* List - No internal scroll, expands parent */}
            <div className="space-y-2">
              {tasks.filter(t => t.type === 'task').map(task => {
                const isDone = task.status === 'done';
                return (
                  <div key={task.id} className={`p-2 md:p-4 rounded-xl border flex flex-col gap-2 transition ${isDone ? 'bg-gray-900/50 border-gray-800 opacity-60' : 'bg-bg border-gray-700 hover:border-gray-500'}`}>
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className={`font-medium text-xs md:text-sm truncate ${isDone ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</h4>
                        {task.deadline && (
                          <div className={`text-[9px] md:text-[10px] flex items-center gap-1 mt-1 ${getDeadlineColor(task.deadline)}`}>
                            <Clock size={10} /> DDL: {task.deadline}
                          </div>
                        )}
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-600 hover:text-red-500 shrink-0 ml-2"><X size={14} /></button>
                    </div>
                    
                    {!isDone ? (
                      <div className="flex items-center gap-2">
                         <button 
                          onClick={() => startWorkflow(task)}
                          className="flex-1 bg-gold text-black py-1 md:py-1.5 rounded-lg font-bold text-[10px] md:text-sm flex items-center justify-center gap-2 hover:bg-yellow-400"
                        >
                          <Play size={10} /> START
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
                        <Check size={12} /> Completed
                        {task.logs.length > 0 && <span className="ml-auto flex items-center gap-1"><MessageSquare size={10}/> {task.logs.length}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
               {tasks.filter(t => t.type === 'task').length === 0 && <div className="text-gray-600 text-center text-[10px] md:text-xs py-10">Inbox zero.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* WORKFLOW MODAL */}
      {activeTask && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-card border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="absolute top-4 right-4 text-xs text-gray-500 uppercase tracking-widest">{workflowPhase} MODE</div>
            
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-4 pr-6">{activeTask.title}</h2>

            {/* Previous History */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Session History</h4>
              {renderLogHistory(activeTask.logs)}
            </div>

            {/* Phase 1: Planning */}
            {workflowPhase === 'planning' && (
              <div className="space-y-4 animate-fade-in">
                <label className="text-cyan text-sm font-bold">What is the immediate next step?</label>
                <input 
                  autoFocus
                  value={currentStepInput}
                  onChange={e => setCurrentStepInput(e.target.value)}
                  placeholder="e.g. Write the introduction paragraph..."
                  className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-cyan outline-none text-sm"
                />
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 bg-black px-3 py-2 rounded-lg border border-gray-700">
                      <Clock size={16} className="text-gray-400" />
                      <input 
                        type="number" 
                        value={timerDuration} 
                        onChange={e => setTimerDuration(parseInt(e.target.value) || 10)}
                        className="w-8 md:w-12 bg-transparent text-white text-center outline-none text-sm"
                      />
                      <span className="text-xs text-gray-500">min</span>
                   </div>
                   <button 
                    onClick={startStep} 
                    disabled={!currentStepInput.trim()}
                    className="flex-1 bg-cyan text-black py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-cyan/90 text-sm md:text-base"
                   >
                     START TIMER
                   </button>
                </div>
              </div>
            )}

            {/* Phase 2: Working */}
            {workflowPhase === 'working' && (
              <div className="text-center space-y-8 animate-fade-in py-8">
                <div className="space-y-2">
                  <div className="text-gray-400 text-sm uppercase tracking-widest">Current Step</div>
                  <div className="text-lg md:text-xl text-white font-medium px-4">{activeTask.logs[activeTask.logs.length - 1]?.step}</div>
                </div>
                <div className="text-6xl md:text-7xl font-mono font-bold text-cyan tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold text-sm">
                    {isTimerRunning ? <span className="flex items-center justify-center gap-2"><Pause size={18} /> PAUSE</span> : <span className="flex items-center justify-center gap-2"><Play size={18}/> RESUME</span>}
                  </button>
                  <button onClick={finishStep} className="flex-1 bg-gray-800 border border-cyan/30 text-cyan py-3 rounded-xl font-bold text-sm">
                    FINISH EARLY
                  </button>
                </div>
              </div>
            )}

            {/* Phase 3: Review */}
            {workflowPhase === 'review' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Step Complete!</h3>
                  <p className="text-gray-400 text-sm mt-1">What would you like to do next?</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => handleReviewDecision('continue')}
                    className="w-full bg-cyan text-black p-4 rounded-xl font-bold flex items-center justify-between group hover:bg-cyan/90 text-sm"
                  >
                    <span>Continue Working</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => handleReviewDecision('break')}
                    className="w-full bg-gray-800 text-white p-4 rounded-xl font-bold border border-gray-700 hover:bg-gray-700 text-sm"
                  >
                    Take a Break (Save & Close)
                  </button>
                   <button 
                    onClick={() => handleReviewDecision('complete')}
                    className="w-full bg-transparent text-green-500 p-4 rounded-xl font-bold border border-green-500/30 hover:bg-green-500/10 text-sm"
                  >
                    Mark Task as Complete
                  </button>
                </div>
              </div>
            )}
            
            <button onClick={() => setActiveTask(null)} className="absolute top-4 left-4 text-gray-600 hover:text-white"><X size={20}/></button>
          </div>
        </div>
      )}

      {/* END DAY MODAL */}
      {showEndDayModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in">
           <div className="w-full max-w-md bg-card border border-gray-800 rounded-2xl p-6 md:p-8">
             <h2 className="text-2xl font-bold text-white mb-2">End of Day Report</h2>
             <p className="text-gray-400 text-sm mb-6">Archive today's progress and update habit streaks.</p>
             
             <div className="space-y-4">
               <div>
                 <label className="text-sm text-gray-400 block mb-2">Mood / Vibe</label>
                 <div className="flex gap-2">
                   {['🔥', '😊', '😐', '😫', '🧠'].map(emoji => (
                     <button 
                      key={emoji} 
                      onClick={() => setEndDayMood(emoji)}
                      className={`text-2xl p-2 md:p-3 rounded-xl bg-bg border ${endDayMood === emoji ? 'border-cyan bg-cyan/10' : 'border-gray-700 hover:border-gray-500'}`}
                     >
                       {emoji}
                     </button>
                   ))}
                 </div>
               </div>
               
               <div>
                  <label className="text-sm text-gray-400 block mb-2">Reflection / Notes</label>
                  <textarea 
                    value={endDayReflection}
                    onChange={e => setEndDayReflection(e.target.value)}
                    className="w-full bg-bg border border-gray-700 rounded-xl p-3 text-white h-24 focus:border-cyan outline-none resize-none text-sm"
                    placeholder="What went well? What didn't?"
                  />
               </div>

               <div className="bg-bg p-4 rounded-xl border border-gray-700 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Tasks Completed Today</span>
                    <span className="text-xl font-bold text-white">{tasks.filter(t => t.status === 'done' && t.completedAt?.startsWith(new Date().toISOString().split('T')[0])).length}</span>
                  </div>
               </div>

               <div className="flex gap-3 mt-4">
                 <button onClick={confirmEndDay} className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 text-sm">Confirm & Sleep</button>
                 <button onClick={() => setShowEndDayModal(false)} className="px-4 py-3 text-gray-500 font-bold hover:text-white text-sm">Cancel</button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
