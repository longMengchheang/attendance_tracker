'use client';

import { useState } from 'react';
import { Plus, X, CheckCircle2, AlertCircle, BookOpen, Loader2 } from 'lucide-react';
import { joinClass } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';

interface JoinClassModalProps {
    trigger?: React.ReactNode;
    onClose?: () => void;
    isOpenControlled?: boolean;
    onSuccess?: () => void;
}

export default function JoinClassModal({ 
  trigger, 
  onClose, 
  isOpenControlled,
  onSuccess 
}: JoinClassModalProps = {}) {
  const { user } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const setIsOpen = (val: boolean) => {
      if (onClose && !val) onClose();
      setInternalIsOpen(val);
  };

  const [classCode, setClassCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
      if (!classCode.trim()) {
          setError('Please enter a class code');
          return;
      }

      if (classCode.length < 4) {
          setError('Invalid class code format');
          return;
      }

      if (!user?.id) {
          setError('Please log in to join a class');
          return;
      }

      setIsJoining(true);
      setError('');

      try {
          await joinClass(user.id, classCode);
          setShowSuccess(true);
          onSuccess?.();
          
          setTimeout(() => {
              setIsOpen(false);
              setShowSuccess(false);
              setClassCode('');
          }, 1500);
      } catch (err: any) {
          setError(err.message || 'Failed to join class');
      } finally {
          setIsJoining(false);
      }
  };

  const handleClose = () => {
      setIsOpen(false);
      setError('');
      setClassCode('');
  };

  return (
    <>
      {/* Trigger */}
      {trigger ? (
          <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <div 
            onClick={() => setIsOpen(true)}
            className="bg-[#3B82F6] p-6 rounded-xl shadow-lg shadow-[#3B82F6]/20 flex flex-col justify-between h-40 cursor-pointer hover:shadow-xl hover:shadow-[#3B82F6]/30 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BookOpen size={120} className="text-white" />
            </div>
            
            <div className="relative z-10 bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
                <Plus size={24} strokeWidth={3} />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-white font-bold text-2xl tracking-tight">Join Class</h3>
              <p className="text-white/80 text-sm mt-1 font-medium">Enter a class code</p>
            </div>
        </div>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Join a Class</h2>
                    <p className="text-sm text-gray-500 mt-1">Enter the code provided by your teacher</p>
                </div>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Success State */}
            {showSuccess ? (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Joined Successfully!</h3>
                    <p className="text-gray-500">You've been added to the class.</p>
                </div>
            ) : (
                <>
                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Class Code</label>
                        <input 
                            type="text" 
                            placeholder="e.g., ZS-AKD-2024"
                            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] outline-none transition-all text-gray-900 uppercase"
                            value={classCode}
                            onChange={(e) => {
                                setClassCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            maxLength={12}
                        />
                        <p className="text-xs text-gray-400 text-center">Ask your teacher for the class code</p>
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-medium">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                    <button 
                        onClick={handleClose} 
                        disabled={isJoining}
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleJoin}
                        disabled={isJoining}
                        className="flex-1 py-3 bg-[#3B82F6] text-white font-bold rounded-xl hover:bg-[#2563EB] transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isJoining ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Joining...
                            </>
                        ) : (
                            'Join Class'
                        )}
                    </button>
                </div>
                </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
