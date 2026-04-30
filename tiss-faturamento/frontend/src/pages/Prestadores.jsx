import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { prestadoresService } from '../services/supabaseService';
import SearchableSelect from '../components/SearchableSelect';

// Lista completa de UFs do Brasil
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Lista completa de Conselhos Profissionais
const CONSELHOS = [
  { sigla: 'CRM', nome: 'Conselho Regional de Medicina', codigoANS: '06', cbos: ['225125', '225135', '225140'] },
  { sigla: 'CRO', nome: 'Conselho Regional de Odontologia', codigoANS: '07', cbos: ['223105', '223110', '223115'] },
  { sigla: 'CRF', nome: 'Conselho Regional de Farmácia', codigoANS: '05', cbos: ['223205', '223210', '223215'] },
  { sigla: 'COREN', nome: 'Conselho Regional de Enfermagem', codigoANS: '04', cbos: ['223505', '223510', '223515'] },
  { sigla: 'CREFITO', nome: 'Conselho Regional de Fisioterapia', codigoANS: '03', cbos: ['223605', '223610'] },
  { sigla: 'CRP', nome: 'Conselho Regional de Psicologia', codigoANS: '08', cbos: ['251510', '251515'] },
  { sigla: 'CRBio', nome: 'Conselho Regional de Biomedicina', codigoANS: '09', cbos: ['223305', '223310'] },
  { sigla: 'CRN', nome: 'Conselho Regional de Nutrição', codigoANS: '10', cbos: ['223405', '223410'] },
  { sigla: 'CREF', nome: 'Conselho Regional de Educação Física', codigoANS: '11', cbos: ['224105', '224110'] },
  { sigla: 'CRA', nome: 'Conselho Regional de Administração', codigoANS: '12', cbos: ['142105'] },
  { sigla: 'CRESS', nome: 'Conselho Regional de Serviço Social', codigoANS: '13', cbos: ['251605'] }
];

// Lista de Especialidades com seus respectivos CBOS
const ESPECIALIDADES = [
  { nome: 'Clínica Médica', cbos: '225125', codigoANS: '06' },
  { nome: 'Cardiologia', cbos: '225135', codigoANS: '06' },
  { nome: 'Pediatria', cbos: '225140', codigoANS: '06' },
  { nome: 'Ginecologia', cbos: '225145', codigoANS: '06' },
  { nome: 'Obstetrícia', cbos: '225150', codigoANS: '06' },
  { nome: 'Ortopedia', cbos: '225155', codigoANS: '06' },
  { nome: 'Traumatologia', cbos: '225160', codigoANS: '06' },
  { nome: 'Cirurgia Geral', cbos: '225165', codigoANS: '06' },
  { nome: 'Neurologia', cbos: '225170', codigoANS: '06' },
  { nome: 'Psiquiatria', cbos: '225175', codigoANS: '06' },
  { nome: 'Dermatologia', cbos: '225180', codigoANS: '06' },
  { nome: 'Oftalmologia', cbos: '225185', codigoANS: '06' },
  { nome: 'Otorrinolaringologia', cbos: '225190', codigoANS: '06' },
  { nome: 'Urologia', cbos: '225195', codigoANS: '06' },
  { nome: 'Anestesiologia', cbos: '225200', codigoANS: '06' },
  { nome: 'Radiologia', cbos: '225205', codigoANS: '06' },
  { nome: 'Patologia', cbos: '225210', codigoANS: '06' },
  { nome: 'Endocrinologia', cbos: '225215', codigoANS: '06' },
  { nome: 'Gastroenterologia', cbos: '225220', codigoANS: '06' },
  { nome: 'Nefrologia', cbos: '225225', codigoANS: '06' },
  { nome: 'Pneumologia', cbos: '225230', codigoANS: '06' },
  { nome: 'Reumatologia', cbos: '225235', codigoANS: '06' },
  { nome: 'Infectologia', cbos: '225240', codigoANS: '06' },
  { nome: 'Oncologia', cbos: '225245', codigoANS: '06' },
  { nome: 'Hematologia', cbos: '225250', codigoANS: '06' },
  { nome: 'Medicina do Trabalho', cbos: '225255', codigoANS: '06' },
  { nome: 'Medicina Legal', cbos: '225260', codigoANS: '06' },
  { nome: 'Acupuntura', cbos: '225265', codigoANS: '06' },
  { nome: 'Homeopatia', cbos: '225270', codigoANS: '06' },
  { nome: 'Fisioterapia', cbos: '223605', codigoANS: '03' },
  { nome: 'Fonoaudiologia', cbos: '223610', codigoANS: '03' },
  { nome: 'Terapia Ocupacional', cbos: '223615', codigoANS: '03' },
  { nome: 'Nutrição', cbos: '223405', codigoANS: '10' },
  { nome: 'Psicologia', cbos: '251510', codigoANS: '08' },
  { nome: 'Farmácia', cbos: '223205', codigoANS: '05' },
  { nome: 'Biomedicina', cbos: '223305', codigoANS: '09' },
  { nome: 'Enfermagem', cbos: '223505', codigoANS: '04' },
  { nome: 'Odontologia Clínica', cbos: '223105', codigoANS: '07' },
  { nome: 'Odontopediatria', cbos: '223110', codigoANS: '07' },
  { nome: 'Ortodontia', cbos: '223115', codigoANS: '07' }
];

