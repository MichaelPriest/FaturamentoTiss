// src/pages/ChamadosRegistro.jsx
import { useEffect, useState } from 'react';
import { PlusIcon, XMarkIcon, UserPlusIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';

const initialForm = {
  paciente_nome: '',
  paciente_id: '',
  senha: '',
  destino_tipo: 'consultorio',
  destino_nome: '',
  origem_nome: 'Recepção',
  observacao: '',
  agendamento_id: ''
};

export default function ChamadosRegistro() {
  const { user } = useAuth();
  const { unidadeAtualId } = useUnidade();
  const [agendamentos, setAgendamentos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const [agendamentosRes, salasRes] = await Promise.all([
        supabase.from('agendamentos').select('*').eq('data_agendamento', hoje).order('hora_inicio', { ascending: true }),
        supabase.from('salas').select('*').eq('ativo', true).order('nome')
      ]);

      if (agendamentosRes.error) throw agendamentosRes.error;
      if (salasRes.error) throw salasRes.error;

      setAgendamentos(filterByUnidade(agendamentosRes.data || [], unidadeAtualId));
      setSalas(filterByUnidade(salasRes.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [unidadeAtualId]);

  const gerarSenhaAleatoria = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const letra = letras.charAt(Math.floor(Math.random() * letras.length));
    return `${letra}${numeros}`;
  };

  const selecionarAgendamento = (agendamentoId) => {
    const agendamento = agendamentos.find((item) => String(item.id) === String(agendamentoId));
    const sala = salas.find((item) => String(item.id) === String(agendamento?.sala_id));

    setFormData((prev) => ({
      ...prev,
      agendamento_id: agendamentoId,
      paciente_id: agendamento?.paciente_id || '',
      paciente_nome: agendamento?.paciente_nome || prev.paciente_nome,
      destino_nome: sala?.nome || agendamento?.local || prev.destino_nome,
      senha: prev.senha || gerarSenhaAleatoria()
    }));
  };

  const criarChamado = async (event) => {
    event.preventDefault();
    
    if (!formData.paciente_nome.trim()) {
      toast.error('Informe o nome do paciente');
      return;
    }
    
    if (!formData.destino_nome.trim()) {
      toast.error('Informe o destino (sala/consultório)');
      return;
    }

    const senhaFinal = formData.senha.trim() || gerarSenhaAleatoria();
    const agendamento = agendamentos.find((item) => String(item.id) === String(formData.agendamento_id));
    
    const payload = applyUnidadeToPayload({
      titulo: `Chamar ${formData.paciente_nome.trim()}`,
      categoria: 'chamada_paciente',
      prioridade: 'normal',
      status: 'aguardando',
      paciente_id: formData.paciente_id || (agendamento?.paciente_id ? String(agendamento.paciente_id) : null),
      paciente_nome: formData.paciente_nome.trim(),
      senha: senhaFinal,
      destino_tipo: formData.destino_tipo,
      destino_nome: formData.destino_nome.trim(),
      origem_nome: formData.origem_nome.trim() || 'Recepção',
      agendamento_id: formData.agendamento_id ? String(formData.agendamento_id) : null,
      solicitante_id: user?.id || null,
      solicitante_nome: user?.nome || user?.email?.split('@')[0] || 'Usuário',
      metadata: { 
        agendamento_id: formData.agendamento_id ? String(formData.agendamento_id) : null,
        senha_gerada: senhaFinal
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, unidadeAtualId);

    try {
      const { error } = await supabase.from('chamados').insert([payload]);
      if (error) throw error;
      
      toast.success(`Paciente adicionado à fila com senha ${senhaFinal}`);
      setShowModal(false);
      setFormData(initialForm);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao criar chamada:', error);
      toast.error('Erro ao criar chamada');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Recepção / Registro
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Adicione pacientes à fila de chamada por unidade
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
          >
            <UserPlusIcon className="w-4 h-4" /> 
            Adicionar à Fila
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <QrCodeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Como funciona?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Adicione pacientes à fila para que sejam chamados nos painéis de atendimento
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
              <p className="text-sm font-medium">Informe o paciente</p>
              <p className="text-xs text-gray-500">Nome e identificação</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
              <p className="text-sm font-medium">Selecione o destino</p>
              <p className="text-xs text-gray-500">Sala/consultório para atendimento</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
              <p className="text-sm font-medium">Gere a senha</p>
              <p className="text-xs text-gray-500">Senha será mostrada no painel</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="font-semibold text-gray-800 dark:text-white">Agendamentos de hoje</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {agendamentos.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Nenhum agendamento para hoje
              </div>
            ) : (
              agendamentos.map((ag) => (
                <div key={ag.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{ag.paciente_nome}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {ag.hora_inicio?.substring(0, 5)} - {ag.hora_fim?.substring(0, 5)} • {ag.status}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      selecionarAgendamento(ag.id);
                      setShowModal(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Atender
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={criarChamado} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">Adicionar Paciente à Fila</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agendamento (opcional)
                </label>
                <select 
                  value={formData.agendamento_id} 
                  onChange={(e) => selecionarAgendamento(e.target.value)} 
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                >
                  <option value="">Selecionar agendamento de hoje</option>
                  {agendamentos.map((agendamento) => (
                    <option key={agendamento.id} value={agendamento.id}>
                      {agendamento.hora_inicio?.substring(0, 5)} - {agendamento.paciente_nome || 'Paciente'} ({agendamento.status})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Paciente *
                  </label>
                  <input 
                    value={formData.paciente_nome} 
                    onChange={(e) => setFormData({ ...formData, paciente_nome: e.target.value })} 
                    placeholder="Nome completo" 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha/Identificador
                  </label>
                  <div className="flex gap-2">
                    <input 
                      value={formData.senha} 
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })} 
                      placeholder="Senha automática" 
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, senha: gerarSenhaAleatoria() })}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Gerar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Destino
                  </label>
                  <select 
                    value={formData.destino_tipo} 
                    onChange={(e) => setFormData({ ...formData, destino_tipo: e.target.value })} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                  >
                    <option value="consultorio">Consultório médico</option>
                    <option value="procedimento">Sala de procedimento</option>
                    <option value="exame">Sala de exame</option>
                    <option value="recepcao">Recepção</option>
                    <option value="triagem">Triagem</option>
                    <option value="medicina">Medicina do Trabalho</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destino (Sala/Consultório) *
                  </label>
                  <div className="flex gap-2">
                    <input 
                      value={formData.destino_nome} 
                      onChange={(e) => setFormData({ ...formData, destino_nome: e.target.value })} 
                      placeholder="Ex.: Consultório 2" 
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                      required 
                    />
                    <select 
                      value={formData.destino_nome} 
                      onChange={(e) => setFormData({ ...formData, destino_nome: e.target.value })} 
                      className="w-40 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm dark:text-white"
                    >
                      <option value="">Sala cadastrada</option>
                      {salas.map((sala) => (
                        <option key={sala.id} value={sala.nome}>{sala.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Origem
                </label>
                <input 
                  value={formData.origem_nome} 
                  onChange={(e) => setFormData({ ...formData, origem_nome: e.target.value })} 
                  placeholder="Recepção, Triagem, etc." 
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações Internas
                </label>
                <textarea 
                  value={formData.observacao} 
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} 
                  placeholder="Informações adicionais para a equipe" 
                  rows="3" 
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:from-blue-600 hover:to-indigo-700 shadow-md"
              >
                <PlusIcon className="w-4 h-4 inline mr-1" />
                Adicionar à Fila
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
