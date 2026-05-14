// src/pages/ChamadosPainel.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MegaphoneIcon, CheckCircleIcon, ClockIcon, BellAlertIcon, 
  UserGroupIcon, SpeakerWaveIcon, ArrowPathIcon, 
  UserIcon, PhoneIcon, ArrowRightIcon, Volume2Icon, VolumeXIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { filterByUnidade } from '../services/unidadesService';

const statusConfig = {
  aguardando: { label: 'Aguardando', className: 'bg-gray-500', icon: ClockIcon },
  chamado: { label: 'Chamado', className: 'bg-blue-500', icon: BellAlertIcon },
  em_atendimento: { label: 'Em atendimento', className: 'bg-yellow-500', icon: UserGroupIcon },
  finalizado: { label: 'Finalizado', className: 'bg-green-500', icon: CheckCircleIcon },
  cancelado: { label: 'Cancelado', className: 'bg-red-500', icon: CheckCircleIcon }
};

export default function ChamadosPainel() {
  const { user } = useAuth();
  const { unidadeAtualId } = useUnidade();
  const navigate = useNavigate();
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chamadoAtual, setChamadoAtual] = useState(null);
  const [ultimosChamados, setUltimosChamados] = useState([]);
  const [filaEspera, setFilaEspera] = useState([]);
  const [somAtivo, setSomAtivo] = useState(true);
  const [ultimaChamada, setUltimaChamada] = useState(null);
  const audioRef = useRef(null);

  // Função para emitir som de chamada
  const emitirSom = useCallback((pacienteNome, destino) => {
    if (!somAtivo) return;
    
    try {
      // Tentar usar Web Speech API para voz
      const utterance = new SpeechSynthesisUtterance(
        `Chamando ${pacienteNome} para ${destino}`
      );
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.volume = 1;
      window.speechSynthesis.cancel(); // Cancela chamadas anteriores
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('Speech não suportado');
    }
  }, [somAtivo]);

  // Função para tocar som de notificação
  const tocarSomNotificacao = useCallback(() => {
    if (!somAtivo) return;
    
    // Criar um beep simples via Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Fechar o contexto após o som
      setTimeout(() => audioContext.close(), 600);
    } catch (e) {
      console.log('Áudio não suportado');
    }
  }, [somAtivo]);

  const carregarDados = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const dadosFiltrados = filterByUnidade(data || [], unidadeAtualId);
      setChamados(dadosFiltrados);

      // Chamado atual (sendo atendido agora)
      const atual = dadosFiltrados.find(c => c.status === 'em_atendimento');
      setChamadoAtual(atual || null);

      // Últimos 8 chamados finalizados
      const ultimos = dadosFiltrados
        .filter(c => c.status === 'finalizado')
        .slice(0, 8);
      setUltimosChamados(ultimos);

      // Fila de espera (aguardando e chamados)
      const espera = dadosFiltrados
        .filter(c => c.status === 'aguardando' || c.status === 'chamado')
        .slice(0, 8);
      setFilaEspera(espera);

      // Verificar se houve nova chamada
      const ultimoChamado = dadosFiltrados.find(c => c.status === 'chamado' && c.chamado_em);
      if (ultimoChamado && (!ultimaChamada || ultimoChamado.id !== ultimaChamada.id)) {
        setUltimaChamada(ultimoChamado);
        tocarSomNotificacao();
        emitirSom(ultimoChamado.paciente_nome || ultimoChamado.titulo, ultimoChamado.destino_nome);
      }

    } catch (error) {
      console.error('Erro ao carregar painel:', error);
      toast.error('Erro ao carregar painel de chamadas');
    } finally {
      setLoading(false);
    }
  }, [unidadeAtualId, ultimaChamada, tocarSomNotificacao, emitirSom]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Auto-refresh a cada 3 segundos (mais rápido para TVs)
  useEffect(() => {
    const interval = setInterval(carregarDados, 3000);
    return () => clearInterval(interval);
  }, [carregarDados]);

  const atualizarStatus = async (chamado, status, emitirVoz = false) => {
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
      
      if (status === 'chamado' && emitirVoz) {
        emitirSom(chamado.paciente_nome || chamado.titulo, chamado.destino_nome);
        tocarSomNotificacao();
      }
      
      toast.success(status === 'chamado' ? 'Paciente chamado!' : 'Status atualizado');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar chamada:', error);
      toast.error('Erro ao atualizar chamada');
    }
  };

  const chamarProximo = () => {
    const proximo = chamados.find(c => c.status === 'aguardando');
    if (proximo) {
      atualizarStatus(proximo, 'chamado', true);
    } else {
      toast.info('Não há pacientes aguardando na fila');
    }
  };

  const rechamarPaciente = (chamado) => {
    atualizarStatus(chamado, 'chamado', true);
  };

  const toggleSom = () => {
    setSomAtivo(!somAtivo);
    if (!somAtivo) {
      toast.success('Som ativado');
    } else {
      toast.info('Som desativado');
      window.speechSynthesis.cancel();
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      {/* Container principal - ocupando 100% da tela */}
      <div className="h-full flex flex-col p-4 md:p-6">
        
        {/* Cabeçalho do Painel - Minimalista para TV */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <MegaphoneIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                PAINEL DE CHAMADAS
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Sistema de chamada de pacientes - Atendimento humanizado
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Controle de som */}
            <button
              onClick={toggleSom}
              className={`p-3 rounded-xl transition-all ${somAtivo ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              title={somAtivo ? 'Desativar som' : 'Ativar som'}
            >
              {somAtivo ? <Volume2Icon className="w-6 h-6 text-white" /> : <VolumeXIcon className="w-6 h-6 text-gray-400" />}
            </button>
            
            {/* Botão de recarregar */}
            <button
              onClick={carregarDados}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all"
              title="Recarregar"
            >
              <ArrowPathIcon className="w-6 h-6 text-white" />
            </button>
            
            {/* Data/Hora em destaque */}
            <div className="bg-gray-800 px-4 py-2 rounded-xl text-right border border-gray-700">
              <div className="text-2xl font-bold text-white font-mono tabular-nums">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-gray-400">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </div>
            </div>
          </div>
        </div>

        {/* Área principal - Grid responsivo para TV */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          
          {/* COLUNA ESQUERDA - Chamado Atual (Destaque) */}
          <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl">
            <div className="mb-4">
              <div className="bg-white/20 rounded-full p-3 inline-flex">
                <MegaphoneIcon className="w-10 h-10 text-white" />
              </div>
            </div>
            <p className="text-blue-200 text-sm uppercase tracking-wider mb-2">EM ATENDIMENTO AGORA</p>
            
            {chamadoAtual ? (
              <>
                <div className="text-6xl md:text-7xl font-bold text-white mb-4 break-all">
                  {chamadoAtual.senha || chamadoAtual.paciente_nome?.substring(0, 20) || '---'}
                </div>
                <div className="text-2xl text-white mb-2 font-semibold">
                  {chamadoAtual.paciente_nome || chamadoAtual.titulo}
                </div>
                <div className="flex items-center gap-2 text-blue-200 text-lg">
                  <UserIcon className="w-5 h-5" />
                  <span>{chamadoAtual.destino_nome} • {chamadoAtual.origem_nome}</span>
                </div>
                <button
                  onClick={() => atualizarStatus(chamadoAtual, 'finalizado', false)}
                  className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold flex items-center gap-2 transition-all"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Finalizar Atendimento
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl md:text-6xl font-bold text-white mb-4">AGUARDANDO</div>
                <p className="text-xl text-blue-200">Nenhum paciente em atendimento</p>
                <button
                  onClick={chamarProximo}
                  className="mt-6 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-white font-semibold flex items-center gap-2 transition-all"
                >
                  <SpeakerWaveIcon className="w-5 h-5" />
                  Chamar Próximo
                </button>
              </>
            )}
          </div>

          {/* COLUNA DIREITA - Fila de Espera e Últimos Chamados */}
          <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
            
            {/* Botão Chamar Próximo (destaque) */}
            <button
              onClick={chamarProximo}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 rounded-xl text-2xl font-bold text-white flex items-center justify-center gap-3 transition-all shadow-lg"
            >
              <SpeakerWaveIcon className="w-8 h-8" />
              CHAMAR PRÓXIMO PACIENTE
              <ArrowRightIcon className="w-8 h-8" />
            </button>

            {/* Fila de Espera */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 flex-1 flex flex-col min-h-0">
              <div className="p-4 bg-gray-700/50 rounded-t-xl border-b border-gray-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-yellow-500" />
                  FILA DE ESPERA
                </h2>
                <p className="text-gray-400 text-sm">Pacientes aguardando chamada</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filaEspera.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    Nenhum paciente na fila de espera
                  </div>
                ) : (
                  filaEspera.map((chamado, index) => {
                    const Icon = statusConfig[chamado.status]?.icon || ClockIcon;
                    const statusClass = statusConfig[chamado.status]?.className || 'bg-gray-500';
                    
                    return (
                      <div key={chamado.id} className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-all">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="text-3xl font-bold text-gray-500 w-12 text-center">
                              {index + 1}º
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-white text-lg truncate">
                                  {chamado.paciente_nome || chamado.titulo}
                                </p>
                                {chamado.senha && (
                                  <span className="px-2 py-0.5 bg-gray-600 rounded-lg text-xs font-mono text-gray-300">
                                    Senha: {chamado.senha}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-400 text-sm mt-1">
                                {chamado.destino_nome} • {chamado.origem_nome}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusClass}`}>
                              <Icon className="w-3 h-3 inline mr-1" />
                              {statusConfig[chamado.status]?.label || chamado.status}
                            </span>
                            
                            {chamado.status === 'aguardando' && (
                              <button
                                onClick={() => atualizarStatus(chamado, 'chamado', true)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-semibold flex items-center gap-1 transition-colors"
                              >
                                <BellAlertIcon className="w-4 h-4" />
                                Chamar
                              </button>
                            )}
                            
                            {chamado.status === 'chamado' && (
                              <>
                                <button
                                  onClick={() => atualizarStatus(chamado, 'em_atendimento', false)}
                                  className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white text-sm font-semibold flex items-center gap-1 transition-colors"
                                >
                                  <UserGroupIcon className="w-4 h-4" />
                                  Atender
                                </button>
                                <button
                                  onClick={() => rechamarPaciente(chamado)}
                                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-semibold flex items-center gap-1 transition-colors"
                                >
                                  <MegaphoneIcon className="w-4 h-4" />
                                  Rechamar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Últimos Chamados Finalizados */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-4 bg-gray-700/50 rounded-t-xl border-b border-gray-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ÚLTIMOS ATENDIMENTOS
                </h2>
                <p className="text-gray-400 text-sm">Histórico de chamadas finalizadas</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
                {ultimosChamados.length === 0 ? (
                  <div className="col-span-4 text-center text-gray-500 py-8">
                    Nenhum atendimento finalizado ainda
                  </div>
                ) : (
                  ultimosChamados.map((chamado) => (
                    <div key={chamado.id} className="bg-gray-700/50 rounded-xl p-3 text-center hover:bg-gray-700 transition-all">
                      <p className="text-lg font-bold text-white truncate">
                        {chamado.paciente_nome?.split(' ')[0] || chamado.titulo?.split(' ')[0]}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{chamado.destino_nome}</p>
                      <p className="text-xs text-green-400 mt-2">
                        {chamado.finalizado_em ? new Date(chamado.finalizado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com informações da unidade */}
        <div className="mt-4 pt-3 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            Sistema de Chamadas • {unidadeAtualId === 'todas' ? 'Todas as Unidades' : `Unidade ${unidadeAtualId}`}
          </p>
        </div>
      </div>
    </div>
  );
}
