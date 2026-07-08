import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = ({ label, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <label className="text-gray-900 font-extrabold text-lg">{label}</label>
      <input 
        className="w-full p-4 border-2 border-gray-400 rounded-xl text-xl text-gray-900 bg-gray-50 placeholder-gray-500 focus:border-[#8B0000] focus:bg-white focus:outline-none transition-all shadow-sm"
        {...props} 
      />
    </div>
  );
};