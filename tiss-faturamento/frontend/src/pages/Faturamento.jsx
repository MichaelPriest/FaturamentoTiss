// src/pages/Faturamento.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DocumentArrowDownIcon,
  PaperAirplaneIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentPlusIcon,
  ReceiptPercentIcon,
  BanknotesIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LockClosedIcon,
  LockOpenIcon,
  XCircleIcon,
  PrinterIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { gerarXMLTISS, converterAtendimentoParaTISS, setVersao } from '../lib/tissGenerator';
import { imprimirGuiaTISSOficial, imprimirMultiplasGuiasTISS } from '../components/ImpressaoGuiaTISS';
import { imprimirContaFaturada } from '../components/ImpressaoContaFaturada';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';

// ============================================
// MAPA DE CÓDIGOS CBOS (TISS)
// ============================================
const CBOS_MAP = {
  "201115": "Geneticista",
  "203015": "Pesquisador em biologia de microorganismos e parasitas",
  "213150": "Físico médico",
  "221105": "Biólogo",
  "221205": "Biomédico",
  "223204": "Cirurgião dentista - auditor",
  "223208": "Cirurgião dentista - clínico geral",
  "223212": "Cirurgião dentista - endodontista",
  "223216": "Cirurgião dentista - epidemiologista",
  "223220": "Cirurgião dentista - estomatologista",
  "223224": "Cirurgião dentista - implantodontista",
  "223228": "Cirurgião dentista - odontogeriatra",
  "223232": "Cirurgião dentista - odontologista legal",
  "223236": "Cirurgião dentista - odontopediatra",
  "223240": "Cirurgião dentista - ortopedista e ortodontista",
  "223244": "Cirurgião dentista - patologista bucal",
  "223248": "Cirurgião dentista - periodontista",
  "223252": "Cirurgião dentista - protesiólogo bucomaxilofacial",
  "223256": "Cirurgião dentista - protesista",
  "223260": "Cirurgião dentista - radiologista",
  "223264": "Cirurgião dentista - reabilitador oral",
  "223268": "Cirurgião dentista - traumatologista bucomaxilofacial",
  "223272": "Cirurgião dentista de saúde coletiva",
  "223276": "Cirurgião dentista - odontologia do trabalho",
  "223280": "Cirurgião dentista - dentística",
  "223284": "Cirurgião dentista - disfunção temporomandibular e dor orofacial",
  "223288": "Cirurgião dentista - odontologia para pacientes com necessidades especiais",
  "223293": "Cirurgião-dentista da estratégia de saúde da família",
  "223405": "Farmacêutico",
  "223415": "Farmacêutico analista clínico",
  "223420": "Farmacêutico de alimentos",
  "223425": "Farmacêutico práticas integrativas e complementares",
  "223430": "Farmacêutico em saúde pública",
  "223435": "Farmacêutico industrial",
  "223440": "Farmacêutico toxicologista",
  "223445": "Farmacêutico hospitalar e clínico",
  "223505": "Enfermeiro",
  "223510": "Enfermeiro auditor",
  "223515": "Enfermeiro de bordo",
  "223520": "Enfermeiro de centro cirúrgico",
  "223525": "Enfermeiro de terapia intensiva",
  "223530": "Enfermeiro do trabalho",
  "223535": "Enfermeiro nefrologista",
  "223540": "Enfermeiro neonatologista",
  "223545": "Enfermeiro obstétrico",
  "223550": "Enfermeiro psiquiátrico",
  "223555": "Enfermeiro puericultor e pediátrico",
  "223560": "Enfermeiro sanitarista",
  "223565": "Enfermeiro da estratégia de saúde da família",
  "223570": "Perfusionista",
  "223575": "Obstetriz",
  "223605": "Fisioterapeuta geral",
  "223620": "Peripatologista",
  "223625": "Fisioterapeuta respiratória",
  "223630": "Fisioterapeuta neurofuncional",
  "223635": "Fisioterapeuta traumato-ortopédica funcional",
  "223640": "Fisioterapeuta osteopata",
  "223645": "Fisioterapeuta quiropraxista",
  "223650": "Fisioterapeuta acupunturista",
  "223655": "Fisioterapeuta esportivo",
  "223660": "Fisioterapeuta do trabalho",
  "223705": "Dietista",
  "223710": "Nutricionista",
  "223810": "Fonoaudiólogo",
  "223815": "Fonoaudiólogo educacional",
  "223820": "Fonoaudiólogo em audiologia",
  "223825": "Fonoaudiólogo em disfagia",
  "223830": "Fonoaudiólogo em linguagem",
  "223835": "Fonoaudiólogo em motricidade orofacial",
  "223840": "Fonoaudiólogo em saúde coletiva",
  "223845": "Fonoaudiólogo em voz",
  "223905": "Terapeuta ocupacional",
  "223910": "Ortoptista",
  "223915": "Psicomotricista",
  "224105": "Avaliador físico",
  "224110": "Ludomotricista",
  "224115": "Preparador de atleta",
  "224120": "Preparador físico",
  "224125": "Técnico de desporto individual e coletivo (exceto futebol)",
  "224130": "Técnico de laboratório e fiscalização desportiva",
  "224135": "Treinador profissional de futebol",
  "224140": "Profissional de educação física na saúde",
  "225103": "Médico infectologista",
  "225105": "Médico acupunturista",
  "225106": "Médico legista",
  "225109": "Médico nefrologista",
  "225110": "Médico alergista e imunologista",
  "225112": "Médico neurologista",
  "225115": "Médico angiologista",
  "225118": "Médico nutrologista",
  "225120": "Médico cardiologista",
  "225121": "Médico oncologista",
  "225122": "Médico cancerologista pediátrico",
  "225124": "Médico pediatra",
  "225125": "Médico clínico",
  "225127": "Médico pneumologista",
  "225130": "Médico de família e comunidade",
  "225133": "Médico psiquiatra",
  "225135": "Médico dermatologista",
  "225136": "Médico reumatologista",
  "225139": "Médico sanitarista",
  "225140": "Médico do trabalho",
  "225142": "Médico da estratégia de saúde da família",
  "225145": "Médico em medicina de tráfego",
  "225148": "Médico anatomopatologista",
  "225150": "Médico em medicina intensiva",
  "225151": "Médico anestesiologista",
  "225154": "Médico antroposófico",
  "225155": "Médico endocrinologista e metabologista",
  "225160": "Médico fisiatra",
  "225165": "Médico gastroenterologista",
  "225170": "Médico generalista",
  "225175": "Médico geneticista",
  "225180": "Médico geriatra",
  "225185": "Médico hematologista",
  "225190": "Médico hemoterapeuta",
  "225195": "Médico homeopata",
  "225203": "Médico em cirurgia vascular",
  "225210": "Médico cirurgião cardiovascular",
  "225215": "Médico cirurgião de cabeça e pescoço",
  "225220": "Médico cirurgião do aparelho digestivo",
  "225225": "Médico cirurgião geral",
  "225230": "Médico cirurgião pediátrico",
  "225235": "Médico cirurgião plástico",
  "225240": "Médico cirurgião torácico",
  "225245": "Médico foniatra",
  "225250": "Médico ginecologista e obstetra",
  "225255": "Médico mastologista",
  "225260": "Médico neurocirurgião",
  "225265": "Médico oftalmologista",
  "225270": "Médico ortopedista e traumatologista",
  "225275": "Médico otorrinolaringologista",
  "225280": "Médico proctologista",
  "225285": "Médico urologista",
  "225290": "Médico cancerologista cirúrgico",
  "225295": "Médico cirurgião da mão",
  "225305": "Médico citopatologista",
  "225310": "Médico em endoscopia",
  "225315": "Médico em medicina nuclear",
  "225320": "Médico em radiologia e diagnóstico por imagem",
  "225325": "Médico patologista clínico",
  "225330": "Médico radioterapeuta",
  "225335": "Médico patologista clínico / medicina laboratorial",
  "225340": "Médico hemoterapeuta",
  "225345": "Médico hiperbarista",
  "225350": "Médico neurofisiologista",
  "225355": "Médico radiologista intervencionista",
  "226105": "Quiropraxista",
  "226110": "Osteopata",
  "226305": "Musicoterapeuta",
  "226310": "Arteterapeuta",
  "226315": "Equoterapeuta",
  "226320": "Naturologo",
  "239425": "Psicopedagogo",
  "239440": "Neuropsicopedagogo clínico",
  "239445": "Neuropsicopedagogo institucional",
  "251510": "Psicólogo clínico",
  "251545": "Neuropsicólogo",
  "251550": "Psicanalista",
  "251555": "Psicólogo acupunturista",
  "251605": "Assistente social",
  "322120": "Massoterapeuta",
  "322125": "Terapeuta holístico",
  "322135": "Doula",
  "322205": "Técnico de enfermagem",
  "322220": "Técnico de enfermagem psiquiátrica",
  "322225": "Instrumentador cirúrgico",
  "322230": "Auxiliar de enfermagem",
  "516210": "Cuidador de idosos"
};

