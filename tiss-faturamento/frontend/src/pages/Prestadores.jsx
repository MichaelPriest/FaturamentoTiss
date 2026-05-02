import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

// Lista completa de UFs do Brasil
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Lista completa de Conselhos Profissionais
const CONSELHOS = [
  { sigla: 'CRM', nome: 'Conselho Regional de Medicina', codigoANS: '06' },
  { sigla: 'CRO', nome: 'Conselho Regional de Odontologia', codigoANS: '07' },
  { sigla: 'CRF', nome: 'Conselho Regional de Farmácia', codigoANS: '05' },
  { sigla: 'COREN', nome: 'Conselho Regional de Enfermagem', codigoANS: '04' },
  { sigla: 'CREFITO', nome: 'Conselho Regional de Fisioterapia', codigoANS: '03' },
  { sigla: 'CRP', nome: 'Conselho Regional de Psicologia', codigoANS: '08' },
  { sigla: 'CRBio', nome: 'Conselho Regional de Biomedicina', codigoANS: '09' },
  { sigla: 'CRN', nome: 'Conselho Regional de Nutrição', codigoANS: '10' },
  { sigla: 'CREF', nome: 'Conselho Regional de Educação Física', codigoANS: '11' },
  { sigla: 'CRA', nome: 'Conselho Regional de Administração', codigoANS: '12' },
  { sigla: 'CRESS', nome: 'Conselho Regional de Serviço Social', codigoANS: '13' }
];

// Mapeamento de especialidades
const MAPA_ESPECIALIDADES = {
  32: { nome: 'Terapia Ocupacional', cbos: '223615', codigo_ans: '03' },
  14: { nome: 'Psicologia', cbos: '251510', codigo_ans: '08' },
  15: { nome: 'Neuropsicologia', cbos: '251510', codigo_ans: '08' },
  16: { nome: 'Psicopedagogia', cbos: '251510', codigo_ans: '08' },
  17: { nome: 'Fonoaudiologia', cbos: '223610', codigo_ans: '03' },
  18: { nome: 'Fisioterapia', cbos: '223605', codigo_ans: '03' },
  19: { nome: 'Psicomotricidade', cbos: '223605', codigo_ans: '03' },
  21: { nome: 'Musicoterapia', cbos: '223610', codigo_ans: '03' },
  22: { nome: 'Nutrição', cbos: '223405', codigo_ans: '10' },
  23: { nome: 'Pedagogia', cbos: null, codigo_ans: null },
  24: { nome: 'Educação Física', cbos: '224105', codigo_ans: '11' },
  25: { nome: 'Gerontologia', cbos: '223615', codigo_ans: '03' },
  26: { nome: 'Estudante Psicologia', cbos: null, codigo_ans: null }
};

