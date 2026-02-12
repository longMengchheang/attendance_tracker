'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { Search, MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';

// Default center: Phnom Penh
const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };
const DEFAULT_ZOOM = 13;

interface LocationValue {
  name: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value?: LocationValue | null;
  onChange: (value: LocationValue) => void;
  error?: string;
}

// Component to handle map updates when value changes
function MapUpdater({ center, zoom }: { center: { lat: number, lng: number }, zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value changes
  useEffect(() => {
    if (value && value.name !== searchQuery) {
       // Only update if the value name is significantly different or empty
       // We don't want to overwrite while typing if it's just a lag
       if (!document.activeElement?.className.includes('location-search-input')) {
          setSearchQuery(value.name);
       }
    }
  }, [value]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Geocoding Helpers ---

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    setGeoError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      
      const displayName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      // Simplify address for display if too long
      const simplifiedName = displayName.split(',').slice(0, 3).join(',');
      
      const newValue = {
        name: simplifiedName,
        lat,
        lng
      };
      
      setSearchQuery(simplifiedName);
      onChange(newValue);
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      // Fallback to coordinates
      const fallbackName = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setSearchQuery(fallbackName);
      onChange({ name: fallbackName, lat, lng });
    } finally {
      setIsGeocoding(false);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Search error:', err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // --- Event Handlers ---

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(query);
    }, 500);
  };

  const handleSuggestionSelect = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    
    // Update everything
    setSearchQuery(place.display_name);
    setShowSuggestions(false);
    setShowMap(true); // Show map when a place is selected
    onChange({
      name: place.display_name,
      lat,
      lng
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location unavailable');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out');
            break;
          default:
            setGeoError('Could not get location');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMarkerDragEnd = (e: any) => {
    const marker = e.target;
    const position = marker.getLatLng();
    reverseGeocode(position.lat, position.lng);
  };

  // --- Render Helpers ---

  const center = value && value.lat && value.lng 
    ? { lat: value.lat, lng: value.lng } 
    : DEFAULT_CENTER;

  // Manual lat/lng edit handlers
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLat = parseFloat(e.target.value);
    if (!isNaN(newLat) && newLat >= -90 && newLat <= 90) {
      if (value) {
        onChange({ ...value, lat: newLat });
        // Optional: debounce reverse geocode here if desired, 
        // or just accept coordinates without updating name immediately
      }
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLng = parseFloat(e.target.value);
    if (!isNaN(newLng) && newLng >= -180 && newLng <= 180) {
      if (value) {
        onChange({ ...value, lng: newLng });
      }
    }
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchInput}
          onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="Search for a location..."
          className="location-search-input w-full bg-white border border-gray-200 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none text-gray-900 transition-all"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        )}
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {suggestions.map((place) => (
              <button
                key={place.place_id}
                onClick={() => handleSuggestionSelect(place)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors"
              >
                <MapPin size={16} className="mt-1 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 line-clamp-2">{place.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

       {/* Action Buttons */}
       <div className="flex gap-3">
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex-1 py-2.5 border border-[#F43F5E] text-[#F43F5E] rounded-lg hover:bg-[#FFF0F3] text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          type="button"
        >
          {isLocating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <Navigation size={16} />
              Use Current Location
            </>
          )}
        </button>

        <button
          onClick={() => setShowMap(!showMap)}
          className={`flex-1 py-2.5 border rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
            showMap 
              ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
          type="button"
        >
          <MapPin size={16} />
          {showMap ? 'Hide Map' : 'Choose on Map'}
        </button>
      </div>

      {/* Map Container */}
      {showMap && (
        <div className="relative h-64 w-full rounded-xl overflow-hidden border border-gray-200 z-0 animate-in fade-in zoom-in-95 duration-200">
          <MapContainer 
            center={center} 
            zoom={DEFAULT_ZOOM} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={center} />
            <MapClickHandler onLocationSelect={reverseGeocode} />
            
            {value && value.lat && value.lng && (
              <Marker 
                position={{ lat: value.lat, lng: value.lng }}
                draggable={true}
                eventHandlers={{
                  dragend: handleMarkerDragEnd
                }}
              />
            )}
          </MapContainer>
          
          {/* Geocoding Loading Overlay */}
          {isGeocoding && (
               <div className="absolute inset-0 bg-white/50 z-[401] flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                         <Loader2 size={16} className="animate-spin text-[#F43F5E]" />
                         <span className="text-xs font-semibold text-gray-700">Updating location...</span>
                    </div>
               </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {(error || geoError) && (
        <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
          <AlertCircle size={14} />
          {error || geoError}
        </div>
      )}

      {/* Manual Coordinates (Collapsible/Optional - keeping visible for now as requested) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Latitude</label>
          <input
            type="number"
            step="any"
            value={value?.lat || ''}
            onChange={handleLatChange}
            placeholder="0.000000"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Longitude</label>
          <input
            type="number"
            step="any"
            value={value?.lng || ''}
            onChange={handleLngChange}
            placeholder="0.000000"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
