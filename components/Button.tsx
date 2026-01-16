import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";
  
  const variants = {
    primary: "bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-500",
    secondary: "bg-white hover:bg-gray-50 text-slate-900 border-gray-300 focus:ring-slate-500"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};