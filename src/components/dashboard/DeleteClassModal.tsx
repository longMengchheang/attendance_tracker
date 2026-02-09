'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { deleteClass } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  classId?: string;
  onSuccess?: () => void;
}

export default function DeleteClassModal({ 
  isOpen, 
  onClose, 
  className, 
  classId,
  onSuccess 
}: DeleteClassModalProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!classId || !user?.id) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteClass(classId, user.id);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete class');
    } finally {
      setIsDeleting(false);
    }
  };

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

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="flex gap-3 pt-4">
            <button 
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                Cancel
            </button>
            <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Class'
                )}
            </button>
        </div>

      </div>
    </div>
  );
}
