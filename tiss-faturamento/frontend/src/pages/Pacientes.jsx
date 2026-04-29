import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';

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

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [convenios, setConvenios] = useState([]);
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

  const carregarDados = () => {
    const storedPacientes = localStorage.getItem('pacientes');
    const storedConvenios = localStorage.getItem('convenios');
    if (storedPacientes) setPacientes(JSON.parse(storedPacientes));
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
  };

  const salvarPacientes = (lista) => {
    localStorage.setItem('pacientes', JSON.stringify(lista));
    setPacientes(lista);
  };

  // Buscar endereço pelo CEP usando ViaCEP
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.numero_carteira || !formData.convenio_id) {
      toast.error('Nome, número da carteira e convênio são obrigatórios');
      return;
    }

    const pacienteData = {
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ''),
      rg: formData.rg.replace(/\D/g, ''),
      telefone: formData.telefone.replace(/\D/g, ''),
      celular: formData.celular.replace(/\D/g, ''),
      cep: formData.cep.replace(/\D/g, '')
    };

    if (editing) {
      salvarPacientes(pacientes.map(p => p.id === editing.id ? { ...pacienteData, id: p.id, updated_at: new Date().toISOString() } : p));
      toast.success('Paciente atualizado com sucesso!');
    } else {
      salvarPacientes([...pacientes, { ...pacienteData, id: Date.now(), created_at: new Date().toISOString(), status: 'ATIVO' }]);
      toast.success('Paciente cadastrado com sucesso!');
    }

    setShowModal(false);
    setEditing(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '', numero_carteira: '', convenio_id: '', cpf: '', rg: '', data_nascimento: '', sexo: 'M',
      telefone: '', celular: '', email: '', endereco: '', numero: '', complemento: '', bairro: '',
      cep: '', cidade: '', estado: 'SP', data_validade_carteira: '', observacao: ''
    });
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este paciente?')) {
      salvarPacientes(pacientes.filter(p => p.id !== id));
      toast.success('Paciente excluído com sucesso!');
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
    porConvenio: convenios.map(c => ({
      ...c,
      quantidade: pacientes.filter(p => p.convenio_id === c.id).length
    }))
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Pacientes / Beneficiários</h2>
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" /> Novo Paciente
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Total de Pacientes</p>
          <p className="text-2xl font-bold text-gray-800">{estatisticas.total}</p>
        </div>
        {estatisticas.porConvenio.slice(0, 3).map(c => (
          <div key={c.id} className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">{c.razao_social}</p>
            <p className="text-2xl font-bold text-blue-600">{c.quantidade}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFiltroConvenio('todos')} className={`px-3 py-1 rounded-lg text-xs ${filtroConvenio === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Todos ({pacientes.length})
        </button>
        {convenios.map(c => {
          const count = pacientes.filter(p => p.convenio_id === c.id).length;
          if (count === 0) return null;
          return (
            <button key={c.id} onClick={() => setFiltroConvenio(c.id.toString())} className={`px-3 py-1 rounded-lg text-xs ${filtroConvenio === c.id.toString() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {c.nome_fantasia || c.razao_social} ({count})
            </button>
          );
        })}
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg border p-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, carteira ou CPF..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full border rounded-lg px-8 py-1.5 text-sm" 
          />
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Nome</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Carteira</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Convênio</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">CPF</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Validade</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Telefone</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500 w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPacientes.map((p) => {
                const convenio = convenios.find(c => c.id === p.convenio_id);
                const status = getStatusCarteira(p.data_validade_carteira);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-800">{p.nome}</td>
                    <td className="px-4 py-2 text-xs font-mono text-gray-600">{p.numero_carteira}</td>
                    <td className="px-4 py-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${convenio ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {convenio?.razao_social || 'Sem convênio'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{p.cpf ? aplicarMascaraCPF(p.cpf) : '-'}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {status.color === 'green' && <CheckCircleIcon className="w-3 h-3 text-green-500" />}
                        {status.color === 'yellow' && <ClockIcon className="w-3 h-3 text-yellow-500" />}
                        {status.color === 'red' && <XCircleIcon className="w-3 h-3 text-red-500" />}
                        <span className={`text-xs ${
                          status.color === 'green' ? 'text-green-600' : 
                          status.color === 'yellow' ? 'text-yellow-600' : 
                          status.color === 'red' ? 'text-red-600' : 'text-gray-500'
                        }`}>{status.text}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{p.telefone ? aplicarMascaraTelefone(p.telefone) : (p.celular ? aplicarMascaraTelefone(p.celular) : '-')}</td>
                    <td className="px-4 py-2 text-center">
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
                        className="text-blue-600 hover:text-blue-800 mx-1" 
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="text-red-600 hover:text-red-800 mx-1" 
                        title="Excluir"
                      >
                        <TrashIcon className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredPacientes.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            Nenhum paciente encontrado
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold mb-4">{editing ? 'Editar' : 'Novo'} Paciente</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados Pessoais */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input 
                    type="text" 
                    value={formData.cpf} 
                    onChange={e => setFormData({...formData, cpf: aplicarMascaraCPF(e.target.value)})} 
                    maxLength={14}
                    placeholder="000.000.000-00"
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                  <input 
                    type="text" 
                    value={formData.rg} 
                    onChange={e => setFormData({...formData, rg: aplicarMascaraRG(e.target.value)})} 
                    placeholder="00.000.000-0"
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Nascimento</label>
                  <input type="date" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>

                {/* Dados do Convênio */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Convênio *</label>
                  <select 
                    value={formData.convenio_id} 
                    onChange={e => setFormData({...formData, convenio_id: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                    required
                  >
                    <option value="">Selecione o convênio</option>
                    {convenios.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número da Carteira *</label>
                  <input type="text" value={formData.numero_carteira} onChange={e => setFormData({...formData, numero_carteira: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Validade da Carteira</label>
                  <input type="date" value={formData.data_validade_carteira} onChange={e => setFormData({...formData, data_validade_carteira: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>

                {/* Contato */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Fixo</label>
                  <input 
                    type="text" 
                    value={formData.telefone} 
                    onChange={e => setFormData({...formData, telefone: aplicarMascaraTelefone(e.target.value)})} 
                    maxLength={15}
                    placeholder="(00) 0000-0000"
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular / WhatsApp</label>
                  <input 
                    type="text" 
                    value={formData.celular} 
                    onChange={e => setFormData({...formData, celular: aplicarMascaraTelefone(e.target.value)})} 
                    maxLength={15}
                    placeholder="(00) 00000-0000"
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.cep} 
                      onChange={handleCEPChange} 
                      maxLength={9}
                      placeholder="00000-000"
                      className="w-full border rounded-lg px-3 py-2 text-sm" 
                    />
                    {buscandoCEP && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input type="text" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea rows="2" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