const MAX_GUIAS_POR_LOTE = 100;

export default function Faturamento() {
  const { unidadeAtualId } = useUnidade();
  const [atendimentos, setAtendimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [buscandoLote, setBuscandoLote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guiasGeradas, setGuiasGeradas] = useState([]);
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('todos');
  const [filtroPrestador, setFiltroPrestador] = useState('todos');
  const [filtroTipoAtendimento, setFiltroTipoAtendimento] = useState('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [ordem, setOrdem] = useState('guia');
  const [ordemDirecao, setOrdemDirecao] = useState('asc');
  const [versaoTISS, setVersaoTISS] = useState('4.03.00');
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [showPreviaModal, setShowPreviaModal] = useState(false);
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);
  const [showHistoricoLogs, setShowHistoricoLogs] = useState(false);
  const [showGerarPorLote, setShowGerarPorLote] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [sequencialGlobal, setSequencialGlobal] = useState(1);
  const [logsLotes, setLogsLotes] = useState([]);
  const [numeroLoteBusca, setNumeroLoteBusca] = useState('');
  const [loteEncontrado, setLoteEncontrado] = useState(null);
  const [numeroLotePreview, setNumeroLotePreview] = useState('');
  const [configClinica, setConfigClinica] = useState({});

  const [dadosFatura, setDadosFatura] = useState({
    competencia: format(new Date(), 'yyyy-MM'),
    dataFechamento: format(new Date(), 'yyyy-MM-dd'),
    dataPrevisaoPagamento: '',
    baseCalculo: 0,
    aliquotaISS: 5,
    valorISS: 0,
    aliquotaIBS: 0,
    valorIBS: 0,
    aliquotaCBS: 0,
    valorCBS: 0,
    aliquotaIR: 1.5,
    valorIR: 0,
    aliquotaCSLL: 1,
    valorCSLL: 0,
    aliquotaPIS: 0.65,
    valorPIS: 0,
    aliquotaCOFINS: 3,
    valorCOFINS: 0,
    valorLiquido: 0,
    observacoes: ''
  });

  // ============================================
  // FUNÇÕES DE VALIDAÇÃO
  // ============================================

  const validarDadosImpressao = useCallback((atendimento, convenio) => {
    if (!atendimento) {
      toast.error('Dados do atendimento não encontrados');
      return false;
    }
    if (!convenio) {
      toast.error('Dados do convênio não encontrados');
      return false;
    }
    
    try {
      const itens = typeof atendimento.itens === 'string' 
        ? JSON.parse(atendimento.itens) 
        : atendimento.itens;
      
      if (!itens || itens.length === 0) {
        toast.error('Atendimento sem itens para faturar');
        return false;
      }
    } catch (e) {
      console.error('Erro ao validar itens:', e);
      toast.error('Erro ao validar dados do atendimento');
      return false;
    }
    
    return true;
  }, []);

  // ============================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================

  const carregarConfigClinica = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'config_sistema')
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.valor) {
        setConfigClinica(JSON.parse(data.valor));
      }
    } catch (error) {
      console.error('Erro ao carregar config clínica:', error);
      toast.error('Erro ao carregar configurações da clínica');
    }
  };

  const carregarSequencial = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'sequencial_faturamento')
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.valor) {
        setSequencialGlobal(parseInt(data.valor));
      }
    } catch (error) {
      console.error('Erro ao carregar sequencial:', error);
      toast.error('Erro ao carregar sequencial de faturamento');
    }
  };

  const carregarBloqueados = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'guias_bloqueadas')
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.valor) {
        const bloqueadosList = JSON.parse(data.valor);
        setBloqueados(Array.isArray(bloqueadosList) ? bloqueadosList : []);
      } else {
        setBloqueados([]);
      }
    } catch (error) {
      console.error('Erro ao carregar bloqueados:', error);
      setBloqueados([]);
    }
  };

  const carregarLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs_faturamento')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setLogsLotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setLogsLotes([]);
    }
  };

  const carregarDados = async () => {
    try {
      const [atendimentosRes, conveniosRes, prestadoresRes, procedimentosRes] = await Promise.all([
        supabase.from('atendimentos').select('*').eq('status', 'faturado').order('created_at', { ascending: false }),
        supabase.from('convenios').select('*').eq('ativo', true).order('razao_social'),
        supabase.from('prestadores').select('*').order('nome'),
        supabase.from('procedimentos').select('*').order('nome')
      ]);

      if (atendimentosRes.error) throw atendimentosRes.error;
      if (conveniosRes.error) throw conveniosRes.error;
      if (prestadoresRes.error) throw prestadoresRes.error;
      if (procedimentosRes.error) throw procedimentosRes.error;

      setAtendimentos(filterByUnidade(atendimentosRes.data || [], unidadeAtualId));
      setConvenios(filterByUnidade(conveniosRes.data || [], unidadeAtualId));
      setPrestadores(filterByUnidade(prestadoresRes.data || [], unidadeAtualId));
      setProcedimentos(filterByUnidade(procedimentosRes.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setAtendimentos([]);
      setConvenios([]);
      setPrestadores([]);
      setProcedimentos([]);
    }
  };

  const carregarVersao = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'versao_tiss')
        .maybeSingle();
      
      if (error) throw error;
      if (data?.valor) setVersaoTISS(data.valor);
    } catch (error) {
      console.error('Erro ao carregar versão:', error);
    }
  };

  const carregarLotes = async () => {
    try {
      const { data, error } = await supabase
        .from('lotes_faturamento')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setGuiasGeradas(data || []);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      setGuiasGeradas([]);
    }
  };

  // ============================================
  // FUNÇÕES DE UTILIDADE
  // ============================================

  const gerarNumeroLote = (contador) => {
    return contador.toString().padStart(12, '0');
  };

  const getProfissionalExibicao = (atendimento) => {
    let nome = '-';
    let cbosDescricao = '';

    try {
      const itens = typeof atendimento.itens === 'string'
        ? JSON.parse(atendimento.itens)
        : atendimento.itens;

      if (Array.isArray(itens) && itens.length > 0) {
        const primeiro = itens[0];
        nome = primeiro.prestador_nome || '-';
        const cbos = primeiro.prestador_cbos;
        if (cbos && CBOS_MAP[cbos]) {
          cbosDescricao = CBOS_MAP[cbos];
        } else if (cbos) {
          cbosDescricao = `CBO ${cbos}`;
        }
      }
    } catch (e) {
      console.warn('Erro ao extrair profissional/CBO:', e);
    }

    return cbosDescricao ? `${nome} / ${cbosDescricao}` : nome;
  };

  const calcularImpostos = (baseCalculo, aliquotaISS, aliquotaIBS, aliquotaCBS, aliquotaIR, aliquotaCSLL, aliquotaPIS, aliquotaCOFINS) => {
    const iss = (baseCalculo * aliquotaISS) / 100;
    const ibs = (baseCalculo * aliquotaIBS) / 100;
    const cbs = (baseCalculo * aliquotaCBS) / 100;
    const ir = (baseCalculo * aliquotaIR) / 100;
    const csll = (baseCalculo * aliquotaCSLL) / 100;
    const pis = (baseCalculo * aliquotaPIS) / 100;
    const cofins = (baseCalculo * aliquotaCOFINS) / 100;
    const totalImpostos = iss + ibs + cbs + ir + csll + pis + cofins;
    const valorLiquido = baseCalculo - totalImpostos;
    return { iss, ibs, cbs, ir, csll, pis, cofins, totalImpostos, valorLiquido };
  };

  const atualizarTodosImpostos = (baseCalculo) => {
    setDadosFatura(prev => {
      const impostos = calcularImpostos(
        baseCalculo,
        prev.aliquotaISS,
        prev.aliquotaIBS,
        prev.aliquotaCBS,
        prev.aliquotaIR,
        prev.aliquotaCSLL,
        prev.aliquotaPIS,
        prev.aliquotaCOFINS
      );
      return {
        ...prev,
        baseCalculo: baseCalculo,
        valorISS: impostos.iss,
        valorIBS: impostos.ibs,
        valorCBS: impostos.cbs,
        valorIR: impostos.ir,
        valorCSLL: impostos.csll,
        valorPIS: impostos.pis,
        valorCOFINS: impostos.cofins,
        valorLiquido: impostos.valorLiquido
      };
    });
  };

  const atualizarAliquota = (campo, valor) => {
    const novaAliquota = parseFloat(valor) || 0;

    setDadosFatura(prev => {
      const novosDados = { ...prev, [campo]: novaAliquota };
      const impostos = calcularImpostos(
        novosDados.baseCalculo,
        campo === 'aliquotaISS' ? novaAliquota : novosDados.aliquotaISS,
        campo === 'aliquotaIBS' ? novaAliquota : novosDados.aliquotaIBS,
        campo === 'aliquotaCBS' ? novaAliquota : novosDados.aliquotaCBS,
        campo === 'aliquotaIR' ? novaAliquota : novosDados.aliquotaIR,
        campo === 'aliquotaCSLL' ? novaAliquota : novosDados.aliquotaCSLL,
        campo === 'aliquotaPIS' ? novaAliquota : novosDados.aliquotaPIS,
        campo === 'aliquotaCOFINS' ? novaAliquota : novosDados.aliquotaCOFINS
      );
      return {
        ...novosDados,
        valorISS: impostos.iss,
        valorIBS: impostos.ibs,
        valorCBS: impostos.cbs,
        valorIR: impostos.ir,
        valorCSLL: impostos.csll,
        valorPIS: impostos.pis,
        valorCOFINS: impostos.cofins,
        valorLiquido: impostos.valorLiquido
      };
    });
  };

  const salvarBloqueados = async (bloqueadosList) => {
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert([
          {
            chave: 'guias_bloqueadas',
            valor: JSON.stringify(bloqueadosList),
            descricao: 'Lista de guias bloqueadas para faturamento',
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'chave' });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar bloqueados:', error);
      toast.error('Erro ao salvar lista de bloqueados');
    }
  };

  const atualizarSequencial = async (novoSequencial) => {
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert([
          {
            chave: 'sequencial_faturamento',
            valor: novoSequencial.toString(),
            descricao: 'Contador de números de lote TISS',
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'chave' });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar sequencial:', error);
      toast.error('Erro ao atualizar sequencial de faturamento');
    }
  };

  const registrarLog = async (acao, lote, detalhes) => {
    try {
      const { error } = await supabase
        .from('logs_faturamento')
        .insert({
          acao,
          numero_lote: lote.numero_lote,
          convenio_nome: lote.convenio_nome,
          quantidade_guias: lote.quantidade_guias,
          valor_total: lote.dados_fatura?.base_calculo,
          detalhes,
          usuario: 'sistema',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      await carregarLogs();
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  // ============================================
  // FUNÇÕES DE IMPRESSÃO
  // ============================================

  const handleImprimirGuia = (atendimento) => {
    const convenio = convenios.find(c => c.id === atendimento.paciente_convenio_id);
    
    if (!validarDadosImpressao(atendimento, convenio)) return;
    
    imprimirGuiaTISSOficial(atendimento, convenio, configClinica);
    toast.success('Enviando guia para impressão...');
  };

  const handleImprimirGuiasSelecionadas = () => {
    if (selecionados.length === 0) {
      toast.error('Nenhuma guia selecionada');
      return;
    }
    
    const guiasSelecionadas = pendentes.filter(a => selecionados.includes(a.id));
    const convenio = convenios.find(c => c.id === guiasSelecionadas[0]?.paciente_convenio_id);
    
    if (!validarDadosImpressao(guiasSelecionadas[0], convenio)) return;
    
    imprimirMultiplasGuiasTISS(guiasSelecionadas, convenio, configClinica);
    toast.success(`${guiasSelecionadas.length} guia(s) enviada(s) para impressão...`);
  };

  const handleImprimirLote = async (lote) => {
    setImprimindo(true);
    
    try {
      const { data: guiasDoLote, error } = await supabase
        .from('atendimentos')
        .select('*')
        .in('id', lote.guias_ids || []);
      
      if (error) throw error;
      
      if (!guiasDoLote || guiasDoLote.length === 0) {
        toast.error('Nenhuma guia encontrada para este lote');
        return;
      }
      
      const convenio = convenios.find(c => c.id === lote.convenio_id);
      
      if (!validarDadosImpressao(guiasDoLote[0], convenio)) return;
      
      // Garantir que a configuração da clínica está carregada
      let configClinicaAtual = configClinica;
      if (!configClinicaAtual?.cnes) {
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'config_sistema')
          .maybeSingle();
        if (configData?.valor) {
          configClinicaAtual = JSON.parse(configData.valor);
          setConfigClinica(configClinicaAtual);
        }
      }
      
      imprimirMultiplasGuiasTISS(guiasDoLote, convenio, configClinicaAtual);
      toast.success(`Imprimindo ${guiasDoLote.length} guia(s) do lote...`);
    } catch (error) {
      console.error('Erro ao imprimir lote:', error);
      toast.error('Erro ao imprimir lote');
    } finally {
      setImprimindo(false);
    }
  };

  const handleImprimirConta = (lote) => {
    // Buscar os atendimentos do lote para pegar os itens
    const atendimentosDoLote = atendimentos.filter(a => lote.guias_ids?.includes(a.id));
    
    // Coletar todos os itens dos atendimentos
    const todosItens = [];
    atendimentosDoLote.forEach(atendimento => {
      const itens = typeof atendimento.itens === 'string' 
        ? JSON.parse(atendimento.itens) 
        : (atendimento.itens || []);
      todosItens.push(...itens);
    });
    
    // Calcular total geral
    const totalGeral = todosItens.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    
    // Buscar dados do paciente (primeiro atendimento do lote)
    const primeiroAtendimento = atendimentosDoLote[0];
    const paciente = {
      nome: primeiroAtendimento?.paciente_nome || '',
      numero_carteira: primeiroAtendimento?.numero_carteira || '',
      cpf: primeiroAtendimento?.cpf || '',
      data_nascimento: primeiroAtendimento?.data_nascimento || ''
    };
    
    // Buscar dados do convênio
    const convenio = convenios.find(c => c.id === lote.convenio_id);
    
    // Buscar dados da clínica (config)
    const clinica = {
      nome_empresa: configClinica.nome_empresa || '',
      nome_contratado: configClinica.nome_contratado || '',
      cnpj: configClinica.cnpj || '',
      cnes: configClinica.cnes || ''
    };
    
    // Preparar dados da conta
    const dadosConta = {
      numero_conta: lote.numero_lote,
      data_emissao: lote.data_envio || new Date().toISOString(),
      status: 'faturado',
      paciente,
      convenio: {
        razao_social: lote.convenio_nome,
        registro_ans: convenio?.registro_ans || '',
        codigo_prestador: convenio?.codigo_prestador || ''
      },
      clinica,
      itens: todosItens.map(item => ({
        data_execucao: item.data_execucao || '',
        codigo: item.codigo || '',
        nome: item.nome || '',
        quantidade: item.quantidade || 1,
        valor_unitario: item.valor_unitario || 0,
        valor_total: item.valor_total || 0
      })),
      subtotal: totalGeral,
      total_geral: totalGeral,
      observacoes: `Lote referente às guias: ${lote.guias_ids?.join(', ') || ''}`,
      logo_base64: convenio?.logo_base64 || configClinica.logo_base64
    };
    
    imprimirContaFaturada(dadosConta);
    toast.success('Conta faturada enviada para impressão!');
  };

  const handleImprimirContaIndividual = (atendimento) => {
    // Criar um objeto lote simulado para este atendimento individual
    const convenio = convenios.find(c => c.id === atendimento.paciente_convenio_id);
    const itens = typeof atendimento.itens === 'string' 
      ? JSON.parse(atendimento.itens) 
      : (atendimento.itens || []);
    
    const paciente = {
      nome: atendimento.paciente_nome || '',
      numero_carteira: atendimento.numero_carteira || '',
      cpf: atendimento.cpf || '',
      data_nascimento: atendimento.data_nascimento || ''
    };
    
    const clinica = {
      nome_empresa: configClinica.nome_empresa || '',
      nome_contratado: configClinica.nome_contratado || '',
      cnpj: configClinica.cnpj || '',
      cnes: configClinica.cnes || ''
    };
    
    const dadosConta = {
      numero_conta: atendimento.numero_guia_prestador || `GUI-${atendimento.id}`,
      data_emissao: new Date().toISOString(),
      status: 'faturado',
      paciente,
      convenio: {
        razao_social: convenio?.razao_social || '',
        registro_ans: convenio?.registro_ans || '',
        codigo_prestador: convenio?.codigo_prestador || ''
      },
      clinica,
      itens: itens.map(item => ({
        data_execucao: item.data_execucao || '',
        codigo: item.codigo || '',
        nome: item.nome || '',
        quantidade: item.quantidade || 1,
        valor_unitario: item.valor_unitario || 0,
        valor_total: item.valor_total || 0
      })),
      subtotal: atendimento.valor_total || 0,
      total_geral: atendimento.valor_total || 0,
      observacoes: `Guia: ${atendimento.numero_guia_prestador || 'N/A'}`,
      logo_base64: convenio?.logo_base64 || configClinica.logo_base64
    };
    
    imprimirContaFaturada(dadosConta);
    toast.success('Conta faturada enviada para impressão!');
  };

  // ============================================
  // FUNÇÕES DE FILTRAGEM E SELEÇÃO
  // ============================================

  const pendentes = Array.isArray(atendimentos) ? atendimentos.filter(a => a.status === 'faturado') : [];
  const todosAtendimentos = [...pendentes, ...(Array.isArray(atendimentos) ? atendimentos.filter(a => bloqueados.includes(a.id) && a.status === 'faturado') : [])];

  const pendentesFiltrados = useMemo(() => {
    let filtrados = [...todosAtendimentos];

    if (filtroConvenio !== 'todos') {
      filtrados = filtrados.filter(a => a.paciente_convenio_id === parseInt(filtroConvenio));
    }
    if (filtroEspecialidade !== 'todos') {
      filtrados = filtrados.filter(a => a.prestador_especialidade === filtroEspecialidade);
    }
    if (filtroPrestador !== 'todos') {
      filtrados = filtrados.filter(a => a.prestador_id === parseInt(filtroPrestador));
    }
    if (filtroTipoAtendimento !== 'todos') {
      filtrados = filtrados.filter(a => a.tipo_atendimento === filtroTipoAtendimento);
    }
    if (filtroDataInicio) {
      filtrados = filtrados.filter(a => a.data_atendimento >= filtroDataInicio);
    }
    if (filtroDataFim) {
      filtrados = filtrados.filter(a => a.data_atendimento <= filtroDataFim);
    }

    filtrados.sort((a, b) => {
      let valorA, valorB;
      switch (ordem) {
        case 'guia':
          valorA = a.numero_guia_prestador || '';
          valorB = b.numero_guia_prestador || '';
          break;
        case 'alfabetica':
          valorA = a.paciente_nome || '';
          valorB = b.paciente_nome || '';
          break;
        case 'atendimento':
          valorA = a.data_atendimento || '';
          valorB = b.data_atendimento || '';
          break;
        case 'valor':
          valorA = a.valor_total || 0;
          valorB = b.valor_total || 0;
          break;
        default:
          valorA = a.numero_guia_prestador || '';
          valorB = b.numero_guia_prestador || '';
      }
      if (ordemDirecao === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });

    return filtrados;
  }, [todosAtendimentos, filtroConvenio, filtroEspecialidade, filtroPrestador, filtroTipoAtendimento, filtroDataInicio, filtroDataFim, ordem, ordemDirecao]);

  const pendentesPorConvenio = useMemo(() => {
    return pendentesFiltrados.reduce((acc, a) => {
      const convenioId = a.paciente_convenio_id;
      if (!acc[convenioId]) acc[convenioId] = [];
      acc[convenioId].push(a);
      return acc;
    }, {});
  }, [pendentesFiltrados]);

  const previewData = useMemo(() => {
    if (selecionados.length === 0) return null;
    const atendimentosSelecionados = pendentes.filter(a => selecionados.includes(a.id));
    const valorTotal = atendimentosSelecionados.reduce((sum, a) => sum + (a.valor_total || 0), 0);

    return {
      atendimentos: atendimentosSelecionados,
      valorTotal,
      quantidade: atendimentosSelecionados.length,
      conveniosAgrupados: atendimentosSelecionados.reduce((acc, a) => {
        const convenioId = a.paciente_convenio_id;
        if (!acc[convenioId]) {
          acc[convenioId] = {
            convenio: convenios.find(c => c.id === convenioId),
            atendimentos: [],
            valorTotal: 0
          };
        }
        acc[convenioId].atendimentos.push(a);
        acc[convenioId].valorTotal += (a.valor_total || 0);
        return acc;
      }, {})
    };
  }, [selecionados, pendentes, convenios]);

  const totalSelecionados = selecionados.length;
  const totalPendentes = pendentes.length;
  const valorTotalPendente = pendentes.reduce((sum, a) => sum + (a.valor_total || 0), 0);

  // ============================================
  // FUNÇÕES DE INTERAÇÃO
  // ============================================

  const toggleBloqueio = async (id) => {
    let novosBloqueados;
    if (bloqueados.includes(id)) {
      novosBloqueados = bloqueados.filter(b => b !== id);
      toast.info('Guia desbloqueada');
    } else {
      novosBloqueados = [...bloqueados, id];
      toast.info('Guia bloqueada');
    }
    setBloqueados(novosBloqueados);
    await salvarBloqueados(novosBloqueados);
  };

  const selecionarTodos = () => {
    const ids = pendentesFiltrados.filter(a => !bloqueados.includes(a.id)).map(a => a.id);
    setSelecionados(ids);
  };

  const desmarcarTodos = () => {
    setSelecionados([]);
  };

  const selecionarBloqueados = () => {
    setSelecionados(bloqueados);
  };

  const handleSelectItem = (id) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(i => i !== id));
    } else {
      if (selecionados.length < MAX_GUIAS_POR_LOTE) {
        setSelecionados([...selecionados, id]);
      } else {
        toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote`);
      }
    }
  };

  const abrirPrevia = () => {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos uma guia para faturar');
      return;
    }
    if (previewData) {
      const primeiroNumero = gerarNumeroLote(sequencialGlobal);
      setNumeroLotePreview(primeiroNumero);
      atualizarTodosImpostos(previewData.valorTotal);
      setShowPreviaModal(true);
    }
  };

  const imprimirRelacao = () => {
    if (!previewData) return;

    const printWindow = window.open('', '_blank');
    let conteudo = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relação de Faturamento</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { text-align: center; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          .total { font-weight: bold; text-align: right; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Sistema de Faturamento TISS</h1>
        <h2>Relação de Guias para Faturamento</h2>
        <p><strong>Data da relação:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Número do Lote:</strong> ${numeroLotePreview}</p>
        <p><strong>Total de guias:</strong> ${previewData.quantidade}</p>
        <p><strong>Valor total:</strong> R$ ${previewData.valorTotal.toFixed(2)}</p>
    `;

    Object.entries(previewData.conveniosAgrupados).forEach(([convenioId, data]) => {
      conteudo += `
        <h3>Convênio: ${data.convenio?.razao_social || 'Desconhecido'}</h3>
        <table>
          <thead>
            <tr>
              <th>Nº Guia</th>
              <th>Nº Guia Operadora</th>
              <th>Senha</th>
              <th>Data</th>
              <th>Paciente</th>
              <th>Carteira</th>
              <th>Profissional / Especialidade</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
      `;
      data.atendimentos.forEach(a => {
        const profissionalExibir = getProfissionalExibicao(a);
        conteudo += `
          <tr>
            <td>${a.numero_guia_prestador || '-'}</td>
            <td>${a.numero_guia_operadora || '-'}</td>
            <td>${a.senha_autorizacao || '-'}</td>
            <td>${a.data_atendimento || '-'}</td>
            <td>${a.paciente_nome || '-'}</td>
            <td>${a.numero_carteira || '-'}</td>
            <td>${profissionalExibir}</td>
            <td style="text-align: right;">R$ ${(a.valor_total || 0).toFixed(2)}</td>
          </tr>
        `;
      });
      conteudo += `
          </tbody>
          <tfoot><tr><td colspan="7" class="total">Total:</td><td class="total">R$ ${data.valorTotal.toFixed(2)}</td></tr></tfoot>
        </table>
      `;
    });

    conteudo += `<div class="footer"><p>Sistema de Faturamento TISS</p></div><script>window.onload = function() { window.print(); window.close(); };</script></body></html>`;
    printWindow.document.write(conteudo);
    printWindow.document.close();
  };

  const confirmarGeracaoLote = async () => {
    if (!previewData) return;

    setGerando(true);
    setShowPreviaModal(false);

    try {
      const atendimentosPorConvenio = previewData.conveniosAgrupados;
      let currentCounter = parseInt(numeroLotePreview) || sequencialGlobal;
      const lotesGerados = [];

      for (const [convenioId, data] of Object.entries(atendimentosPorConvenio)) {
        const convenio = data.convenio;

        if (!convenio || !convenio.codigo_prestador) {
          toast.error(`Convênio ${convenio?.razao_social || 'Desconhecido'} não possui código de prestador`);
          continue;
        }

        const numeroLote = gerarNumeroLote(currentCounter);
        currentCounter++;

        const guias = data.atendimentos.map((atendimento, index) => ({
          ...converterAtendimentoParaTISS(atendimento, convenio),
          codigoPrestadorExecutante: convenio.codigo_prestador,
          versao: versaoTISS,
          sequencialTransacao: String(index + 1).padStart(4, '0')
        }));

        const xml = gerarXMLTISS({
          versao: versaoTISS,
          codigoPrestadorNaOperadora: convenio.codigo_prestador,
          registroANS: convenio.registro_ans,
          numeroLote: numeroLote,
          guias: guias,
          convenio: convenio
        });

        const nomeArquivo = `${numeroLote}_${convenio.registro_ans}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xml`;

        const novoLote = {
          convenio_id: parseInt(convenioId),
          convenio_nome: convenio.razao_social,
          numero_lote: numeroLote,
          data_envio: format(new Date(), 'yyyy-MM-dd'),
          quantidade_guias: data.atendimentos.length,
          guias_ids: data.atendimentos.map(a => a.id),
          xml_content: xml,
          status: 'faturado',
          versao: versaoTISS,
          dados_fatura: {
            competencia: dadosFatura.competencia,
            data_fechamento: dadosFatura.dataFechamento,
            data_previsao_pagamento: dadosFatura.dataPrevisaoPagamento,
            base_calculo: dadosFatura.baseCalculo,
            aliquota_iss: dadosFatura.aliquotaISS,
            valor_iss: dadosFatura.valorISS,
            aliquota_ibs: dadosFatura.aliquotaIBS,
            valor_ibs: dadosFatura.valorIBS,
            aliquota_cbs: dadosFatura.aliquotaCBS,
            valor_cbs: dadosFatura.valorCBS,
            aliquota_ir: dadosFatura.aliquotaIR,
            valor_ir: dadosFatura.valorIR,
            aliquota_csll: dadosFatura.aliquotaCSLL,
            valor_csll: dadosFatura.valorCSLL,
            aliquota_pis: dadosFatura.aliquotaPIS,
            valor_pis: dadosFatura.valorPIS,
            aliquota_cofins: dadosFatura.aliquotaCOFINS,
            valor_cofins: dadosFatura.valorCOFINS,
            valor_liquido: dadosFatura.valorLiquido,
            observacoes: dadosFatura.observacoes
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase.from('lotes_faturamento').insert([applyUnidadeToPayload(novoLote, unidadeAtualId)]);
        
        if (insertError) throw insertError;
        
        lotesGerados.push(novoLote);

        await registrarLog('GERACAO_LOTE', novoLote, `Lote gerado com ${data.atendimentos.length} guias`);

        const ids = data.atendimentos.map(a => a.id).filter(id => id != null);
        if (ids.length > 0) {
          const updateQuery = supabase
            .from('atendimentos')
            .update({
              status: 'finalizado',
              data_faturamento: format(new Date(), 'yyyy-MM-dd'),
              updated_at: new Date().toISOString()
            });

          if (ids.length === 1) {
            await updateQuery.eq('id', ids[0]);
          } else {
            await updateQuery.in('id', ids);
          }
        }

        const novosBloqueados = bloqueados.filter(id => !ids.includes(id));
        setBloqueados(novosBloqueados);
        await salvarBloqueados(novosBloqueados);

        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        a.click();
        URL.revokeObjectURL(url);
      }

      await atualizarSequencial(currentCounter);
      setSequencialGlobal(currentCounter);
      await carregarLotes();
      await carregarDados();

      setSelecionados([]);

      toast.success(`${lotesGerados.length} lote(s) gerado(s) com sucesso!`);

      if (confirm('Deseja imprimir a relação das guias faturadas?')) {
        setTimeout(() => imprimirRelacao(), 500);
      }
    } catch (error) {
      console.error('Erro ao gerar lote:', error);
      toast.error('Erro ao gerar lote: ' + error.message);
    } finally {
      setGerando(false);
    }
  };

  const buscarLoteParaRegenerar = async () => {
    if (!numeroLoteBusca?.trim()) {
      toast.error('Digite o número do lote');
      return;
    }

    setBuscandoLote(true);

    try {
      const { data, error } = await supabase
        .from('lotes_faturamento')
        .select('*')
        .eq('numero_lote', numeroLoteBusca.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setLoteEncontrado(data);
        toast.success('Lote encontrado!');
      } else {
        setLoteEncontrado(null);
        toast.error('Lote não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar lote:', error);
      toast.error('Erro ao buscar lote: ' + error.message);
    } finally {
      setBuscandoLote(false);
    }
  };

  const regenerarPorNumeroLote = async () => {
    if (!loteEncontrado) return;

    const confirmacao = window.confirm(`Regenerar o lote ${loteEncontrado.numero_lote}? Isso irá recriar o XML com os dados atuais.`);
    if (!confirmacao) return;

    setGerando(true);

    try {
      const { data: atendimentosOriginais, error: fetchError } = await supabase
        .from('atendimentos')
        .select('*')
        .in('id', loteEncontrado.guias_ids || []);
      
      if (fetchError) throw fetchError;

      const convenio = convenios.find(c => c.id === loteEncontrado.convenio_id);
      if (!convenio) {
        toast.error('Convênio não encontrado');
        return;
      }

      const novasGuias = atendimentosOriginais.map((atendimento, index) => ({
        ...converterAtendimentoParaTISS(atendimento, convenio),
        codigoPrestadorExecutante: convenio.codigo_prestador,
        versao: versaoTISS,
        sequencialTransacao: String(index + 1).padStart(4, '0')
      }));

      const xml = gerarXMLTISS({
        versao: versaoTISS,
        codigoPrestadorNaOperadora: convenio.codigo_prestador,
        registroANS: convenio.registro_ans,
        numeroLote: loteEncontrado.numero_lote,
        guias: novasGuias,
        convenio: convenio
      });

      const nomeArquivo = `${loteEncontrado.numero_lote}_${convenio.registro_ans}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xml`;

      const novoLote = {
        ...loteEncontrado,
        id: undefined,
        data_envio: format(new Date(), 'yyyy-MM-dd'),
        xml_content: xml,
        regenerado: true,
        regenerado_de: loteEncontrado.numero_lote,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('lotes_faturamento').insert([applyUnidadeToPayload(novoLote, unidadeAtualId)]);
      if (insertError) throw insertError;
      
      await registrarLog('REGENERACAO_XML', novoLote, `XML regenerado para o lote ${loteEncontrado.numero_lote}`);
      await carregarLotes();

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);

      setShowGerarPorLote(false);
      setNumeroLoteBusca('');
      setLoteEncontrado(null);
      toast.success(`XML do lote ${loteEncontrado.numero_lote} regenerado!`);
    } catch (error) {
      console.error('Erro ao regenerar lote:', error);
      toast.error('Erro ao regenerar lote: ' + error.message);
    } finally {
      setGerando(false);
    }
  };

  const regenerarLote = async (lote) => {
    const confirmacao = window.confirm(`Regenerar o XML do lote ${lote.numero_lote}?`);
    if (!confirmacao) return;
    
    setGerando(true);

    try {
      const { data: atendimentosOriginais, error: fetchError } = await supabase
        .from('atendimentos')
        .select('*')
        .in('id', lote.guias_ids || []);
      
      if (fetchError) throw fetchError;

      const convenio = convenios.find(c => c.id === lote.convenio_id);
      if (!convenio) {
        toast.error('Convênio não encontrado');
        return;
      }

      const novasGuias = atendimentosOriginais.map((atendimento, index) => ({
        ...converterAtendimentoParaTISS(atendimento, convenio),
        codigoPrestadorExecutante: convenio.codigo_prestador,
        versao: versaoTISS,
        sequencialTransacao: String(index + 1).padStart(4, '0')
      }));

      const xml = gerarXMLTISS({
        versao: versaoTISS,
        codigoPrestadorNaOperadora: convenio.codigo_prestador,
        registroANS: convenio.registro_ans,
        numeroLote: lote.numero_lote,
        guias: novasGuias,
        convenio: convenio
      });

      const nomeArquivo = `${lote.numero_lote}_${convenio.registro_ans}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xml`;

      const novoLote = {
        ...lote,
        id: undefined,
        data_envio: format(new Date(), 'yyyy-MM-dd'),
        xml_content: xml,
        regenerado: true,
        regenerado_de: lote.numero_lote,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('lotes_faturamento').insert([applyUnidadeToPayload(novoLote, unidadeAtualId)]);
      if (insertError) throw insertError;
      
      await registrarLog('REGENERACAO_XML', novoLote, `XML regenerado para o lote ${lote.numero_lote}`);
      await carregarLotes();

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`XML do lote ${lote.numero_lote} regenerado!`);
    } catch (error) {
      console.error('Erro ao regenerar lote:', error);
      toast.error('Erro ao regenerar lote: ' + error.message);
    } finally {
      setGerando(false);
    }
  };

  const cancelarLote = async (lote) => {
    const confirmacao = window.confirm(`Cancelar o lote ${lote.numero_lote}? 
      Esta ação irá:
      • Reabrir ${lote.quantidade_guias} guia(s)
      • Remover o lote do histórico
      • Permitir refaturamento das guias
      
      Deseja continuar?`);
    
    if (!confirmacao) return;

    setCancelando(true);

    try {
      const ids = lote.guias_ids || [];
      if (ids.length > 0) {
        const updateQuery = supabase
          .from('atendimentos')
          .update({
            status: 'faturado',
            data_faturamento: null,
            updated_at: new Date().toISOString()
          });

        if (ids.length === 1) {
          await updateQuery.eq('id', ids[0]);
        } else {
          await updateQuery.in('id', ids);
        }
      }

      await registrarLog('CANCELAMENTO_LOTE', lote, `Lote cancelado. Guias reabertas.`);

      const { error: deleteError } = await supabase
        .from('lotes_faturamento')
        .delete()
        .eq('id', lote.id);

      if (deleteError) throw deleteError;

      await carregarLotes();
      await carregarDados();
      toast.success('Lote cancelado e guias reabertas!');
    } catch (error) {
      console.error('Erro ao cancelar lote:', error);
      toast.error('Erro ao cancelar lote: ' + error.message);
    } finally {
      setCancelando(false);
    }
  };

  const gerarXMLporLote = (lote) => {
    const blob = new Blob([lote.xml_content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lote.numero_lote}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('XML baixado!');
  };

  const visualizarLote = (lote) => {
    setSelectedLote(lote);
    setShowLoteModal(true);
  };

  // ============================================
  // EFECTS
  // ============================================

  useEffect(() => {
    const carregarTodosDados = async () => {
      setLoading(true);
      try {
        await Promise.all([
          carregarDados(),
          carregarVersao(),
          carregarLotes(),
          carregarSequencial(),
          carregarBloqueados(),
          carregarLogs(),
          carregarConfigClinica()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    carregarTodosDados();
  }, [unidadeAtualId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Faturamento TISS
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Geração de lotes e arquivos XML no padrão TISS
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={versaoTISS}
              onChange={(e) => { setVersaoTISS(e.target.value); setVersao(e.target.value); }}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="4.01.00">TISS 4.01.00</option>
              <option value="4.02.00">TISS 4.02.00</option>
              <option value="4.03.00">TISS 4.03.00</option>
            </select>
            <button
              onClick={() => setShowGerarPorLote(!showGerarPorLote)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Gerar por Nº Lote
            </button>
            <button
              onClick={() => setShowHistoricoLogs(!showHistoricoLogs)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              {showHistoricoLogs ? 'Ocultar Logs' : 'Ver Logs'}
            </button>
            {totalSelecionados > 0 && (
              <>
                <button
                  onClick={handleImprimirGuiasSelecionadas}
                  disabled={imprimindo}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  {imprimindo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PrinterIcon className="w-4 h-4" />}
                  Imprimir ({totalSelecionados})
                </button>
                <button
                  onClick={abrirPrevia}
                  disabled={gerando}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg disabled:opacity-50"
                >
                  <ReceiptPercentIcon className="w-4 h-4" />
                  Faturar Selecionados ({totalSelecionados}/{MAX_GUIAS_POR_LOTE})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal de Gerar por Número do Lote */}
        {showGerarPorLote && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">Gerar XML por Número do Lote</h3>
              <button onClick={() => setShowGerarPorLote(false)} className="text-gray-500 hover:text-gray-700"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Digite o número do lote"
                value={numeroLoteBusca}
                onChange={(e) => setNumeroLoteBusca(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              />
              <button 
                onClick={buscarLoteParaRegenerar} 
                disabled={buscandoLote}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {buscandoLote ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Buscar'}
              </button>
            </div>
            {loteEncontrado && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-3">
                  <div><span className="text-gray-500">Nº Lote:</span> <span className="font-mono font-bold">{loteEncontrado.numero_lote}</span></div>
                  <div><span className="text-gray-500">Convênio:</span> {loteEncontrado.convenio_nome}</div>
                  <div><span className="text-gray-500">Data:</span> {loteEncontrado.data_envio}</div>
                  <div><span className="text-gray-500">Guias:</span> {loteEncontrado.quantidade_guias}</div>
                  <div><span className="text-gray-500">Valor:</span> R$ {(loteEncontrado.dados_fatura?.base_calculo || 0).toFixed(2)}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleImprimirLote(loteEncontrado)} 
                    disabled={imprimindo}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    {imprimindo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PrinterIcon className="w-4 h-4" />}
                    Imprimir Lote
                  </button>
                  <button 
                    onClick={regenerarPorNumeroLote} 
                    disabled={gerando} 
                    className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-yellow-700 flex-1 disabled:opacity-50"
                  >
                    {gerando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Regenerar XML'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Total Pendentes</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPendentes}</p></div>
              <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Selecionados</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalSelecionados}</p></div>
              <CheckIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Bloqueados</p><p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{bloqueados.length}</p></div>
              <LockClosedIcon className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Valor Pendente</p><p className="text-2xl font-bold text-purple-600 dark:text-purple-400">R$ {valorTotalPendente.toFixed(2)}</p></div>
              <CurrencyDollarIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Próx. Lote</p><p className="text-xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">{gerarNumeroLote(sequencialGlobal)}</p></div>
              <ArrowPathIcon className="w-8 h-8 text-cyan-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Lotes Gerados</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{guiasGeradas.length}</p></div>
              <ArchiveBoxIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={selecionarTodos} className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 transition-all">Selecionar Todos (Não Bloqueados)</button>
          <button onClick={desmarcarTodos} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-all">Desmarcar Todos</button>
          <button onClick={selecionarBloqueados} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-all">Selecionar Bloqueados</button>
          <button onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
            <FunnelIcon className="w-4 h-4" /> Filtros Avançados
          </button>
        </div>

        {/* Filtros Avançados */}
        {showFiltrosAvancados && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Convênio</label>
                <select value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="todos">Todos</option>
                  {convenios.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Especialidade</label>
                <select value={filtroEspecialidade} onChange={(e) => setFiltroEspecialidade(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="todos">Todas</option>
                  {[...new Set(prestadores.map(p => p.especialidade))].filter(Boolean).map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Profissional</label>
                <select value={filtroPrestador} onChange={(e) => setFiltroPrestador(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="todos">Todos</option>
                  {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ordenar por</label>
                <div className="flex gap-2">
                  <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="guia">Nº Guia</option>
                    <option value="alfabetica">Ordem Alfabética</option>
                    <option value="atendimento">Data Atendimento</option>
                    <option value="valor">Valor</option>
                  </select>
                  <button onClick={() => setOrdemDirecao(ordemDirecao === 'asc' ? 'desc' : 'asc')} className="p-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    {ordemDirecao === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data Início</label>
                <input 
                  type="date" 
                  value={filtroDataInicio} 
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data Fim</label>
                <input 
                  type="date" 
                  value={filtroDataFim} 
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Lista de atendimentos por convênio */}
        <div className="space-y-4">
          {Object.entries(pendentesPorConvenio).map(([convenioId, convenioAtendimentos], index) => {
            const convenio = convenios.find(c => c.id === parseInt(convenioId));
            if (!convenio) return null;
            const selecionadosCount = convenioAtendimentos.filter(a => selecionados.includes(a.id)).length;
            const totalConvenio = convenioAtendimentos.reduce((sum, a) => sum + (a.valor_total || 0), 0);

            const idsConvenio = convenioAtendimentos.filter(a => !bloqueados.includes(a.id)).map(a => a.id);

            return (
              <div key={convenio.id || `convenio-${convenioId}-${index}`} className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-gray-800 dark:text-white">{convenio.razao_social}</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">Código: {convenio.codigo_prestador}</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">ANS: {convenio.registro_ans}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total: R$ {totalConvenio.toFixed(2)}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">{selecionadosCount}/{convenioAtendimentos.length} selecionados</span>
                    <button onClick={() => {
                      const guiasParaImprimir = convenioAtendimentos.filter(a => selecionados.includes(a.id) || (selecionadosCount === 0 && a));
                      if (guiasParaImprimir.length === 0) {
                        toast.error('Nenhuma guia para imprimir');
                        return;
                      }
                      imprimirMultiplasGuiasTISS(guiasParaImprimir, convenio, configClinica);
                      toast.success(`${guiasParaImprimir.length} guia(s) enviada(s) para impressão`);
                    }} className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1">
                      <PrinterIcon className="w-4 h-4" /> Imprimir
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left w-8">
                          <input
                            type="checkbox"
                            checked={selecionadosCount === idsConvenio.length && idsConvenio.length > 0}
                            onChange={() => {
                              if (selecionadosCount === idsConvenio.length) {
                                setSelecionados(selecionados.filter(id => !idsConvenio.includes(id)));
                              } else {
                                if (selecionados.length + idsConvenio.length <= MAX_GUIAS_POR_LOTE) {
                                  setSelecionados([...selecionados, ...idsConvenio]);
                                } else {
                                  toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote`);
                                }
                              }
                            }}
                            className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Guia</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Guia Operadora</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Senha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Paciente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Carteira</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Profissional / Especialidade</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                        <th className="px-4 py-3 text-center w-32">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {convenioAtendimentos.map((a) => (
                        <tr key={a.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${bloqueados.includes(a.id) ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selecionados.includes(a.id)}
                              onChange={() => handleSelectItem(a.id)}
                              disabled={bloqueados.includes(a.id)}
                              className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">{a.numero_guia_prestador || '-'}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.numero_guia_operadora || '-'}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.senha_autorizacao || '-'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{a.data_atendimento || '-'}</td>
                          <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-white">{a.paciente_nome || '-'}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.numero_carteira || '-'}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{getProfissionalExibicao(a)}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-right text-gray-700 dark:text-gray-300">R$ {(a.valor_total || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <button 
                                onClick={() => handleImprimirGuia(a)} 
                                disabled={imprimindo}
                                className="p-1 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50" 
                                title="Imprimir Guia TISS"
                              >
                                <PrinterIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleImprimirContaIndividual(a)} 
                                className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" 
                                title="Imprimir Conta Faturada"
                              >
                                <ReceiptPercentIcon className="w-4 h-4" />
                              </button>                              
                              <button 
                                onClick={() => toggleBloqueio(a.id)} 
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                                title={bloqueados.includes(a.id) ? 'Desbloquear' : 'Bloquear'}
                              >
                                {bloqueados.includes(a.id) ? <LockOpenIcon className="w-4 h-4 text-green-500" /> : <LockClosedIcon className="w-4 h-4 text-orange-500" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                      <tr className="border-t">
                        <td colSpan="9" className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total do Convênio:</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">R$ {totalConvenio.toFixed(2)}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {totalPendentes === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center">
            <CheckIcon className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum atendimento pendente de faturamento</p>
          </div>
        )}

        {/* Histórico de Lotes */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Lotes Gerados</h3>
            <button onClick={carregarLotes} className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 hover:text-blue-700 transition-colors"><ArrowPathIcon className="w-4 h-4" /> Atualizar</button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Convênio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Lote</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Guias</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-64">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {guiasGeradas.map((g) => (
                    <tr key={g.id || `lote-${g.numero_lote}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{g.convenio_nome}</td>
                      <td className="px-4 py-3 text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">{g.numero_lote}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.data_envio}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.quantidade_guias}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">R$ {(g.dados_fatura?.base_calculo || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {/* Visualizar XML */}
                          <button onClick={() => visualizarLote(g)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Visualizar XML">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          
                          {/* Imprimir Guias TISS */}
                          <button 
                            onClick={() => handleImprimirLote(g)} 
                            disabled={imprimindo}
                            className="p-1 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50" 
                            title="Imprimir Guias TISS"
                          >
                            {imprimindo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div> : <PrinterIcon className="w-4 h-4" />}
                          </button>
                          
                          {/* Imprimir Conta Faturada */}
                          <button onClick={() => handleImprimirConta(g)} className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Imprimir Conta Faturada">
                            <ReceiptPercentIcon className="w-4 h-4" />
                          </button>
                          
                          {/* Baixar XML */}
                          <button onClick={() => gerarXMLporLote(g)} className="p-1 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Baixar XML">
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </button>
                          
                          {/* Regenerar XML */}
                          <button 
                            onClick={() => regenerarLote(g)} 
                            disabled={gerando} 
                            className="p-1 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-50" 
                            title="Regenerar XML"
                          >
                            {gerando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div> : <ArrowPathIcon className="w-4 h-4" />}
                          </button>
                          
                          {/* Cancelar Lote */}
                          <button 
                            onClick={() => cancelarLote(g)} 
                            disabled={cancelando} 
                            className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50" 
                            title="Cancelar Lote"
                          >
                            {cancelando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div> : <XCircleIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {guiasGeradas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                        <DocumentPlusIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        Nenhum lote gerado ainda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Histórico de Logs */}
        {showHistoricoLogs && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Histórico de Logs</h3>
              <button onClick={carregarLogs} className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1"><ArrowPathIcon className="w-4 h-4" /> Atualizar</button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data/Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Ação</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Lote</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Convênio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Guias</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logsLotes.map((log) => (
                      <tr key={log.id || `log-${log.created_at}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-1 rounded-full text-xs ${log.acao === 'GERACAO_LOTE' ? 'bg-green-100 text-green-700' : log.acao === 'CANCELAMENTO_LOTE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {log.acao === 'GERACAO_LOTE' ? 'Geração' : log.acao === 'CANCELAMENTO_LOTE' ? 'Cancelamento' : 'Regeneração'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-blue-600">{log.numero_lote}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{log.convenio_nome}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{log.quantidade_guias}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">R$ {(log.valor_total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{log.detalhes}</td>
                      </tr>
                    ))}
                    {logsLotes.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-gray-500">Nenhum log encontrado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Prévia e Faturamento */}
        {showPreviaModal && previewData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Prévia do Faturamento</h3>
                  <button onClick={() => setShowPreviaModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Resumo dos Selecionados */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Resumo dos Agendamentos Selecionados</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total de Guias</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{previewData.quantidade}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {previewData.valorTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Convênios</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(previewData.conveniosAgrupados).length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nº do Lote</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">{numeroLotePreview}</p>
                    </div>
                    <div>
                      <button 
                        onClick={handleImprimirGuiasSelecionadas} 
                        disabled={imprimindo}
                        className="mt-2 w-full bg-purple-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-purple-700 transition-all disabled:opacity-50"
                      >
                        {imprimindo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PrinterIcon className="w-4 h-4" />}
                        Imprimir Guias
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={imprimirRelacao} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                      <PrinterIcon className="w-4 h-4" /> Imprimir Relação
                    </button>
                  </div>
                </div>

                {/* Detalhes por Convênio */}
                {Object.entries(previewData.conveniosAgrupados).map(([convenioId, data], index) => (
                  <div key={`preview-convenio-${convenioId}-${index}`} className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 border-b">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800 dark:text-white">{data.convenio?.razao_social || 'Desconhecido'}</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">R$ {data.valorTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nº Guia</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nº Guia Operadora</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Senha</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Paciente</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Carteira</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Profissional / Especialidade</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {data.atendimentos.map(a => (
                            <tr key={a.id}>
                              <td className="px-3 py-2 text-xs font-mono text-blue-600">{a.numero_guia_prestador || '-'}</td>
                              <td className="px-3 py-2 text-xs font-mono text-gray-600">{a.numero_guia_operadora || '-'}</td>
                              <td className="px-3 py-2 text-xs font-mono text-gray-600">{a.senha_autorizacao || '-'}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{a.data_atendimento || '-'}</td>
                              <td className="px-3 py-2 text-xs text-gray-800">{a.paciente_nome || '-'}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{a.numero_carteira || '-'}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{getProfissionalExibicao(a)}</td>
                              <td className="px-3 py-2 text-xs text-right font-semibold text-gray-700">R$ {(a.valor_total || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Dados da Nota Fiscal */}
                <div className="border rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5" /> Dados da Nota Fiscal / Faturamento
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Competência</label>
                      <input type="month" value={dadosFatura.competencia} onChange={e => setDadosFatura({...dadosFatura, competencia: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Fechamento</label>
                      <input type="date" value={dadosFatura.dataFechamento} onChange={e => setDadosFatura({...dadosFatura, dataFechamento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Previsão de Pagamento</label>
                      <input type="date" value={dadosFatura.dataPrevisaoPagamento} onChange={e => setDadosFatura({...dadosFatura, dataPrevisaoPagamento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Impostos e Deduções</h5>
                    <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500">Base Cálculo</label>
                        <input type="number" step="0.01" value={dadosFatura.baseCalculo} onChange={(e) => atualizarTodosImpostos(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">ISS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaISS} onChange={(e) => atualizarAliquota('aliquotaISS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">IBS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaIBS} onChange={(e) => atualizarAliquota('aliquotaIBS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">CBS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaCBS} onChange={(e) => atualizarAliquota('aliquotaCBS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">IR (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaIR} onChange={(e) => atualizarAliquota('aliquotaIR', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">CSLL (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaCSLL} onChange={(e) => atualizarAliquota('aliquotaCSLL', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">PIS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaPIS} onChange={(e) => atualizarAliquota('aliquotaPIS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">COFINS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaCOFINS} onChange={(e) => atualizarAliquota('aliquotaCOFINS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div><label className="block text-xs text-gray-500">Valor ISS</label><input type="text" value={dadosFatura.valorISS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor IBS</label><input type="text" value={dadosFatura.valorIBS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor CBS</label><input type="text" value={dadosFatura.valorCBS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor IR</label><input type="text" value={dadosFatura.valorIR.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor CSLL</label><input type="text" value={dadosFatura.valorCSLL.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor PIS</label><input type="text" value={dadosFatura.valorPIS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor COFINS</label><input type="text" value={dadosFatura.valorCOFINS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor Líquido</label><input type="text" value={dadosFatura.valorLiquido.toFixed(2)} disabled className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-2 py-1 text-sm font-bold text-green-700 dark:text-green-400" /></div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                    <textarea rows="2" value={dadosFatura.observacoes} onChange={e => setDadosFatura({...dadosFatura, observacoes: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="Informações adicionais da fatura..." />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowPreviaModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button onClick={confirmarGeracaoLote} disabled={gerando} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium shadow-md flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50">
                  {gerando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PaperAirplaneIcon className="w-4 h-4" />}
                  Confirmar e Gerar Lote
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização do XML */}
        {showLoteModal && selectedLote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">XML do Lote - {selectedLote.numero_lote}</h3>
                  <button onClick={() => setShowLoteModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Convênio:</span> <span className="text-sm font-medium">{selectedLote.convenio_nome}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Nº Lote:</span> <span className="text-sm font-mono">{selectedLote.numero_lote}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Data:</span> <span className="text-sm">{selectedLote.data_envio}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Guias:</span> <span className="text-sm font-bold">{selectedLote.quantidade_guias}</span></div>
                  <div>
                    <button 
                      onClick={() => handleImprimirLote(selectedLote)} 
                      disabled={imprimindo}
                      className="w-full bg-purple-600 text-white px-2 py-1 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-purple-700 disabled:opacity-50"
                    >
                      {imprimindo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PrinterIcon className="w-4 h-4" />}
                      Imprimir Lote
                    </button>
                  </div>
                </div>
                {selectedLote.dados_fatura && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div><span className="text-xs text-gray-500">Competência:</span> <span className="text-sm">{selectedLote.dados_fatura.competencia}</span></div>
                    <div><span className="text-xs text-gray-500">Fechamento:</span> <span className="text-sm">{selectedLote.dados_fatura.data_fechamento}</span></div>
                    <div><span className="text-xs text-gray-500">Valor Líquido:</span> <span className="text-sm font-bold text-green-600">R$ {(selectedLote.dados_fatura.valor_liquido || 0).toFixed(2)}</span></div>
                    <div><span className="text-xs text-gray-500">Previsão Pagto:</span> <span className="text-sm">{selectedLote.dados_fatura.data_previsao_pagamento || '-'}</span></div>
                  </div>
                )}
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-96">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{selectedLote.xml_content}</pre>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => { const blob = new Blob([selectedLote.xml_content], { type: 'application/xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${selectedLote.numero_lote}.xml`; a.click(); URL.revokeObjectURL(url); toast.success('XML baixado!'); }} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg">Baixar XML</button>
                  <button onClick={() => setShowLoteModal(false)} className="px-4 py-2 border rounded-lg">Fechar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informações */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 Informações</h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• <strong>Guias bloqueadas</strong> aparecem com fundo laranja e não podem ser faturadas</li>
            <li>• Use os botões de bloqueio/desbloqueio para controlar quais guias entrarão no faturamento</li>
            <li>• Após faturar, as guias são finalizadas e não podem ser alteradas no módulo de atendimentos</li>
            <li>• Para reabrir as guias, cancele o lote no histórico</li>
            <li>• Use "Gerar por Nº Lote" para regenerar o XML de um lote específico</li>
            <li>• Cancelar um lote retorna as guias para o status "faturado"</li>
            <li>• Limite máximo de <strong>{MAX_GUIAS_POR_LOTE} guias por lote</strong></li>
            <li>• O número do lote é um sequencial único de até 12 dígitos</li>
            <li>• <strong>Imprimir Guias</strong> - Gera o formulário oficial TISS no padrão ANS</li>
            <li>• <strong>Imprimir Conta Faturada</strong> - Gera uma conta detalhada em formato padronizado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
