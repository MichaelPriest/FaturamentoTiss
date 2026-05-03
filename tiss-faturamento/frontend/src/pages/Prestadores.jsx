import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

// Lista de UFs (mantida igual)
const UFS = [
  { sigla: 'AC', nome: 'Acre', codigoANS: '12' },
  { sigla: 'AL', nome: 'Alagoas', codigoANS: '27' },
  // ... (manter todos os UFS listados anteriormente)
  { sigla: 'EX', nome: 'Exterior', codigoANS: '98' }
];

// Conselhos (mantido)
const CONSELHOS = [
  { sigla: 'CRM', nome: 'Conselho Regional de Medicina', codigoANS: '06' },
  { sigla: 'CRO', nome: 'Conselho Regional de Odontologia', codigoANS: '08' },
  { sigla: 'CRF', nome: 'Conselho Regional de Farmácia', codigoANS: '03' },
  { sigla: 'COREN', nome: 'Conselho Regional de Enfermagem', codigoANS: '02' },
  { sigla: 'CREFITO', nome: 'Conselho Regional de Fisioterapia e Terapia Ocupacional', codigoANS: '05' },
  { sigla: 'CRP', nome: 'Conselho Regional de Psicologia', codigoANS: '09' },
  { sigla: 'CRBio', nome: 'Conselho Regional de Biomedicina', codigoANS: '12' },
  { sigla: 'CRN', nome: 'Conselho Regional de Nutrição', codigoANS: '07' },
  { sigla: 'CREF', nome: 'Conselho Regional de Educação Física', codigoANS: '13' },
  { sigla: 'CRESS', nome: 'Conselho Regional de Serviço Social', codigoANS: '01' }
];

// Especialidades (mantido)
const ESPECIALIDADES = [
  { id: 14, nome: 'Psicologia', cbos: '251510', codigo_ans: '09', conselhoPadrao: 'CRP' },
  // ... (manter todas)
  { id: 26, nome: 'Estudante Psicologia', cbos: null, codigo_ans: null, conselhoPadrao: null }
];

// Funções de máscara
const maskCPF = (value) => {
  const str = value.replace(/\D/g, '');
  if (str.length <= 11) {
    return str.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
  }
  return str;
};

const maskCNPJ = (value) => {
  const str = value.replace(/\D/g, '');
  if (str.length <= 14) {
    return str.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').slice(0, 18);
  }
  return str;
};

const maskTelefone = (value) => {
  const str = value.replace(/\D/g, '');
  if (str.length <= 10) {
    return str.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3').slice(0, 14);
  } else {
    return str.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
  }
};

const maskCEP = (value) => value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9);

