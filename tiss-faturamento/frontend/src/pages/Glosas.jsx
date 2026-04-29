import { useState, useEffect } from 'react';
import { EyeIcon, CheckCircleIcon, XCircleIcon, ClockIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function Glosas() {
  const [glosas, setGlosas] = useState([]);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    const stored = localStorage.getItem('glosas');
    if (stored) {
      setGlosas(JSON.parse(stored));
    } else {
      const exemplos = [
        { id: 1, numero_guia: 'GUI-001', paciente: 'João Silva', data: '2024-01-15', valor: 150.00, motivo: 'Procedimento não autorizado', status: 'aberta' },
        { id: 2, numero_guia: 'GUI-002', paciente: 'Maria Santos', data: '2024-01-20', valor: 200.00, motivo: 'Documentação incompleta', status: 'recurso_enviado' },
      ];
      setGlosas(exemplos);
      localStorage.setItem('glosas', JSON.stringify(exemplos));
    }
  }, []);

  const handleRecurso = (id) => {
    const atualizadas = glosas.map(g => g.id === id ? { ...g, status: 'recurso_enviado', data_recurso: new Date().toISOString().split('T')[0] } : g);
    setGlosas(atualizadas);
    localStorage.setItem('glosas', JSON.stringify(atualizadas));
    toast.success('Recurso enviado com sucesso!');
  };

  const filtered = glosas.filter(g => filtro === 'todas' ? true : g.status === filtro);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Glosas e Recursos</h2>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFiltro('todas')} className={`px-3 py-1 rounded-lg text-xs ${filtro === 'todas' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Todas</button>
        <button onClick={() => setFiltro('aberta')} className={`px-3 py-1 rounded-lg text-xs ${filtro === 'aberta' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Abertas</button>
        <button onClick={() => setFiltro('recurso_enviado')} className={`px-3 py-1 rounded-lg text-xs ${filtro === 'recurso_enviado' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Recurso Enviado</button>
        <button onClick={() => setFiltro('acatada')} className={`px-3 py-1 rounded-lg text-xs ${filtro === 'acatada' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Acatadas</button>
        <button onClick={() => setFiltro('negada')} className={`px-3 py-1 rounded-lg text-xs ${filtro === 'negada' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Negadas</button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Guia</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Paciente</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Data</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Valor</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Motivo</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Status</th>
              <th className="px-4 py-2 text-center text-xs text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-xs font-mono">{g.numero_guia}</td>
                <td className="px-4 py-2 text-xs">{g.paciente}</td>
                <td className="px-4 py-2 text-xs">{g.data}</td>
                <td className="px-4 py-2 text-xs">R$ {g.valor.toFixed(2)}</td>
                <td className="px-4 py-2 text-xs">{g.motivo}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    g.status === 'aberta' ? 'bg-yellow-100 text-yellow-700' :
                    g.status === 'recurso_enviado' ? 'bg-blue-100 text-blue-700' :
                    g.status === 'acatada' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {g.status === 'aberta' ? 'Aberta' : g.status === 'recurso_enviado' ? 'Recurso Enviado' : g.status === 'acatada' ? 'Acatada' : 'Negada'}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  {g.status === 'aberta' && (
                    <button onClick={() => handleRecurso(g.id)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Enviar Recurso</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}