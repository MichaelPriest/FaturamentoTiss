import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.numero_carteira || !formData.convenio_id) {
      toast.error('Nome, número da carteira e convênio são obrigatórios');
      return;
    }

    if (editing) {
      salvarPacientes(pacientes.map(p => p.id === editing.id ? { ...formData, id: p.id, updated_at: new Date().toISOString() } : p));
      toast.success('Paciente atualizado com sucesso!');
    } else {
      salvarPacientes([...pacientes, { ...formData, id: Date.now(), created_at: new Date().toISOString(), status: 'ATIVO' }]);
      toast.success('Paciente cadastrado com sucesso!');
    }

    setShowModal(false);
    setEditing(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '', numero_carteira: '', convenio_id: '', cpf: '', rg: '', data_nascimento: '', sexo: 'M',
      telefone: '', celular: '', email: '', endereco: '', cep: '', cidade: '', estado: 'SP',
      data_validade_carteira: '', observacao: ''
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
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.numero_carteira.includes(searchTerm) ||
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
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
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
          <input type="text" placeholder="Buscar por nome, carteira ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-lg px-8 py-1.5 text-sm" />
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
                    <td className="px-4 py-2 text-xs text-gray-600">{convenio?.razao_social || '-'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{p.cpf || '-'}</td>
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
                    <td className="px-4 py-2 text-xs text-gray-500">{p.telefone || p.celular || '-'}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => { setEditing(p); setFormData(p); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                        <PencilIcon className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 mx-1" title="Excluir">
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
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar' : 'Novo'} Paciente</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                {/* Dados Pessoais */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
                  <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">RG</label>
                  <input type="text" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data Nascimento</label>
                  <input type="date" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sexo</label>
                  <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>

                {/* Dados do Convênio */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Convênio *</label>
                  <select value={formData.convenio_id} onChange={e => setFormData({...formData, convenio_id: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required>
                    <option value="">Selecione o convênio</option>
                    {convenios.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número da Carteira *</label>
                  <input type="text" value={formData.numero_carteira} onChange={e => setFormData({...formData, numero_carteira: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data Validade da Carteira</label>
                  <input type="date" value={formData.data_validade_carteira} onChange={e => setFormData({...formData, data_validade_carteira: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>

                {/* Contato */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Celular</label>
                  <input type="text" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>

                {/* Endereço */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Endereço</label>
                  <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CEP</label>
                  <input type="text" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                    <option value="SP">São Paulo</option><option value="RJ">Rio de Janeiro</option><option value="MG">Minas Gerais</option>
                    <option value="RS">Rio Grande do Sul</option><option value="PR">Paraná</option><option value="SC">Santa Catarina</option>
                    <option value="BA">Bahia</option><option value="PE">Pernambuco</option><option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option><option value="GO">Goiás</option><option value="ES">Espírito Santo</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                  <textarea rows="2" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm"></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}