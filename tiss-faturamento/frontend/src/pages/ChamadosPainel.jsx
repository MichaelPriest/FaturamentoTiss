// src/pages/ChamadosPainel.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MegaphoneIcon, CheckCircleIcon, ClockIcon, BellAlertIcon, 
  UserGroupIcon, SpeakerWaveIcon, ArrowPathIcon, 
  UserIcon, PhoneIcon, ArrowRightIcon, SpeakerXMarkIcon,
  TrophyIcon, StarIcon, FireIcon, HeartIcon, 
  ClipboardDocumentCheckIcon, BeakerIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { filterByUnidade } from '../services/unidadesService';

const statusConfig = {
  aguardando: { label: 'Aguardando', className: 'bg-blue-500', icon: ClockIcon },
  chamado: { label: 'Chamado', className: 'bg-yellow-500', icon: BellAlertIcon },
  em_atendimento: { label: 'Em atendimento', className: 'bg-green-500', icon: UserGroupIcon },
  finalizado: { label: 'Finalizado', className: 'bg-gray-500', icon: CheckCircleIcon },
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
  const [totalAtendimentosHoje, setTotalAtendimentosHoje] = useState(0);
  const [tempoMedioEspera, setTempoMedioEspera] = useState(0);
  const audioRef = useRef(null);

  const getDataAtual = () => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  };

  const emitirSom = useCallback((pacienteNome, destino) => {
    if (!somAtivo) return;
    
    try {
      const utterance = new SpeechSynthesisUtterance(
        `Chamando paciente ${pacienteNome}, comparecer ao ${destino}`
      );
      utterance.lang = 'pt-BR';
      utterance.rate = 0.85;
      utterance.volume = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('Speech não suportado');
    }
  }, [somAtivo]);

  const tocarSomNotificacao = useCallback(() => {
    if (!somAtivo) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.25;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.8);
      oscillator.stop(audioContext.currentTime + 0.8);
      
      setTimeout(() => audioContext.close(), 900);
    } catch (e) {
      console.log('Áudio não suportado');
    }
  }, [somAtivo]);

  const calcularTempoMedioEspera = (chamadosList) => {
    const finalizados = chamadosList.filter(c => c.status === 'finalizado' && c.created_at && c.atendido_em);
    if (finalizados.length === 0) return 0;
    
    const totalTempo = finalizados.reduce((acc, c) => {
      const criado = new Date(c.created_at);
      const atendido = new Date(c.atendido_em);
      const diffMinutes = (atendido - criado) / 1000 / 60;
      return acc + diffMinutes;
    }, 0);
    
    return Math.round(totalTempo / finalizados.length);
  };

  const carregarDados = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);

      if (error) throw error;

      const dadosFiltrados = filterByUnidade(data || [], unidadeAtualId);
      setChamados(dadosFiltrados);

      const atual = dadosFiltrados.find(c => c.status === 'em_atendimento');
      setChamadoAtual(atual || null);

      const ultimos = dadosFiltrados
        .filter(c => c.status === 'finalizado')
        .slice(0, 10);
      setUltimosChamados(ultimos);

      const espera = dadosFiltrados
        .filter(c => c.status === 'aguardando' || c.status === 'chamado')
        .slice(0, 8);
      setFilaEspera(espera);

      const hoje = getDataAtual();
      const atendimentosHoje = dadosFiltrados.filter(c => 
        c.status === 'finalizado' && 
        c.finalizado_em && 
        c.finalizado_em.split('T')[0] === hoje
      ).length;
      setTotalAtendimentosHoje(atendimentosHoje);

      const tempoMedio = calcularTempoMedioEspera(dadosFiltrados);
      setTempoMedioEspera(tempoMedio);

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

  useEffect(() => {
    const interval = setInterval(carregarDados, 4000);
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
      toast.success('Áudio do painel ativado');
    } else {
      toast.info('Áudio do painel desativado');
      window.speechSynthesis.cancel();
    }
  };

  const formatarNome = (nome) => {
    if (!nome) return '---';
    return nome.length > 25 ? nome.substring(0, 25) + '...' : nome;
  };

  const getDestinoIcon = (destinoTipo) => {
    switch(destinoTipo) {
      case 'consultorio': return <UserIcon className="w-4 h-4" />;
      case 'exame': return <BeakerIcon className="w-4 h-4" />;
      case 'procedimento': return <ClipboardDocumentCheckIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-teal-700">Carregando painel de atendimento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* HEADER HOSPITALAR */}
        <div className="bg-white rounded-2xl shadow-lg border-l-8 border-teal-500 p-5 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-2xl">
                <HeartIcon className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Painel de Atendimento
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Sistema de chamada de pacientes • Unidade de Saúde
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-teal-50 px-4 py-2 rounded-xl text-center">
                <p className="text-xs text-teal-600">Atendimentos hoje</p>
                <p className="text-2xl font-bold text-teal-700">{totalAtendimentosHoje}</p>
              </div>
              
              <div className="bg-blue-50 px-4 py-2 rounded-xl text-center">
                <p className="text-xs text-blue-600">Tempo médio espera</p>
                <p className="text-2xl font-bold text-blue-700">{tempoMedioEspera} min</p>
              </div>
              
              <button
                onClick={toggleSom}
                className={`p-3 rounded-xl transition-all ${somAtivo ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-300 hover:bg-gray-400'} text-white`}
                title={somAtivo ? 'Desativar som' : 'Ativar som'}
              >
                {somAtivo ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={carregarDados}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-gray-600"
                title="Atualizar"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
              
              <div className="bg-gray-100 px-4 py-2 rounded-xl text-right">
                <div className="text-xl font-bold text-gray-700 font-mono">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CHAMADO ATUAL - DESTAQUE */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 text-center">
                <div className="inline-flex bg-white/20 rounded-full p-3 mb-4">
                  <MegaphoneIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-teal-100 text-sm uppercase tracking-wide mb-2">Atendimento atual</p>
                
                {chamadoAtual ? (
                  <>
                    <div className="text-5xl md:text-6xl font-bold text-white mb-3">
                      {chamadoAtual.senha || '---'}
                    </div>
                    <div className="text-xl text-white font-semibold mb-2">
                      {formatarNome(chamadoAtual.paciente_nome || chamadoAtual.titulo)}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-teal-100 text-sm">
                      {getDestinoIcon(chamadoAtual.destino_tipo)}
                      <span>{chamadoAtual.destino_nome}</span>
                    </div>
                    <button
                      onClick={() => atualizarStatus(chamadoAtual, 'finalizado', false)}
                      className="mt-6 w-full bg-white text-teal-700 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Finalizar Atendimento
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-3xl md:text-4xl font-bold text-white mb-3">Aguardando</div>
                    <p className="text-teal-100">Nenhum paciente em atendimento</p>
                    <button
                      onClick={chamarProximo}
                      className="mt-6 w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
                    >
                      <SpeakerWaveIcon className="w-5 h-5" />
                      Chamar Próximo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* FILA DE ESPERA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-teal-500" />
                  Fila de Espera
                </h2>
                <p className="text-xs text-gray-400 mt-1">Pacientes aguardando atendimento</p>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filaEspera.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum paciente na fila</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filaEspera.map((chamado, index) => (
                      <div key={chamado.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                              <span className="font-bold text-teal-600">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                {formatarNome(chamado.paciente_nome || chamado.titulo)}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  {getDestinoIcon(chamado.destino_tipo)}
                                  {chamado.destino_nome}
                                </span>
                                {chamado.senha && (
                                  <span className="font-mono">Senha: {chamado.senha}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusConfig[chamado.status]?.className}`}>
                              {statusConfig[chamado.status]?.label}
                            </span>
                            
                            {chamado.status === 'aguardando' && (
                              <button
                                onClick={() => atualizarStatus(chamado, 'chamado', true)}
                                className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <BellAlertIcon className="w-4 h-4" />
                                Chamar
                              </button>
                            )}
                            
                            {chamado.status === 'chamado' && (
                              <>
                                <button
                                  onClick={() => atualizarStatus(chamado, 'em_atendimento', false)}
                                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                  <UserGroupIcon className="w-4 h-4" />
                                  Atender
                                </button>
                                <button
                                  onClick={() => rechamarPaciente(chamado)}
                                  className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                  <MegaphoneIcon className="w-4 h-4" />
                                  Rechamar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTÃO CHAMAR PRÓXIMO - DESTAQUE */}
        <div className="mt-6">
          <button
            onClick={chamarProximo}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl text-xl font-bold text-white flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <SpeakerWaveIcon className="w-6 h-6" />
            CHAMAR PRÓXIMO PACIENTE
            <ArrowRightIcon className="w-6 h-6" />
          </button>
        </div>

        {/* ÚLTIMOS ATENDIMENTOS */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              Últimos Atendimentos Realizados
            </h2>
            <p className="text-xs text-gray-400 mt-1">Histórico de pacientes atendidos</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-5">
            {ultimosChamados.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                <ClipboardDocumentCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum atendimento finalizado ainda</p>
              </div>
            ) : (
              ultimosChamados.map((chamado, idx) => (
                <div key={chamado.id} className="bg-gray-50 rounded-xl p-3 text-center hover:shadow-md transition-all">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {idx === 0 && <TrophyIcon className="w-4 h-4 text-yellow-500" />}
                    <span className="text-xs text-green-600">
                      {chamado.finalizado_em ? new Date(chamado.finalizado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm truncate" title={chamado.paciente_nome || chamado.titulo}>
                    {formatarNome(chamado.paciente_nome || chamado.titulo)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    {getDestinoIcon(chamado.destino_tipo)}
                    {chamado.destino_nome}
                  </p>
                  {chamado.senha && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">Senha: {chamado.senha}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Sistema de Gestão de Atendimento • {unidadeAtualId === 'todas' ? 'Todas as Unidades' : `Unidade de Saúde`}
          </p>
        </div>
      </div>
    </div>
  );
}
