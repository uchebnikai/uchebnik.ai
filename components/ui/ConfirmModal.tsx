import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-indigo-500/20 animate-in zoom-in-95">
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-500 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                   <button onClick={onCancel} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">Отказ</button>
                   <button onClick={onConfirm} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-colors">Потвърди</button>
                </div>
             </div>
        </div>
    );
};