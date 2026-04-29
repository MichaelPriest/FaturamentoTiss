import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function Convenios() {
  const [convenios, setConvenios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aba, setAba] = useState('dados');
  const [formData, setFormData] = useState({
    // Dados do Convênio
    registro_ans: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    tabela_padrao: 'TUSS',
    prazo_envio_dias: 30,
    ativo: true,
    // Dados do Prestador neste Convênio
    codigo_prestador: '',
    senha_prestador: '',
    cnes: '',
    // Configurações de envio
    ambiente: 'homologacao',
    url_webservice: '',
    // Configurações financeiras
    tipo_tabela: 'TUSS',
    multiplicador: 1.00,
    coparticipacao: false,
    percentual_coparticipacao: 0,
    // Controle de sequência de guias
    proximo_numero_guia: 1000000,
    ultimo_numero_guia: 999999
  });

  useEffect(() => {
    carregarConvenios();
  }, []);

  const carregarConvenios = () => {
    const stored = localStorage.getItem('convenios');
    if (stored) {
      setConvenios(JSON.parse(stored));
      console.log('Convênios carregados:', JSON.parse(stored));
    } else {
      // Dados de exemplo
      const exemplos = [
        {
          id: 1,
          registro_ans: '421928',
          razao_social: 'UNIMED SÃO PAULO',
          nome_fantasia: 'UNIMED',
          cnpj: '00.000.000/0001-00',
          codigo_prestador: '12345678',
          ambiente: 'homologacao',
          ativo: true,
          proximo_numero_guia: 1000000
        },
        {
          id: 2,
          registro_ans: '123456',
          razao_social: 'BRADESCO SAÚDE',
          nome_fantasia: 'BRADESCO',
          cnpj: '11.111.111/0001-11',
          codigo_prestador: '87654321',
          ambiente: 'homologacao',
          ativo: true,
          proximo_numero_guia: 2000000
        }
      ];
      setConvenios(exemplos);
      localStorage.setItem('convenios', JSON.stringify(exemplos));
    }
  };

  const salvar = (lista) => {
    localStorage.setItem('convenios', JSON.stringify(lista));
    setConvenios(lista);
    toast.success('Convênio salvo com sucesso!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.registro_ans || !formData.razao_social) {
      toast.error('Registro ANS e Razão Social são obrigatórios');
      return;
    }
    if (!formData.codigo_prestador) {
      toast.error('Código do prestador para este convênio é obrigatório');
      return;
    }

    if (editing) {
      salvar(convenios.map(c => c.id === editing.id ? { ...formData, id: c.id } : c));
      toast.success('Convênio atualizado!');
    } else {
      salvar([...convenios, { ...formData, id: Date.now() }]);
      toast.success('Convênio cadastrado!');
    }

    setShowModal(false);
    setEditing(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      registro_ans: '', razao_social: '', nome_fantasia: '', cnpj: '',
      tabela_padrao: 'TUSS', prazo_envio_dias: 30, ativo: true,
      codigo_prestador: '', senha_prestador: '', cnes: '',
      ambiente: 'homologacao', url_webservice: '',
      tipo_tabela: 'TUSS', multiplicador: 1.00, coparticipacao: false, percentual_coparticipacao: 0,
      proximo_numero_guia: 1000000, ultimo_numero_guia: 999999
    });
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este convênio?')) {
      salvar(convenios.filter(c => c.id !== id));
      toast.success('Convênio excluído!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Convênios / Operadoras</h2>
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Novo Convênio
        </button>
      </div>

      {/* Tabela de Convênios */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Registro ANS</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Razão Social</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Código Prestador</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Próx. Guia</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Ambiente</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Status</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500 w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {convenios.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-900">{c.registro_ans}</td>
                  <td className="px-4 py-2 text-xs text-gray-700">{c.razao_social}</td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-600">{c.codigo_prestador || '-'}</td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-600">{c.proximo_numero_guia || '-'}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.ambiente === 'producao' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.ambiente === 'producao' ? 'Produção' : 'Homologação'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => { setEditing(c); setFormData(c); setShowModal(true); }} className="text-blue-600 mx-1" title="Editar">
                      <PencilIcon className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 mx-1" title="Excluir">
                      <TrashIcon className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {convenios.length === 0 && (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-sm">Nenhum convênio cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar' : 'Novo'} Convênio</h3>
            
            {/* Tabs */}
            <div className="flex border-b mb-4">
              <button onClick={() => setAba('dados')} className={`px-4 py-2 text-sm ${aba === 'dados' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Dados</button>
              <button onClick={() => setAba('prestador')} className={`px-4 py-2 text-sm ${aba === 'prestador' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Prestador</button>
              <button onClick={() => setAba('guias')} className={`px-4 py-2 text-sm ${aba === 'guias' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Numeração Guias</button>
              <button onClick={() => setAba('financeiro')} className={`px-4 py-2 text-sm ${aba === 'financeiro' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Financeiro</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Aba Dados */}
              {aba === 'dados' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Registro ANS *" value={formData.registro_ans} onChange={e => setFormData({...formData, registro_ans: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
                  <input type="text" placeholder="Razão Social *" value={formData.razao_social} onChange={e => setFormData({...formData, razao_social: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
                  <input type="text" placeholder="Nome Fantasia" value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                  <input type="text" placeholder="CNPJ" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                  <div className="flex gap-2">
                    <select value={formData.ambiente} onChange={e => setFormData({...formData, ambiente: e.target.value})} className="flex-1 border rounded-lg px-3 py-1.5 text-sm">
                      <option value="homologacao">Homologação (Testes)</option>
                      <option value="producao">Produção</option>
                    </select>
                    <input type="text" placeholder="URL WebService" value={formData.url_webservice} onChange={e => setFormData({...formData, url_webservice: e.target.value})} className="flex-2 border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="w-4 h-4" />
                    <label className="text-sm text-gray-700">Convênio Ativo</label>
                  </div>
                </div>
              )}

              {/* Aba Prestador */}
              {aba === 'prestador' && (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg mb-2">
                    <p className="text-xs text-blue-700">Dados específicos para este convênio. Cada convênio pode ter um código de prestador diferente.</p>
                  </div>
                  <input type="text" placeholder="Código do Prestador na Operadora *" value={formData.codigo_prestador} onChange={e => setFormData({...formData, codigo_prestador: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm font-mono" required />
                  <input type="password" placeholder="Senha do Prestador" value={formData.senha_prestador} onChange={e => setFormData({...formData, senha_prestador: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                  <input type="text" placeholder="CNES" value={formData.cnes} onChange={e => setFormData({...formData, cnes: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                </div>
              )}

              {/* Aba Numeração de Guias */}
              {aba === 'guias' && (
                <div className="space-y-3">
                  <div className="bg-yellow-50 p-3 rounded-lg mb-2">
                    <p className="text-xs text-yellow-700">Defina o número inicial para a sequência de guias deste convênio. O sistema incrementará automaticamente.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Próximo Número da Guia</label>
                      <input type="number" value={formData.proximo_numero_guia} onChange={e => setFormData({...formData, proximo_numero_guia: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-1.5 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Último Número (Limite)</label>
                      <input type="number" value={formData.ultimo_numero_guia} onChange={e => setFormData({...formData, ultimo_numero_guia: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-1.5 text-sm font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Financeiro */}
              {aba === 'financeiro' && (
                <div className="space-y-3">
                  <select value={formData.tipo_tabela} onChange={e => setFormData({...formData, tipo_tabela: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                    <option value="TUSS">Tabela TUSS</option>
                    <option value="CBHPM">Tabela CBHPM</option>
                    <option value="PROPRIA">Tabela Própria</option>
                  </select>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Multiplicador de valores (%)</label>
                    <input type="number" step="0.01" value={formData.multiplicador} onChange={e => setFormData({...formData, multiplicador: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.coparticipacao} onChange={e => setFormData({...formData, coparticipacao: e.target.checked})} className="w-4 h-4" />
                    <label className="text-sm text-gray-700">Possui coparticipação</label>
                  </div>
                  {formData.coparticipacao && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Percentual de coparticipação (%)</label>
                      <input type="number" step="1" value={formData.percentual_coparticipacao} onChange={e => setFormData({...formData, percentual_coparticipacao: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}