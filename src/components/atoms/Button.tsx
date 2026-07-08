import React from 'react';

// Definimos qué información necesita recibir nuestro botón
interface ButtonProps {
    label: string;
    variant: 'success' | 'danger' | 'primary';
    icon?: string;
    onClick: () => void;
}

export const Button = ({ label, variant, icon, onClick }: ButtonProps) => {
    // Estilos base de Tailwind: Botón grande, texto grande y bordes redondeados
    const baseStyle = "w-full py-4 text-xl font-bold rounded-xl flex items-center justify-center gap-3 shadow-md active:scale-95 transition-all";

    // Colores según el tipo de botón
    const variants = {
        success: "bg-green-600 text-white hover:bg-green-700",
        danger: "bg-red-600 text-white hover:bg-red-700",
        primary: "bg-blue-600 text-white hover:bg-blue-700"
    };

    return (
        <button className={`${baseStyle} ${variants[variant]}`} onClick={onClick}>
            {icon && <span className="text-2xl">{icon}</span>}
            {label}
        </button>
    );
};