import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface AddressSuggestion {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
  };
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress?: (address: {
    adresse: string;
    code_postal: string;
    ville: string;
  }) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  city?: string;
  postalCode?: string;
  companyName?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelectAddress,
  placeholder,
  required,
  className = '',
  label,
  city,
  postalCode,
  companyName,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        let searchQuery = value;

        if (companyName && companyName.length >= 2) {
          searchQuery = `${companyName}, ${value}`;

          if (city) {
            searchQuery = `${companyName}, ${value}, ${city}`;
          }

          if (postalCode && city) {
            searchQuery = `${companyName}, ${value}, ${postalCode} ${city}`;
          }
        } else {
          if (city) {
            searchQuery = `${value}, ${city}`;
          }

          if (postalCode && city) {
            searchQuery = `${value}, ${postalCode} ${city}`;
          }
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&countrycodes=fr&addressdetails=1&limit=5`,
          {
            headers: {
              'Accept-Language': 'fr',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, city, postalCode, companyName]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const roadName = suggestion.address.road || '';
    const houseNumber = suggestion.address.house_number || '';
    const adresse = houseNumber ? `${houseNumber} ${roadName}` : roadName;
    const ville = (
      suggestion.address.city ||
      suggestion.address.town ||
      suggestion.address.village ||
      ''
    ).toUpperCase();
    const code_postal = suggestion.address.postcode || '';

    onChange(adresse);
    setShowSuggestions(false);

    if (onSelectAddress) {
      onSelectAddress({
        adresse,
        code_postal,
        ville,
      });
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className={`input ${className}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3 transition-colors"
            >
              <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.address.road && suggestion.address.house_number
                    ? `${suggestion.address.house_number} ${suggestion.address.road}`
                    : suggestion.address.road || suggestion.display_name.split(',')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {[
                    suggestion.address.postcode,
                    (suggestion.address.city ||
                      suggestion.address.town ||
                      suggestion.address.village || '').toUpperCase(),
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
