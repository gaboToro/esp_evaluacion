'use client';

import React from 'react';
import Image from 'next/image';
import { useAdmin } from '../../hooks/useAdmin';
import { AdminDashboard } from '../../components/organisms/AdminDashboard';
import { AdminTasks } from '../../components/organisms/AdminTasks';
import { AdminUsers } from '../../components/organisms/AdminUsers';

export default function AdminPage() {
  const {
    isLoading, vistaActual, setVistaActual, evaluacionSeleccionada, setEvaluacionSeleccionada,
    notificaciones, marcarNotificacionLeida, handleLogout, ...props 
  } = useAdmin();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-2xl font-bold text-[#8B0000] animate-pulse">Cargando Panel...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 relative flex-1 w-full">
      {/* CABECERA (Template) */}
      <header className="flex flex-col xl:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm mb-6 border-l-8 border-[#8B0000] gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#8B0000] p-2 rounded-lg">
            <Image src="/logo.png" alt="Logo El Español" width={60} height={30} className="object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Panel de Administración</h1>
            <p className="text-gray-500 font-medium">Control total del local</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner overflow-x-auto">
            <button onClick={() => setVistaActual('dashboard')} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${vistaActual === 'dashboard' ? 'bg-white text-[#8B0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>📊 Dashboard</button>
            <button onClick={() => setVistaActual('tareas')} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${vistaActual === 'tareas' ? 'bg-white text-[#8B0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>📋 Tareas</button>
            <button onClick={() => setVistaActual('usuarios')} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${vistaActual === 'usuarios' ? 'bg-white text-[#8B0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>👥 Personal</button>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-[#8B0000] border border-red-200 font-bold px-6 py-2 rounded-xl hover:bg-red-100 transition-colors shadow-sm shrink-0">Cerrar Sesión</button>
        </div>
      </header>

      {/* ÁREA DE NOTIFICACIONES */}
      {notificaciones.filter((n: any) => !n.leido).map((notif: any) => (
        <div key={notif.id} className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center animate-fade-in">
          <div className="mb-2 sm:mb-0">
            <span className="text-xl mr-2">🔔</span><span className="font-bold">{notif.mensaje}</span>
            <span className="text-xs font-normal text-yellow-700 ml-2">({notif.fecha})</span>
          </div>
          <button onClick={() => marcarNotificacionLeida(notif.id)} className="text-yellow-700 hover:text-yellow-900 font-bold px-3 py-1 hover:bg-yellow-200 rounded-lg transition-colors text-sm">✕ Marcar como vista</button>
        </div>
      ))}

      {/* RENDERIZADO DINÁMICO DE ORGANISMOS */}
      {vistaActual === 'dashboard' && <AdminDashboard {...props} setEvaluacionSeleccionada={setEvaluacionSeleccionada} />}
      {vistaActual === 'tareas' && <AdminTasks {...props} />}
      {vistaActual === 'usuarios' && <AdminUsers {...props} />}
      
      {/* MODAL DETALLES */}
      {evaluacionSeleccionada && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#8B0000] p-4 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-lg">Detalles de Evaluación</h3>
              <button onClick={() => setEvaluacionSeleccionada(null)} className="text-white hover:text-red-200 font-bold text-xl px-2">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div><p className="text-xs text-gray-500 uppercase font-bold">Evaluado</p><p className="font-extrabold text-gray-900">{evaluacionSeleccionada.evaluadoNombre}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Evaluador</p><p className="font-bold text-gray-700">{evaluacionSeleccionada.evaluadorNombre}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Área</p><p className="font-bold text-[#8B0000]">{evaluacionSeleccionada.areaEvaluada}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Puntaje</p><p className={`font-extrabold ${evaluacionSeleccionada.puntajeTotal >= 80 ? 'text-green-600' : 'text-red-600'}`}>{evaluacionSeleccionada.puntajeTotal} / 100</p></div>
              </div>
              <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Checklist de Tareas:</h4>
              <div className="space-y-2 mb-6">
                {evaluacionSeleccionada.detalles?.map((detalle: any, index: number) => (
                  <div key={index} className={`flex justify-between items-start p-3 rounded-lg border-l-4 ${detalle.cumplio ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                    <span className={`text-sm font-medium ${!detalle.cumplio ? 'text-red-700 font-extrabold' : 'text-gray-700'}`}>{detalle.descripcion}</span>
                    <span className="shrink-0 ml-4">{detalle.cumplio ? '✅ Cumplió' : '❌ Faltó'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}