export default function Prestadores() {
  const [prestadores, setPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState([]);
  const [especialidadePrincipal, setEspecialidadePrincipal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState(null);
  const [buscarCEP, setBuscarCEP] = useState(false);

  const [formData, setFormData] = useState({
    tipo_pessoa: 'F',
    nome: '',
    codigo_prestador: '',
    cpf: '',
    cnpj: '',
    conselho: 'CRM',
    codigo_conselho_ans: '06',
    numero_conselho: '',
    uf_conselho: 'SP',
    telefone: '',
    celular: '',
    email: '',
    endereco: '',
    cep: '',
    cidade: '',
    estado: 'SP',
    ativo: true
  });

  useEffect(() => {
    carregarPrestadores();
  }, []);

  const carregarPrestadores = async () => {
    setLoading(true);
    try {
      const { data: prestadores, error: errorPrestadores } = await supabase
        .from('prestadores')
        .select('*')
        .order('nome', { ascending: true });
      if (errorPrestadores) throw errorPrestadores;

      const { data: relacoes, error: errorRelacoes } = await supabase
        .from('prestador_especialidade')
        .select('*');
      if (errorRelacoes) throw errorRelacoes;

      const mapaEspecialidades = new Map();
      ESPECIALIDADES.forEach(esp => mapaEspecialidades.set(esp.id, esp));

      const especialidadesPorPrestador = new Map();
      relacoes.forEach(rel => {
        if (!especialidadesPorPrestador.has(rel.prestador_id)) {
          especialidadesPorPrestador.set(rel.prestador_id, []);
        }
        const esp = mapaEspecialidades.get(rel.especialidade_id);
        if (esp) {
          especialidadesPorPrestador.get(rel.prestador_id).push({
            id: rel.id,
            prestador_id: rel.prestador_id,
            especialidade_id: rel.especialidade_id,
            principal: rel.principal,
            especialidade: {
              id: esp.id,
              nome: esp.nome,
              cbos: esp.cbos,
              codigo_ans: esp.codigo_ans
            }
          });
        }
      });

      const resultado = prestadores.map(prestador => ({
        ...prestador,
        tipo_pessoa: prestador.tipo_pessoa || 'F',
        especialidades: especialidadesPorPrestador.get(prestador.id) || []
      }));

      setPrestadores(resultado);
    } catch (error) {
      console.error('Erro ao carregar prestadores:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Função para consultar CEP
  const consultarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: `${data.logradouro}, ${data.bairro}`,
          cidade: data.localidade,
          estado: data.uf
        }));
        toast.success('CEP encontrado! Endereço preenchido.');
      } else {
        toast.warning('CEP não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro na consulta do CEP');
    }
  };

  const handleCEPChange = (e) => {
    const raw = e.target.value;
    const masked = maskCEP(raw);
    setFormData({ ...formData, cep: masked });
    if (masked.replace(/\D/g, '').length === 8) {
      consultarCEP(masked);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (formData.tipo_pessoa === 'J' && !formData.codigo_prestador) {
      toast.error('Código do prestador é obrigatório para pessoa jurídica');
      return;
    }
    if (especialidadesSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma especialidade');
      return;
    }

    try {
      // Função segura para limpar dígitos (trata null/undefined)
      const safeClean = (value) => value ? value.replace(/\D/g, '') : null;

      const prestadorPayload = {
        tipo_pessoa: formData.tipo_pessoa,
        nome: formData.nome.toUpperCase(),
        codigo_prestador: formData.codigo_prestador || null,
        cpf: safeClean(formData.cpf),
        cnpj: safeClean(formData.cnpj),
        conselho: formData.conselho,
        codigo_conselho_ans: formData.codigo_conselho_ans,
        numero_conselho: formData.numero_conselho || null,
        uf_conselho: formData.uf_conselho,
        telefone: safeClean(formData.telefone),
        celular: safeClean(formData.celular),
        email: formData.email || null,
        endereco: formData.endereco || null,
        cep: safeClean(formData.cep),
        cidade: formData.cidade ? formData.cidade.toUpperCase() : null,
        estado: formData.estado,
        ativo: formData.ativo,
        updated_at: new Date().toISOString()
      };

      let prestadorId;

      if (editing) {
        const { error: updateError } = await supabase
          .from('prestadores')
          .update(prestadorPayload)
          .eq('id', editing.id);
        if (updateError) throw updateError;
        prestadorId = editing.id;
        await supabase
          .from('prestador_especialidade')
          .delete()
          .eq('prestador_id', editing.id);
      } else {
        prestadorPayload.created_at = new Date().toISOString();
        const { data: novoPrestador, error: insertError } = await supabase
          .from('prestadores')
          .insert(prestadorPayload)
          .select()
          .single();
        if (insertError) throw insertError;
        prestadorId = novoPrestador.id;
      }

      const especialidadesInsert = especialidadesSelecionadas.map(esp => ({
        prestador_id: prestadorId,
        especialidade_id: esp.id,
        principal: esp.id === especialidadePrincipal?.id
      }));

      if (especialidadesInsert.length > 0) {
        const { error: espError } = await supabase
          .from('prestador_especialidade')
          .insert(especialidadesInsert);
        if (espError) throw espError;
      }

      toast.success(editing ? 'Prestador atualizado!' : 'Prestador cadastrado!');
      await carregarPrestadores();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar prestador:', error);
      toast.error(error?.message || 'Erro ao salvar prestador');
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_pessoa: 'F',
      nome: '',
      codigo_prestador: '',
      cpf: '',
      cnpj: '',
      conselho: 'CRM',
      codigo_conselho_ans: '06',
      numero_conselho: '',
      uf_conselho: 'SP',
      telefone: '',
      celular: '',
      email: '',
      endereco: '',
      cep: '',
      cidade: '',
      estado: 'SP',
      ativo: true
    });
    setEspecialidadesSelecionadas([]);
    setEspecialidadePrincipal(null);
  };

  const handleEdit = (prestador) => {
    setEditing(prestador);
    setFormData({
      tipo_pessoa: prestador.tipo_pessoa || 'F',
      nome: prestador.nome || '',
      codigo_prestador: prestador.codigo_prestador || '',
      cpf: prestador.cpf || '',
      cnpj: prestador.cnpj || '',
      conselho: prestador.conselho || 'CRM',
      codigo_conselho_ans: prestador.codigo_conselho_ans || '06',
      numero_conselho: prestador.numero_conselho || '',
      uf_conselho: prestador.uf_conselho || 'SP',
      telefone: prestador.telefone || '',
      celular: prestador.celular || '',
      email: prestador.email || '',
      endereco: prestador.endereco || '',
      cep: prestador.cep || '',
      cidade: prestador.cidade || '',
      estado: prestador.estado || 'SP',
      ativo: prestador.ativo !== false
    });

    if (prestador.especialidades && prestador.especialidades.length > 0) {
      const especialidades = prestador.especialidades.map(esp => ({
        id: esp.especialidade_id,
        nome: esp.especialidade?.nome,
        cbos: esp.especialidade?.cbos,
        codigo_ans: esp.especialidade?.codigo_ans
      }));
      setEspecialidadesSelecionadas(especialidades);
      const principal = prestador.especialidades.find(esp => esp.principal);
      if (principal) {
        setEspecialidadePrincipal({ id: principal.especialidade_id, nome: principal.especialidade?.nome });
      }
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este prestador?')) {
      try {
        const { error } = await supabase.from('prestadores').delete().eq('id', id);
        if (error) throw error;
        toast.success('Prestador excluído!');
        await carregarPrestadores();
      } catch (error) {
        console.error('Erro ao excluir prestador:', error);
        toast.error('Erro ao excluir prestador');
      }
    }
  };

  const handleConselhoChange = (sigla) => {
    const conselho = CONSELHOS.find(c => c.sigla === sigla);
    setFormData({
      ...formData,
      conselho: sigla,
      codigo_conselho_ans: conselho?.codigoANS || '06'
    });
  };

  const adicionarEspecialidade = (especialidadeId) => {
    const especialidade = ESPECIALIDADES.find(e => e.id === parseInt(especialidadeId));
    if (!especialidade) return;
    if (especialidadesSelecionadas.some(e => e.id === especialidade.id)) {
      toast.warning('Especialidade já adicionada');
      return;
    }
    setEspecialidadesSelecionadas([...especialidadesSelecionadas, especialidade]);
    if (especialidadesSelecionadas.length === 0) {
      setEspecialidadePrincipal(especialidade);
      if (especialidade.conselhoPadrao) handleConselhoChange(especialidade.conselhoPadrao);
    }
  };

  const removerEspecialidade = (especialidadeId) => {
    const novaLista = especialidadesSelecionadas.filter(e => e.id !== especialidadeId);
    setEspecialidadesSelecionadas(novaLista);
    if (especialidadePrincipal?.id === especialidadeId) {
      if (novaLista.length > 0) {
        setEspecialidadePrincipal(novaLista[0]);
        if (novaLista[0].conselhoPadrao) handleConselhoChange(novaLista[0].conselhoPadrao);
      } else {
        setEspecialidadePrincipal(null);
      }
    }
  };

  const definirPrincipal = (especialidadeId) => {
    const especialidade = especialidadesSelecionadas.find(e => e.id === especialidadeId);
    setEspecialidadePrincipal(especialidade);
    if (especialidade.conselhoPadrao) handleConselhoChange(especialidade.conselhoPadrao);
  };

  const getEspecialidadesTexto = (prestador) => {
    if (!prestador.especialidades || prestador.especialidades.length === 0) return '-';
    const nomes = prestador.especialidades.map(esp => {
      const nome = esp.especialidade?.nome;
      if (!nome) return null;
      return esp.principal ? `${nome}*` : nome;
    }).filter(n => n);
    return nomes.length ? nomes.join(', ') : '-';
  };

  const getCBOSTexto = (prestador) => {
    if (!prestador.especialidades || prestador.especialidades.length === 0) return '-';
    const principal = prestador.especialidades.find(esp => esp.principal);
    if (principal && principal.especialidade?.cbos) return principal.especialidade.cbos;
    return prestador.especialidades[0]?.especialidade?.cbos || '-';
  };

  const formatarCPFouCNPJ = (valor) => {
    if (!valor) return '-';
    const str = String(valor);
    if (str.length === 11) return maskCPF(str);
    if (str.length === 14) return maskCNPJ(str);
    return str;
  };

  const filtered = prestadores.filter(p =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_prestador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm) ||
    getEspecialidadesTexto(p).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Carregando prestadores...</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Prestadores
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cadastro de profissionais (pessoa física) e clínicas/hospitais (pessoa jurídica)
          </p>
        </div>
        <button 
          onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
        >
          <PlusIcon className="w-4 h-4" /> Novo Prestador
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome, código, CPF ou especialidade..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full border-0 bg-transparent rounded-lg px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPF/CNPJ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conselho</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nº Conselho</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Especialidades</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CBOS</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{p.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatarCPFouCNPJ(p.cpf || p.cnpj)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.conselho}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.numero_conselho || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.uf_conselho}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getEspecialidadesTexto(p)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{getCBOSTexto(p)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button 
                        onClick={() => { setSelectedPrestador(p); setShowDetailModal(true); }} 
                        className="p-1 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                        title="Visualizar"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(p)} 
                        className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" 
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                        title="Excluir"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Nenhum prestador cadastrado
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showDetailModal && selectedPrestador && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Detalhes do Prestador
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500">Nome</label><p className="text-gray-800 dark:text-white font-medium">{selectedPrestador.nome}</p></div>
                <div><label className="text-xs text-gray-500">Tipo</label><p className="text-gray-800 dark:text-white">{selectedPrestador.tipo_pessoa === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p></div>
                {selectedPrestador.codigo_prestador && <div><label className="text-xs text-gray-500">Código Prestador</label><p className="text-gray-800 dark:text-white font-mono">{selectedPrestador.codigo_prestador}</p></div>}
                <div><label className="text-xs text-gray-500">CPF/CNPJ</label><p className="text-gray-800 dark:text-white">{formatarCPFouCNPJ(selectedPrestador.cpf || selectedPrestador.cnpj)}</p></div>
                <div><label className="text-xs text-gray-500">Conselho</label><p className="text-gray-800 dark:text-white">{selectedPrestador.conselho}</p></div>
                <div><label className="text-xs text-gray-500">Número Conselho</label><p className="text-gray-800 dark:text-white">{selectedPrestador.numero_conselho || '-'}</p></div>
                <div><label className="text-xs text-gray-500">UF Conselho</label><p className="text-gray-800 dark:text-white">{selectedPrestador.uf_conselho}</p></div>
                <div><label className="text-xs text-gray-500">Especialidades</label><p className="text-gray-800 dark:text-white">{getEspecialidadesTexto(selectedPrestador)}</p></div>
                <div><label className="text-xs text-gray-500">CBOS Principal</label><p className="text-gray-800 dark:text-white">{getCBOSTexto(selectedPrestador)}</p></div>
                <div><label className="text-xs text-gray-500">Telefone</label><p className="text-gray-800 dark:text-white">{maskTelefone(selectedPrestador.telefone || '') || '-'}</p></div>
                <div><label className="text-xs text-gray-500">Celular</label><p className="text-gray-800 dark:text-white">{maskTelefone(selectedPrestador.celular || '') || '-'}</p></div>
                <div className="col-span-2"><label className="text-xs text-gray-500">Email</label><p className="text-gray-800 dark:text-white">{selectedPrestador.email || '-'}</p></div>
                <div className="col-span-2"><label className="text-xs text-gray-500">Endereço</label><p className="text-gray-800 dark:text-white">{selectedPrestador.endereco || '-'}</p></div>
                <div><label className="text-xs text-gray-500">CEP</label><p className="text-gray-800 dark:text-white">{maskCEP(selectedPrestador.cep || '') || '-'}</p></div>
                <div><label className="text-xs text-gray-500">Cidade</label><p className="text-gray-800 dark:text-white">{selectedPrestador.cidade || '-'}</p></div>
                <div><label className="text-xs text-gray-500">Estado</label><p className="text-gray-800 dark:text-white">{selectedPrestador.estado}</p></div>
                <div><label className="text-xs text-gray-500">Status</label><p className="text-gray-800 dark:text-white">{selectedPrestador.ativo ? 'Ativo' : 'Inativo'}</p></div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição (com máscaras e busca CEP) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{editing ? 'Editar Prestador' : 'Novo Prestador'}</h3>
            </div>
            <div className="p-5">
              <form onSubmit={handleSubmit}>
                {/* Tipo de Pessoa */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Pessoa</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tipo_pessoa" value="F" checked={formData.tipo_pessoa === 'F'} onChange={() => setFormData({...formData, tipo_pessoa: 'F'})} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Pessoa Física (Profissional)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tipo_pessoa" value="J" checked={formData.tipo_pessoa === 'J'} onChange={() => setFormData({...formData, tipo_pessoa: 'J'})} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Pessoa Jurídica (Clínica/Hospital)</span>
                    </label>
                  </div>
                </div>

                {/* Nome */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" required />
                </div>

                {/* Código do Prestador condicional */}
                {formData.tipo_pessoa === 'J' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código do Prestador na Operadora *</label>
                    <input type="text" value={formData.codigo_prestador} onChange={e => setFormData({...formData, codigo_prestador: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" required />
                  </div>
                )}

                {/* CPF ou CNPJ com máscara */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {formData.tipo_pessoa === 'F' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                      <input type="text" value={maskCPF(formData.cpf)} onChange={e => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '')})} maxLength={14} placeholder="000.000.000-00" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                      <input type="text" value={maskCNPJ(formData.cnpj)} onChange={e => setFormData({...formData, cnpj: e.target.value.replace(/\D/g, '')})} maxLength={18} placeholder="00.000.000/0000-00" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                  )}
                  <div></div>
                </div>

                {/* Especialidades (mantido igual) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Especialidades *</label>
                  <div className="flex gap-2 mb-3">
                    <select onChange={(e) => adicionarEspecialidade(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" defaultValue="">
                      <option value="" disabled>Selecione uma especialidade...</option>
                      {ESPECIALIDADES.filter(e => !especialidadesSelecionadas.some(sel => sel.id === e.id)).map(e => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                    </select>
                  </div>
                  {especialidadesSelecionadas.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr><th className="px-3 py-2 text-left">Especialidade</th><th className="px-3 py-2 text-left">CBOS</th><th className="px-3 py-2 text-center w-24">Principal</th><th className="px-3 py-2 text-center w-16">Ação</th></tr>
                        </thead>
                        <tbody>
                          {especialidadesSelecionadas.map(esp => (
                            <tr key={esp.id}><td className="px-3 py-2">{esp.nome}</td><td className="px-3 py-2 font-mono">{esp.cbos || '-'}</td><td className="px-3 py-2 text-center"><input type="radio" name="principal" checked={especialidadePrincipal?.id === esp.id} onChange={() => definirPrincipal(esp.id)} className="w-4 h-4 text-blue-600" /></td><td className="px-3 py-2 text-center"><button type="button" onClick={() => removerEspecialidade(esp.id)} className="text-red-600"><XMarkIcon className="w-4 h-4" /></button></td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">* Selecione ao menos uma especialidade. Marque o rádio para definir a principal (usada para CBOS no XML).</p>
                </div>

                {/* Conselho */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div><label className="block text-sm font-medium mb-1">Conselho</label><select value={formData.conselho} onChange={e => handleConselhoChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600">{CONSELHOS.map(c => <option key={c.sigla} value={c.sigla}>{c.sigla}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Código ANS</label><input type="text" value={formData.codigo_conselho_ans} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800" /></div>
                  <div><label className="block text-sm font-medium mb-1">Número do Conselho</label><input type="text" value={formData.numero_conselho} onChange={e => setFormData({...formData, numero_conselho: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" /></div>
                  <div><label className="block text-sm font-medium mb-1">UF do Conselho</label><select value={formData.uf_conselho} onChange={e => setFormData({...formData, uf_conselho: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600">{UFS.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>)}</select></div>
                </div>

                {/* Contato e Endereço com máscaras e CEP automático */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="block text-sm font-medium mb-1">Telefone</label><input type="text" value={maskTelefone(formData.telefone)} onChange={e => setFormData({...formData, telefone: e.target.value.replace(/\D/g, '')})} maxLength={15} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" /></div>
                  <div><label className="block text-sm font-medium mb-1">Celular</label><input type="text" value={maskTelefone(formData.celular)} onChange={e => setFormData({...formData, celular: e.target.value.replace(/\D/g, '')})} maxLength={15} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1">CEP</label><div className="flex gap-2"><input type="text" value={formData.cep} onChange={handleCEPChange} maxLength={9} placeholder="00000-000" className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" /><button type="button" onClick={() => consultarCEP(formData.cep)} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">Buscar</button></div></div>
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1">Endereço</label><input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Cidade</label><input type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value.toUpperCase()})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" /></div>
                  <div><label className="block text-sm font-medium mb-1">Estado</label><select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700">{UFS.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>)}</select></div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <input type="checkbox" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <label className="text-sm text-gray-700 dark:text-gray-300">Prestador Ativo</label>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:from-blue-600 hover:to-indigo-700">{editing ? 'Atualizar' : 'Salvar'} Prestador</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
