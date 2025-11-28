
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, ListTodo, PieChart, Eye, Settings, X, Download, Upload, UserCircle } from 'lucide-react';
import { StorageService } from '../services/storage';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Hub', path: '/' },
  { id: 'daily', icon: ListTodo, label: 'Daily', path: '/daily' },
  { id: 'self', icon: Eye, label: 'Self', path: '/self' },
  { id: 'review', icon: PieChart, label: 'Review', path: '/review' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState('');
  const [userStatus, setUserStatus] = useState('');

  // Sync Status
  const [importStatus, setImportStatus] = useState('');

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (showSettings) {
      const profile = StorageService.getProfile();
      setUserName(profile.name);
      setUserStatus(profile.status);
    }
  }, [showSettings]);

  const saveProfile = () => {
    StorageService.saveProfile({ name: userName, status: userStatus });
    window.location.reload(); // Simple reload to propagate changes
  };

  const handleExport = () => {
    const data = StorageService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenhouse_lite_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const success = StorageService.importData(result);
      if (success) {
        setImportStatus('Success! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatus('Error importing file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-bg text-gray-200 overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-card border-r border-gray-800 h-full p-4 justify-between transition-all duration-300">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-blue-500 shadow-lg shadow-cyan/20"></div>
            <h1 className="hidden lg:block font-bold text-xl tracking-wider text-white">GH<span className="text-cyan">OS</span></h1>
          </div>
          
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isActive(item.path) 
                    ? 'bg-cyan/10 text-cyan shadow-[0_0_10px_rgba(78,205,196,0.1)]' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                <span className="hidden lg:block font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors"
          >
            <UserCircle size={24} />
            <span className="hidden lg:block text-sm">Settings & Sync</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative h-full">
        <div className="max-w-7xl mx-auto p-4 pb-24 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-md border-t border-gray-800 z-50 pb-safe pt-2 px-4 overflow-x-auto">
        <div className="flex justify-between items-center h-16 min-w-max gap-4 px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 w-12 transition-all ${
                isActive(item.path) ? 'text-cyan -translate-y-2' : 'text-gray-500'
              }`}
            >
              <div className={`p-2 rounded-full ${isActive(item.path) ? 'bg-cyan/10 ring-1 ring-cyan' : ''}`}>
                 <item.icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              </div>
              {isActive(item.path) && <span className="text-[10px] font-bold">{item.label}</span>}
            </button>
          ))}
          <button onClick={() => setShowSettings(true)} className="flex flex-col items-center gap-1 w-12 text-gray-500">
             <div className="p-2"><Settings size={20} /></div>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings size={20} /> System Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Profile Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-cyan uppercase tracking-wider">User Identity</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Display Name</label>
                    <input 
                      value={userName} 
                      onChange={e => setUserName(e.target.value)}
                      className="w-full bg-bg border border-gray-700 rounded-lg p-3 text-white focus:border-cyan outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Status Message</label>
                    <input 
                      value={userStatus} 
                      onChange={e => setUserStatus(e.target.value)}
                      className="w-full bg-bg border border-gray-700 rounded-lg p-3 text-white focus:border-cyan outline-none" 
                    />
                  </div>
                  <button onClick={saveProfile} className="w-full bg-cyan/20 text-cyan py-2 rounded-lg font-bold border border-cyan/30 hover:bg-cyan/30">
                    Save Profile
                  </button>
                </div>
              </div>

              {/* Sync Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gold uppercase tracking-wider">Data Sync / Backup</h4>
                <p className="text-xs text-gray-400">
                  Data is stored locally. To sync between devices, export the file from one and import to the other.
                </p>
                <div className="flex gap-4">
                  <button onClick={handleExport} className="flex-1 bg-gray-800 text-white py-3 rounded-xl border border-gray-700 flex items-center justify-center gap-2 hover:bg-gray-700">
                    <Download size={18} /> Export Data
                  </button>
                  <label className="flex-1 bg-gray-800 text-white py-3 rounded-xl border border-gray-700 flex items-center justify-center gap-2 hover:bg-gray-700 cursor-pointer">
                    <Upload size={18} /> Import Data
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>
                {importStatus && (
                  <div className="text-center text-sm font-bold text-green-500 animate-pulse">{importStatus}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
