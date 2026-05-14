import { useEffect, useMemo, useState } from 'react';
import { BellAlertIcon, CheckCircleIcon, ClockIcon, MegaphoneIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';

const initialForm = {
  paciente_nome: '',
  senha: '',
  destino_tipo: 'consultorio',
  destino_nome: '',
  origem_nome: 'Recepção',
  observacao: '',
  agendamento_id: ''
};

const statusConfig = {
  aguardando: { label: 'Aguardando', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  chamado: { label: 'Chamado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  em_atendimento: { label: 'Em atendimento', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  finalizado: { label: 'Finalizado', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
};

export default function Chamados() {
  const { user } = useAuth();
  const { unidadeAtualId } = useUnidade();
  const [chamados, setChamados] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('ativos');
  const [formData, setFormData] = useState(initialForm);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const [chamadosRes, agendamentosRes, salasRes] = await Promise.all([
        supabase.from('chamados').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('agendamentos').select('*').eq('data_agendamento', hoje).order('hora_inicio', { ascending: true }),
        supabase.from('salas').select('*').eq('ativo', true).order('nome')
      ]);

      if (chamadosRes.error) throw chamadosRes.error;
      if (agendamentosRes.error) throw agendamentosRes.error;
      if (salasRes.error) throw salasRes.error;

      setChamados(filterByUnidade(chamadosRes.data || [], unidadeAtualId));
      setAgendamentos(filterByUnidade(agendamentosRes.data || [], unidadeAtualId));
      setSalas(filterByUnidade(salasRes.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar painel de chamados:', error);
      toast.error('Erro ao carregar painel de chamados. Execute a migration de chamados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [unidadeAtualId]);

  useEffect(() => {
    const interval = setInterval(carregarDados, 15000);
    return () => clearInterval(interval);
  }, [unidadeAtualId]);

  const chamadosFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return chamados;
    if (filtroStatus === 'ativos') return chamados.filter((chamado) => !['finalizado', 'cancelado'].includes(chamado.status));
    return chamados.filter((chamado) => chamado.status === filtroStatus);
  }, [chamados, filtroStatus]);

  const painelPublico = useMemo(
    () => chamados
      .filter((chamado) => ['chamado', 'em_atendimento'].includes(chamado.status))
      .slice(0, 6),
    [chamados]
  );

  const resumo = useMemo(() => ({
    aguardando: chamados.filter((chamado) => chamado.status === 'aguardando').length,
    chamados: chamados.filter((chamado) => chamado.status === 'chamado').length,
    atendimento: chamados.filter((chamado) => chamado.status === 'em_atendimento').length,
    finalizados: chamados.filter((chamado) => chamado.status === 'finalizado').length
  }), [chamados]);

  const abrirNovo = () => {
    setFormData(initialForm);
    setShowModal(true);
  };

  const selecionarAgendamento = (agendamentoId) => {
    const agendamento = agendamentos.find((item) => String(item.id) === String(agendamentoId));
    const sala = salas.find((item) => String(item.id) === String(agendamento?.sala_id));

    setFormData((prev) => ({
      ...prev,
      agendamento_id: agendamentoId,
      paciente_nome: agendamento?.paciente_nome || prev.paciente_nome,
      destino_nome: sala?.nome || agendamento?.local || prev.destino_nome,
      senha: prev.senha || (agendamento?.numero_guia_prestador ? String(agendamento.numero_guia_prestador).slice(-4) : '')
    }));
  };

  const criarChamado = async (event) => {
    event.preventDefault();
    if (!formData.paciente_nome.trim() || !formData.destino_nome.trim()) {
      toast.error('Informe paciente e destino');
      return;
    }

    const agendamento = agendamentos.find((item) => String(item.id) === String(formData.agendamento_id));
    const payload = applyUnidadeToPayload({
      titulo: `Chamar ${formData.paciente_nome.trim()}`,
      descricao: formData.observacao.trim(),
      categoria: 'chamada_paciente',
      prioridade: 'normal',
      status: 'aguardando',
      paciente_id: agendamento?.paciente_id ? String(agendamento.paciente_id) : null,
      paciente_nome: formData.paciente_nome.trim(),
      senha: formData.senha.trim() || null,
      destino_tipo: formData.destino_tipo,
      destino_nome: formData.destino_nome.trim(),
      origem_nome: formData.origem_nome.trim() || 'Recepção',
      agendamento_id: formData.agendamento_id ? String(formData.agendamento_id) : null,
      solicitante_id: user?.id || null,
      solicitante_nome: user?.nome || user?.email || 'Usuário',
      metadata: { agendamento_id: formData.agendamento_id ? String(formData.agendamento_id) : null },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, unidadeAtualId);

    try {
      const { error } = await supabase.from('chamados').insert([payload]);
      if (error) throw error;
      toast.success('Paciente adicionado à fila de chamada');
      setShowModal(false);
      setFormData(initialForm);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao criar chamada:', error);
      toast.error('Erro ao criar chamada');
    }
  };

  const atualizarStatus = async (chamado, status) => {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'chamado') updates.chamado_em = new Date().toISOString();
    if (status === 'em_atendimento') updates.atendido_em = new Date().toISOString();
    if (status === 'finalizado') updates.finalizado_em = new Date().toISOString();

    try {
      const { error } = await supabase.from('chamados').update(updates).eq('id', chamado.id);
      if (error) throw error;
      toast.success(status === 'chamado' ? 'Paciente chamado no painel' : 'Status atualizado');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar chamada:', error);
      toast.error('Erro ao atualizar chamada');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Painel de Chamadas</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Recepção, médicos e salas chamando pacientes por unidade</p>
          </div>
          <button onClick={abrirNovo} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 shadow-lg"><PlusIcon className="w-4 h-4" /> Novo Paciente na Fila</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Aguardando</p><p className="text-2xl font-bold text-gray-800 dark:text-white">{resumo.aguardando}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Chamados</p><p className="text-2xl font-bold text-blue-600">{resumo.chamados}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Em atendimento</p><p className="text-2xl font-bold text-yellow-600">{resumo.atendimento}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Finalizados</p><p className="text-2xl font-bold text-green-600">{resumo.finalizados}</p></div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-4"><MegaphoneIcon className="w-6 h-6" /><h2 className="text-xl font-bold">Painel público de chamadas</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {painelPublico.map((chamado) => (
              <div key={chamado.id} className="bg-white/15 backdrop-blur rounded-xl p-4 border border-white/20">
                <p className="text-xs uppercase opacity-80">Paciente</p>
                <p className="text-2xl font-bold">{chamado.paciente_nome || chamado.titulo}</p>
                <p className="text-sm mt-2 opacity-90">Dirija-se para</p>
                <p className="text-xl font-semibold">{chamado.destino_nome}</p>
                {chamado.senha && <p className="mt-2 text-sm">Senha: <strong>{chamado.senha}</strong></p>}
              </div>
            ))}
            {painelPublico.length === 0 && <div className="md:col-span-2 xl:col-span-3 text-white/80">Nenhum paciente chamado no momento.</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
            <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white">
              <option value="ativos">Ativos</option><option value="todos">Todos</option><option value="aguardando">Aguardando</option><option value="chamado">Chamados</option><option value="em_atendimento">Em atendimento</option><option value="finalizado">Finalizados</option>
            </select>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {chamadosFiltrados.map((chamado) => (
              <div key={chamado.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{chamado.paciente_nome || chamado.titulo}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[chamado.status]?.className || statusConfig.aguardando.className}`}>{statusConfig[chamado.status]?.label || chamado.status}</span>
                      {chamado.senha && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Senha {chamado.senha}</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{chamado.origem_nome || 'Recepção'} → {chamado.destino_nome || 'Destino não informado'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Criado por {chamado.solicitante_nome || 'Não informado'} • {chamado.created_at ? new Date(chamado.created_at).toLocaleString('pt-BR') : ''}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {chamado.status !== 'chamado' && <button onClick={() => atualizarStatus(chamado, 'chamado')} className="px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 flex items-center gap-1"><BellAlertIcon className="w-4 h-4" /> Chamar</button>}
                    {chamado.status !== 'em_atendimento' && <button onClick={() => atualizarStatus(chamado, 'em_atendimento')} className="px-3 py-1.5 rounded-lg text-sm bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300"><ClockIcon className="w-4 h-4 inline mr-1" /> Atender</button>}
                    {chamado.status !== 'finalizado' && <button onClick={() => atualizarStatus(chamado, 'finalizado')} className="px-3 py-1.5 rounded-lg text-sm bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300"><CheckCircleIcon className="w-4 h-4 inline mr-1" /> Finalizar</button>}
                  </div>
                </div>
              </div>
            ))}
            {chamadosFiltrados.length === 0 && <div className="p-10 text-center text-gray-500 dark:text-gray-400">Nenhuma chamada encontrada.</div>}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={criarChamado} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"><h3 className="text-lg font-semibold dark:text-white">Novo Paciente na Fila</h3><button type="button" onClick={() => setShowModal(false)}><XMarkIcon className="w-5 h-5 text-gray-500" /></button></div>
            <div className="p-5 space-y-4">
              <select value={formData.agendamento_id} onChange={(event) => selecionarAgendamento(event.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white">
                <option value="">Selecionar agendamento de hoje (opcional)</option>
                {agendamentos.map((agendamento) => <option key={agendamento.id} value={agendamento.id}>{agendamento.hora_inicio?.substring(0, 5)} - {agendamento.paciente_nome || 'Paciente'} ({agendamento.status})</option>)}
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={formData.paciente_nome} onChange={(event) => setFormData({ ...formData, paciente_nome: event.target.value })} placeholder="Nome do paciente" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" required />
                <input value={formData.senha} onChange={(event) => setFormData({ ...formData, senha: event.target.value })} placeholder="Senha/identificador" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={formData.destino_tipo} onChange={(event) => setFormData({ ...formData, destino_tipo: event.target.value })} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"><option value="consultorio">Consultório médico</option><option value="procedimento">Sala de procedimento</option><option value="exame">Sala de exame</option><option value="recepcao">Recepção</option></select>
                <input value={formData.destino_nome} onChange={(event) => setFormData({ ...formData, destino_nome: event.target.value })} placeholder="Destino (ex.: Consultório 2)" className="md:col-span-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={formData.origem_nome} onChange={(event) => setFormData({ ...formData, origem_nome: event.target.value })} placeholder="Origem" className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" />
                <select value={formData.destino_nome} onChange={(event) => setFormData({ ...formData, destino_nome: event.target.value })} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white">
                  <option value="">Usar sala cadastrada</option>
                  {salas.map((sala) => <option key={sala.id} value={sala.nome}>{sala.nome}</option>)}
                </select>
              </div>
              <textarea value={formData.observacao} onChange={(event) => setFormData({ ...formData, observacao: event.target.value })} placeholder="Observações internas" rows="3" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" />
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200">Cancelar</button><button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Adicionar à fila</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
