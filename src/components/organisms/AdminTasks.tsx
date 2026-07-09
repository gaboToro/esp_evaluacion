import React from 'react';

export const AdminTasks = ({ 
  listaTareas, nuevaTareaDesc, setNuevaTareaDesc, nuevaTareaArea, setNuevaTareaArea, 
  isCargandoTarea, handleAgregarTarea, handleToggleEstadoTarea, handleEliminarDefinitivoTarea 
}: any) => {
  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-1 h-fit border-t-4 border-[#8B0000]">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Añadir Nueva Tarea</h2>
        <form onSubmit={handleAgregarTarea} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Área Operativa</label>
            <select value={nuevaTareaArea} onChange={(e) => setNuevaTareaArea(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] font-medium"><option value="Caja">Caja</option><option value="Mesas">Mesas</option><option value="Elaboración">Elaboración</option></select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
            <textarea value={nuevaTareaDesc} onChange={(e) => setNuevaTareaDesc(e.target.value)} placeholder="Ej: Revisar stock..." className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] font-medium" rows={3} required />
          </div>
          <button type="submit" disabled={isCargandoTarea} className="w-full bg-[#8B0000] text-white font-bold py-3 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">{isCargandoTarea ? 'Guardando...' : '+ Guardar Tarea'}</button>
        </form>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-2">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Catálogo de Tareas</h2>
        {['Caja', 'Mesas', 'Elaboración'].map((area) => (
          <div key={area} className="mb-8 last:mb-0">
            <h3 className="text-lg font-extrabold text-[#8B0000] mb-3 bg-red-50 p-2 rounded-lg">Área: {area}</h3>
            <div className="space-y-3">
              {listaTareas.filter((t: any) => t.area === area).map((tarea: any) => (
                <div key={tarea.id} className={`flex justify-between items-center bg-gray-50 border p-3 rounded-xl ${tarea.estado === 'Inactivo' ? 'opacity-60 grayscale' : ''}`}>
                  <div className="flex flex-col">
                    <p className={`font-medium text-sm ${tarea.estado === 'Inactivo' ? 'line-through text-gray-500' : 'text-gray-700'}`}>{tarea.descripcion}</p>
                    <span className={`text-xs font-bold w-fit px-2 py-0.5 mt-1 rounded-full ${tarea.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{tarea.estado}</span>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <button onClick={() => handleToggleEstadoTarea(tarea)} className="p-2 rounded-lg font-bold text-xs">{tarea.estado === 'Activo' ? '⏸️ Pausar' : '▶️ Activar'}</button>
                    <button onClick={() => handleEliminarDefinitivoTarea(tarea.id)} className="text-red-500 p-2 rounded-lg font-bold text-xs">🗑️ Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};