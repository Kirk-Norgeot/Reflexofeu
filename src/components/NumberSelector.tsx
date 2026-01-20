interface NumberSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export default function NumberSelector({ value, onChange, min = 1, max = 8, label }: NumberSelectorProps) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {numbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-12 h-12 rounded-lg font-semibold transition-all ${
              value === num
                ? 'bg-primary-600 text-white shadow-lg scale-110'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
