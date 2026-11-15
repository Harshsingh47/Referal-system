import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const Icon = type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle2;
  const iconColor = type === 'error' ? '#f43f5e' : type === 'info' ? '#38bdf8' : '#10b981';

  return (
    <div className="toast-container">
      <div className="toast">
        <Icon size={18} color={iconColor} />
        <span>{message}</span>
      </div>
    </div>
  );
}
