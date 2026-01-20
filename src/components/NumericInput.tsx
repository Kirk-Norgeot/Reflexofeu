import { useState } from 'react';
import NumericKeypad from './NumericKeypad';

interface NumericInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function NumericInput({
  value,
  onChange,
  label,
  placeholder,
  required,
  className = '',
}: NumericInputProps) {
  const [showKeypad, setShowKeypad] = useState(false);

  return (
    <>
      <div>
        {label && <label className="label">{label}</label>}
        <input
          type="text"
          value={value}
          onClick={() => setShowKeypad(true)}
          readOnly
          placeholder={placeholder}
          required={required}
          className={`input cursor-pointer ${className}`}
        />
      </div>

      {showKeypad && (
        <NumericKeypad
          value={value}
          onChange={onChange}
          onClose={() => setShowKeypad(false)}
          label={label}
        />
      )}
    </>
  );
}
