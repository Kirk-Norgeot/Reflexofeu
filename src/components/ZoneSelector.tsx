import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';

interface ZoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const PRESET_ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', '1', '2', '3', '4', '5', '6', '7'];

export default function ZoneSelector({ value, onChange, label }: ZoneSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    if (value && !PRESET_ZONES.includes(value)) {
      setIsCustom(true);
      setCustomValue(value);
    }
  }, [value]);

  const handlePresetClick = (zone: string) => {
    setIsCustom(false);
    setCustomValue('');
    onChange(zone);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    if (customValue) {
      onChange(customValue);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {PRESET_ZONES.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => handlePresetClick(zone)}
            className={`w-12 h-12 rounded-lg font-semibold transition-all ${
              value === zone && !isCustom
                ? 'bg-primary-600 text-white shadow-lg scale-110'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            {zone}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustomClick}
          className={`px-4 h-12 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
            isCustom
              ? 'bg-primary-600 text-white shadow-lg scale-110'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Clavier</span>
        </button>
      </div>
      {isCustom && (
        <input
          type="text"
          value={customValue}
          onChange={handleCustomChange}
          placeholder="Saisir une zone personnalisée"
          className="input mt-2"
          autoFocus
        />
      )}
    </div>
  );
}
