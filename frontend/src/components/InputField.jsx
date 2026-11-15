import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  optional = false,
  error,
  isValid = false,
  hint,
  icon: Icon,
  disabled = false,
  maxLength,
  fontMono = false,
  allowToggleVisibility = false,
  autoComplete
}) {
  const [showText, setShowText] = useState(false);

  const effectiveType = allowToggleVisibility
    ? (showText ? 'text' : 'password')
    : type;

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        <span>
          {label}
          {required && <span className="label-required">*</span>}
        </span>
        {optional && <span className="label-optional">(Optional)</span>}
      </label>

      <div className="input-container">
        {Icon && (
          <span className="input-icon-left">
            <Icon size={18} />
          </span>
        )}

        <input
          id={name}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete={autoComplete || 'off'}
          className={`input-field ${!Icon ? 'no-icon' : ''} ${error ? 'input-error' : isValid ? 'input-success' : ''} ${fontMono ? 'font-mono' : ''}`}
        />

        {allowToggleVisibility && (
          <button
            type="button"
            className="input-action-btn"
            onClick={() => setShowText(!showText)}
            tabIndex={-1}
            title={showText ? 'Hide value' : 'Show value'}
          >
            {showText ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p className="field-error-msg">
          <AlertCircle size={14} />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="field-hint-msg">{hint}</p>
      ) : null}
    </div>
  );
}
