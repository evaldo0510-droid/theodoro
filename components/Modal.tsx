import React from 'react';
import { X, LucideIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  colorClass?: string;
  sizeClass?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon, 
  children, 
  colorClass = "bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950", 
  sizeClass = "max-w-4xl" 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className={`relative w-full ${sizeClass} ${colorClass} rounded-3xl shadow-2xl transform transition-all scale-100 max-h-[90vh] flex flex-col border border-white/10`}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10 bg-inherit backdrop-blur-xl rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/5 dark:bg-white/10 rounded-lg">
              <Icon className="w-5 h-5 text-slate-800 dark:text-white" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white truncate">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="p-5 md:p-8 overflow-y-auto flex-1 custom-scrollbar dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};