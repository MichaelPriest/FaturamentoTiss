import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function Procedimentos() {
  const [procedimentos, setProcedimentos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aba, setAba] = useState('tuss'); // tuss, cbhpm, propria
  const [formData, setFormData] = useState({
    codigo_tuss: '',
    nome: '',
    tipo: 'CONSULTA',
    grupo: '',
    valor_sugerido: '',
    pontos_cbhpm: '',
    ch_base: '',
    tabela: 'TUSS'
  });

  useEffect(() => {
    carregarProcedimentos();
  }, []);

  const carregarProcedimentos = () => {
    const stored = localStorage.getItem('procedimentos');
    if (stored) {
      setProcedimentos(JSON.parse(stored));
    } else {
      const defaults = [
        { id: 1, codigo_tuss: '01010101', nome: 'Consulta médica em consultório', tipo: 'CONSULTA', grupo: 'CONSULTAS', valor_sugerido: 150, tabela: 'TUSS' },
        { id: 2, codigo_tuss: '01010202', nome: 'Consulta de retorno', tipo: 'CONSULTA', grupo: 'CONSULTAS', valor_sugerido: 100, tabela: 'TUSS' },
        { id: 3, codigo_tuss: '02010101', nome: 'Hemograma completo', tipo: 'EXAME', grupo: 'HEMATOLOGIA', valor_sugerido: 80, tabela: 'TUSS' },
        { id: 4, codigo_tuss: '03010101', nome: 'Ultrassonografia abdominal', tipo: 'EXAME', grupo: 'ULTRASSONOGRAFIA', valor_sugerido: 200, tabela: 'TUSS' },
        { id: 5, codigo_tuss: '04010101', nome: 'Eletrocardiograma', tipo: 'EXAME', grupo: 'CARDIOLOGIA', valor_sugerido: 90, tabela: 'TUSS' },
      ];
      setProcedimentos(defaults);
      localStorage.setItem('procedimentos', JSON.stringify(defaults));
    }
  };

  const salvar = (lista) => {
    localStorage.setItem('procedimentos', JSON.stringify(lista));
    setProcedimentos(lista);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.codigo_tuss || !formData.nome) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    if (editing) {
      salvar(procedimentos.map(p => p.id === editing.id ? { ...formData, id: p.id, valor_sugerido: parseFloat(formData.valor_sugerido) || 0 } : p));
      toast.success('Procedimento atualizado!');
    } else {
      salvar([...procedimentos, { ...formData, id: Date.now(), valor_sugerido: parseFloat(formData.valor_sugerido) || 0 }]);
      toast.success('Procedimento cadastrado!');
    }

    setShowModal(false);
    setEditing(null);
    setFormData({ codigo_tuss: '', nome: '', tipo: 'CONSULTA', grupo: '', valor_sugerido: '', pontos_cbhpm: '', ch_base: '', tabela: 'TUSS' });
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este procedimento?')) {
      salvar(procedimentos.filter(p => p.id !== id));
      toast.success('Procedimento excluído!');
    }
  };

  const handleImport = () => {
    const importarDados = [
      { codigo_tuss: '05010101', nome: 'Radiografia de tórax', tipo: 'EXAME', grupo: 'RADIOLOGIA', valor_sugerido: 120 },
      { codigo_tuss: '06010101', nome: 'Tomografia computadorizada', tipo: 'EXAME', grupo: 'TOMOGRAFIA', valor_sugerido: 350 },
    ];
    
    const novos = importarDados.filter(d => !procedimentos.some(p => p.codigo_tuss === d.codigo_tuss));
    if (novos.length > 0) {
      const comIds = novos.map((d, i) => ({ ...d, id: Date.now() + i, tabela: 'TUSS' }));
      salvar([...procedimentos, ...comIds]);
      toast.success(`${novos.length} procedimentos importados!`);
    } else {
      toast.info('Todos os procedimentos já existem');
    }
  };

  const filtered = procedimentos.filter(p => 
    (aba === 'tuss' && p.tabela === 'TUSS') ||
    (aba === 'cbhpm' && p.tabela === 'CBHPM') ||
    (aba === 'propria' && p.tabela === 'PROPRIA')
  ).filter(p => 
    p.codigo_tuss.includes(searchTerm) || 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Procedimentos</h2>
        <div className="flex gap-2">
          <button onClick={handleImport} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowUpTrayIcon className="w-4 h-4" /> Importar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <PlusIcon className="w-4 h-4" /> Novo Procedimento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button onClick={() => setAba('tuss')} className={`px-4 py-2 text-sm font-medium transition-colors ${aba === 'tuss' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          TUSS
        </button>
        <button onClick={() => setAba('cbhpm')} className={`px-4 py-2 text-sm font-medium transition-colors ${aba === 'cbhpm' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          CBHPM
        </button>
        <button onClick={() => setAba('propria')} className={`px-4 py-2 text-sm font-medium transition-colors ${aba === 'propria' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Tabela Própria
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg border p-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por código ou nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-lg px-8 py-1.5 text-sm" />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Código</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Nome</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Tipo</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Grupo</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Valor (R$)</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500 w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs font-mono text-gray-600">{p.codigo_tuss}</td>
                  <td className="px-4 py-2 text-xs text-gray-800">{p.nome}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.tipo === 'CONSULTA' ? 'bg-blue-100 text-blue-700' :
                      p.tipo === 'EXAME' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{p.grupo || '-'}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">R$ {p.valor_sugerido?.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => { setEditing(p); setFormData(p); setShowModal(true); }} className="text-blue-600 mx-1">
                      <PencilIcon className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 mx-1">
                      <TrashIcon className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="px-4 py-8 text-center text-gray-500 text-sm">Nenhum procedimento encontrado</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar' : 'Novo'} Procedimento</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <select value={formData.tabela} onChange={e => setFormData({...formData, tabela: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                  <option value="TUSS">TUSS</option>
                  <option value="CBHPM">CBHPM</option>
                  <option value="PROPRIA">Tabela Própria</option>
                </select>
                <input type="text" placeholder="Código *" value={formData.codigo_tuss} onChange={e => setFormData({...formData, codigo_tuss: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm font-mono" required />
                <input type="text" placeholder="Nome *" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
                <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                  <option value="CONSULTA">Consulta</option>
                  <option value="EXAME">Exame</option>
                  <option value="TERAPIA">Terapia</option>
                  <option value="CIRURGIA">Cirurgia</option>
                </select>
                <input type="text" placeholder="Grupo" value={formData.grupo} onChange={e => setFormData({...formData, grupo: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                <input type="number" step="0.01" placeholder="Valor R$" value={formData.valor_sugerido} onChange={e => setFormData({...formData, valor_sugerido: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}