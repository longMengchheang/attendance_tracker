'use client';

import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
}

export default function DeleteClassModal({ isOpen, onClose, className }: DeleteClassModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in text-center space-y-4">
        
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
            <AlertTriangle size={32} />
        </div>

        <div>
            <h2 className="text-xl font-bold text-gray-900">Delete Class?</h2>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-gray-700">"{className}"</span>?
                <br />
                This action cannot be undone and will remove all associated attendance records.
            </p>
        </div>

        <div className="flex gap-3 pt-4">
            <button 
                onClick={onClose}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={onClose} // In real app, this would delete
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
                Delete Class
            </button>
        </div>

      </div>
    </div>
  );
}
