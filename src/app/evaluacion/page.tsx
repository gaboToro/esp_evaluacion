'use client';

import React from 'react';
import { Button } from '../../components/atoms/Button';
import { useEvaluacion } from '../../hooks/useEvaluacion';

export default function EvaluacionPage() {
  const {
    userName, userTipoRacha, userContadorRacha, colaboradores, selectedEvaluado, setSelectedEvaluado,
    selectedArea, setSelectedArea, tasks, currentTaskIndex, isFinished, isLoading, isChecking,
    rachaAlert, hasEvaluatedToday, scoreVisual, handleSelectEvaluado, handleCumplio, handleFalto, handleLogout
  } = useEvaluacion();

  if (isLoading && !selectedEvaluado && !selectedArea) {
    return (
      <div className="flex-1 bg-[#8B0000] flex items-center justify-center">
        <p className="text-xl font-bold text-[#FFD700] animate-pulse">Cargando sistema...</p>
      </div>
    );
  }

  if (hasEvaluatedToday) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border-t-8 border-[#8B0000]">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">¡Evaluación Completada!</h2>
          <p className="text-md font-medium text-gray-600 mb-6">Ya realizaste tu evaluación correspondiente al turno de hoy.</p>
          <Button label="Cerrar Sesión" variant="danger" onClick={handleLogout} />
        </div>
      </div>
    );
  }

  if (!selectedEvaluado) {
    return (
      <div className="flex-1 bg-[#8B0000] flex flex-col p-6 rounded-b-3xl shadow-xl">
        <div className="flex justify-between items-center mb-8 text-white">
          <div className="text-lg flex flex-col">
            <div><span className="font-light">Hola, </span><span className="font-extrabold">{userName}</span></div>
            <span className={`text-xs font-bold px-2 py-1 mt-2 rounded-full w-fit ${userTipoRacha === 'Positiva' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              Tu Racha: {userTipoRacha} ({userContadorRacha}/4)
            </span>
          </div>
          <button onClick={handleLogout} className="text-sm font-bold bg-white/20 px-4 py-2 rounded-full h-fit hover:bg-white/30 transition-colors">Cerrar Sesión</button>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center mx-auto mt-4">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Paso 1: El Compañero</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {isChecking ? <p className="text-[#8B0000] font-bold animate-pulse py-4">Verificando...</p> : 
              colaboradores.map((colab) => (
                <button key={colab.id} onClick={() => handleSelectEvaluado(colab)} className="w-full text-left px-6 py-4 rounded-xl border-2 hover:border-[#8B0000] font-bold text-gray-700 flex justify-between">
                  <span>{colab.name}</span><span className="text-xs font-normal text-gray-400">CI: {colab.id}</span>
                </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedArea) {
    return (
      <div className="flex-1 bg-[#8B0000] flex flex-col p-6 rounded-b-3xl shadow-xl">
        <button onClick={() => setSelectedEvaluado(null)} className="text-sm font-bold bg-white/20 px-4 py-2 rounded-full w-fit text-white mb-8 hover:bg-white/30 transition-colors">← Volver</button>
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center mx-auto mt-4">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Paso 2: El Área</h2>
          <div className="space-y-4">
            <Button label="Caja - Estrategas" variant="primary" onClick={() => setSelectedArea('Caja')} />
            <Button label="Mesas - Anfitrión" variant="primary" onClick={() => setSelectedArea('Mesas')} />
            <Button label="Elaboración - Artesanos" variant="primary" onClick={() => setSelectedArea('Elaboración')} />
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border-t-8 border-[#8B0000]">
          {rachaAlert && <div className={`p-4 mb-6 rounded-xl font-bold text-white shadow-md ${rachaAlert.includes('Excelente') ? 'bg-green-600' : 'bg-red-600'}`}>{rachaAlert}</div>}
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Evaluación Enviada</h2>
          <div className={`text-6xl font-extrabold mb-6 ${scoreVisual >= 80 ? 'text-green-600' : 'text-red-600'}`}>{scoreVisual}/100</div>
          <Button label="Volver al Inicio" variant="primary" onClick={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-[#8B0000] text-[#FFD700] px-6 py-4 shadow-md rounded-b-3xl flex justify-between items-center">
        <div className="text-white font-medium flex flex-col"><span className="text-xs text-red-200">Evaluando a:</span><span className="font-bold">{selectedEvaluado.name}</span></div>
        <div className="bg-white/20 px-4 py-2 rounded-lg font-bold">Pts: {scoreVisual}</div>
      </header>
      <main className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
        <div className="mb-8">
          <p className="text-sm font-bold text-[#8B0000] bg-red-100 inline-block px-3 py-1 rounded-full">Área: {selectedArea}</p>
          <p className="text-sm font-bold text-gray-400 mt-2">Tarea {currentTaskIndex + 1} de {tasks.length}</p>
          <h2 className="text-3xl font-bold text-gray-800 leading-snug mt-2">{tasks[currentTaskIndex]?.descripcion}</h2>
        </div>
        <div className="space-y-4 mt-auto mb-8">
          <Button label="SÍ CUMPLIÓ" variant="success" icon="✅" onClick={handleCumplio} />
          <Button label="FALTÓ (Evidencia Omitida)" variant="danger" icon="❌" onClick={handleFalto} />
        </div>
      </main>
    </div>
  );
}