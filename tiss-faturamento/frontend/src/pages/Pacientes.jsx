import { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, 
  CheckCircleIcon, XCircleIcon, ClockIcon, UsersIcon, BuildingOfficeIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import { pacientesService, conveniosService } from '../services/supabaseService';
import SearchableSelect from '../components/SearchableSelect';

// Funções de máscara
const aplicarMascaraCPF = (valor) => {
  const cpf = valor.replace(/\D/g, '');
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return cpf.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  if (cpf.length <= 9) return cpf.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
};

const aplicarMascaraTelefone = (valor) => {
  const telefone = valor.replace(/\D/g, '');
  if (telefone.length <= 2) return telefone;
  if (telefone.length <= 6) return telefone.replace(/(\d{2})(\d{1,4})/, '($1) $2');
  if (telefone.length <= 10) return telefone.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
  return telefone.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
};

const aplicarMascaraCEP = (valor) => {
  const cep = valor.replace(/\D/g, '');
  if (cep.length <= 5) return cep;
  return cep.replace(/(\d{5})(\d{1,3})/, '$1-$2');
};

const aplicarMascaraRG = (valor) => {
  const rg = valor.replace(/\D/g, '');
  if (rg.length <= 2) return rg;
  if (rg.length <= 5) return rg.replace(/(\d{2})(\d{1,3})/, '$1.$2');
  if (rg.length <= 8) return rg.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
  return rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
};

// Lista de estados brasileiros
const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Opções de sexo
const SEXO_OPCOES = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' }
];

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    numero_carteira: '',
    convenio_id: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    sexo: 'M',
    telefone: '',
    celular: '',
    email: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado: 'SP',
    data_validade_carteira: '',
    observacao: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [pacientesData, conveniosData] = await Promise.all([
        pacientesService.listar(),
        conveniosService.listar()
      ]);
      setPacientes(pacientesData);
      setConvenios(conveniosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const buscarEnderecoPorCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    
    setBuscandoCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
        toast.success('Endereço encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setBuscandoCEP(false);
    }
  };

  const handleCEPChange = (e) => {
    const cepMask = aplicarMascaraCEP(e.target.value);
    setFormData({ ...formData, cep: cepMask });
    
    const cepLimpo = e.target.value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarEnderecoPorCEP(cepLimpo);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.numero_carteira || !formData.convenio_id) {
      toast.error('Nome, número da carteira e convênio são obrigatórios');
      return;
    }

    const pacienteData = {
      nome: formData.nome.toUpperCase(),
      numero_carteira: formData.numero_carteira,
      convenio_id: parseInt(formData.convenio_id),
      cpf: formData.cpf.replace(/\D/g, ''),
      rg: formData.rg.replace(/\D/g, ''),
      data_nascimento: formData.data_nascimento || null,
      sexo: formData.sexo,
      telefone: formData.telefone.replace(/\D/g, ''),
      celular: formData.celular.replace(/\D/g, ''),
      email: formData.email,
      endereco: formData.endereco,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cep: formData.cep.replace(/\D/g, ''),
      cidade: formData.cidade,
      estado: formData.estado,
      data_validade_carteira: formData.data_validade_carteira || null,
      observacao: formData.observacao
    };

    try {
      if (editing) {
        await pacientesService.atualizar(editing.id, pacienteData);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        await pacientesService.criar(pacienteData);
        toast.success('Paciente cadastrado com sucesso!');
      }
      await carregarDados();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      toast.error('Erro ao salvar paciente');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '', numero_carteira: '', convenio_id: '', cpf: '', rg: '', data_nascimento: '', sexo: 'M',
      telefone: '', celular: '', email: '', endereco: '', numero: '', complemento: '', bairro: '',
      cep: '', cidade: '', estado: 'SP', data_validade_carteira: '', observacao: ''
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este paciente?')) {
      try {
        await pacientesService.deletar(id);
        toast.success('Paciente excluído com sucesso!');
        await carregarDados();
      } catch (error) {
        console.error('Erro ao excluir paciente:', error);
        toast.error('Erro ao excluir paciente');
      }
    }
  };

  const getStatusCarteira = (validade) => {
    if (!validade) return { text: 'Não informada', color: 'gray' };
    const diasRestantes = differenceInDays(parseISO(validade), new Date());
    if (diasRestantes < 0) return { text: 'Vencida', color: 'red' };
    if (diasRestantes < 30) return { text: `Vence em ${diasRestantes} dias`, color: 'yellow' };
    return { text: `Válida até ${format(parseISO(validade), 'dd/MM/yyyy')}`, color: 'green' };
  };

  const filteredPacientes = pacientes.filter(p => {
    const matchConvenio = filtroConvenio === 'todos' || p.convenio_id === parseInt(filtroConvenio);
    const matchSearch = p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.numero_carteira?.includes(searchTerm) ||
                        p.cpf?.includes(searchTerm);
    return matchConvenio && matchSearch;
  });

  const estatisticas = {
    total: pacientes.length,
    comConvenio: pacientes.filter(p => p.convenio_id).length,
    semConvenio: pacientes.filter(p => !p.convenio_id).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Pacientes / Beneficiários
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cadastro de pacientes e beneficiários
          </p>
        </div>
        <button 
          onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
        >
          <PlusIcon className="w-4 h-4" /> Novo Paciente
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Pacientes</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Com Convênio</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{estatisticas.comConvenio}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sem Convênio</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{estatisticas.semConvenio}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Convênios</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{convenios.length}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setFiltroConvenio('todos')} 
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroConvenio === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          Todos ({pacientes.length})
        </button>
        {convenios.map(c => {
          const count = pacientes.filter(p => p.convenio_id === c.id).length;
          if (count === 0) return null;
          return (
            <button 
              key={c.id} 
              onClick={() => setFiltroConvenio(c.id.toString())} 
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroConvenio === c.id.toString() ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {c.nome_fantasia || c.razao_social} ({count})
            </button>
          );
        })}
      </div>

      {/* Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome, carteira ou CPF..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full border-0 bg-transparent rounded-lg px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
          />
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Carteira</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Convênio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Telefone</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPacientes.map((p) => {
                const convenio = convenios.find(c => c.id === p.convenio_id);
                const status = getStatusCarteira(p.data_validade_carteira);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{p.nome}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{p.numero_carteira}</td>
                    <td className="px-4 py-3">
                      {convenio ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {convenio.razao_social}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          Sem convênio
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.cpf ? aplicarMascaraCPF(p.cpf) : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {status.color === 'green' && <CheckCircleIcon className="w-3 h-3 text-green-500" />}
                        {status.color === 'yellow' && <ClockIcon className="w-3 h-3 text-yellow-500" />}
                        {status.color === 'red' && <XCircleIcon className="w-3 h-3 text-red-500" />}
                        <span className={`text-xs ${
                          status.color === 'green' ? 'text-green-600 dark:text-green-400' : 
                          status.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 
                          status.color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>{status.text}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.telefone ? aplicarMascaraTelefone(p.telefone) : (p.celular ? aplicarMascaraTelefone(p.celular) : '-')}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => { 
                            setEditing(p); 
                            setFormData({
                              ...p,
                              cpf: p.cpf ? aplicarMascaraCPF(p.cpf) : '',
                              rg: p.rg || '',
                              telefone: p.telefone ? aplicarMascaraTelefone(p.telefone) : '',
                              celular: p.celular ? aplicarMascaraTelefone(p.celular) : '',
                              cep: p.cep ? aplicarMascaraCEP(p.cep) : ''
                            }); 
                            setShowModal(true); 
                          }} 
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
                );
              })}
              {filteredPacientes.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    Nenhum paciente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editing ? 'Editar Paciente' : 'Novo Paciente'}
              </h3>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      value={formData.nome} 
                      onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                    <input 
                      type="text" 
                      value={formData.cpf} 
                      onChange={e => setFormData({...formData, cpf: aplicarMascaraCPF(e.target.value)})} 
                      maxLength={14}
                      placeholder="000.000.000-00"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RG</label>
                    <input 
                      type="text" 
                      value={formData.rg} 
                      onChange={e => setFormData({...formData, rg: aplicarMascaraRG(e.target.value)})} 
                      placeholder="00.000.000-0"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Nascimento</label>
                    <input 
                      type="date" 
                      value={formData.data_nascimento} 
                      onChange={e => setFormData({...formData, data_nascimento: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  
                  {/* Sexo - SearchableSelect */}
                  <SearchableSelect
                    label="Sexo"
                    options={SEXO_OPCOES}
                    value={formData.sexo}
                    onChange={e => setFormData({...formData, sexo: e.target.value})}
                    placeholder="Selecione o sexo"
                  />

                  {/* Convênio - SearchableSelect */}
                  <SearchableSelect
                    label="Convênio"
                    options={convenios.filter(c => c.ativo !== false).map(c => ({
                      value: c.id,
                      label: `${c.razao_social} ${c.codigo_prestador ? `(Cód: ${c.codigo_prestador})` : ''}`
                    }))}
                    value={formData.convenio_id}
                    onChange={e => setFormData({...formData, convenio_id: e.target.value})}
                    placeholder="Selecione o convênio"
                    required={true}
                  />
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 -mt-2">
                    ✓ O convênio será usado no faturamento
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número da Carteira *</label>
                    <input 
                      type="text" 
                      value={formData.numero_carteira} 
                      onChange={e => setFormData({...formData, numero_carteira: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Validade da Carteira</label>
                    <input 
                      type="date" 
                      value={formData.data_validade_carteira} 
                      onChange={e => setFormData({...formData, data_validade_carteira: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone Fixo</label>
                    <input 
                      type="text" 
                      value={formData.telefone} 
                      onChange={e => setFormData({...formData, telefone: aplicarMascaraTelefone(e.target.value)})} 
                      maxLength={15}
                      placeholder="(00) 0000-0000"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celular / WhatsApp</label>
                    <input 
                      type="text" 
                      value={formData.celular} 
                      onChange={e => setFormData({...formData, celular: aplicarMascaraTelefone(e.target.value)})} 
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.cep} 
                        onChange={handleCEPChange} 
                        maxLength={9}
                        placeholder="00000-000"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                      />
                      {buscandoCEP && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                    <input 
                      type="text" 
                      value={formData.endereco} 
                      onChange={e => setFormData({...formData, endereco: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                    <input 
                      type="text" 
                      value={formData.numero} 
                      onChange={e => setFormData({...formData, numero: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Complemento</label>
                    <input 
                      type="text" 
                      value={formData.complemento} 
                      onChange={e => setFormData({...formData, complemento: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                    <input 
                      type="text" 
                      value={formData.bairro} 
                      onChange={e => setFormData({...formData, bairro: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                    <input 
                      type="text" 
                      value={formData.cidade} 
                      onChange={e => setFormData({...formData, cidade: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  
                  {/* Estado - SearchableSelect */}
                  <SearchableSelect
                    label="Estado"
                    options={ESTADOS.map(uf => ({ value: uf, label: uf }))}
                    value={formData.estado}
                    onChange={e => setFormData({...formData, estado: e.target.value})}
                    placeholder="Selecione o estado"
                  />
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                    <textarea 
                      rows="3" 
                      value={formData.observacao} 
                      onChange={e => setFormData({...formData, observacao: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                      placeholder="Informações adicionais..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md"
                  >
                    {editing ? 'Atualizar' : 'Salvar'} Paciente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
