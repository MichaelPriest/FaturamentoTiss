import { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';

const initialForm = {
  titulo: '',
  descricao: '',
  categoria: 'suporte',
  prioridade: 'normal',
  status: 'aberto'
};

const statusConfig = {
  aberto: { label: 'Aberto', icon: ExclamationTriangleIcon, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  em_andamento: { label: 'Em andamento', icon: ClockIcon, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolvido: { label: 'Resolvido', icon: CheckCircleIcon, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
};

export default function Chamados() {
  const { user } = useAuth();
  const { unidadeAtualId } = useUnidade();
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [formData, setFormData] = useState(initialForm);

  const carregarChamados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChamados(filterByUnidade(data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      toast.error('Erro ao carregar chamados. Verifique se a migration de chamados foi executada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarChamados();
  }, [unidadeAtualId]);

  const chamadosFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return chamados;
    return chamados.filter((chamado) => chamado.status === filtroStatus);
  }, [chamados, filtroStatus]);

  const resumo = useMemo(() => ({
    total: chamados.length,
    abertos: chamados.filter((chamado) => chamado.status === 'aberto').length,
    andamento: chamados.filter((chamado) => chamado.status === 'em_andamento').length,
    resolvidos: chamados.filter((chamado) => chamado.status === 'resolvido').length
  }), [chamados]);

  const abrirNovo = () => {
    setEditing(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const abrirEditar = (chamado) => {
    setEditing(chamado);
    setFormData({
      titulo: chamado.titulo || '',
      descricao: chamado.descricao || '',
      categoria: chamado.categoria || 'suporte',
      prioridade: chamado.prioridade || 'normal',
      status: chamado.status || 'aberto'
    });
    setShowModal(true);
  };

  const salvarChamado = async (event) => {
    event.preventDefault();
    if (!formData.titulo.trim()) {
      toast.error('Título do chamado é obrigatório');
      return;
    }

    const payload = applyUnidadeToPayload({
      ...formData,
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim(),
      solicitante_id: user?.id || null,
      solicitante_nome: user?.nome || user?.email || 'Usuário',
      updated_at: new Date().toISOString()
    }, unidadeAtualId);

    try {
      const { error } = editing
        ? await supabase.from('chamados').update(payload).eq('id', editing.id)
        : await supabase.from('chamados').insert([{ ...payload, created_at: new Date().toISOString() }]);

      if (error) throw error;
      toast.success(editing ? 'Chamado atualizado!' : 'Chamado aberto!');
      setShowModal(false);
      setEditing(null);
      await carregarChamados();
    } catch (error) {
      console.error('Erro ao salvar chamado:', error);
      toast.error('Erro ao salvar chamado');
    }
  };

  const atualizarStatus = async (chamado, status) => {
    try {
      const updates = { status, updated_at: new Date().toISOString() };
      if (status === 'resolvido') updates.resolvido_em = new Date().toISOString();
      const { error } = await supabase.from('chamados').update(updates).eq('id', chamado.id);
      if (error) throw error;
      toast.success('Status atualizado');
      await carregarChamados();
    } catch (error) {
      console.error('Erro ao atualizar chamado:', error);
      toast.error('Erro ao atualizar chamado');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Painel de Chamados</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Abra, acompanhe e resolva solicitações internas por unidade</p>
          </div>
          <button onClick={abrirNovo} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 shadow-lg"><PlusIcon className="w-4 h-4" /> Novo Chamado</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold dark:text-white">{resumo.total}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500">Abertos</p><p className="text-2xl font-bold text-red-600">{resumo.abertos}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500">Em andamento</p><p className="text-2xl font-bold text-yellow-600">{resumo.andamento}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500">Resolvidos</p><p className="text-2xl font-bold text-green-600">{resumo.resolvidos}</p></div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
            <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white">
              <option value="todos">Todos</option><option value="aberto">Abertos</option><option value="em_andamento">Em andamento</option><option value="resolvido">Resolvidos</option>
            </select>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {chamadosFiltrados.map((chamado) => {
              const StatusIcon = statusConfig[chamado.status]?.icon || ExclamationTriangleIcon;
              return (
                <div key={chamado.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{chamado.titulo}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${statusConfig[chamado.status]?.className || statusConfig.aberto.className}`}><StatusIcon className="w-3 h-3" />{statusConfig[chamado.status]?.label || chamado.status}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">{chamado.prioridade}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{chamado.descricao || 'Sem descrição'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Solicitante: {chamado.solicitante_nome || 'Não informado'} • {chamado.created_at ? new Date(chamado.created_at).toLocaleString('pt-BR') : ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => abrirEditar(chamado)} className="px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300">Editar</button>
                      {chamado.status !== 'em_andamento' && <button onClick={() => atualizarStatus(chamado, 'em_andamento')} className="px-3 py-1.5 rounded-lg text-sm bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300">Iniciar</button>}
                      {chamado.status !== 'resolvido' && <button onClick={() => atualizarStatus(chamado, 'resolvido')} className="px-3 py-1.5 rounded-lg text-sm bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300">Resolver</button>}
                    </div>
                  </div>
                </div>
              );
            })}
            {chamadosFiltrados.length === 0 && <div className="p-10 text-center text-gray-500 dark:text-gray-400">Nenhum chamado encontrado.</div>}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={salvarChamado} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"><h3 className="text-lg font-semibold dark:text-white">{editing ? 'Editar Chamado' : 'Novo Chamado'}</h3><button type="button" onClick={() => setShowModal(false)}><XMarkIcon className="w-5 h-5 text-gray-500" /></button></div>
            <div className="p-5 space-y-4">
              <input value={formData.titulo} onChange={(event) => setFormData({ ...formData, titulo: event.target.value })} placeholder="Título" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" required />
              <textarea value={formData.descricao} onChange={(event) => setFormData({ ...formData, descricao: event.target.value })} placeholder="Descrição" rows="4" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={formData.categoria} onChange={(event) => setFormData({ ...formData, categoria: event.target.value })} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"><option value="suporte">Suporte</option><option value="manutencao">Manutenção</option><option value="financeiro">Financeiro</option><option value="operacional">Operacional</option></select>
                <select value={formData.prioridade} onChange={(event) => setFormData({ ...formData, prioridade: event.target.value })} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select>
                <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"><option value="aberto">Aberto</option><option value="em_andamento">Em andamento</option><option value="resolvido">Resolvido</option></select>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200">Cancelar</button><button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Salvar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
