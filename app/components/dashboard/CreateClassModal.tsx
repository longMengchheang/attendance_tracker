'use client';

import { useState } from 'react';
import { Plus, X, MapPin as MapPinIcon, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateClassModalProps {
    initialData?: {
        name: string;
        code: string;
        location: string;
        radius: number | string;
        startTime?: string;
        endTime?: string;
    };
    trigger?: React.ReactNode; 
    onClose?: () => void;
    isOpenControlled?: boolean; // To control from outside if needed
}

export default function CreateClassModal({ initialData, trigger, onClose, isOpenControlled }: CreateClassModalProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Determine if controlled or uncontrolled
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const setIsOpen = (val: boolean) => {
      if (onClose && !val) onClose();
      setInternalIsOpen(val);
  };

  const isEditMode = !!initialData;

  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
      name: initialData?.name || '',
      code: initialData?.code || 'ZS-AKD-2024',
      location: initialData?.location || '',
      lat: '',
      lng: '',
      radius: initialData?.radius ? Number(initialData.radius) : 100,
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || ''
  });
  const [errors, setErrors] = useState<{time?: string}>({});

  const handleCreate = () => {
      // Basic Validation
      if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
          setErrors({ time: 'End time must be after start time' });
          return;
      }

      // Simulate API call
      setTimeout(() => {
          setShowSuccess(true);
          setTimeout(() => {
              setIsOpen(false);
              setShowSuccess(false);
              setErrors({});
          }, 1500);
      }, 500);
  };

  const regenerateCode = () => {
      // Mock code generation
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for ( let i = 0; i < 6; i++ ) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setFormData({ ...formData, code: result });
  };

  return (
    <>
      {/* Trigger */}
      {trigger ? (
          <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <div 
            onClick={() => setIsOpen(true)}
            className="bg-[#F43F5E] p-6 rounded-xl shadow-lg shadow-[#F43F5E]/20 flex flex-col justify-between h-40 cursor-pointer hover:shadow-xl hover:shadow-[#F43F5E]/30 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10">
            <Plus size={120} className="text-white" />
            </div>
            
            <div className="relative z-10 bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
                <Plus size={24} strokeWidth={3} />
            </div>
            
            <div className="relative z-10">
            <h3 className="text-white font-bold text-2xl tracking-tight">Create Class</h3>
            <p className="text-white/80 text-sm mt-1 font-medium">Add a new course</p>
            </div>
        </div>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Update Class' : 'Create New Class'}</h2>
                    <p className="text-sm text-gray-500 mt-1">{isEditMode ? 'Modify class details' : 'Set up specific details for student enrollment'}</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Success State */}
            {showSuccess ? (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Class Updated!' : 'Class Created!'}</h3>
                    <p className="text-gray-500">Your class has been successfully {isEditMode ? 'updated' : 'added'}.</p>
                </div>
            ) : (
                <>
                {/* Body */}
                <div className="p-6 space-y-8">
                    
                    {/* Section 1: Class Details */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            Class Details
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Class Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., Machine Learning"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all text-gray-900"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Class Code</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        readOnly
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-500 cursor-not-allowed font-mono"
                                        value={formData.code}
                                    />
                                    <button 
                                        onClick={regenerateCode}
                                        className="p-2.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 hover:text-[#F43F5E] hover:border-[#F43F5E]/30 transition-colors"
                                        title="Regenerate Code"
                                    >
                                        <RefreshCw size={20} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400">Auto-generated unique code for students to join.</p>
                            </div>
                        </div>
                    </section>
        
                    {/* Section 2: Location & Radius */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            Location & Radius
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </h3>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Class Location</label>
                            <input 
                                type="text" 
                                placeholder="Search for a location..."
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none text-gray-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-500">Latitude</label>
                                <input 
                                    type="text" 
                                    placeholder="-" 
                                    readOnly 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-400 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-500">Longitude</label>
                                <input 
                                    type="text" 
                                    placeholder="-" 
                                    readOnly 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-400 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 py-2.5 border border-[#F43F5E] text-[#F43F5E] rounded-lg hover:bg-[#FFF0F3] text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                <MapPinIcon size={16} />
                                Use Current Location
                            </button>
                            <button className="flex-1 py-2.5 border border-[#F43F5E] text-[#F43F5E] rounded-lg hover:bg-[#FFF0F3] text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                <MapPinIcon size={16} />
                                Choose from Map
                            </button>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="block text-sm font-semibold text-gray-700">Check-in Radius (meters)</label>
                            <input 
                                type="number" 
                                min="10"
                                max="500"
                                value={Number.isNaN(formData.radius) ? '' : formData.radius}
                                onChange={(e) => setFormData({...formData, radius: parseInt(e.target.value)})}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none text-gray-900"
                            />
                            <p className="text-xs text-gray-400">Recommended: 50–150 meters. Max: 500m.</p>
                        </div>
                    </section>

                    {/* Section 3: Schedule */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            Check-in Window
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Start Time</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="time" 
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none text-sm text-gray-900"
                                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">End Time</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="time" 
                                        className={`w-full bg-white border rounded-lg p-2.5 pl-10 focus:ring-2 outline-none text-sm text-gray-900 ${errors.time ? 'border-red-300 ring-red-100' : 'border-gray-200 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E]'}`}
                                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        {errors.time && (
                            <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
                                <AlertCircle size={14} />
                                {errors.time}
                            </div>
                        )}
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreate}
                        className="flex-1 py-3 bg-[#F43F5E] text-white font-bold rounded-xl hover:bg-[#E11D48] transition-all shadow-md hover:shadow-lg"
                    >
                        {isEditMode ? 'Update Class' : 'Create Class'}
                    </button>
                </div>
                </>
            )}
          </div>
        </div>
      )}
    </>

)
}