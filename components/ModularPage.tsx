
import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, Save, Trash2, FileText, Folder, FolderPlus, FilePlus, ChevronRight, CornerUpLeft } from 'lucide-react';
import { StorageService } from '../services/storage';
import { PageItem } from '../types';
import { RichEditor } from './RichEditor';

interface ModularPageProps {
  storageKey: string;
  title: string;
  icon: React.ElementType;
  color: string;
}

export const ModularPage: React.FC<ModularPageProps> = ({ storageKey, title, icon: Icon, color }) => {
  const [items, setItems] = useState<PageItem[]>([]);
  const [activeFile, setActiveFile] = useState<PageItem | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createName, setCreateName] = useState('');

  useEffect(() => {
    const loaded = StorageService.getPages(storageKey);
    const migrated = loaded.map(item => ({
      ...item,
      type: item.type || 'file',
      parentId: item.parentId || null
    }));
    setItems(migrated);
  }, [storageKey]);

  // --- Helpers ---
  const getCurrentFolderItems = () => {
    return items.filter(i => i.parentId === currentFolderId);
  };

  const getBreadcrumbs = () => {
    const crumbs = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = items.find(i => i.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const getDescendantIds = (allItems: PageItem[], folderId: string): string[] => {
    const children = allItems.filter(i => i.parentId === folderId);
    let ids = children.map(c => c.id);
    children.forEach(c => {
      if (c.type === 'folder') {
        ids = [...ids, ...getDescendantIds(allItems, c.id)];
      }
    });
    return ids;
  };

  // --- Actions ---
  const handleCreate = () => {
    if (!createName.trim()) return;
    
    const newItem: PageItem = {
      id: Date.now().toString(),
      type: createType,
      parentId: currentFolderId,
      title: createName,
      subtitle: createType === 'file' ? 'New entry' : 'Folder',
      content: createType === 'file' ? '<p>Start writing here...</p>' : undefined,
      updatedAt: new Date().toISOString()
    };
    
    const updated = [newItem, ...items];
    setItems(updated);
    StorageService.savePages(storageKey, updated);
    
    setCreateName('');
    setShowCreateModal(false);

    if (createType === 'file') {
      openFile(newItem);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    // Critical: Stop propagation to prevent opening the folder/file
    e.preventDefault();
    e.stopPropagation();
    
    const itemToDelete = items.find(i => i.id === id);
    if (!itemToDelete) return;

    const msg = itemToDelete.type === 'folder' 
      ? `Delete folder "${itemToDelete.title}" and all its contents?` 
      : `Delete page "${itemToDelete.title}"?`;

    if (window.confirm(msg)) {
      let idsToDelete = [id];
      if (itemToDelete.type === 'folder') {
        idsToDelete = [...idsToDelete, ...getDescendantIds(items, id)];
      }

      const updated = items.filter(i => !idsToDelete.includes(i.id));
      setItems(updated);
      StorageService.savePages(storageKey, updated);
      
      if (activeFile && idsToDelete.includes(activeFile.id)) setActiveFile(null);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(id);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation();
    
    if (draggedItemId === folderId) return; // Cannot drag into self
    
    // Check for circular dependency (dragging a parent into its child)
    // For simplicity: don't allow if target is a descendant of source
    if (draggedItemId) {
        const descendants = getDescendantIds(items, draggedItemId);
        if (descendants.includes(folderId)) return;
    }

    setDragOverFolderId(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetFolderId) return;

    // Update parentId
    const updated = items.map(item => {
        if (item.id === sourceId) {
            return { ...item, parentId: targetFolderId, updatedAt: new Date().toISOString() };
        }
        return item;
    });

    setItems(updated);
    StorageService.savePages(storageKey, updated);
    setDraggedItemId(null);
  };

  // --- Navigation & Editing ---
  const openFile = (item: PageItem) => {
    setActiveFile(item);
    setEditTitle(item.title);
    setEditSubtitle(item.subtitle);
    setEditContent(item.content || '');
  };

  const enterFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const navigateUp = () => {
    const currentFolder = items.find(i => i.id === currentFolderId);
    setCurrentFolderId(currentFolder?.parentId || null);
  };

  const navigateToBreadcrumb = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const saveActiveFile = () => {
    if (!activeFile) return;
    const updatedPage = {
      ...activeFile,
      title: editTitle,
      subtitle: editSubtitle,
      content: editContent,
      updatedAt: new Date().toISOString()
    };
    const updatedList = items.map(p => p.id === activeFile.id ? updatedPage : p);
    setItems(updatedList);
    StorageService.savePages(storageKey, updatedList);
    setActiveFile(updatedPage);
  };

  const goBackFromEditor = () => {
    saveActiveFile();
    setActiveFile(null);
  };

  // --- Render Editor ---
  if (activeFile) {
    return (
      <div className="h-full flex flex-col animate-fade-in pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={goBackFromEditor} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ChevronLeft size={20} /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={saveActiveFile} className={`bg-${color}/20 text-${color} px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2`}>
              <Save size={16} /> Save
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full space-y-4 flex-1 flex flex-col">
          <input 
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-transparent text-4xl font-bold text-white outline-none placeholder-gray-600"
            placeholder="Page Title"
          />
          <input 
            value={editSubtitle}
            onChange={(e) => setEditSubtitle(e.target.value)}
            className="w-full bg-transparent text-lg text-gray-500 outline-none placeholder-gray-700"
            placeholder="Add a subtitle or summary..."
          />
          
          <div className="flex-1 mt-4">
             <RichEditor 
               content={editContent} 
               onChange={setEditContent}
               color={color}
             />
          </div>
        </div>
      </div>
    );
  }

  // --- Render File System ---
  const currentItems = getCurrentFolderItems();
  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                 <button 
                   onClick={() => navigateToBreadcrumb(null)} 
                   className={`hover:text-${color} ${currentFolderId === null ? 'text-gray-300' : ''}`}
                 >
                   Root
                 </button>
                 {breadcrumbs.map(crumb => (
                   <React.Fragment key={crumb.id}>
                     <ChevronRight size={12} />
                     <button 
                        onClick={() => navigateToBreadcrumb(crumb.id)}
                        className={`hover:text-${color} ${currentFolderId === crumb.id ? 'text-gray-300' : ''}`}
                     >
                       {crumb.title}
                     </button>
                   </React.Fragment>
                 ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className={`bg-${color} text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-${color}/20`}
          >
            <Plus size={18} /> New
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-xl font-bold text-white">Create New</h3>
            
            <div className="flex gap-2 bg-bg p-1 rounded-lg">
              <button 
                onClick={() => setCreateType('file')}
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition ${createType === 'file' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <FilePlus size={16} /> Page
              </button>
              <button 
                onClick={() => setCreateType('folder')}
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition ${createType === 'folder' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <FolderPlus size={16} /> Folder
              </button>
            </div>

            <input 
              autoFocus
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              placeholder={createType === 'file' ? "Page Name..." : "Folder Name..."}
              className="w-full bg-bg border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-cyan"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />

            <div className="flex gap-2">
              <button onClick={handleCreate} className={`flex-1 bg-${color} text-black py-2 rounded-xl font-bold`}>Create</button>
              <button onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-xl font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px] content-start">
        {currentFolderId && (
          <div 
            onClick={navigateUp}
            className="border border-dashed border-gray-700 p-6 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition text-gray-500"
          >
            <CornerUpLeft size={24} />
            <span className="font-bold">Up one level</span>
          </div>
        )}

        {/* Folders First */}
        {currentItems.filter(i => i.type === 'folder').map(folder => {
          const isDragTarget = dragOverFolderId === folder.id;
          return (
            <div 
              key={folder.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              onClick={() => enterFolder(folder.id)}
              className={`group bg-card border p-6 rounded-2xl cursor-pointer transition-all relative flex flex-col justify-between 
                ${isDragTarget ? `border-${color} border-2 border-dashed bg-${color}/5 scale-105` : 'border-gray-800 hover:border-gray-500'}
              `}
            >
              <div className="flex items-start justify-between mb-4 pointer-events-none">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                  <Folder size={24} fill="currentColor" fillOpacity={0.2} />
                </div>
                {/* Pointer events auto needed on button because parent has pointer-events-none? No, I put pointer-events-none on the header div, 
                    but the button needs to be clickable. Actually, better to just NOT disable pointer events on parent and rely on stopPropagation.
                */}
              </div>
              
              {/* Delete Button (Absolute Positioned, High Z-Index, Explicit Handler) */}
              <div 
                className="absolute top-6 right-6 z-20"
                onClick={(e) => handleDelete(e, folder.id)}
              >
                 <button 
                  className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                  title="Delete Folder"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-white mb-1">{folder.title}</h3>
                 <p className="text-xs text-gray-500">{getCurrentFolderItems().filter(i => i.parentId === folder.id).length} items inside</p>
              </div>
            </div>
          );
        })}

        {/* Then Files */}
        {currentItems.filter(i => i.type !== 'folder').map(page => (
          <div 
            key={page.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, page.id)}
            onClick={() => openFile(page)}
            className={`group bg-card border border-gray-800 p-6 rounded-2xl hover:border-gray-500 cursor-pointer transition-all relative flex flex-col justify-between opacity-${draggedItemId === page.id ? '50' : '100'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${color}/5 text-${color}`}>
                <FileText size={24} />
              </div>
            </div>

            {/* Delete Button */}
            <div 
                className="absolute top-6 right-6 z-20"
                onClick={(e) => handleDelete(e, page.id)}
              >
                 <button 
                  className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                  title="Delete Page"
                >
                  <Trash2 size={16} />
                </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{page.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-2 h-10">{page.subtitle}</p>
              <div className="mt-4 text-[10px] text-gray-600 font-mono">
                {new Date(page.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}

        {currentItems.length === 0 && (
          <div 
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:border-gray-600 hover:text-gray-400 transition min-h-[200px]"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-bold">Empty Folder. Create Something.</span>
          </div>
        )}
      </div>
    </div>
  );
};
