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
    observacao: ''
  });

  const carregarSalas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('salas').select('*').order('nome');
    if (error) toast.error('Erro ao carregar salas');
    else setSalas(data || []);
    setLoading(false);
  };

  useEffect(() => { carregarSalas(); }, []);

  const salvarSala = async () => {
    if (!formData.nome) {
      toast.error('Nome da sala é obrigatório');
      return;
    }

    const sala = { ...formData, updated_at: new Date().toISOString() };
    
    if (editing) {
      const { error } = await supabase.from('salas').update(sala).eq('id', editing.id);
      if (error) toast.error('Erro ao atualizar');
      else toast.success('Sala atualizada!');
    } else {
      const { error } = await supabase.from('salas').insert([{ ...sala, created_at: new Date().toISOString() }]);
      if (error) toast.error('Erro ao criar sala');
      else toast.success('Sala criada!');
    }
    
    setShowModal(false);
    carregarSalas();
  };

  const excluirSala = async (id) => {
    if (confirm('Excluir esta sala?')) {
      const { error } = await supabase.from('salas').delete().eq('id', id);
      if (error) toast.error('Erro ao excluir');
      else toast.success('Sala excluída!');
      carregarSalas();
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Salas</h1>
            <p className="text-gray-500">Gerencie as salas da clínica</p>
          </div>
          <button onClick={() => { setEditing(null); setFormData({ nome: '', tipo: 'consultorio', capacidade: 1, localizacao: '', cor: '#3B82F6', observacao: '' }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Nova Sala
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salas.map(sala => (
            <div key={sala.id} className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: sala.cor }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sala.cor }}></div>
                  <h3 className="font-semibold text-lg">{sala.nome}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(sala); setFormData(sala); setShowModal(true); }} className="p-1 text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => excluirSala(sala.id)} className="p-1 text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="text-gray-500">Tipo:</span> {sala.tipo}</p>
                <p><span className="text-gray-500">Capacidade:</span> {sala.capacidade} pessoa(s)</p>
                {sala.localizacao && <p><span className="text-gray-500">Local:</span> {sala.localizacao}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between">
              <h2 className="text-xl font-semibold">{editing ? 'Editar' : 'Nova'} Sala</h2>
              <button onClick={() => setShowModal(false)}><XMarkIcon className="w-6 h-6" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input type="text" placeholder="Nome da sala" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option value="consultorio">Consultório</option>
                <option value="exame">Sala de Exame</option>
                <option value="procedimento">Sala de Procedimento</option>
                <option value="internacao">Quarto/Internação</option>
              </select>
              <input type="number" placeholder="Capacidade" value={formData.capacidade} onChange={e => setFormData({...formData, capacidade: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Localização" value={formData.localizacao} onChange={e => setFormData({...formData, localizacao: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              <div className="flex items-center gap-2">
                <label className="text-sm">Cor:</label>
                <input type="color" value={formData.cor} onChange={e => setFormData({...formData, cor: e.target.value})} className="w-12 h-10 border rounded" />
                <span className="text-sm text-gray-500">{formData.cor}</span>
              </div>
              <textarea placeholder="Observações" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows="2" />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={salvarSala} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
