import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', type = 'text', ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && isPasswordVisible ? 'text' : type;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={inputType}
          className={`
            w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
            focus:ring-yellow-500 focus:border-yellow-500 block 
            ${icon ? 'pl-10' : 'pl-3'} 
            ${isPasswordType ? 'pr-10' : 'p-2.5'}
            p-2.5 
            transition duration-200 ease-in-out
            placeholder-gray-400
            ${className}
          `}
          {...props}
        />

        {/* Right Icon (Password Toggle) */}
        {isPasswordType && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={isPasswordVisible ? "Ocultar senha" : "Ver senha"}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};