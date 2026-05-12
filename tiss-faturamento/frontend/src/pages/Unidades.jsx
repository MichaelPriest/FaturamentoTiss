import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { unidadesService } from '../services/unidadesService';
import { useUnidade } from '../contexts/UnidadeContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { supabase } from '../lib/supabaseClient';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const initialForm = {
  nome: '',
  codigo: '',
  cnpj: '',
  cnes: '',
  responsavel: '',
  telefone: '',
  email: '',
  endereco: '',
  cidade: '',
  uf: 'SP',
  observacao: '',
  ativo: true
};

export default function Unidades() {
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [sessionChecked, setSessionChecked] = useState(false);
  const { recarregarUnidades } = useUnidade();
  const { createNotification } = useNotifications();

  const resumo = useMemo(() => ({
    total: unidades.length,
    ativas: unidades.filter((unidade) => unidade.ativo !== false).length,
    inativas: unidades.filter((unidade) => unidade.ativo === false).length,
    comCnes: unidades.filter((unidade) => unidade.cnes).length
  }), [unidades]);

  // Verificar autenticação ao carregar a página
  const verificarAutenticacao = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        toast.error('Erro de autenticação. Faça login novamente.');
        navigate('/login');
        return false;
      }
      
      if (!session) {
        console.log('Usuário não autenticado');
        toast.error('Você precisa estar logado para acessar esta página.');
        navigate('/login');
        return false;
      }
      
      console.log('Usuário autenticado:', session.user.email);
      return true;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      toast.error('Erro ao verificar autenticação');
      navigate('/login');
      return false;
    }
  };

  const carregarUnidades = async () => {
    setLoading(true);
    try {
      const data = await unidadesService.listar();
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      
      // Tratar diferentes tipos de erro
      if (error.message?.includes('autenticado') || 
          error.message?.includes('login') ||
          error.message?.includes('401') ||
          error.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
      } else if (error.message?.includes('Supabase não configurado')) {
        toast.error('Erro de configuração do sistema. Contate o administrador.');
      } else {
        toast.error('Erro ao carregar unidades: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Verificar autenticação e carregar dados
  useEffect(() => {
    const inicializar = async () => {
      const autenticado = await verificarAutenticacao();
      if (autenticado) {
        await carregarUnidades();
      }
      setSessionChecked(true);
    };
    
    inicializar();
  }, []);

  // Escutar mudanças na autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        toast.info('Sessão encerrada. Faça login novamente.');
        navigate('/login');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('Usuário logado:', session.user.email);
        carregarUnidades();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token renovado com sucesso');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const resetForm = () => {
    setEditing(null);
    setFormData(initialForm);
  };

  const abrirNovaUnidade = () => {
    resetForm();
    setShowModal(true);
  };

  const abrirEdicao = (unidade) => {
    setEditing(unidade);
    setFormData({
      nome: unidade.nome || '',
      codigo: unidade.codigo || '',
      cnpj: unidade.cnpj || '',
      cnes: unidade.cnes || '',
      responsavel: unidade.responsavel || '',
      telefone: unidade.telefone || '',
      email: unidade.email || '',
      endereco: unidade.endereco || '',
      cidade: unidade.cidade || '',
      uf: unidade.uf || 'SP',
      observacao: unidade.observacao || '',
      ativo: unidade.ativo !== false
    });
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    resetForm();
  };

  const salvarUnidade = async (event) => {
    event.preventDefault();

    if (!formData.nome.trim()) {
      toast.error('Nome da unidade é obrigatório');
      return;
    }

    const unidade = {
      nome: formData.nome.trim(),
      codigo: formData.codigo.trim() || null,
      cnpj: formData.cnpj.trim() || null,
      cnes: formData.cnes.trim() || null,
      responsavel: formData.responsavel.trim() || null,
      telefone: formData.telefone.trim() || null,
      email: formData.email.trim() || null,
      endereco: formData.endereco.trim() || null,
      cidade: formData.cidade.trim() || null,
      uf: formData.uf,
      observacao: formData.observacao.trim() || null,
      ativo: formData.ativo,
      updated_at: new Date().toISOString()
    };

    setSaving(true);
    try {
      if (editing) {
        await unidadesService.atualizar(editing.id, unidade);
        await createNotification({
          titulo: 'Unidade atualizada',
          mensagem: `A unidade ${unidade.nome} foi atualizada.`,
          tipo: 'success',
          categoria: 'cadastro',
          unidade_id: editing.id
        }, { silent: true });
        toast.success('Unidade atualizada com sucesso!');
      } else {
        const novaUnidade = await unidadesService.criar(unidade);
        await createNotification({
          titulo: 'Nova unidade criada',
          mensagem: `A unidade ${novaUnidade.nome || unidade.nome} foi cadastrada.`,
          tipo: 'success',
          categoria: 'cadastro',
          unidade_id: novaUnidade.id
        }, { silent: true });
        toast.success('Unidade criada com sucesso!');
      }

      fecharModal();
      await carregarUnidades();
      await recarregarUnidades();
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      
      if (error.message?.includes('autenticado') || error.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
      } else {
        toast.error('Erro ao salvar unidade: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setSaving(false);
    }
  };

  const alternarStatus = async (unidade) => {
    try {
      await unidadesService.alternarStatus(unidade);
      await createNotification({
        titulo: `Unidade ${unidade.ativo === false ? 'ativada' : 'desativada'}`,
        mensagem: `A unidade ${unidade.nome} teve seu status alterado.`,
        tipo: 'info',
        categoria: 'cadastro',
        unidade_id: unidade.id
      }, { silent: true });
      toast.success(`Unidade ${unidade.ativo === false ? 'ativada' : 'desativada'} com sucesso!`);
      await carregarUnidades();
      await recarregarUnidades();
    } catch (error) {
      console.error('Erro ao alterar status da unidade:', error);
      
      if (error.message?.includes('autenticado') || error.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
      } else {
        toast.error('Erro ao alterar status da unidade');
      }
    }
  };

  const excluirUnidade = async (unidade) => {
    if (!confirm(`Tem certeza que deseja excluir a unidade ${unidade.nome}?`)) return;

    try {
      await unidadesService.deletar(unidade.id);
      await createNotification({
        titulo: 'Unidade excluída',
        mensagem: `A unidade ${unidade.nome} foi removida.`,
        tipo: 'warning',
        categoria: 'cadastro'
      }, { silent: true });
      toast.success('Unidade excluída com sucesso!');
      await carregarUnidades();
      await recarregarUnidades();
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      
      if (error.message?.includes('autenticado') || error.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
      } else {
        toast.error('Erro ao excluir unidade');
      }
    }
  };

  if (loading || !sessionChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Unidades
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Cadastre filiais, clínicas e unidades de atendimento
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={carregarUnidades}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              title="Recarregar"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Recarregar
            </button>
            <button
              onClick={abrirNovaUnidade}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <PlusIcon className="w-4 h-4" />
              Nova Unidade
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: resumo.total, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Ativas', value: resumo.ativas, color: 'text-green-600 dark:text-green-400' },
            { label: 'Inativas', value: resumo.inativas, color: 'text-red-600 dark:text-red-400' },
            { label: 'Com CNES', value: resumo.comCnes, color: 'text-purple-600 dark:text-purple-400' }
          ].map((card) => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-2">
              <BuildingOffice2Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-800 dark:text-white">Unidades cadastradas</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CNES/CNPJ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Localização</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contato</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {unidades.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <BuildingOffice2Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      Nenhuma unidade cadastrada
                     </td>
                  </tr>
                ) : (
                  unidades.map((unidade) => (
                    <tr key={unidade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{unidade.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{unidade.codigo || 'Sem código'}</p>
                       </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <p>CNES: {unidade.cnes || '-'}</p>
                        <p className="text-xs">CNPJ: {unidade.cnpj || '-'}</p>
                       </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="w-4 h-4 mt-0.5 text-gray-400" />
                          <span>{[unidade.cidade, unidade.uf].filter(Boolean).join(' / ') || unidade.endereco || '-'}</span>
                        </div>
                       </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <p>{unidade.responsavel || '-'}</p>
                        <p className="text-xs">{unidade.telefone || unidade.email || ''}</p>
                       </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => alternarStatus(unidade)}
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            unidade.ativo !== false
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {unidade.ativo !== false ? 'Ativa' : 'Inativa'}
                        </button>
                       </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => abrirEdicao(unidade)}
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => excluirUnidade(unidade)}
                            className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={salvarUnidade} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {editing ? 'Editar Unidade' : 'Nova Unidade'}
                </h3>
                <button type="button" onClick={fecharModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da unidade *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código interno</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNES</label>
                  <input
                    type="text"
                    value={formData.cnes}
                    onChange={(e) => setFormData({ ...formData, cnes: e.target.value })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    placeholder="0000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                  <input type="text" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                  <input type="text" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                  <input type="text" value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                  <input type="text" value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                  <select value={formData.uf} onChange={(e) => setFormData({ ...formData, uf: e.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  rows="3"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Unidade ativa
              </label>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-5 rounded-b-2xl flex justify-end gap-3">
              <button type="button" onClick={fecharModal} className="px-4 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg flex items-center gap-2 disabled:opacity-70">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Salvar Unidade
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