export default function Prestadores() {
  const [prestadores, setPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState([]);
  const [especialidadePrincipal, setEspecialidadePrincipal] = useState(null);
  
  const [formData, setFormData] = useState({
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
      // Buscar todos os prestadores
      const { data: prestadoresData, error: errorPrestadores } = await supabase
        .from('prestadores')
        .select('*')
        .order('nome', { ascending: true });
      
      if (errorPrestadores) throw errorPrestadores;
      
      // Buscar relações e especialidades em uma única consulta
      const { data: relacoesComEsp, error: errorRelacoes } = await supabase
        .from('prestador_especialidade')
        .select(`
          id,
          prestador_id,
          especialidade_id,
          principal,
          especialidades (
            id,
            nome,
            cbos,
            codigo_ans
          )
        `);
      
      if (errorRelacoes) throw errorRelacoes;
      
      // Agrupar especialidades por prestador
      const especialidadesPorPrestador = new Map();
      
      relacoesComEsp?.forEach(rel => {
        if (!especialidadesPorPrestador.has(rel.prestador_id)) {
          especialidadesPorPrestador.set(rel.prestador_id, []);
        }
        
        if (rel.especialidades) {
          especialidadesPorPrestador.get(rel.prestador_id).push({
            id: rel.id,
            prestador_id: rel.prestador_id,
            especialidade_id: rel.especialidade_id,
            principal: rel.principal,
            especialidade: {
              id: rel.especialidades.id,
              nome: rel.especialidades.nome,
              cbos: rel.especialidades.cbos,
              codigo_ans: rel.especialidades.codigo_ans
            }
          });
        }
      });
      
      // Montar resultado final
      const resultado = prestadoresData.map(prestador => ({
        ...prestador,
        especialidades: especialidadesPorPrestador.get(prestador.id) || []
      }));
      
      console.log('Prestadores carregados:', resultado.length);
      setPrestadores(resultado);
    } catch (error) {
      console.error('Erro ao carregar prestadores:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getEspecialidadesTexto = (prestador) => {
    if (!prestador.especialidades || prestador.especialidades.length === 0) {
      return '-';
    }
    
    const nomes = prestador.especialidades.map(esp => {
      const nome = esp.especialidade?.nome;
      if (!nome) return null;
      return esp.principal ? `${nome}*` : nome;
    }).filter(n => n);
    
    return nomes.length > 0 ? nomes.join(', ') : '-';
  };

  const getCBOSTexto = (prestador) => {
    if (!prestador.especialidades || prestador.especialidades.length === 0) {
      return '-';
    }
    
    const principal = prestador.especialidades.find(esp => esp.principal === true);
    if (principal && principal.especialidade?.cbos) {
      return principal.especialidade.cbos;
    }
    
    const primeira = prestador.especialidades[0];
    return primeira?.especialidade?.cbos || '-';
  };

  const filtered = prestadores.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_prestador?.includes(searchTerm) ||
    p.cpf?.includes(searchTerm) ||
    getEspecialidadesTexto(p).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ... (resto das funções handleSubmit, handleEdit, etc. mantêm-se iguais)

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
            setFormData({
              nome: '', codigo_prestador: '', cpf: '', cnpj: '', conselho: 'CRM',
              codigo_conselho_ans: '06', numero_conselho: '', uf_conselho: 'SP',
              telefone: '', celular: '', email: '', endereco: '', cep: '', 
              cidade: '', estado: 'SP', ativo: true
            });
            setEspecialidadesSelecionadas([]);
            setEspecialidadePrincipal(null);
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Especialidades</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CBOS</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{p.codigo_prestador || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{p.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.cpf || p.cnpj || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.conselho} {p.numero_conselho}/{p.uf_conselho}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {getEspecialidadesTexto(p)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{getCBOSTexto(p)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button 
                        onClick={() => {
                          setEditing(p);
                          setFormData({
                            nome: p.nome || '',
                            codigo_prestador: p.codigo_prestador || '',
                            cpf: p.cpf || '',
                            cnpj: p.cnpj || '',
                            conselho: p.conselho || 'CRM',
                            codigo_conselho_ans: p.codigo_conselho_ans || '06',
                            numero_conselho: p.numero_conselho || '',
                            uf_conselho: p.uf_conselho || 'SP',
                            telefone: p.telefone || '',
                            celular: p.celular || '',
                            email: p.email || '',
                            endereco: p.endereco || '',
                            cep: p.cep || '',
                            cidade: p.cidade || '',
                            estado: p.estado || 'SP',
                            ativo: p.ativo !== false
                          });
                          setEspecialidadesSelecionadas(p.especialidades?.map(esp => ({
                            id: esp.especialidade_id,
                            nome: esp.especialidade?.nome,
                            cbos: esp.especialidade?.cbos,
                            codigo_ans: esp.especialidade?.codigo_ans
                          })) || []);
                          setEspecialidadePrincipal(p.especialidades?.find(esp => esp.principal) ? {
                            id: p.especialidades.find(esp => esp.principal).especialidade_id,
                            nome: p.especialidades.find(esp => esp.principal).especialidade?.nome
                          } : null);
                          setShowModal(true);
                        }} 
                        className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" 
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja excluir este prestador?')) {
                            try {
                              await supabase.from('prestadores').delete().eq('id', p.id);
                              toast.success('Prestador excluído!');
                              await carregarPrestadores();
                            } catch (error) {
                              console.error('Erro ao excluir prestador:', error);
                              toast.error('Erro ao excluir prestador');
                            }
                          }
                        }} 
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
    </div>
  );
}
