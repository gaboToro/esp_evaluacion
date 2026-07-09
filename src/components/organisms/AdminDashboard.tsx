import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#16a34a', '#dc2626'];

export const AdminDashboard = ({ 
  statsRachas, promedioAreas, datosParaTabla, filtroUsuario, setFiltroUsuario, 
  usuariosUnicos, filtroArea, setFiltroArea, ordenFecha, setOrdenFecha, setEvaluacionSeleccionada 
}: any) => {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-end mb-6">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <span className="font-bold text-gray-700">Vista del Panel:</span>
          <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className="bg-gray-50 border-2 border-[#8B0000] text-gray-800 font-bold py-1 px-3 rounded-lg focus:outline-none">
            <option value="General">🏢 Resumen General (Todos)</option>
            {usuariosUnicos.map((user: string, idx: number) => (<option key={idx} value={user}>👤 {user}</option>))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">Termómetro de Rachas</h2>
          <div className="h-64 w-full"><ResponsiveContainer><PieChart><Pie data={statsRachas} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{statsRachas.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">Rendimiento Promedio por Área</h2>
          <div className="h-64 w-full"><ResponsiveContainer><BarChart data={promedioAreas}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="area" /><YAxis domain={[0, 100]} /><RechartsTooltip cursor={{fill: 'transparent'}} /><Bar dataKey="promedio" fill="#8B0000" radius={[2, 2, 2, 2]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">Registro de Auditoría</h2>
          <div className="flex gap-4">
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="bg-gray-50 border border-gray-300 py-1 px-3 rounded-lg text-sm font-medium"><option value="Todas">Todas las Áreas</option><option value="Caja">Caja</option><option value="Mesas">Mesas</option><option value="Elaboración">Elaboración</option></select>
            <select value={ordenFecha} onChange={(e) => setOrdenFecha(e.target.value)} className="bg-gray-50 border border-gray-300 py-1 px-3 rounded-lg text-sm font-medium"><option value="desc">Más recientes primero</option><option value="asc">Más antiguos primero</option></select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-gray-50 text-gray-600 border-b-2 border-gray-200"><th className="p-4 font-bold">Fecha</th><th className="p-4 font-bold text-[#8B0000]">Evaluado</th><th className="p-4 font-bold">Área</th><th className="p-4 font-bold">Puntaje</th><th className="p-4 font-bold text-right">Evaluador</th><th className="p-4 font-bold text-center">Acciones</th></tr></thead>
            <tbody>{datosParaTabla.map((e: any) => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{e.fecha}</td>
                <td className="p-4 font-extrabold text-gray-900">{e.evaluadoNombre}</td>
                <td className="p-4 font-medium text-gray-700">{e.areaEvaluada}</td>
                <td className="p-4 font-extrabold text-gray-800">{e.puntajeTotal}/100</td>
                <td className="p-4 text-sm text-gray-500 text-right">{e.evaluadorNombre}</td>
                <td className="p-4 text-center"><button onClick={() => setEvaluacionSeleccionada(e)} className="bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-lg hover:bg-[#8B0000] hover:text-white transition-colors">👁️ Ver</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};