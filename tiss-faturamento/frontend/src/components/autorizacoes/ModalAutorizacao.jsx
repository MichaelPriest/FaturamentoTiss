// src/components/autorizacoes/ModalAutorizacao.jsx
import { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import ListaItensAutorizados from './ListaItensAutorizados';

export default function ModalAutorizacao({
  isOpen,
  onClose,
  onSave,
  editing,
  pacientes,
  convenios,
  procedimentos,
  initialData = null
}) {
  const [formData, setFormData] = useState({
    paciente_id: '',
    convenio_id: '',
    numero_guia_operadora: '',
    data_autorizacao: new Date().toISOString().split('T')[0],
    data_validade_senha: '',
    senha_autorizacao: '',
    observacao: '',
    itens: []
  });

  const [searchPacienteTerm, setSearchPacienteTerm] = useState('');
  const [itensAutorizacao, setItensAutorizacao] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        paciente_id: initialData.paciente_id || '',
        convenio_id: initialData.convenio_id || '',
        numero_guia_operadora: initialData.numero_guia_operadora || '',
        data_autorizacao: initialData.data_autorizacao || new Date().toISOString().split('T')[0],
        data_validade_senha: initialData.data_validade_senha || '',
        senha_autorizacao: initialData.senha_autorizacao || '',
        observacao: initialData.observacao || '',
        itens: []
      });
      setItensAutorizacao(initialData.itens || []);
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      convenio_id: '',
      numero_guia_operadora: '',
      data_autorizacao: new Date().toISOString().split('T')[0],
      data_validade_senha: '',
      senha_autorizacao: '',
      observacao: '',
      itens: []
    });
    setItensAutorizacao([]);
    setSearchPacienteTerm('');
  };

  const pacientesFiltrados = pacientes?.filter(p =>
    p.nome?.toLowerCase().includes(searchPacienteTerm.toLowerCase()) ||
    p.numero_carteira?.includes(searchPacienteTerm) ||
    p.cpf?.includes(searchPacienteTerm)
  ) || [];

  const procedimentosDoConvenio = procedimentos?.filter(p =>
    !p.convenio_id || p.convenio_id === formData.convenio_id
  ) || [];

  const valorTotal = itensAutorizacao.reduce((sum, item) => sum + (item.valor_total || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      itens: itensAutorizacao,
      valor_total: valorTotal
    });
  };

  const handleRemoverItem = (itemId) => {
    setItensAutorizacao(itensAutorizacao.filter(item => item.id !== itemId));
  };

  const handleAtualizarItem = (itemAtualizado) => {
    setItensAutorizacao(itensAutorizacao.map(item =>
      item.id === itemAtualizado.id ? itemAtualizado : item
    ));
  };

  const handleAdicionarItem = (novoItem) => {
    setItensAutorizacao([...itensAutorizacao, {
      ...novoItem,
      id: Date.now(),
      quantidade_utilizada: 0
    }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              {editing ? 'Editar Autorização' : 'Nova Autorização'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Dados do Paciente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Buscar Paciente
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Digite nome, CPF ou carteira..."
                      value={searchPacienteTerm}
                      onChange={(e) => setSearchPacienteTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Paciente *
                  </label>
                  <select
                    value={formData.paciente_id}
                    onChange={(e) => {
                      const paciente = pacientes?.find(p => p.id === parseInt(e.target.value));
                      setFormData({
                        ...formData,
                        paciente_id: e.target.value,
                        convenio_id: paciente?.convenio_id || ''
                      });
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                    required
                  >
                    <option value="">Selecione um paciente</option>
                    {pacientesFiltrados.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} - {p.numero_carteira} - {p.cpf || 'SEM CPF'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dados da Autorização */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número Guia Operadora
                  </label>
                  <input
                    type="text"
                    value={formData.numero_guia_operadora}
                    onChange={(e) => setFormData({...formData, numero_guia_operadora: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono dark:bg-gray-700"
                    placeholder="Número fornecido pela operadora"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha de Autorização
                  </label>
                  <input
                    type="text"
                    value={formData.senha_autorizacao}
                    onChange={(e) => setFormData({...formData, senha_autorizacao: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                    placeholder="Senha fornecida pela operadora"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data da Autorização *
                  </label>
                  <input
                    type="date"
                    value={formData.data_autorizacao}
                    onChange={(e) => setFormData({...formData, data_autorizacao: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    value={formData.data_validade_senha}
                    onChange={(e) => setFormData({...formData, data_validade_senha: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Itens Autorizados */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <ListaItensAutorizados
                  itens={itensAutorizacao}
                  onRemoverItem={handleRemoverItem}
                  onAtualizarItem={handleAtualizarItem}
                  onAdicionarItem={handleAdicionarItem}
                  procedimentosDoConvenio={procedimentosDoConvenio}
                  readOnly={false}
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows="3"
                  value={formData.observacao}
                  onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                  placeholder="Informações adicionais sobre a autorização..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:from-blue-600 hover:to-indigo-700"
              >
                {editing ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
