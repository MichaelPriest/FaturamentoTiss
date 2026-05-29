import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { filterByUnidade } from '../services/unidadesService';

const formatarData = (data) => {
  if (!data) return '-';
  try {
    return format(new Date(data), 'dd/MM/yyyy');
  } catch {
    return data;
  }
};

const normalizarItens = (itens) => {
  if (!itens) return [];
  if (Array.isArray(itens)) return itens;
  try {
    const parsed = JSON.parse(itens);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function PacienteHistorico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { unidadeAtualId } = useUnidade();
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState(null);
  const [atendimentos, setAtendimentos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [prontuarios, setProntuarios] = useState([]);

  useEffect(() => {
    carregarHistorico();
  }, [id, unidadeAtualId]);

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const pacienteId = parseInt(id);
      const [pacienteRes, atendimentosRes, agendamentosRes, prontuariosRes] = await Promise.all([
        supabase.from('pacientes').select('*').eq('id', pacienteId).single(),
        supabase.from('atendimentos').select('*').eq('paciente_id', pacienteId).order('data_atendimento', { ascending: false }),
        supabase.from('agendamentos').select('*').eq('paciente_id', pacienteId).order('data_agendamento', { ascending: false }),
        supabase.from('prontuario').select('*').eq('paciente_id', pacienteId).order('data_atendimento', { ascending: false })
      ]);

      if (pacienteRes.error) throw pacienteRes.error;
      if (atendimentosRes.error) throw atendimentosRes.error;
      if (agendamentosRes.error) throw agendamentosRes.error;
      if (prontuariosRes.error) throw prontuariosRes.error;

      setPaciente(pacienteRes.data);
      setAtendimentos(filterByUnidade(atendimentosRes.data || [], unidadeAtualId));
      setAgendamentos(filterByUnidade(agendamentosRes.data || [], unidadeAtualId));
      setProntuarios(filterByUnidade(prontuariosRes.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar histórico do paciente:', error);
      toast.error('Erro ao carregar histórico do paciente');
    } finally {
      setLoading(false);
    }
  };

  const totalFaturado = useMemo(() => atendimentos.reduce((sum, item) => sum + Number(item.valor_total || 0), 0), [atendimentos]);

  if (loading) {
    return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando histórico...</div>;
  }

  if (!paciente) {
    return <div className="p-6 text-gray-600 dark:text-gray-300">Paciente não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate('/pacientes')} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-2">
            <ArrowLeftIcon className="w-4 h-4" /> Voltar para pacientes
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-7 h-7 text-blue-600" /> Histórico do Paciente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Todos os agendamentos, prontuários, guias e procedimentos realizados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 md:col-span-2">
          <p className="text-xs text-gray-500">Paciente</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{paciente.nome}</h2>
          <p className="text-sm text-gray-500">CPF: {paciente.cpf || '-'} • Nascimento: {formatarData(paciente.data_nascimento)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Atendimentos</p>
          <p className="text-2xl font-bold text-blue-600">{atendimentos.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Total faturado</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalFaturado.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5 text-pink-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Guias / Atendimentos realizados</h3>
          </div>
          <div className="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
            {atendimentos.map(atendimento => {
              const itens = normalizarItens(atendimento.itens);
              return (
                <div key={atendimento.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Guia {atendimento.numero_guia_prestador || atendimento.id}</p>
                      <p className="text-xs text-gray-500">{formatarData(atendimento.data_atendimento)} • {atendimento.paciente_convenio_nome || 'Sem convênio'} • Carteira {atendimento.numero_carteira || '-'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 h-fit">{atendimento.status || '-'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span>Autorização: {atendimento.numero_guia_operadora || '-'}</span>
                    <span>Senha: {atendimento.senha_autorizacao || '-'}</span>
                    <span>Valor: R$ {Number(atendimento.valor_total || 0).toFixed(2)}</span>
                    <span>Itens: {itens.length}</span>
                  </div>
                  {itens.length > 0 && (
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 space-y-1">
                      {itens.map((item, idx) => (
                        <div key={`${item.codigo}-${idx}`} className="flex justify-between gap-3 text-xs">
                          <span className="text-gray-700 dark:text-gray-200">{item.codigo} - {item.nome || item.descricao}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{item.quantidade || 1}x R$ {Number(item.valor_total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {atendimentos.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhum atendimento faturável encontrado.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-cyan-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Agendamentos</h3>
            </div>
            <div className="divide-y dark:divide-gray-700 max-h-72 overflow-y-auto">
              {agendamentos.map(agendamento => (
                <div key={agendamento.id} className="p-4 flex justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{formatarData(agendamento.data_agendamento)} às {agendamento.hora_inicio}</p>
                    <p className="text-xs text-gray-500">{agendamento.tipo} • {agendamento.prestador_nome || '-'} • {agendamento.convenio_nome || 'Sem convênio'} • Carteira {agendamento.paciente_carteira || '-'}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 h-fit">{agendamento.status}</span>
                </div>
              ))}
              {agendamentos.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhum agendamento encontrado.</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Prontuários</h3>
            </div>
            <div className="divide-y dark:divide-gray-700 max-h-72 overflow-y-auto">
              {prontuarios.map(prontuario => (
                <div key={prontuario.id} className="p-4 space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2"><ClockIcon className="w-4 h-4" /> {formatarData(prontuario.data_atendimento)}</p>
                  <p className="text-xs text-gray-500">Status: {prontuario.status || '-'}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{prontuario.conduta || prontuario.diagnostico_principal || prontuario.observacoes || 'Sem descrição clínica registrada.'}</p>
                </div>
              ))}
              {prontuarios.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhum prontuário encontrado.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
