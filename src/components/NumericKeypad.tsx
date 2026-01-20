import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  label?: string;
}

export default function NumericKeypad({
  value,
  onChange,
  onClose,
  label,
}: NumericKeypadProps) {
  const [inputValue, setInputValue] = useState(value);
  const keypadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleKeyPress = (key: string) => {
    if (key === ',') {
      if (!inputValue.includes(',')) {
        setInputValue(inputValue + key);
      }
    } else {
      setInputValue(inputValue + key);
    }
  };

  const handleBackspace = () => {
    setInputValue(inputValue.slice(0, -1));
  };

  const handleClear = () => {
    setInputValue('');
  };

  const handleValidate = () => {
    onChange(inputValue);
    onClose();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={keypadRef}
        className="bg-white rounded-lg shadow-xl p-6 w-80 max-w-full mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {label || 'Entrez une valeur'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={inputValue}
            readOnly
            className="input text-center text-2xl font-semibold"
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyPress(key)}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 font-semibold text-xl py-4 rounded-lg transition-colors"
            >
              {key}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={handleBackspace}
            className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold py-3 rounded-lg transition-colors"
          >
            Effacer
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold py-3 rounded-lg transition-colors"
          >
            Tout effacer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-3 text-lg font-semibold"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleValidate}
            className="btn-primary py-3 text-lg font-semibold"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
