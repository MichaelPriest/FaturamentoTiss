import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon, EyeIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showItensModal, setShowItensModal] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState(null);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  
  // Itens da guia (múltiplos procedimentos)
  const [itensGuia, setItensGuia] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    procedimento_codigo: '',
    procedimento_nome: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    data_execucao: new Date().toISOString().split('T')[0],
    hora_inicial: '',
    hora_final: '',
    prestador_id: '',
    prestador_nome: '',
    prestador_cpf: '',
    prestador_conselho: '',
    prestador_numero_conselho: '',
    prestador_uf_conselho: '',
    prestador_cbos: '',
    grau_participacao: '00'
  });

  const [formData, setFormData] = useState({
    paciente_id: '',
    observacao: '',
    status: 'pendente',
    numero_guia_operadora: '',
    data_autorizacao: '',
    senha_autorizacao: '',
    paciente_nome: '',
    paciente_carteira: '',
    convenio_id: '',
    convenio_nome: '',
    convenio_registro_ans: '',
    convenio_codigo_prestador: '',
    convenio_proximo_numero_guia: null
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    const storedAtendimentos = localStorage.getItem('atendimentos');
    const storedPacientes = localStorage.getItem('pacientes');
    const storedPrestadores = localStorage.getItem('prestadores');
    const storedProcedimentos = localStorage.getItem('procedimentos');
    const storedConvenios = localStorage.getItem('convenios');
    
    if (storedAtendimentos) setAtendimentos(JSON.parse(storedAtendimentos));
    if (storedPacientes) setPacientes(JSON.parse(storedPacientes));
    if (storedPrestadores) setPrestadores(JSON.parse(storedPrestadores));
    if (storedProcedimentos) setProcedimentos(JSON.parse(storedProcedimentos));
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
  };

  const salvar = (lista) => {
    localStorage.setItem('atendimentos', JSON.stringify(lista));
    setAtendimentos(lista);
  };

  const atualizarConvenios = () => {
    const storedConvenios = localStorage.getItem('convenios');
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
  };

  const getDescricaoGrau = (codigo) => {
    const graus = {
      '00': 'Cirurgião',
      '01': 'Primeiro Auxiliar',
      '02': 'Segundo Auxiliar',
      '03': 'Terceiro Auxiliar',
      '04': 'Quarto Auxiliar',
      '05': 'Instrumentador',
      '06': 'Anestesista',
      '07': 'Auxiliar de Anestesista',
      '08': 'Consultor',
      '09': 'Perfusionista',
      '10': 'Pediatra na sala de parto',
      '11': 'Auxiliar SADT',
      '12': 'Clínico',
      '13': 'Intensivista'
    };
    return graus[codigo] || 'Desconhecido';
  };

  const handlePacienteChange = (pacienteId) => {
    if (!pacienteId) return;
    
    const paciente = pacientes.find(p => p.id === parseInt(pacienteId));
    if (paciente) {
      const convenio = convenios.find(c => c.id === paciente.convenio_id);
      
      setFormData({
        ...formData,
        paciente_id: pacienteId,
        paciente_nome: paciente.nome || '',
        paciente_carteira: paciente.numero_carteira || '',
        convenio_id: paciente.convenio_id || '',
        convenio_nome: convenio?.razao_social || 'Sem convênio',
        convenio_registro_ans: convenio?.registro_ans || '',
        convenio_codigo_prestador: convenio?.codigo_prestador || '',
        convenio_proximo_numero_guia: convenio?.proximo_numero_guia || null
      });
      
      if (!paciente.convenio_id) {
        toast.warning('Este paciente não possui convênio associado!');
      }
    }
  };

  const handleAdicionarItem = () => {
    if (!currentItem.procedimento_codigo) {
      toast.error('Selecione um procedimento');
      return;
    }
    if (!currentItem.prestador_id) {
      toast.error('Selecione o profissional que executou este procedimento');
      return;
    }

    const valorTotal = currentItem.quantidade * currentItem.valor_unitario;
    const prestador = prestadores.find(p => p.id === parseInt(currentItem.prestador_id));
    
    const novoItem = {
      ...currentItem,
      prestador_id: prestador?.id,
      prestador_nome: prestador?.nome,
      prestador_cpf: prestador?.cpf || '00000000000',
      prestador_conselho: prestador?.conselho || '06',
      prestador_numero_conselho: prestador?.numero_conselho || '00000',
      prestador_uf_conselho: prestador?.uf_conselho || '35',
      prestador_cbos: prestador?.cbos || '225125',
      grau_participacao: currentItem.grau_participacao || '00',
      valor_total: valorTotal,
      id: Date.now() + Math.random()
    };

    setItensGuia([...itensGuia, novoItem]);
    
    setCurrentItem({
      procedimento_codigo: '',
      procedimento_nome: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      data_execucao: new Date().toISOString().split('T')[0],
      hora_inicial: '',
      hora_final: '',
      prestador_id: '',
      prestador_nome: '',
      prestador_cpf: '',
      prestador_conselho: '',
      prestador_numero_conselho: '',
      prestador_uf_conselho: '',
      prestador_cbos: '',
      grau_participacao: '00'
    });
  };

  const removerItem = (itemId) => {
    setItensGuia(itensGuia.filter(item => item.id !== itemId));
  };

  const handleProcedimentoItemChange = (procedimentoCodigo) => {
    const procedimento = procedimentos.find(p => p.codigo_tuss === procedimentoCodigo);
    if (procedimento) {
      setCurrentItem({
        ...currentItem,
        procedimento_codigo: procedimento.codigo_tuss,
        procedimento_nome: procedimento.nome,
        valor_unitario: procedimento.valor_sugerido || 0,
        valor_total: (currentItem.quantidade || 1) * (procedimento.valor_sugerido || 0)
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.paciente_id) {
      toast.error('Selecione um paciente');
      return;
    }
    if (itensGuia.length === 0) {
      toast.error('Adicione pelo menos um procedimento');
      return;
    }

    const conveniosAtualizados = JSON.parse(localStorage.getItem('convenios') || '[]');
    const paciente = pacientes.find(p => p.id === parseInt(formData.paciente_id));
    const convenio = conveniosAtualizados.find(c => c.id === paciente?.convenio_id);
    
    if (!convenio) {
      toast.error('Convênio não encontrado. Verifique se o paciente possui convênio associado.');
      return;
    }
    
    const valorTotalGuia = itensGuia.reduce((sum, item) => sum + item.valor_total, 0);
    
    let numeroGuiaPrestador;
    if (convenio.proximo_numero_guia) {
      numeroGuiaPrestador = convenio.proximo_numero_guia.toString();
      const conveniosAtualizadosComNovoNumero = conveniosAtualizados.map(c => 
        c.id === convenio.id ? { ...c, proximo_numero_guia: c.proximo_numero_guia + 1 } : c
      );
      localStorage.setItem('convenios', JSON.stringify(conveniosAtualizadosComNovoNumero));
      atualizarConvenios();
    } else {
      numeroGuiaPrestador = Date.now().toString();
    }
    
    const novoAtendimento = {
      id: editing ? editing.id : Date.now(),
      numero_guia_prestador: numeroGuiaPrestador,
      observacao: formData.observacao,
      status: formData.status,
      numero_guia_operadora: formData.numero_guia_operadora,
      data_autorizacao: formData.data_autorizacao,
      senha_autorizacao: formData.senha_autorizacao,
      itens: itensGuia,
      valor_total: valorTotalGuia,
      paciente_id: paciente.id,
      paciente_nome: paciente.nome,
      numero_carteira: paciente.numero_carteira,
      paciente_convenio_id: paciente.convenio_id,
      paciente_convenio_nome: convenio?.razao_social || 'Sem convênio',
      convenio_registro_ans: convenio?.registro_ans,
      convenio_codigo_prestador: convenio?.codigo_prestador,
      created_at: editing ? editing.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editing) {
      salvar(atendimentos.map(a => a.id === editing.id ? novoAtendimento : a));
      toast.success('Atendimento atualizado com sucesso!');
    } else {
      salvar([...atendimentos, novoAtendimento]);
      toast.success('Atendimento registrado com sucesso!');
    }

    resetModal();
  };

  const resetModal = () => {
    setShowModal(false);
    setEditing(null);
    setItensGuia([]);
    setFormData({
      paciente_id: '',
      observacao: '',
      status: 'pendente',
      numero_guia_operadora: '',
      data_autorizacao: '',
      senha_autorizacao: '',
      paciente_nome: '',
      paciente_carteira: '',
      convenio_id: '',
      convenio_nome: '',
      convenio_registro_ans: '',
      convenio_codigo_prestador: '',
      convenio_proximo_numero_guia: null
    });
    setCurrentItem({
      procedimento_codigo: '',
      procedimento_nome: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      data_execucao: new Date().toISOString().split('T')[0],
      hora_inicial: '',
      hora_final: '',
      prestador_id: '',
      prestador_nome: '',
      prestador_cpf: '',
      prestador_conselho: '',
      prestador_numero_conselho: '',
      prestador_uf_conselho: '',
      prestador_cbos: '',
      grau_participacao: '00'
    });
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este atendimento?')) {
      salvar(atendimentos.filter(a => a.id !== id));
      toast.success('Atendimento excluído com sucesso!');
    }
  };

  const handleEnviarFaturamento = (id) => {
    salvar(atendimentos.map(a => a.id === id ? { ...a, status: 'faturado' } : a));
    toast.success('Atendimento enviado para faturamento!');
  };

  const handleEdit = (atendimento) => {
    setEditing(atendimento);
    setItensGuia(atendimento.itens || []);
    setFormData({
      ...atendimento,
      paciente_id: atendimento.paciente_id,
      observacao: atendimento.observacao || '',
      status: atendimento.status,
      numero_guia_operadora: atendimento.numero_guia_operadora || '',
      data_autorizacao: atendimento.data_autorizacao || '',
      senha_autorizacao: atendimento.senha_autorizacao || '',
      paciente_nome: atendimento.paciente_nome,
      paciente_carteira: atendimento.numero_carteira,
      convenio_id: atendimento.paciente_convenio_id,
      convenio_nome: atendimento.paciente_convenio_nome,
      convenio_registro_ans: atendimento.convenio_registro_ans,
      convenio_codigo_prestador: atendimento.convenio_codigo_prestador
    });
    setShowModal(true);
  };

  const handleViewItens = (atendimento) => {
    setSelectedGuia(atendimento);
    setShowItensModal(true);
  };

  const atendimentosFiltrados = atendimentos.filter(a => {
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
    if (filtroConvenio !== 'todos' && a.paciente_convenio_id !== parseInt(filtroConvenio)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return a.paciente_nome?.toLowerCase().includes(term) ||
             a.numero_carteira?.includes(term) ||
             a.numero_guia_prestador?.includes(term);
    }
    return true;
  });

  const pendentes = atendimentos.filter(a => a.status === 'pendente').length;
  const faturados = atendimentos.filter(a => a.status === 'faturado').length;
  const valorTotalPendente = atendimentos.filter(a => a.status === 'pendente').reduce((sum, a) => sum + (a.valor_total || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Atendimentos / Guias</h2>
        <button onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" /> Nova Guia
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Total de Guias</p>
          <p className="text-2xl font-bold text-gray-800">{atendimentos.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{pendentes}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Faturados</p>
          <p className="text-2xl font-bold text-green-600">{faturados}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Valor Pendente</p>
          <p className="text-2xl font-bold text-blue-600">R$ {valorTotalPendente.toFixed(2)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por paciente, carteira ou guia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-sm" />
          </div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendentes</option>
            <option value="faturado">Faturados</option>
          </select>
          <select value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="todos">Todos os convênios</option>
            {convenios.map(c => (<option key={c.id} value={c.id}>{c.razao_social}</option>))}
          </select>
        </div>
      </div>

      {/* Tabela de Guias */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500">Data</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500">Nº Guia</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500">Paciente</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500">Carteira</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500">Convênio</th>
              <th className="px-4 py-3 text-center text-xs text-gray-500">Itens</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500">Valor Total</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500">Status</th>
              <th className="px-4 py-3 text-center text-xs text-gray-500 w-32">Ações</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {atendimentosFiltrados.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {a.itens && a.itens[0] ? format(new Date(a.itens[0].data_execucao), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{a.numero_guia_prestador}</td>
                  <td className="px-4 py-3 text-xs text-gray-800">{a.paciente_nome}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{a.numero_carteira}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${a.paciente_convenio_nome && a.paciente_convenio_nome !== 'Sem convênio' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.paciente_convenio_nome || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-center">
                    <button onClick={() => handleViewItens(a)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto" title="Ver itens">
                      <DocumentPlusIcon className="w-4 h-4" />
                      <span className="font-bold">{a.itens?.length || 0}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-medium">R$ {a.valor_total?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'faturado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.status === 'faturado' ? 'Faturado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleViewItens(a)} className="text-gray-600 hover:text-gray-800 p-1" title="Ver Itens">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {a.status === 'pendente' && (
                        <button onClick={() => handleEnviarFaturamento(a.id)} className="text-green-600 hover:text-green-800 p-1" title="Faturar">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(a)} className="text-blue-600 hover:text-blue-800 p-1" title="Editar">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800 p-1" title="Excluir">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {atendimentosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-gray-500 text-sm">
                    Nenhum atendimento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Itens da Guia */}
      {showItensModal && selectedGuia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Itens da Guia</h3>
                <button onClick={() => setShowItensModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div><strong>Guia:</strong> {selectedGuia.numero_guia_prestador}</div>
                <div><strong>Paciente:</strong> {selectedGuia.paciente_nome}</div>
                <div><strong>Carteira:</strong> {selectedGuia.numero_carteira}</div>
                <div><strong>Convênio:</strong> <span className="text-blue-600 font-medium">{selectedGuia.paciente_convenio_nome || '-'}</span></div>
                <div><strong>Guia Operadora:</strong> {selectedGuia.numero_guia_operadora || '-'}</div>
                <div><strong>Data Autorização:</strong> {selectedGuia.data_autorizacao || '-'}</div>
                <div><strong>Senha:</strong> {selectedGuia.senha_autorizacao || '-'}</div>
                <div><strong>Status:</strong> {selectedGuia.status}</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Seq</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Data Execução</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Hora Ini</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Hora Fim</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Código</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Procedimento</th>
                      <th className="px-3 py-2 text-center text-xs text-gray-500">Qtd</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500">Valor</th>
                      <th className="px-3 py-2 text-center text-xs text-gray-500">Grau</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Profissional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedGuia.itens || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-xs text-center font-medium">{idx + 1}</td>
                        <td className="px-3 py-2 text-xs">{item.data_execucao || '-'}</td>
                        <td className="px-3 py-2 text-xs">{item.hora_inicial || '-'}</td>
                        <td className="px-3 py-2 text-xs">{item.hora_final || '-'}</td>
                        <td className="px-3 py-2 text-xs font-mono">{item.procedimento_codigo}</td>
                        <td className="px-3 py-2 text-xs">{item.procedimento_nome}</td>
                        <td className="px-3 py-2 text-xs text-center">{item.quantidade}</td>
                        <td className="px-3 py-2 text-xs text-right">R$ {item.valor_total?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-center">
                          <span className="px-1 py-0.5 rounded text-xs bg-gray-100" title={getDescricaoGrau(item.grau_participacao)}>
                            {item.grau_participacao || '00'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{item.prestador_nome}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="8" className="px-3 py-2 text-right font-semibold">Total da Guia:</td>
                      <td className="px-3 py-2 text-right font-bold text-blue-600">R$ {selectedGuia.valor_total?.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{editing ? 'Editar Guia' : 'Nova Guia'}</h3>
                <button onClick={resetModal} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Paciente */}
                <div className="border rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                  <select 
                    value={formData.paciente_id} 
                    onChange={e => handlePacienteChange(e.target.value)} 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                    required
                  >
                    <option value="">Selecione um paciente</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} - {p.numero_carteira}
                      </option>
                    ))}
                  </select>
                  {formData.paciente_carteira && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Carteira:</strong> {formData.paciente_carteira} | 
                        <strong> Convênio:</strong> {formData.convenio_nome || 'Não definido'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Dados de Autorização */}
                <div className="border rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Dados de Autorização da Operadora</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Número da Guia (Operadora)</label>
                      <input type="text" value={formData.numero_guia_operadora} onChange={e => setFormData({...formData, numero_guia_operadora: e.target.value})} placeholder="Número fornecido pela operadora" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Data da Autorização</label>
                      <input type="date" value={formData.data_autorizacao} onChange={e => setFormData({...formData, data_autorizacao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Senha de Autorização</label>
                      <input type="text" value={formData.senha_autorizacao} onChange={e => setFormData({...formData, senha_autorizacao: e.target.value})} placeholder="Pode conter letras e números" className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Procedimentos da Guia */}
                <div className="border rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Procedimentos da Guia</label>
                  
                  {itensGuia.length > 0 && (
                    <div className="mb-3 max-h-40 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left text-xs text-gray-500">Seq</th>
                            <th className="px-2 py-1 text-left text-xs text-gray-500">Data</th>
                            <th className="px-2 py-1 text-left text-xs text-gray-500">H.I</th>
                            <th className="px-2 py-1 text-left text-xs text-gray-500">H.F</th>
                            <th className="px-2 py-1 text-left text-xs text-gray-500">Código</th>
                            <th className="px-2 py-1 text-left text-xs text-gray-500">Procedimento</th>
                            <th className="px-2 py-1 text-center text-xs text-gray-500">Qtd</th>
                            <th className="px-2 py-1 text-right text-xs text-gray-500">Valor</th>
                            <th className="px-2 py-1 text-center text-xs text-gray-500">Grau</th>
                            <th className="px-2 py-1 text-left text-xs text-gray-500">Profissional</th>
                            <th className="px-2 py-1 text-center w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {itensGuia.map((item, idx) => (
                            <tr key={item.id}>
                              <td className="px-2 py-1 text-xs text-center">{idx + 1}</td>
                              <td className="px-2 py-1 text-xs">{item.data_execucao}</td>
                              <td className="px-2 py-1 text-xs">{item.hora_inicial}</td>
                              <td className="px-2 py-1 text-xs">{item.hora_final}</td>
                              <td className="px-2 py-1 text-xs font-mono">{item.procedimento_codigo}</td>
                              <td className="px-2 py-1 text-xs">{item.procedimento_nome}</td>
                              <td className="px-2 py-1 text-xs text-center">{item.quantidade}</td>
                              <td className="px-2 py-1 text-xs text-right">R$ {item.valor_total?.toFixed(2)}</td>
                              <td className="px-2 py-1 text-xs text-center">
                                <span className="px-1 py-0.5 rounded text-xs bg-gray-100" title={getDescricaoGrau(item.grau_participacao)}>
                                  {item.grau_participacao || '00'}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-xs text-gray-600">{item.prestador_nome}</td>
                              <td className="px-2 py-1 text-center">
                                <button type="button" onClick={() => removerItem(item.id)} className="text-red-600 hover:text-red-800">
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Formulário para adicionar novo item */}
                  <div className="border-t pt-3 mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-2">Adicionar novo procedimento:</p>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Data</label>
                        <input type="date" value={currentItem.data_execucao} onChange={e => setCurrentItem({...currentItem, data_execucao: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">H.I</label>
                        <input type="time" value={currentItem.hora_inicial} onChange={e => setCurrentItem({...currentItem, hora_inicial: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">H.F</label>
                        <input type="time" value={currentItem.hora_final} onChange={e => setCurrentItem({...currentItem, hora_final: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">Procedimento</label>
                        <select value={currentItem.procedimento_codigo} onChange={e => handleProcedimentoItemChange(e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                          <option value="">Selecione</option>
                          {procedimentos.map(p => (
                            <option key={p.id} value={p.codigo_tuss}>{p.codigo_tuss} - {p.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">Qtd</label>
                        <input type="number" min="1" value={currentItem.quantidade} onChange={e => setCurrentItem({...currentItem, quantidade: parseInt(e.target.value) || 1, valor_total: (parseInt(e.target.value) || 1) * currentItem.valor_unitario})} className="w-full border rounded-lg px-2 py-1.5 text-sm text-center" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Valor Unit.</label>
                        <input type="number" step="0.01" value={currentItem.valor_unitario} onChange={e => setCurrentItem({...currentItem, valor_unitario: parseFloat(e.target.value) || 0, valor_total: currentItem.quantidade * (parseFloat(e.target.value) || 0)})} className="w-full border rounded-lg px-2 py-1.5 text-sm text-right" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">Grau Part.</label>
                        <select value={currentItem.grau_participacao} onChange={e => setCurrentItem({...currentItem, grau_participacao: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                          <option value="00">00 - Cirurgião</option>
                          <option value="01">01 - Primeiro Auxiliar</option>
                          <option value="02">02 - Segundo Auxiliar</option>
                          <option value="03">03 - Terceiro Auxiliar</option>
                          <option value="04">04 - Quarto Auxiliar</option>
                          <option value="05">05 - Instrumentador</option>
                          <option value="06">06 - Anestesista</option>
                          <option value="07">07 - Auxiliar de Anestesista</option>
                          <option value="08">08 - Consultor</option>
                          <option value="09">09 - Perfusionista</option>
                          <option value="10">10 - Pediatra na sala de parto</option>
                          <option value="11">11 - Auxiliar SADT</option>
                          <option value="12">12 - Clínico</option>
                          <option value="13">13 - Intensivista</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Profissional</label>
                        <select value={currentItem.prestador_id} onChange={e => {
                          const prestador = prestadores.find(p => p.id === parseInt(e.target.value));
                          setCurrentItem({...currentItem, prestador_id: e.target.value, prestador_nome: prestador?.nome || '', prestador_cpf: prestador?.cpf || '', prestador_conselho: prestador?.conselho || '', prestador_numero_conselho: prestador?.numero_conselho || '', prestador_uf_conselho: prestador?.uf_conselho || '', prestador_cbos: prestador?.cbos || ''});
                        }} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                          <option value="">Selecione</option>
                          {prestadores.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <button type="button" onClick={handleAdicionarItem} className="w-full bg-green-600 text-white px-2 py-1.5 rounded-lg text-sm hover:bg-green-700">+ Add</button>
                      </div>
                    </div>
                  </div>
                  
                  {itensGuia.length === 0 && <p className="text-xs text-yellow-600 mt-3">⚠️ Adicione pelo menos um procedimento</p>}
                  {itensGuia.length > 0 && <div className="text-right mt-3 pt-2 border-t"><p className="text-sm font-semibold">Subtotal: R$ {itensGuia.reduce((sum, i) => sum + i.valor_total, 0).toFixed(2)}</p></div>}
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea rows="2" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Informações adicionais..." />
                </div>

                {editing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="pendente">Pendente</option>
                      <option value="faturado">Faturado</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={resetModal} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? 'Atualizar' : 'Salvar'} Guia</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}