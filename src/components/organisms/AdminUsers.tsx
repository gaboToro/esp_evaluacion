import React from 'react';

export const AdminUsers = ({ 
  listaUsuariosBD, nuevoUsNombre, setNuevoUsNombre, nuevoUsCedula, setNuevoUsCedula, 
  nuevoUsRol, setNuevoUsRol, isCargandoUsuario, handleAgregarUsuario, handleToggleEstadoUsuario 
}: any) => {
  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-1 h-fit border-t-4 border-[#8B0000]">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Autorizar Trabajador</h2>
        <form onSubmit={handleAgregarUsuario} className="flex flex-col gap-4">
          <div><label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label><input type="text" value={nuevoUsNombre} onChange={(e) => setNuevoUsNombre(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] focus:outline-none font-medium" required /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1">Cédula</label><input type="number" value={nuevoUsCedula} onChange={(e) => setNuevoUsCedula(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] focus:outline-none font-medium" required /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1">Rol</label><select value={nuevoUsRol} onChange={(e) => setNuevoUsRol(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-[#8B0000] focus:outline-none font-medium"><option value="Operario">Operario</option><option value="Admin">Administrador</option></select></div>
          <button type="submit" disabled={isCargandoUsuario} className="w-full bg-[#8B0000] text-white font-bold py-3 mt-2 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">{isCargandoUsuario ? 'Registrando...' : '✓ Autorizar Usuario'}</button>
        </form>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-2">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Nómina Registrada</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-gray-50 text-gray-600 border-b-2 border-gray-200"><th className="p-4 font-bold">Colaborador</th><th className="p-4 font-bold">Cédula</th><th className="p-4 font-bold">Rol</th><th className="p-4 font-bold">Estado</th><th className="p-4 font-bold text-right">Acciones</th></tr></thead>
            <tbody>
              {listaUsuariosBD.map((usuario: any) => (
                <tr key={usuario.id} className={`border-b hover:bg-gray-50 transition-colors ${usuario.estado === 'Inactivo' ? 'opacity-50' : ''}`}>
                  <td className="p-4 font-bold text-gray-900">{usuario.name}</td>
                  <td className="p-4 font-medium text-gray-600">{usuario.id}</td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${usuario.rol === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{usuario.rol}</span></td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${usuario.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{usuario.estado}</span></td>
                  <td className="p-4 text-right">
                    {usuario.rol !== 'Admin' ? (
                      <button onClick={() => handleToggleEstadoUsuario(usuario)} className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${usuario.estado === 'Activo' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>{usuario.estado === 'Activo' ? '🚫 Desactivar' : '✅ Reactivar'}</button>
                    ) : (<span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-2 rounded-lg cursor-not-allowed">🛡️ Intocable</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};