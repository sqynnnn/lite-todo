
import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Table, Heading1, Heading2, List, Type, Palette, KanbanSquare } from 'lucide-react';

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  color?: string;
}

export const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, color = 'cyan' }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, []); 

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertTable = () => {
    const html = `
      <table style="width:100%; border-collapse: collapse; margin: 1em 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #4b5563; padding: 8px; background: rgba(255,255,255,0.05);">Header 1</th>
            <th style="border: 1px solid #4b5563; padding: 8px; background: rgba(255,255,255,0.05);">Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #4b5563; padding: 8px;">Cell 1</td>
            <td style="border: 1px solid #4b5563; padding: 8px;">Cell 2</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    exec('insertHTML', html);
  };

  const insertProjectTemplate = () => {
     const html = `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid #374151; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="color: #4ECDC4; font-weight: bold; margin-bottom: 8px;">🚀 Project Tracker</h3>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; color: #9ca3af; font-size: 0.85em;">
              <th style="padding: 8px; border-bottom: 1px solid #374151;">Status</th>
              <th style="padding: 8px; border-bottom: 1px solid #374151;">Task</th>
              <th style="padding: 8px; border-bottom: 1px solid #374151;">Due</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #374151;"><span style="background: #FBBF24; color: black; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">DOING</span></td>
              <td style="padding: 8px; border-bottom: 1px solid #374151;">Project initialization</td>
              <td style="padding: 8px; border-bottom: 1px solid #374151; color: #9ca3af;">Today</td>
            </tr>
             <tr>
              <td style="padding: 8px; border-bottom: 1px solid #374151;"><span style="background: #374151; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">TODO</span></td>
              <td style="padding: 8px; border-bottom: 1px solid #374151;">Phase 2 Planning</td>
              <td style="padding: 8px; border-bottom: 1px solid #374151; color: #9ca3af;">Next Week</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><br/></p>
     `;
     exec('insertHTML', html);
  };

  const buttonClass = "p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition";

  return (
    <div className="flex flex-col h-full border border-gray-800 rounded-xl overflow-hidden bg-card/50">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-800 bg-card">
        <button onClick={() => exec('formatBlock', 'H1')} className={buttonClass} title="Large Heading"><Heading1 size={18} /></button>
        <button onClick={() => exec('formatBlock', 'H2')} className={buttonClass} title="Medium Heading"><Heading2 size={18} /></button>
        <div className="w-px h-6 bg-gray-700 mx-2" />
        <button onClick={() => exec('bold')} className={buttonClass} title="Bold"><Bold size={18} /></button>
        <button onClick={() => exec('italic')} className={buttonClass} title="Italic"><Italic size={18} /></button>
        <button onClick={() => exec('underline')} className={buttonClass} title="Underline"><Underline size={18} /></button>
        <div className="w-px h-6 bg-gray-700 mx-2" />
        <button onClick={() => exec('insertUnorderedList')} className={buttonClass} title="List"><List size={18} /></button>
        <button onClick={insertTable} className={buttonClass} title="Insert Table"><Table size={18} /></button>
        <button onClick={insertProjectTemplate} className="p-2 rounded bg-gold/10 text-gold hover:bg-gold/20 transition flex items-center gap-1 text-xs font-bold px-3 ml-2" title="Insert Project Template">
          <KanbanSquare size={14} /> Project
        </button>
        <div className="w-px h-6 bg-gray-700 mx-2" />
        
        {/* Color Pickers */}
        <div className="relative group">
           <button className={buttonClass}><Type size={18}/></button>
           <div className="absolute top-full left-0 hidden group-hover:flex bg-gray-900 border border-gray-700 p-2 rounded shadow-xl gap-1 z-50">
             {['#FFFFFF', '#4ECDC4', '#FF6B6B', '#FFD166', '#A78BFA'].map(c => (
               <button key={c} onClick={() => exec('foreColor', c)} className="w-6 h-6 rounded border border-gray-600" style={{backgroundColor: c}} />
             ))}
           </div>
        </div>
      </div>

      {/* Editor Content */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-6 outline-none text-gray-200 overflow-y-auto rich-editor-content"
        style={{ minHeight: '50vh' }}
      />
      
      <style>{`
        .rich-editor-content h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; color: white; }
        .rich-editor-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; color: #e5e7eb; border-bottom: 1px solid #374151; padding-bottom: 0.2em; margin-top: 1em; }
        .rich-editor-content ul { list-style-type: disc; padding-left: 1.5em; margin: 1em 0; }
        .rich-editor-content p { margin-bottom: 0.5em; line-height: 1.6; }
        .rich-editor-content table { width: 100%; border-collapse: collapse; }
        .rich-editor-content td, .rich-editor-content th { border: 1px solid #4b5563; padding: 8px; }
      `}</style>
    </div>
  );
};
