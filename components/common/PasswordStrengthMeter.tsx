import React from 'react';
import type { PasswordValidationState } from '../../utils/passwordValidator.ts';

interface PasswordStrengthMeterProps {
  validationState: PasswordValidationState;
}

const Requirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <li className={`flex items-center text-xs transition-colors ${met ? 'text-green-600' : 'text-slate-500'}`}>
    <span className="material-symbols-outlined text-sm mr-1">
      {met ? 'check_circle' : 'cancel'}
    </span>
    {text}
  </li>
);

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ validationState }) => {
  const { length, uppercase, special, score } = validationState;

  const getStrengthColor = () => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500'; // Weak
      case 2:
      case 3:
        return 'bg-yellow-500'; // Medium
      case 4:
        return 'bg-green-500'; // Strong
      default:
        return 'bg-slate-200';
    }
  };

  const strengthWidth = `${(score / 4) * 100}%`;

  return (
    <div className="space-y-2 pt-1">
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: strengthWidth }}
        />
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-1">
        <Requirement met={length} text="Mínimo 8 caracteres" />
        <Requirement met={uppercase} text="Una mayúscula" />
        <Requirement met={special} text="Un caracter especial" />
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
