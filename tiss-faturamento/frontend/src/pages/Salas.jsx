// src/pages/Salas.jsx
import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, HomeModernIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

export default function Salas() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'consultorio',
    capacidade: 1,
    localizacao: '',
    cor: '#3B82F6',
    observacao: '',
    ativo: true
  });

  const carregarSalas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      setSalas(data || []);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      toast.error('Erro ao carregar salas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSalas();
  }, []);

  const salvarSala = async () => {
    if (!formData.nome) {
      toast.error('Nome da sala é obrigatório');
      return;
    }

    const sala = {
      nome: formData.nome,
      tipo: formData.tipo,
      capacidade: parseInt(formData.capacidade) || 1,
      localizacao: formData.localizacao || null,
      cor: formData.cor,
      observacao: formData.observacao || null,
      ativo: formData.ativo,
      updated_at: new Date().toISOString()
    };
    
    try {
      if (editing) {
        const { error } = await supabase
          .from('salas')
          .update(sala)
          .eq('id', editing.id);
        
        if (error) throw error;
        toast.success('Sala atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('salas')
          .insert([{ ...sala, created_at: new Date().toISOString() }]);
        
        if (error) throw error;
        toast.success('Sala criada com sucesso!');
      }
      
      setShowModal(false);
      carregarSalas();
    } catch (error) {
      console.error('Erro ao salvar sala:', error);
      toast.error('Erro ao salvar sala');
    }
  };

  const excluirSala = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta sala?')) {
      try {
        const { error } = await supabase
          .from('salas')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Sala excluída com sucesso!');
        carregarSalas();
      } catch (error) {
        console.error('Erro ao excluir sala:', error);
        toast.error('Erro ao excluir sala');
      }
    }
  };

  const alternarStatus = async (sala) => {
    try {
      const { error } = await supabase
        .from('salas')
        .update({ ativo: !sala.ativo, updated_at: new Date().toISOString() })
        .eq('id', sala.id);
      
      if (error) throw error;
      toast.success(`Sala ${!sala.ativo ? 'ativada' : 'desativada'} com sucesso!`);
      carregarSalas();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const abrirModalEditar = (sala) => {
    setEditing(sala);
    setFormData({
      nome: sala.nome,
      tipo: sala.tipo,
      capacidade: sala.capacidade,
      localizacao: sala.localizacao || '',
      cor: sala.cor,
      observacao: sala.observacao || '',
      ativo: sala.ativo
    });
    setShowModal(true);
  };

  const abrirModalNovo = () => {
    setEditing(null);
    setFormData({
      nome: '',
      tipo: 'consultorio',
      capacidade: 1,
      localizacao: '',
      cor: '#3B82F6',
      observacao: '',
      ativo: true
    });
    setShowModal(true);
  };

  const tiposSala = [
    { value: 'consultorio', label: 'Consultório', icon: '🏥' },
    { value: 'exame', label: 'Sala de Exame', icon: '🔬' },
    { value: 'procedimento', label: 'Sala de Procedimento', icon: '⚕️' },
    { value: 'internacao', label: 'Quarto/Internação', icon: '🛏️' },
    { value: 'reuniao', label: 'Sala de Reunião', icon: '👥' },
    { value: 'espera', label: 'Sala de Espera', icon: '🪑' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Salas
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gerencie as salas da clínica
            </p>
          </div>
          <button
            onClick={abrirModalNovo}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
          >
            <PlusIcon className="w-4 h-4" />
            Nova Sala
          </button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total de Salas</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{salas.length}</p>
              </div>
              <HomeModernIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Consultórios</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {salas.filter(s => s.tipo === 'consultorio').length}
                </p>
              </div>
              <span className="text-2xl">🏥</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Salas de Exame</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {salas.filter(s => s.tipo === 'exame').length}
                </p>
              </div>
              <span className="text-2xl">🔬</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Salas Ativas</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {salas.filter(s => s.ativo).length}
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Lista de Salas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salas.map(sala => (
            <div
              key={sala.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200"
              style={{ borderLeft: `4px solid ${sala.cor}` }}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sala.cor }}></div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{sala.nome}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${sala.ativo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {sala.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirModalEditar(sala)}
                      className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => excluirSala(sala.id)}
                      className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Excluir"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="text-base">{tiposSala.find(t => t.value === sala.tipo)?.icon || '🏥'}</span>
                    <span>{tiposSala.find(t => t.value === sala.tipo)?.label || sala.tipo}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Capacidade:</span> {sala.capacidade} pessoa(s)
                  </p>
                  {sala.localizacao && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Localização:</span> {sala.localizacao}
                    </p>
                  )}
                  {sala.observacao && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{sala.observacao}</p>
                  )}
                </div>
              </div>
              
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <button
                  onClick={() => alternarStatus(sala)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${sala.ativo ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                >
                  {sala.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <span className="text-xs text-gray-400">
                  Criado em: {new Date(sala.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {salas.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <HomeModernIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma sala cadastrada</p>
            <button
              onClick={abrirModalNovo}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
            >
              + Adicionar primeira sala
            </button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editing ? 'Editar Sala' : 'Nova Sala'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Sala *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="Ex: Consultório 01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Sala
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  {tiposSala.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.icon} {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacidade}
                    onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cor
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="Andar, setor, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.ativo === true}
                      onChange={() => setFormData({ ...formData, ativo: true })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ativa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.ativo === false}
                      onChange={() => setFormData({ ...formData, ativo: false })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Inativa</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows="3"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="Informações adicionais..."
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarSala}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md"
              >
                {editing ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
