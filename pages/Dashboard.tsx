
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, LineChart, StickyNote, Eye } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Memo } from '../types';

const MODULES = [
  { id: 'daily', title: 'Daily Ops', desc: 'Task management & routines', icon: ListTodo, color: 'text-red-500 border-red-500/20 bg-red-500/10', path: '/daily' },
  { id: 'self', title: 'Self Observation', desc: 'Values & Identity', icon: Eye, color: 'text-pink-500 border-pink-500/20 bg-pink-500/10', path: '/self' },
  { id: 'review', title: 'System Review', desc: 'History & Analytics', icon: LineChart, color: 'text-cyan border-cyan/20 bg-cyan/10', path: '/review' },
];

const QUOTES = [
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
  { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" }
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [memo, setMemo] = useState('');
  const [quote, setQuote] = useState(QUOTES[0]);
  const [profile, setProfile] = useState({ name: 'Operator', status: 'Ready for input.' });

  useEffect(() => {
    // Load Memos
    const memos = StorageService.getMemos();
    if (memos.length > 0) {
      setMemo(memos[0].content);
    }
    // Load Profile
    setProfile(StorageService.getProfile());

    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  }, []);

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setMemo(content);
    const newMemo: Memo = {
      id: 'main-memo',
      content,
      updatedAt: new Date().toISOString()
    };
    StorageService.saveMemos([newMemo]);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome back, <span className="text-cyan">{profile.name}</span>.</h1>
          <p className="text-gray-400">Status: <span className="text-green-500">{profile.status}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => navigate(mod.path)}
            className={`group p-6 rounded-2xl border ${mod.color.replace('text', 'border')} flex flex-col items-start gap-4 transition-all hover:scale-[1.02] bg-card`}
          >
            <div className={`p-3 rounded-xl ${mod.color}`}>
              <mod.icon size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan transition-colors">{mod.title}</h3>
              <p className="text-sm text-gray-400">{mod.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Memo Widget */}
        <div className="md:col-span-2 bg-card border border-gray-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-gold">
            <StickyNote size={20} />
            <h3 className="font-bold text-white">Quick Memo / Scratchpad</h3>
          </div>
          <textarea 
            value={memo}
            onChange={handleMemoChange}
            placeholder="Type your thoughts, reminders, or quick notes here..."
            className="flex-1 bg-bg/50 border border-gray-700 rounded-xl p-4 text-gray-300 focus:border-cyan focus:outline-none resize-none min-h-[150px]"
          />
        </div>
        
        {/* Quote Widget */}
        <div className="bg-gradient-to-br from-card to-bg border border-gray-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Daily Insight</h3>
            <p className="text-white italic text-lg font-serif mb-4">"{quote.text}"</p>
            <p className="text-cyan text-sm">— {quote.author}</p>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-cyan/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};
