
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X } from 'lucide-react';
import { StorageService } from '../services/storage';

interface ListItem {
  id: string;
  title: string;
  desc: string;
}

interface GenericListProps {
  storageKey: string;
  title: string;
  icon: React.ElementType;
  color: string;
}

export const GenericList: React.FC<GenericListProps> = ({ storageKey, title, icon: Icon, color }) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    setItems(StorageService.getListItems(storageKey));
  }, [storageKey]);

  const saveItems = (newItems: ListItem[]) => {
    setItems(newItems);
    StorageService.saveListItems(storageKey, newItems);
  };

  const addItem = () => {
    if (!newTitle.trim()) return;
    const newItem: ListItem = {
      id: Date.now().toString(),
      title: newTitle,
      desc: newDesc
    };
    saveItems([newItem, ...items]);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
            <Icon size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className={`bg-${color} text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90`}
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {isAdding && (
        <div className="bg-card border border-gray-700 p-4 rounded-xl space-y-3 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-400">New Item</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
          </div>
          <input 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-bg border border-gray-700 rounded-lg p-3 text-white focus:border-cyan outline-none"
          />
          <textarea 
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description / Details"
            className="w-full bg-bg border border-gray-700 rounded-lg p-3 text-white focus:border-cyan outline-none h-24"
          />
          <button onClick={addItem} className={`w-full bg-${color}/20 text-${color} py-2 rounded-lg font-bold hover:bg-${color}/30`}>
            Save
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-card border border-gray-800 p-5 rounded-2xl group hover:border-gray-600 transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-white">{item.title}</h3>
              <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-gray-400 text-sm whitespace-pre-wrap">{item.desc}</p>
          </div>
        ))}
        {items.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-20 text-gray-600">
            No items yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
