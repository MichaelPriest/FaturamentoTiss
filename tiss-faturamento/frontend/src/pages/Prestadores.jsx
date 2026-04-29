import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

// Lista completa de UFs do Brasil
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Lista completa de Conselhos Profissionais (sem duplicatas)
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
    const stored = localStorage.getItem('prestadores');
    if (stored) setPrestadores(JSON.parse(stored));
  }, []);

  const salvar = (lista) => {
    localStorage.setItem('prestadores', JSON.stringify(lista));
    setPrestadores(lista);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.codigo_prestador) {
      toast.error('Nome e código do prestador são obrigatórios');
      return;
    }

    if (editing) {
      salvar(prestadores.map(p => p.id === editing.id ? { ...formData, id: p.id } : p));
      toast.success('Prestador atualizado com sucesso!');
    } else {
      salvar([...prestadores, { ...formData, id: Date.now(), created_at: new Date().toISOString() }]);
      toast.success('Prestador cadastrado com sucesso!');
    }

    setShowModal(false);
    setEditing(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '', codigo_prestador: '', cpf: '', cnpj: '', conselho: 'CRM',
      codigo_conselho_ans: '06', numero_conselho: '', uf_conselho: 'SP',
      especialidade: 'Clínica Médica', cbos: '225125', telefone: '', celular: '',
      email: '', endereco: '', cep: '', cidade: '', estado: 'SP', ativo: true
    });
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este prestador?')) {
      salvar(prestadores.filter(p => p.id !== id));
      toast.success('Prestador excluído!');
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Prestadores</h2>
        <button 
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowModal(true);
          }} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Novo Prestador
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg border p-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, código, CPF ou especialidade..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full border rounded-lg px-8 py-1.5 text-sm" 
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Código</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Nome</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">CPF/CNPJ</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Conselho</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Especialidade</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">CBOS</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500 w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs font-mono text-gray-600">{p.codigo_prestador}</td>
                  <td className="px-4 py-2 text-xs text-gray-800">{p.nome}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{p.cpf || p.cnpj || '-'}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{p.conselho} {p.numero_conselho}/{p.uf_conselho}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{p.especialidade}</td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-500">{p.cbos}</td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      onClick={() => { setEditing(p); setFormData(p); setShowModal(true); }} 
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
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            Nenhum prestador cadastrado
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar' : 'Novo'} Prestador</h3>
            <form onSubmit={handleSubmit}>
              {/* Dados Pessoais */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código do Prestador *</label>
                  <input type="text" value={formData.codigo_prestador} onChange={e => setFormData({...formData, codigo_prestador: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
                  <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ</label>
                  <input type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
              </div>

              {/* Conselho */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Conselho</label>
                  <select 
                    value={formData.conselho} 
                    onChange={e => handleConselhoChange(e.target.value)} 
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  >
                    {CONSELHOS.map(c => (
                      <option key={c.sigla} value={c.sigla}>{c.sigla} - {c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código ANS</label>
                  <input type="text" value={formData.codigo_conselho_ans} disabled className="w-full border rounded-lg px-3 py-1.5 text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número do Conselho</label>
                  <input type="text" value={formData.numero_conselho} onChange={e => setFormData({...formData, numero_conselho: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">UF do Conselho</label>
                  <select value={formData.uf_conselho} onChange={e => setFormData({...formData, uf_conselho: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              {/* Especialidade e CBOS */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Especialidade</label>
                  <select 
                    value={formData.especialidade} 
                    onChange={e => handleEspecialidadeChange(e.target.value)} 
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  >
                    {ESPECIALIDADES.map(e => (
                      <option key={e.nome} value={e.nome}>{e.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CBOS</label>
                  <input type="text" value={formData.cbos} disabled className="w-full border rounded-lg px-3 py-1.5 text-sm bg-gray-50" />
                  <p className="text-xs text-gray-400 mt-1">Código de ocupação da especialidade</p>
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-2 gap-3 mb-4">
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
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-2 gap-3 mb-4">
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
                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="w-4 h-4" />
                <label className="text-sm text-gray-700">Prestador Ativo</label>
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