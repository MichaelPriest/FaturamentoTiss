// src/pages/ChamadosPainel.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  MegaphoneIcon, CheckCircleIcon, ClockIcon, BellAlertIcon, 
  UserGroupIcon, ClipboardDocumentListIcon, SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { filterByUnidade } from '../services/unidadesService';

const statusConfig = {
  aguardando: { label: 'Aguardando', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: ClockIcon },
  chamado: { label: 'Chamado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: BellAlertIcon },
  em_atendimento: { label: 'Em atendimento', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: UserGroupIcon },
  finalizado: { label: 'Finalizado', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircleIcon },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ClipboardDocumentListIcon }
};

export default function ChamadosPainel() {
  const { user } = useAuth();
  const { unidadeAtualId } = useUnidade();
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chamadoAtual, setChamadoAtual] = useState(null);
  const [ultimosChamados, setUltimosChamados] = useState([]);
  const [filaEspera, setFilaEspera] = useState([]);

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

      // Últimos 5 chamados finalizados
      const ultimos = dadosFiltrados
        .filter(c => c.status === 'finalizado')
        .slice(0, 5);
      setUltimosChamados(ultimos);

      // Fila de espera (aguardando)
      const espera = dadosFiltrados
        .filter(c => c.status === 'aguardando' || c.status === 'chamado')
        .slice(0, 10);
      setFilaEspera(espera);

    } catch (error) {
      console.error('Erro ao carregar painel:', error);
      toast.error('Erro ao carregar painel de chamadas');
    } finally {
      setLoading(false);
    }
  }, [unidadeAtualId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Auto-refresh a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(carregarDados, 5000);
    return () => clearInterval(interval);
  }, [carregarDados]);

  const atualizarStatus = async (chamado, status) => {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'chamado') updates.chamado_em = new Date().toISOString();
    if (status === 'em_atendimento') updates.atendido_em = new Date().toISOString();
    if (status === 'finalizado') updates.finalizado_em = new Date().toISOString();

    // Simular som de chamada (opcional - requer interação do usuário)
    if (status === 'chamado') {
      try {
        const utterance = new SpeechSynthesisUtterance(
          `Chamando ${chamado.paciente_nome || chamado.titulo} para ${chamado.destino_nome}`
        );
        utterance.lang = 'pt-BR';
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.log('Speech não suportado');
      }
    }

    try {
      const { error } = await supabase.from('chamados').update(updates).eq('id', chamado.id);
      if (error) throw error;
      
      toast.success(status === 'chamado' ? 'Paciente chamado!' : 'Status atualizado');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar chamada:', error);
      toast.error('Erro ao atualizar chamada');
    }
  };

  const chamarProximo = () => {
    const proximo = filaEspera.find(c => c.status === 'aguardando');
    if (proximo) {
      atualizarStatus(proximo, 'chamado');
    } else {
      toast.info('Não há pacientes aguardando na fila');
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
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <MegaphoneIcon className="w-10 h-10 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Painel de Chamadas</h1>
          </div>
          <p className="text-gray-400">Sistema de chamada de pacientes - Atendimento humanizado</p>
        </div>

        {/* Chamado Atual */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-center shadow-2xl">
            <p className="text-blue-200 text-sm uppercase tracking-wider mb-2">EM ATENDIMENTO AGORA</p>
            {chamadoAtual ? (
              <>
                <div className="text-6xl md:text-8xl font-bold text-white mb-4">
                  {chamadoAtual.senha || chamadoAtual.paciente_nome?.substring(0, 15) || '---'}
                </div>
                <p className="text-2xl text-white mb-2">{chamadoAtual.paciente_nome || chamadoAtual.titulo}</p>
                <p className="text-blue-200 text-lg">
                  {chamadoAtual.destino_nome} • {chamadoAtual.origem_nome}
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl md:text-6xl font-bold text-white mb-4">Aguardando</div>
                <p className="text-xl text-blue-200">Nenhum paciente em atendimento no momento</p>
              </>
            )}
          </div>
        </div>

        {/* Botão Chamar Próximo */}
        <div className="flex justify-center mb-8">
          <button
            onClick={chamarProximo}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold flex items-center gap-3 shadow-lg transition-all transform hover:scale-105"
          >
            <SpeakerWaveIcon className="w-6 h-6" />
            CHAMAR PRÓXIMO PACIENTE
          </button>
        </div>

        {/* Próximos Chamados e Fila */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fila de Espera */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-700/50 border-b border-gray-600">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-yellow-500" />
                Fila de Espera
              </h2>
              <p className="text-gray-400 text-sm">Pacientes aguardando chamada</p>
            </div>
            <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
              {filaEspera.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum paciente na fila de espera
                </div>
              ) : (
                filaEspera.map((chamado, index) => (
                  <div key={chamado.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-500 w-8">{index + 1}º</span>
                        <div>
                          <p className="font-semibold text-white">
                            {chamado.paciente_nome || chamado.titulo}
                          </p>
                          <p className="text-sm text-gray-400">
                            {chamado.destino_nome} • Senha: {chamado.senha || '---'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {chamado.status === 'aguardando' && (
                          <button
                            onClick={() => atualizarStatus(chamado, 'chamado')}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                          >
                            <BellAlertIcon className="w-4 h-4" />
                            Chamar
                          </button>
                        )}
                        {chamado.status === 'chamado' && (
                          <button
                            onClick={() => atualizarStatus(chamado, 'em_atendimento')}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                          >
                            <UserGroupIcon className="w-4 h-4" />
                            Atender
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Últimos Chamados */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-700/50 border-b border-gray-600">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                Últimos Atendimentos
              </h2>
              <p className="text-gray-400 text-sm">Histórico de chamadas finalizadas</p>
            </div>
            <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
              {ultimosChamados.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum atendimento finalizado ainda
                </div>
              ) : (
                ultimosChamados.map((chamado) => (
                  <div key={chamado.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {chamado.paciente_nome || chamado.titulo}
                        </p>
                        <p className="text-sm text-gray-400">
                          {chamado.destino_nome} • Finalizado em {chamado.finalizado_em ? new Date(chamado.finalizado_em).toLocaleTimeString('pt-BR') : '---'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        Finalizado
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Status por destino */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries({
            'Aguardando': chamados.filter(c => c.status === 'aguardando').length,
            'Chamados': chamados.filter(c => c.status === 'chamado').length,
            'Em atendimento': chamados.filter(c => c.status === 'em_atendimento').length,
            'Finalizados hoje': chamados.filter(c => c.status === 'finalizado' && 
              new Date(c.finalizado_em).toDateString() === new Date().toDateString()
            ).length,
            'Total do dia': chamados.filter(c => 
              new Date(c.created_at).toDateString() === new Date().toDateString()
            ).length
          }).map(([label, count]) => (
            <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
