import React, { useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X, Pencil } from 'lucide-react';

interface SigilBlockProps {
  id: string;
  content: string;
  onDelete: (id: string) => void;
  editingId: string | null;
  onSetEditing: (id: string | null) => void;
  onUpdateContent: (id: string, newContent: string) => void;
}

export function SigilBlock({ id, content, onDelete, editingId, onSetEditing, onUpdateContent }: SigilBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = { transform: CSS.Translate.toString(transform) };
  
  const isEditing = editingId === id;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Detiene la propagación del evento para evitar el conflicto con dnd-kit y la barra espaciadora
    if (e.key === ' ' || e.key.includes('Arrow')) {
      e.stopPropagation();
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSetEditing(null);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // --- CAMBIO DE ESTILO: BORDES Y SOMBRAS A CYAN ---
      className={`
        relative group p-4 rounded-lg bg-[#2d2d2d] border-2 border-cyan-500/50 text-white font-medium
        shadow-lg hover:shadow-cyan-500/20 transition-all duration-200
        select-none touch-none
        ${isDragging ? 'opacity-50 scale-105' : 'hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]'}
      `}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing w-full h-full">
        {isEditing ? (
          <textarea
            ref={textAreaRef}
            value={content}
            onChange={(e) => onUpdateContent(id, e.target.value)}
            onBlur={() => onSetEditing(null)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white outline-none resize-none"
            rows={3}
          />
        ) : (
          <div className="min-h-[24px] w-full">
             <p className="pointer-events-none">{content}</p>
          </div>
        )}
      </div>
      
      <div className="absolute -top-3 -right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onSetEditing(id)}
          className="w-6 h-6 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white"
          title="Edit Sigil"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white"
          title="Delete Sigil"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default SigilBlock;
