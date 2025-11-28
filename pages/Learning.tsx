
import React, { useState } from 'react';
import { BookOpen, Brain, Layers } from 'lucide-react';
import { ModularPage } from '../components/ModularPage';
import { StorageService } from '../services/storage';

export const Learning: React.FC = () => {
  const [tab, setTab] = useState<'knowledge' | 'skill'>('knowledge');

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex space-x-4 border-b border-gray-800 pb-2">
          <button 
            onClick={() => setTab('knowledge')}
            className={`flex items-center gap-2 pb-2 px-2 transition ${tab === 'knowledge' ? 'border-b-2 border-blue-500 text-blue-500 font-bold' : 'text-gray-500 hover:text-white'}`}
          >
             <BookOpen size={18} /> Knowledge Base
          </button>
          <button 
            onClick={() => setTab('skill')}
            className={`flex items-center gap-2 pb-2 px-2 transition ${tab === 'skill' ? 'border-b-2 border-purple-500 text-purple-500 font-bold' : 'text-gray-500 hover:text-white'}`}
          >
             <Layers size={18} /> Skill Library
          </button>
       </div>

       {tab === 'knowledge' && (
         <ModularPage 
            storageKey={StorageService.KEYS.LEARNING_KNOWLEDGE}
            title="Knowledge Base"
            icon={BookOpen}
            color="blue-500"
         />
       )}

       {tab === 'skill' && (
         <ModularPage 
            storageKey={StorageService.KEYS.LEARNING_SKILLS}
            title="Skill Library"
            icon={Brain}
            color="purple-500"
         />
       )}
    </div>
  );
};
