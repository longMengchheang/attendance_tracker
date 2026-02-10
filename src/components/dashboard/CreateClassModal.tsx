'use client';

import { useState } from 'react';
import { Plus, X, MapPin as MapPinIcon, RefreshCw, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { createClass, updateClass } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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
    const timeValue = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const date = new Date(timeValue);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
      name: initialData?.name || '',
      description: initialData?.description || '',
      location: initialData?.location || '',
      lat: initialData?.latitude || '',
      lng: initialData?.longitude || '',
      radius: initialData?.radius ? Number(initialData.radius) : 100,
      startTime: getLocalTime(initialData?.startTime),
      endTime: getLocalTime(initialData?.endTime)
  });
  const [errors, setErrors] = useState<{time?: string; submit?: string; location?: string}>({});

  // Get current location using browser geolocation API
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors({ location: 'Geolocation is not supported by your browser' });
      return;
    }

    setIsGettingLocation(true);
    setErrors({});

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        
        // Try to reverse geocode for a readable address
        let locationName = `${lat}, ${lng}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data.display_name) {
            locationName = data.display_name.split(',').slice(0, 3).join(',');
          }
        } catch (err) {
          // Use coordinates if reverse geocoding fails
        }

        setFormData(prev => ({
          ...prev,
          location: locationName,
          lat,
          lng
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrors({ location: 'Location permission denied' });
            break;
          case error.POSITION_UNAVAILABLE:
            setErrors({ location: 'Location unavailable' });
            break;
          case error.TIMEOUT:
            setErrors({ location: 'Location request timed out' });
            break;
          default:
            setErrors({ location: 'Unable to get location' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Helper to convert local HH:MM to ISO string (using today's date)
  const toIsoString = (timeStr: string) => {
    if (!timeStr) return undefined;
    const date = new Date();
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
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
                  endTime: ''
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
                        <p className="text-xs text-gray-400">A unique class code will be auto-generated for students to join.</p>
                    </section>
    
                    {/* Section 2: Location & Radius */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            Location & Radius (Optional)
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </h3>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Class Location</label>
                            <input 
                                type="text" 
                                placeholder="Search for a location..."
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none text-gray-900"
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button 
                                type="button"
                                onClick={handleGetCurrentLocation}
                                disabled={isGettingLocation}
                                className="flex-1 py-2.5 border border-[#F43F5E] text-[#F43F5E] rounded-lg hover:bg-[#FFF0F3] text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isGettingLocation ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Getting Location...
                                    </>
                                ) : (
                                    <>
                                        <MapPinIcon size={16} />
                                        Use Current Location
                                    </>
                                )}
                            </button>
                        </div>
                        {errors.location && (
                            <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
                                <AlertCircle size={14} />
                                {errors.location}
                            </div>
                        )}

                        {/* Latitude & Longitude Fields */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Latitude</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., -6.2088"
                                    value={formData.lat}
                                    onChange={(e) => setFormData({...formData, lat: e.target.value})}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none text-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Longitude</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., 106.8456"
                                    value={formData.lng}
                                    onChange={(e) => setFormData({...formData, lng: e.target.value})}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none text-gray-900"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">Auto-filled when using current location, or enter manually from Google Maps.</p>

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
                            Check-in Window (Optional)
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
                                        value={formData.startTime}
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
                                        value={formData.endTime}
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
                        onClick={() => setIsOpen(false)} 
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