export default function Prestadores() {
  const [prestadores, setPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    codigo_prestador: '',
    cpf: '',
    cnpj: '',
    conselho: 'CRM',
    codigo_conselho_ans: '06',
    numero_conselho: '',
    uf_conselho: 'SP',
    especialidade: 'Clínica Médica',
    cbos: '225125',
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
      const data = await prestadoresService.listar();
      setPrestadores(data);
    } catch (error) {
      console.error('Erro ao carregar prestadores:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.codigo_prestador) {
      toast.error('Nome e código do prestador são obrigatórios');
      return;
    }

    const prestadorData = {
      nome: formData.nome.toUpperCase(),
      codigo_prestador: formData.codigo_prestador,
      cpf: formData.cpf.replace(/\D/g, ''),
      cnpj: formData.cnpj.replace(/\D/g, ''),
      conselho: formData.conselho,
      codigo_conselho_ans: formData.codigo_conselho_ans,
      numero_conselho: formData.numero_conselho,
      uf_conselho: formData.uf_conselho,
      especialidade: formData.especialidade,
      cbos: formData.cbos,
      telefone: formData.telefone.replace(/\D/g, ''),
      celular: formData.celular.replace(/\D/g, ''),
      email: formData.email,
      endereco: formData.endereco,
      cep: formData.cep.replace(/\D/g, ''),
      cidade: formData.cidade,
      estado: formData.estado,
      ativo: formData.ativo
    };

    try {
      if (editing) {
        await prestadoresService.atualizar(editing.id, prestadorData);
        toast.success('Prestador atualizado com sucesso!');
      } else {
        await prestadoresService.criar(prestadorData);
        toast.success('Prestador cadastrado com sucesso!');
      }
      await carregarPrestadores();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar prestador:', error);
      toast.error('Erro ao salvar prestador');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '', codigo_prestador: '', cpf: '', cnpj: '', conselho: 'CRM',
      codigo_conselho_ans: '06', numero_conselho: '', uf_conselho: 'SP',
      especialidade: 'Clínica Médica', cbos: '225125', telefone: '', celular: '',
      email: '', endereco: '', cep: '', cidade: '', estado: 'SP', ativo: true
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este prestador?')) {
      try {
        await prestadoresService.deletar(id);
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

  const handleEspecialidadeChange = (especialidade) => {
    const encontrada = ESPECIALIDADES.find(e => e.nome === especialidade);
    setFormData({
      ...formData,
      especialidade: especialidade,
      cbos: encontrada?.cbos || '225125',
      conselho: encontrada?.codigoANS === '06' ? 'CRM' : 
                 encontrada?.codigoANS === '07' ? 'CRO' :
                 encontrada?.codigoANS === '05' ? 'CRF' :
                 encontrada?.codigoANS === '04' ? 'COREN' :
                 encontrada?.codigoANS === '03' ? 'CREFITO' :
                 encontrada?.codigoANS === '08' ? 'CRP' : 'CRM',
      codigo_conselho_ans: encontrada?.codigoANS || '06'
    });
  };

  const filtered = prestadores.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_prestador?.includes(searchTerm) ||
    p.cpf?.includes(searchTerm) ||
    p.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando prestadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Prestadores
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cadastro de profissionais e prestadores de serviços
          </p>
        </div>
        <button 
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowModal(true);
          }} 
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPF/CNPJ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conselho</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Especialidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CBOS</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{p.codigo_prestador}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{p.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.cpf || p.cnpj || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.conselho} {p.numero_conselho}/{p.uf_conselho}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{p.especialidade}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{p.cbos}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button 
                        onClick={() => { setEditing(p); setFormData(p); setShowModal(true); }} 
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
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Nenhum prestador cadastrado
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editing ? 'Editar Prestador' : 'Novo Prestador'}
              </h3>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleSubmit}>
                {/* Dados Pessoais */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código do Prestador *</label>
                    <input 
                      type="text" 
                      value={formData.codigo_prestador} 
                      onChange={e => setFormData({...formData, codigo_prestador: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                    <input 
                      type="text" 
                      value={formData.cpf} 
                      onChange={e => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '')})} 
                      maxLength={14}
                      placeholder="000.000.000-00"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                    <input 
                      type="text" 
                      value={formData.cnpj} 
                      onChange={e => setFormData({...formData, cnpj: e.target.value.replace(/\D/g, '')})} 
                      placeholder="00.000.000/0000-00"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                </div>

                {/* Conselho */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conselho</label>
                    <select 
                      value={formData.conselho} 
                      onChange={e => handleConselhoChange(e.target.value)} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {CONSELHOS.map(c => (
                        <option key={c.sigla} value={c.sigla}>{c.sigla} - {c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código ANS</label>
                    <input 
                      type="text" 
                      value={formData.codigo_conselho_ans} 
                      disabled 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número do Conselho</label>
                    <input 
                      type="text" 
                      value={formData.numero_conselho} 
                      onChange={e => setFormData({...formData, numero_conselho: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF do Conselho</label>
                    <select 
                      value={formData.uf_conselho} 
                      onChange={e => setFormData({...formData, uf_conselho: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>

                {/* Especialidade e CBOS */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialidade</label>
                    <select 
                      value={formData.especialidade} 
                      onChange={e => handleEspecialidadeChange(e.target.value)} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {ESPECIALIDADES.map(e => (
                        <option key={e.nome} value={e.nome}>{e.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CBOS</label>
                    <input 
                      type="text" 
                      value={formData.cbos} 
                      disabled 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-400 font-mono" 
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Código de ocupação da especialidade</p>
                  </div>
                </div>

                {/* Contato */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      value={formData.telefone} 
                      onChange={e => setFormData({...formData, telefone: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celular</label>
                    <input 
                      type="text" 
                      value={formData.celular} 
                      onChange={e => setFormData({...formData, celular: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                    <input 
                      type="text" 
                      value={formData.endereco} 
                      onChange={e => setFormData({...formData, endereco: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                    <input 
                      type="text" 
                      value={formData.cep} 
                      onChange={e => setFormData({...formData, cep: e.target.value})} 
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                    <select 
                      value={formData.estado} 
                      onChange={e => setFormData({...formData, estado: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    checked={formData.ativo} 
                    onChange={e => setFormData({...formData, ativo: e.target.checked})} 
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600" 
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">Prestador Ativo</label>
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
                    {editing ? 'Atualizar' : 'Salvar'} Prestador
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
