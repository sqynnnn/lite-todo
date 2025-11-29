
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Copy, Save, FileText, ChevronDown, ChevronUp, Calendar, Archive, Plus } from 'lucide-react';
import { StorageService } from '../services/storage';
import { DayLog, SavedReport } from '../types';

export const Review: React.FC = () => {
  // State
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'archive'>('current');
  
  // Date Range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Generated Stats
  const [reportStats, setReportStats] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  // Editing Saved Report
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    const loadedLogs = StorageService.getDayLogs();
    setLogs(loadedLogs);
    setSavedReports(StorageService.getReports());

    // Default range: Last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    generateAnalysis();
  }, [startDate, endDate, logs]);

  const generateAnalysis = () => {
    if (!startDate || !endDate) return;

    // Filter logs
    const filtered = logs.filter(l => l.date >= startDate && l.date <= endDate);
    const sorted = filtered.sort((a,b) => a.date > b.date ? 1 : -1);

    // 1. Routine Consistency
    const routineCounts: {[key: string]: number} = {};
    let totalDays = 0;
    
    // Calculate total days in range (rough approx)
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    totalDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1;

    sorted.forEach(log => {
      if (log.completedTaskTitles) {
        log.completedTaskTitles.forEach(title => {
           routineCounts[title] = (routineCounts[title] || 0) + 1;
        });
      }
    });

    const consistency = Object.keys(routineCounts).map(title => ({
      title,
      count: routineCounts[title],
      percent: Math.round((routineCounts[title] / totalDays) * 100)
    })).sort((a,b) => b.count - a.count);

    const stats = {
      totalTasks: sorted.reduce((acc, curr) => acc + curr.completedCount, 0),
      avgMood: 'N/A', // Simplified for now
      routineConsistency: consistency,
      logs: sorted,
      totalDays
    };

    setReportStats(stats);
    generateAIPromptString(stats);
  };

  const generateAIPromptString = (stats: any) => {
    if (!stats) return;

    let prompt = `Act as a professional life coach and productivity analyst. Analyze the following user data from ${startDate} to ${endDate}.\n\n`;
    prompt += `**Productivity Overview**\n`;
    prompt += `- Total Tasks Completed: ${stats.totalTasks}\n`;
    prompt += `- Days Tracked: ${stats.logs.length}/${stats.totalDays}\n\n`;

    prompt += `**Habit Consistency (Routine Adherence)**\n`;
    stats.routineConsistency.forEach((c: any) => {
      prompt += `- ${c.title}: ${c.count}/${stats.totalDays} days (${c.percent}%)\n`;
    });
    prompt += `\n**Daily Logs (Mood & Reflections)**\n`;
    stats.logs.forEach((log: DayLog) => {
       prompt += `[${log.date}] Mood: ${log.mood} | Notes: ${log.reflection}\n`;
    });
    prompt += `\n**Instructions:**\n1. Identify patterns in mood vs productivity.\n2. Point out streaks or breaks in habits.\n3. Provide 3 actionable improvements for next week.`;
    
    setAiPrompt(prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiPrompt);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const saveCurrentReport = () => {
    if (!reportStats) return;
    const newReport: SavedReport = {
      id: Date.now().toString(),
      generatedDate: new Date().toISOString(),
      dateRange: { start: startDate, end: endDate },
      stats: {
        totalTasks: reportStats.totalTasks,
        avgMood: '',
        routineConsistency: reportStats.routineConsistency
      },
      notes: ''
    };
    const updated = [newReport, ...savedReports];
    setSavedReports(updated);
    StorageService.saveReports(updated);
    setActiveTab('archive');
  };

  const deleteReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    StorageService.saveReports(updated);
  };

  const updateReportNotes = (id: string, notes: string) => {
    const updated = savedReports.map(r => r.id === id ? { ...r, notes } : r);
    setSavedReports(updated);
    StorageService.saveReports(updated);
  };

  // Chart Data Preparation
  const chartData = reportStats?.logs.map((log: DayLog) => ({
    name: log.date.slice(5),
    count: log.completedCount
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-800 pb-2">
        <button 
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 pb-2 px-2 transition ${activeTab === 'current' ? 'border-b-2 border-cyan text-cyan font-bold' : 'text-gray-500 hover:text-white'}`}
        >
          <Plus size={18} /> New Analysis
        </button>
        <button 
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 pb-2 px-2 transition ${activeTab === 'archive' ? 'border-b-2 border-gold text-gold font-bold' : 'text-gray-500 hover:text-white'}`}
        >
          <Archive size={18} /> Report Archive
        </button>
      </div>

      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-card p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
             {/* Responsive Date Picker */}
             <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:items-center">
               <div className="flex items-center gap-2 bg-bg px-2 py-2 rounded-lg border border-gray-700 w-full md:w-auto">
                  <span className="text-gray-500 text-[10px] uppercase font-bold">Start</span>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="bg-transparent text-white text-xs md:text-sm outline-none w-full" 
                  />
               </div>
               
               <div className="hidden md:block text-gray-500">-</div>

               <div className="flex items-center gap-2 bg-bg px-2 py-2 rounded-lg border border-gray-700 w-full md:w-auto">
                  <span className="text-gray-500 text-[10px] uppercase font-bold">End</span>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="bg-transparent text-white text-xs md:text-sm outline-none w-full" 
                  />
               </div>
             </div>
             
             <button onClick={saveCurrentReport} className="bg-gold/20 text-gold px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold/30 w-full md:w-auto justify-center text-sm">
               <Save size={16} /> Save to Archive
             </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Chart */}
             <div className="bg-card p-4 md:p-6 rounded-2xl border border-gray-800 shadow-xl min-h-[160px] md:min-h-[300px]">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Activity Volume</h3>
               <div className="h-[140px] md:h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData}>
                     <XAxis dataKey="name" stroke="#4b5563" tick={{fontSize: 10}} />
                     <Tooltip contentStyle={{ backgroundColor: '#1E1E24', borderRadius: '8px', border: '1px solid #374151' }} />
                     <Bar dataKey="count" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>

             {/* Habit Consistency */}
             <div className="bg-card p-4 md:p-6 rounded-2xl border border-gray-800 shadow-xl">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Habit Consistency</h3>
               <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {reportStats?.routineConsistency.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-bg/50">
                      <span className="text-gray-200 text-sm truncate max-w-[50%]">{item.title}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-16 md:w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan" style={{width: `${item.percent}%`}}></div>
                        </div>
                        <span className="text-xs font-mono text-cyan w-8 text-right">{item.count}d</span>
                      </div>
                    </div>
                  ))}
                  {(!reportStats?.routineConsistency || reportStats.routineConsistency.length === 0) && (
                    <div className="text-gray-600 text-sm italic">No routine data found in this range.</div>
                  )}
               </div>
             </div>
          </div>

          {/* AI Prompt Section */}
          <div className="bg-gradient-to-br from-card to-gray-900 border border-gray-700 rounded-2xl p-6">
             <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
               <div>
                 <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> AI Coach Prompt</h3>
                 <p className="text-gray-400 text-sm mt-1">Copy this and paste it into ChatGPT/Claude for a deep analysis.</p>
               </div>
               <button 
                onClick={copyToClipboard}
                className="w-full md:w-auto bg-cyan text-black px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 text-sm"
               >
                 {copyFeedback ? <CheckIcon /> : <Copy size={16} />}
                 {copyFeedback || 'Copy Prompt'}
               </button>
             </div>
             <textarea 
               readOnly
               value={aiPrompt}
               className="w-full h-32 bg-black/50 border border-gray-700 rounded-xl p-4 text-xs font-mono text-gray-400 resize-none focus:outline-none"
             />
          </div>
        </div>
      )}

      {activeTab === 'archive' && (
        <div className="grid grid-cols-1 gap-4">
           {savedReports.map(report => (
             <div key={report.id} className="bg-card border border-gray-800 rounded-2xl overflow-hidden">
               <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/50">
                  <div>
                    <h4 className="text-white font-bold text-sm md:text-base">{report.dateRange.start} <span className="text-gray-600 px-1">to</span> {report.dateRange.end}</h4>
                    <span className="text-xs text-gray-500">Generated: {new Date(report.generatedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                     <button 
                      onClick={() => setEditingReportId(editingReportId === report.id ? null : report.id)}
                      className="text-cyan text-sm flex items-center gap-1 hover:underline"
                    >
                       <FileText size={16} /> {editingReportId === report.id ? 'Close' : 'Notes'}
                     </button>
                     <button onClick={() => deleteReport(report.id)} className="text-gray-600 hover:text-red-500"><Archive size={16}/></button>
                  </div>
               </div>
               
               {editingReportId === report.id && (
                 <div className="p-6 border-t border-gray-800 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                       <div className="bg-bg p-3 rounded-lg border border-gray-700 text-center">
                         <div className="text-2xl font-bold text-white">{report.stats.totalTasks}</div>
                         <div className="text-xs text-gray-500 uppercase">Tasks</div>
                       </div>
                       <div className="bg-bg p-3 rounded-lg border border-gray-700 text-center col-span-2">
                         <div className="text-lg font-bold text-cyan truncate">
                            {report.stats.routineConsistency[0]?.title || 'No Data'}
                         </div>
                         <div className="text-xs text-gray-500 uppercase">Top Habit</div>
                       </div>
                    </div>
                    
                    <label className="text-sm text-gold font-bold block mb-2">AI Analysis / Coach Notes</label>
                    <textarea 
                      value={report.notes || ''}
                      onChange={(e) => {
                        updateReportNotes(report.id, e.target.value);
                        // Local update for UI responsiveness
                        report.notes = e.target.value; 
                      }}
                      placeholder="Paste the AI's response here or type your own review notes..."
                      className="w-full h-64 bg-bg border border-gray-700 rounded-xl p-4 text-gray-300 focus:border-gold outline-none resize-none"
                    />
                 </div>
               )}
             </div>
           ))}
           {savedReports.length === 0 && <div className="text-center text-gray-500 py-10">No archived reports.</div>}
        </div>
      )}
    </div>
  );
};

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
