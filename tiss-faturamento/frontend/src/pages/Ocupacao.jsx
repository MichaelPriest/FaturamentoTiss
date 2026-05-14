import { useEffect, useMemo, useState } from 'react';
import { CalendarDaysIcon, ClockIcon, HomeModernIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { filterByUnidade } from '../services/unidadesService';

const statusInfo = {
  livre: { label: 'Livre', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
  ocupada: { label: 'Em atendimento', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
  reservada: { label: 'Reservada hoje', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' },
  inativa: { label: 'Inativa', className: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' }
};

const toMinutes = (hora = '') => {
  const [h = '0', m = '0'] = hora.substring(0, 5).split(':');
  return Number(h) * 60 + Number(m);
};

export default function Ocupacao() {
  const { unidadeAtualId } = useUnidade();
  const [salas, setSalas] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [agora, setAgora] = useState(new Date());

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [salasRes, agendamentosRes] = await Promise.all([
        supabase.from('salas').select('*').order('nome'),
        supabase
          .from('agendamentos')
          .select('*')
          .eq('data_agendamento', dataSelecionada)
          .order('hora_inicio', { ascending: true })
      ]);

      if (salasRes.error) throw salasRes.error;
      if (agendamentosRes.error) throw agendamentosRes.error;

      setSalas(filterByUnidade(salasRes.data || [], unidadeAtualId));
      setAgendamentos(filterByUnidade(agendamentosRes.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar mapa de ocupação:', error);
      toast.error('Erro ao carregar mapa de ocupação');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [dataSelecionada, unidadeAtualId]);

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const salasComStatus = useMemo(() => {
    const minutosAgora = agora.toISOString().split('T')[0] === dataSelecionada ? agora.getHours() * 60 + agora.getMinutes() : null;

    return salas.map((sala) => {
      const agendaSala = agendamentos.filter((agendamento) => String(agendamento.sala_id) === String(sala.id));
      const atual = minutosAgora === null ? null : agendaSala.find((agendamento) => {
        const inicio = toMinutes(agendamento.hora_inicio);
        const fim = toMinutes(agendamento.hora_fim || agendamento.hora_inicio);
        return minutosAgora >= inicio && minutosAgora <= fim && !['cancelado', 'realizado'].includes(agendamento.status);
      });

      const status = !sala.ativo ? 'inativa' : atual ? 'ocupada' : agendaSala.length > 0 ? 'reservada' : 'livre';
      const proximo = agendaSala.find((agendamento) => minutosAgora === null || toMinutes(agendamento.hora_inicio) >= minutosAgora);

      return { sala, agendaSala, atual, proximo, status };
    });
  }, [salas, agendamentos, agora, dataSelecionada]);

  const resumo = useMemo(() => ({
    total: salasComStatus.length,
    livres: salasComStatus.filter((item) => item.status === 'livre').length,
    ocupadas: salasComStatus.filter((item) => item.status === 'ocupada').length,
    reservadas: salasComStatus.filter((item) => item.status === 'reservada').length
  }), [salasComStatus]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Mapa de Ocupação</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Acompanhe salas livres, reservadas e em atendimento</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={dataSelecionada} onChange={(event) => setDataSelecionada(event.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white" />
            <button onClick={carregarDados} className="px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"><ArrowPathIcon className="w-4 h-4" /> Atualizar</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500">Salas</p><p className="text-2xl font-bold dark:text-white">{resumo.total}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500">Livres</p><p className="text-2xl font-bold text-green-600">{resumo.livres}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500">Ocupadas</p><p className="text-2xl font-bold text-red-600">{resumo.ocupadas}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><p className="text-xs text-gray-500">Reservadas</p><p className="text-2xl font-bold text-yellow-600">{resumo.reservadas}</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {salasComStatus.map(({ sala, agendaSala, atual, proximo, status }) => (
            <div key={sala.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${sala.cor || '#3B82F6'}22`, color: sala.cor || '#3B82F6' }}><HomeModernIcon className="w-6 h-6" /></div>
                  <div><h3 className="font-semibold text-gray-800 dark:text-white">{sala.nome}</h3><p className="text-xs text-gray-500 dark:text-gray-400">{sala.tipo || 'Sala'} • Cap. {sala.capacidade || 1}</p></div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${statusInfo[status].className}`}>{statusInfo[status].label}</span>
              </div>

              <div className="space-y-2 text-sm">
                {atual && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"><strong>Agora:</strong> {atual.paciente_nome || 'Agendamento'} ({atual.hora_inicio?.substring(0, 5)} - {atual.hora_fim?.substring(0, 5)})</div>}
                {!atual && proximo && <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"><strong>Próximo:</strong> {proximo.paciente_nome || 'Agendamento'} às {proximo.hora_inicio?.substring(0, 5)}</div>}
                {agendaSala.length === 0 && <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">Sem reservas para a data selecionada.</div>}
                {agendaSala.slice(0, 4).map((agendamento) => (
                  <div key={agendamento.id} className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-700 pt-2 text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" />{agendamento.hora_inicio?.substring(0, 5)} - {agendamento.hora_fim?.substring(0, 5)}</span>
                    <span className="truncate">{agendamento.paciente_nome || agendamento.tipo || 'Agendamento'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {salasComStatus.length === 0 && <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"><CalendarDaysIcon className="w-14 h-14 mx-auto text-gray-400 mb-3" /><p className="text-gray-500 dark:text-gray-400">Nenhuma sala cadastrada para a unidade selecionada.</p></div>}
      </div>
    </div>
  );
}
