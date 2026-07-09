import React from 'react';

// Definimos las propiedades (props) que aceptará nuestro botón
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  variant = 'primary', 
  icon, 
  className = '', 
  ...props 
}) => {
  // Manejo centralizado de los colores corporativos y estados
  let bgColor = 'bg-[#8B0000] hover:bg-red-800 text-white'; // Rojo "El Español" por defecto
  
  if (variant === 'success') bgColor = 'bg-green-600 hover:bg-green-700 text-white';
  if (variant === 'danger') bgColor = 'bg-red-600 hover:bg-red-700 text-white';
  if (variant === 'warning') bgColor = 'bg-yellow-500 hover:bg-yellow-600 text-gray-900';

  return (
    <button
      className={`w-full font-extrabold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 disabled:opacity-50 ${bgColor} ${className}`}
      {...props}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {label}
    </button>
  );
};