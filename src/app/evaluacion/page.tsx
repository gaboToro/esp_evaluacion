'use client';

import React, { useState } from 'react';
import Image from 'next/image'; // Importamos el manejador de imágenes de Next.js
import { useEvaluationStore } from '../../store/evaluationStore';
import { Button } from '../../components/atoms/Button';

export default function EvaluacionPage() {
  const { score, decreaseScore } = useEvaluationStore();
  
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const tasks = [
    "Cierre PDV: cierre de caja impreso y cuadrado",
    "Fondo contado en presencia del encargado",
    "Caja limpia y piso despejado"
  ];

  const handleCumplio = () => {
    siguientePaso();
  };

  const handleFalto = () => {
    // Puedes ajustar cuánto resta cada falta (ej: 10 puntos en lugar de 5 para que cuadre con el /100)
    decreaseScore(10); 
    siguientePaso();
  };

  const siguientePaso = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  // PANTALLA FINAL
  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border-t-8 border-[#8B0000]">
          {/* Logo en la pantalla final */}
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Logo El Español" width={80} height={80} className="object-contain" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Evaluación Terminada</h2>
          <p className="text-xl mb-2">Puntaje Final:</p>
          
          {/* Mostramos la base sobre 100 */}
          <div className={`text-6xl font-extrabold mb-6 ${score >= 80 ? 'text-green-600' : 'text-red-600'}`}>
            {score}/100
          </div>
          
          {/* Lógica intacta: >= 80 es Positiva, < 80 es Negativa */}
          <p className="text-lg font-medium text-gray-600 mb-8">
            Racha: {score >= 80 ? '🔥 Positiva' : '📉 Negativa'}
          </p>
          <Button label="Volver al Inicio" variant="primary" onClick={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  // PANTALLA DE EVALUACIÓN
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#8B0000] text-[#FFD700] px-6 py-4 shadow-md rounded-b-3xl">
        <div className="flex justify-between items-center">
          {/* Aquí reemplazamos el texto "EL ESPAÑOL" por el Logo Oficial */}
          <div className="bg-white/10 p-1 rounded-lg">
             <Image src="/logo.png" alt="Logo El Español" width={100} height={50} className="object-contain" />
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg font-bold">
            Pts: {score}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
        <div className="mb-8">
          <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
            Tarea {currentTaskIndex + 1} de {tasks.length}
          </p>
          <h2 className="text-3xl font-bold text-gray-800 leading-snug">
            {tasks[currentTaskIndex]}
          </h2>
        </div>

        <div className="space-y-4 mt-auto mb-8">
          <Button label="SÍ CUMPLIÓ" variant="success" icon="✅" onClick={handleCumplio} />
          <Button label="FALTÓ" variant="danger" icon="❌" onClick={handleFalto} />
        </div>
      </main>
    </div>
  );
}