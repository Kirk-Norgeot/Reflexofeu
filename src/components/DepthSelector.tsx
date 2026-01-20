import { useState } from 'react';
import NumericKeypad from './NumericKeypad';

interface DepthSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const PRESET_DEPTHS = ['0.10', '0.20', '0.30', '0.40', '0.50', '0.60'];

export default function DepthSelector({ value, onChange, label }: DepthSelectorProps) {
  const [showKeypad, setShowKeypad] = useState(false);
  const [useCustom, setUseCustom] = useState(!PRESET_DEPTHS.includes(value) && value !== '');

  const handlePresetSelect = (preset: string) => {
    setUseCustom(false);
    onChange(preset);
  };

  const handleCustomClick = () => {
    setUseCustom(true);
    setShowKeypad(true);
  };

  const handleKeypadChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleKeypadClose = () => {
    setShowKeypad(false);
  };

  return (
    <>
      <div>
        {label && <label className="label">{label}</label>}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {PRESET_DEPTHS.map((depth) => (
            <button
              key={depth}
              type="button"
              onClick={() => handlePresetSelect(depth)}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                value === depth && !useCustom
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
              }`}
            >
              {depth}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCustomClick}
          className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
            useCustom
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
          }`}
        >
          {useCustom && value ? `Personnalisé: ${value}` : 'Saisir manuellement'}
        </button>
      </div>

      {showKeypad && (
        <NumericKeypad
          value={value}
          onChange={handleKeypadChange}
          onClose={handleKeypadClose}
          label={label}
        />
      )}
    </>
  );
}
