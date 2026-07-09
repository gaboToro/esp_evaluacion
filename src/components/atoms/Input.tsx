import React from 'react';

// Definimos las propiedades del cuadro de texto
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col w-full">
      {/* Etiqueta del campo (Label) con alto contraste */}
      <label className="block text-sm font-extrabold text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Cuadro de texto amplio, legible y con el color corporativo al enfocarse */}
      <input
        className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 font-medium placeholder-gray-400 transition-all focus:outline-none focus:border-[#8B0000] focus:ring-4 focus:ring-red-900/10 ${className}`}
        {...props}
      />
    </div>
  );
};