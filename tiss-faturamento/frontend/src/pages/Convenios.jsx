import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { conveniosService } from '../services/supabaseService';
import { isSupabaseAvailable } from '../lib/supabaseClient';

export default function Convenios() {
  const [convenios, setConvenios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('dados');
  const [formData, setFormData] = useState({
    registro_ans: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    tabela_padrao: 'TUSS',
    prazo_envio_dias: 30,
    ativo: true,
    codigo_prestador: '',
    senha_prestador: '',
    cnes: '',
    ambiente: 'homologacao',
    url_webservice: '',
    tipo_tabela: 'TUSS',
    multiplicador: 1.00,
    coparticipacao: false,
    percentual_coparticipacao: 0,
    proximo_numero_guia: 1000000,
    ultimo_numero_guia: 999999
  });

  useEffect(() => {
    carregarConvenios();
  }, []);

  const carregarConvenios = async () => {
    setLoading(true);
    try {
      const data = await conveniosService.listar();
      setConvenios(data);
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
      toast.error('Erro ao carregar convênios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.registro_ans || !formData.razao_social) {
      toast.error('Registro ANS e Razão Social são obrigatórios');
      return;
    }
    if (!formData.codigo_prestador) {
      toast.error('Código do prestador é obrigatório');
      return;
    }

    try {
      if (editing) {
        await conveniosService.atualizar(editing.id, formData);
        toast.success('Convênio atualizado!');
      } else {
        await conveniosService.criar(formData);
        toast.success('Convênio cadastrado!');
      }
      await carregarConvenios();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar convênio:', error);
      toast.error('Erro ao salvar convênio');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este convênio?')) {
      try {
        await conveniosService.deletar(id);
        toast.success('Convênio excluído!');
        await carregarConvenios();
      } catch (error) {
        console.error('Erro ao excluir convênio:', error);
        toast.error('Erro ao excluir convênio');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      registro_ans: '', razao_social: '', nome_fantasia: '', cnpj: '',
      tabela_padrao: 'TUSS', prazo_envio_dias: 30, ativo: true,
      codigo_prestador: '', senha_prestador: '', cnes: '',
      ambiente: 'homologacao', url_webservice: '',
      tipo_tabela: 'TUSS', multiplicador: 1.00, coparticipacao: false,
      percentual_coparticipacao: 0, proximo_numero_guia: 1000000, ultimo_numero_guia: 999999
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando convênios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Convênios / Operadoras</h2>
        <button 
          onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" /> Novo Convênio
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Registro ANS</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Razão Social</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Código Prestador</th>
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
                    <button onClick={() => { setEditing(c); setFormData(c); setShowModal(true); }} className="text-blue-600 mx-1">
                      <PencilIcon className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 mx-1">
                      <TrashIcon className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {convenios.length === 0 && (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">Nenhum convênio cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - mesmo conteúdo anterior */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar' : 'Novo'} Convênio</h3>
            {/* Resto do modal - mesmo conteúdo anterior */}
          </div>
        </div>
      )}
    </div>
  );
}
