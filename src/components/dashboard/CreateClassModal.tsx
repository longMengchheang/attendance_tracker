'use client';

import { useState } from 'react';
import { Plus, X, MapPin as MapPinIcon, RefreshCw, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClass, updateClass } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { TimePicker } from '../ui/shadcn-time-picker';

const LocationPicker = dynamic(() => import('../ui/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-xl" />
});

interface CreateClassModalProps {
    initialData?: {
        name: string;
        code: string;
        location?: string | null;
        radius?: number | string | null;
        startTime?: string | null;
        endTime?: string | null;
        description?: string | null;
        latitude?: string | null;
        longitude?: string | null;
        days?: string[] | null;
    };
    trigger?: React.ReactNode; 
    onClose?: () => void;
    isOpenControlled?: boolean;
    classId?: string;
    onSuccess?: () => void;
}

export default function CreateClassModal({ 
  initialData, 
  trigger, 
  onClose, 
  isOpenControlled,
  classId,
  onSuccess 
}: CreateClassModalProps = {}) {
  const { user } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Determine if controlled or uncontrolled
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const setIsOpen = (val: boolean) => {
      if (onClose && !val) onClose();
      setInternalIsOpen(val);
  };

  const isEditMode = !!initialData;

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  // Helper to get local HH:MM from ISO string
  const getLocalTime = (isoString?: string | null) => {
    if (!isoString) return '';
    // Ensure we treat the string as UTC if it lacks timezone info (Supabase timestamp vs timestamptz)
    // Only append Z if there is no timezone offset info in the string
    const hasTimezone = isoString.includes('Z') || isoString.includes('+') || (isoString.includes('-') && isoString.lastIndexOf('-') > 10);
    const timeValue = hasTimezone ? isoString : `${isoString}Z`;
    const date = new Date(timeValue);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strHours = hours.toString().padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  };

  const [formData, setFormData] = useState({
      name: initialData?.name || '',
      description: initialData?.description || '',
      location: initialData?.location || '',
      lat: initialData?.latitude || '',
      lng: initialData?.longitude || '',
      radius: initialData?.radius ? Number(initialData.radius) : 100,
      startTime: getLocalTime(initialData?.startTime),
      endTime: getLocalTime(initialData?.endTime),
      days: initialData?.days || [] as string[]
  });
  const [errors, setErrors] = useState<{time?: string; submit?: string; location?: string}>({});



  // Helper to convert local HH:MM (12h or 24h) to ISO string
  const toIsoString = (timeStr: string) => {
    if (!timeStr) return undefined;
    const date = new Date();
    
    // Parse time string which might be "HH:MM" or "HH:MM AM/PM"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);
    if (!match) return undefined;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    // Convert to 24h if PM/AM is present
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date.toISOString();
  };

  const handleCreate = async () => {
      // Basic Validation
      if (!formData.name.trim()) {
          setErrors({ submit: 'Class name is required' });
          return;
      }

      if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
          setErrors({ time: 'End time must be after start time' });
          return;
      }

      if (!user?.id) {
          setErrors({ submit: 'Please log in to create a class' });
          return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
          if (isEditMode && classId) {
              await updateClass(classId, user.id, {
                  name: formData.name,
                  description: formData.description || undefined,
                  location: formData.location || undefined,
                  latitude: formData.lat || undefined,
                  longitude: formData.lng || undefined,
                  radius: formData.radius || 100,
                  checkInStart: toIsoString(formData.startTime),
                  checkInEnd: toIsoString(formData.endTime),
                  days: formData.days,
              });
          } else {
              await createClass(user.id, formData.name, {
                  description: formData.description || undefined,
                  location: formData.location || undefined,
                  latitude: formData.lat || undefined,
                  longitude: formData.lng || undefined,
                  radius: formData.radius || 100,
                  checkInStart: toIsoString(formData.startTime),
                  checkInEnd: toIsoString(formData.endTime),
                  days: formData.days,
              });
          }

          setShowSuccess(true);
          onSuccess?.();
          
          setTimeout(() => {
              setIsOpen(false);
              setShowSuccess(false);
              setErrors({});
              // Reset form
              setFormData({
                  name: '',
                  description: '',
                  location: '',
                  lat: '',
                  lng: '',
                  radius: 100,
                  startTime: '',
                  endTime: '',
                  days: []
              });
          }, 1500);
      } catch (err: any) {
          setErrors({ submit: err.message || 'Failed to save class' });
      } finally {
          setIsSubmitting(false);
      }
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
                <button 
                    onClick={() => {
                        setIsOpen(false);
                        if (!isEditMode) {
                            setFormData({
                                name: '',
                                description: '',
                                location: '',
                                lat: '',
                                lng: '',
                                radius: 100,
                                startTime: '',
                                endTime: '',
                                days: []
                            });
                            setErrors({});
                        }
                    }} 
                    className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
                >
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
                                <label className="block text-sm font-semibold text-gray-700">Class Name *</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., Machine Learning"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all text-gray-900"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Description</label>
                                <input 
                                    type="text" 
                                    placeholder="Brief description (optional)"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all text-gray-900"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>

                    </section>
    
                    {/* Section 2: Location & Radius */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            Location & Radius (Optional)
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </h3>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Class Location</label>
                            
                            <LocationPicker 
                                value={{
                                    name: formData.location || '',
                                    lat: parseFloat(formData.lat) || 0,
                                    lng: parseFloat(formData.lng) || 0
                                }}
                                onChange={(val) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        location: val.name,
                                        lat: val.lat.toString(),
                                        lng: val.lng.toString()
                                    }));
                                }}
                                error={errors.location}
                            />
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
                            <p className="text-xs text-gray-400">Recommended: 50–150 meters.</p>
                        </div>
                    </section>

                    {/* Section 3: Schedule */}
                    <section className="space-y-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            Check-in Window
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </h3>
                        
                        {/* Class Days Selector */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">Class Days</label>
                            <div className="flex flex-wrap gap-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                                    const isSelected = (formData.days || []).includes(day);
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => {
                                                const currentDays = formData.days || [];
                                                const newDays = isSelected
                                                    ? currentDays.filter(d => d !== day)
                                                    : [...currentDays, day];
                                                setFormData({ ...formData, days: newDays });
                                            }}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${
                                                isSelected
                                                    ? 'bg-[#F43F5E] text-white border-[#F43F5E] shadow-sm'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <TimePicker 
                                    label="Start Time"
                                    value={formData.startTime}
                                    onChange={(val) => setFormData({...formData, startTime: val})}
                                />
                            </div>
                            <div className="space-y-2">
                                <TimePicker 
                                    label="End Time"
                                    value={formData.endTime}
                                    onChange={(val) => setFormData({...formData, endTime: val})}
                                />
                            </div>
                        </div>
                        {errors.time && (
                            <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50 p-2 rounded-lg">
                                <AlertCircle size={14} />
                                {errors.time}
                            </div>
                        )}
                    </section>

                    {/* Error Message */}
                    {errors.submit && (
                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg">
                            <AlertCircle size={16} />
                            {errors.submit}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            if (!isEditMode) {
                                setFormData({
                                    name: '',
                                    description: '',
                                    location: '',
                                    lat: '',
                                    lng: '',
                                    radius: 100,
                                    startTime: '',
                                    endTime: '',
                                    days: []
                                });
                                setErrors({});
                            }
                        }} 
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreate}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-[#F43F5E] text-white font-bold rounded-xl hover:bg-[#E11D48] transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {isEditMode ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            isEditMode ? 'Update Class' : 'Create Class'
                        )}
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