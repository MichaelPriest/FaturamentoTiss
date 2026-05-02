import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { procedimentosService, conveniosService } from '../services/supabaseService';

export default function Procedimentos() {
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aba, setAba] = useState('tuss');
  const [formData, setFormData] = useState({
    codigo_tuss: '',
    nome: '',
    tipo: 'CONSULTA',
    grupo: '',
    valor_sugerido: '',
    valor_convenio: '',
    pontos_cbhpm: '',
    ch_base: '',
    tabela: 'TUSS'
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [conveniosData, procedimentosData] = await Promise.all([
        conveniosService.listar(),
        procedimentosService.listar()
      ]);
      
      setConvenios(conveniosData);
      setProcedimentos(procedimentosData);
      
      if (conveniosData.length > 0 && !convenioSelecionado) {
        setConvenioSelecionado(conveniosData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codigo_tuss || !formData.nome) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    const valorFinal = convenioSelecionado && formData.valor_convenio 
      ? parseFloat(formData.valor_convenio) 
      : parseFloat(formData.valor_sugerido) || 0;

    const procedimentoData = {
      codigo_tuss: formData.codigo_tuss,
      nome: formData.nome,
      tipo: formData.tipo,
      grupo: formData.grupo,
      valor_sugerido: valorFinal,
      valor_convenio: formData.valor_convenio ? parseFloat(formData.valor_convenio) : null,
      tabela: formData.tabela,
      convenio_id: convenioSelecionado?.id || null
    };

    try {
      if (editing) {
        await procedimentosService.atualizar(editing.id, procedimentoData);
        toast.success('Procedimento atualizado!');
      } else {
        await procedimentosService.criar(procedimentoData);
        toast.success('Procedimento cadastrado!');
      }
      await carregarDados();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar procedimento:', error);
      toast.error('Erro ao salvar procedimento');
    }
  };

  const resetForm = () => {
    setFormData({ 
      codigo_tuss: '', nome: '', tipo: 'CONSULTA', grupo: '', 
      valor_sugerido: '', valor_convenio: '', pontos_cbhpm: '', ch_base: '', tabela: 'TUSS' 
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este procedimento?')) {
      try {
        await procedimentosService.deletar(id);
        toast.success('Procedimento excluído!');
        await carregarDados();
      } catch (error) {
        console.error('Erro ao excluir procedimento:', error);
        toast.error('Erro ao excluir procedimento');
      }
    }
  };

  const handleImport = async () => {
    const importarDados = [
      { codigo_tuss: '05010101', nome: 'Radiografia de tórax', tipo: 'EXAME', grupo: 'RADIOLOGIA', valor_sugerido: 120 },
      { codigo_tuss: '06010101', nome: 'Tomografia computadorizada', tipo: 'EXAME', grupo: 'TOMOGRAFIA', valor_sugerido: 350 },
      { codigo_tuss: '07010101', nome: 'Ressonância magnética', tipo: 'EXAME', grupo: 'RESSONÂNCIA', valor_sugerido: 500 },
      { codigo_tuss: '08010101', nome: 'Eletroneuromiografia', tipo: 'EXAME', grupo: 'NEUROLOGIA', valor_sugerido: 250 },
      { codigo_tuss: '09010101', nome: 'Ecocardiograma', tipo: 'EXAME', grupo: 'CARDIOLOGIA', valor_sugerido: 180 },
    ];
    
    const novos = importarDados.filter(d => !procedimentos.some(p => p.codigo_tuss === d.codigo_tuss));
    if (novos.length > 0) {
      for (const novo of novos) {
        await procedimentosService.criar({
          ...novo,
          tabela: 'TUSS',
          convenio_id: convenioSelecionado?.id || null
        });
      }
      await carregarDados();
      toast.success(`${novos.length} procedimentos importados!`);
    } else {
      toast.info('Todos os procedimentos já existem');
    }
  };

  const filtered = procedimentos.filter(p => {
    if (convenioSelecionado && p.convenio_id && p.convenio_id !== convenioSelecionado.id) {
      return false;
    }
    if (!convenioSelecionado && p.convenio_id) {
      return false;
    }
    
    if (aba === 'tuss' && p.tabela !== 'TUSS') return false;
    if (aba === 'cbhpm' && p.tabela !== 'CBHPM') return false;
    if (aba === 'propria' && p.tabela !== 'PROPRIA') return false;
    
    return p.codigo_tuss?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.nome?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getValorExibicao = (procedimento) => {
    if (procedimento.valor_convenio && procedimento.valor_convenio > 0) {
      return procedimento.valor_convenio;
    }
    return procedimento.valor_sugerido || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando procedimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Procedimentos
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cadastro de procedimentos TUSS, CBHPM e tabelas próprias
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImport} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-200">
            <ArrowUpTrayIcon className="w-4 h-4" /> Importar
          </button>
          <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg">
            <PlusIcon className="w-4 h-4" /> Novo Procedimento
          </button>
        </div>
      </div>

      {/* Seleção de Convênio */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <BuildingOfficeIcon className="w-4 h-4" />
          Convênio / Tabela
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setConvenioSelecionado(null)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${!convenioSelecionado ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
            Tabela Padrão
          </button>
          {convenios.filter(c => c.ativo).map(c => (
            <button key={c.id} onClick={() => setConvenioSelecionado(c)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${convenioSelecionado?.id === c.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
              {c.razao_social}
            </button>
          ))}
        </div>
        {convenioSelecionado && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
            ✏️ Editando valores específicos para o convênio: {convenioSelecionado.razao_social}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button onClick={() => setAba('tuss')} className={`px-4 py-2 text-sm font-medium transition-all ${aba === 'tuss' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>TUSS</button>
        <button onClick={() => setAba('cbhpm')} className={`px-4 py-2 text-sm font-medium transition-all ${aba === 'cbhpm' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>CBHPM</button>
        <button onClick={() => setAba('propria')} className={`px-4 py-2 text-sm font-medium transition-all ${aba === 'propria' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Tabela Própria</button>
      </div>

      {/* Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por código ou nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-0 bg-transparent rounded-lg px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Valor Padrão</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Valor Convênio</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.codigo_tuss}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{p.nome}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${p.tipo === 'CONSULTA' ? 'bg-blue-100 text-blue-700' : p.tipo === 'EXAME' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{p.tipo}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.grupo || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">R$ {(p.valor_sugerido || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{p.valor_convenio ? <span className="font-semibold text-green-600">R$ {p.valor_convenio.toFixed(2)}</span> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => { setEditing(p); setFormData({...p, valor_convenio: p.valor_convenio || '', valor_sugerido: p.valor_sugerido || ''}); setShowModal(true); }} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50"><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-5 border-b">
              <h3 className="text-xl font-semibold">{editing ? 'Editar Procedimento' : 'Novo Procedimento'}</h3>
            </div>
            <div className="p-5">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <select value={formData.tabela} onChange={e => setFormData({...formData, tabela: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="TUSS">TUSS</option><option value="CBHPM">CBHPM</option><option value="PROPRIA">Tabela Própria</option></select>
                  <input type="text" placeholder="Código *" value={formData.codigo_tuss} onChange={e => setFormData({...formData, codigo_tuss: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" required />
                  <input type="text" placeholder="Nome *" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="CONSULTA">Consulta</option><option value="EXAME">Exame</option><option value="TERAPIA">Terapia</option><option value="CIRURGIA">Cirurgia</option></select>
                  <input type="text" placeholder="Grupo" value={formData.grupo} onChange={e => setFormData({...formData, grupo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  
                  {!convenioSelecionado ? (
                    <input type="number" step="0.01" placeholder="Valor Padrão (R$)" value={formData.valor_sugerido} onChange={e => setFormData({...formData, valor_sugerido: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  ) : (
                    <>
                      <input type="number" step="0.01" placeholder={`Valor para ${convenioSelecionado.razao_social} (R$)`} value={formData.valor_convenio} onChange={e => setFormData({...formData, valor_convenio: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                      {formData.valor_sugerido && <p className="text-xs text-gray-500">Valor padrão: R$ {parseFloat(formData.valor_sugerido).toFixed(2)}</p>}
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg">{editing ? 'Atualizar' : 'Salvar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
