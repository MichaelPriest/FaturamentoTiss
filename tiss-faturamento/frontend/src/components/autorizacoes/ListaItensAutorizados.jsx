// src/components/autorizacoes/ListaItensAutorizados.jsx
import { useState } from 'react';
import { TrashIcon, PencilIcon, PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function ListaItensAutorizados({ 
  itens, 
  onRemoverItem, 
  onAtualizarItem,
  onAdicionarItem,
  procedimentosDoConvenio,
  readOnly = false 
}) {
  const [editandoItem, setEditandoItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [novoItem, setNovoItem] = useState({
    codigo: '',
    nome: '',
    quantidade_autorizada: 1,
    valor_unitario: 0,
    tabela_referencia: '22'
  });

  const itensFiltrados = procedimentosDoConvenio?.filter(item =>
    item.codigo_tuss?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSalvarEdicao = (item) => {
    onAtualizarItem(item);
    setEditandoItem(null);
    toast.success('Item atualizado!');
  };

  const handleAdicionar = () => {
    if (!novoItem.codigo) {
      toast.error('Selecione um procedimento');
      return;
    }
    onAdicionarItem(novoItem);
    setNovoItem({
      codigo: '',
      nome: '',
      quantidade_autorizada: 1,
      valor_unitario: 0,
      tabela_referencia: '22'
    });
    setShowAddForm(false);
    setSearchTerm('');
  };

  const calcularSaldo = (item) => {
    return (item.quantidade_autorizada || 0) - (item.quantidade_utilizada || 0);
  };

  if (readOnly) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Código</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Procedimento</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qtd Autorizada</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qtd Utilizada</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Saldo</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor Unit.</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {itens?.map((item, idx) => {
              const saldo = calcularSaldo(item);
              return (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                  <td className="px-3 py-2 text-xs">{item.nome}</td>
                  <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_autorizada}</td>
                  <td className="px-3 py-2 text-xs text-center">{item.quantidade_utilizada || 0}</td>
                  <td className={`px-3 py-2 text-xs text-center font-semibold ${saldo > 0 ? 'text-green-600' : saldo === 0 ? 'text-gray-500' : 'text-red-600'}`}>
                    {saldo}
                  </td>
                  <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs text-right font-semibold">R$ {((item.valor_unitario || 0) * (item.quantidade_autorizada || 0)).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-700/50">
            <tr className="border-t">
              <td colSpan="6" className="px-3 py-2 text-right font-semibold text-gray-700">Total:</td>
              <td className="px-3 py-2 text-right font-bold text-blue-600">
                R$ {(itens || []).reduce((sum, i) => sum + ((i.valor_unitario || 0) * (i.quantidade_autorizada || 0)), 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com botão adicionar */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
          Itens Autorizados ({itens?.length || 0})
        </h4>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Adicionar Item
        </button>
      </div>

      {/* Formulário de adição */}
      {showAddForm && (
        <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-700/30">
          <div className="flex justify-between items-center mb-3">
            <h5 className="text-sm font-medium">Novo Item</h5>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Buscar Procedimento</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite código ou nome..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
                list="itens-suggestions-add"
              />
              <datalist id="itens-suggestions-add">
                {itensFiltrados.slice(0, 20).map(item => (
                  <option key={item.codigo_tuss} value={item.codigo_tuss}>
                    {item.codigo_tuss} - {item.nome}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {searchTerm && itensFiltrados.length > 0 && (
            <div className="border rounded-xl max-h-48 overflow-y-auto mb-3">
              {itensFiltrados.slice(0, 10).map(item => (
                <button
                  key={item.codigo_tuss}
                  type="button"
                  onClick={() => {
                    setNovoItem({
                      ...novoItem,
                      codigo: item.codigo_tuss,
                      nome: item.nome,
                      valor_unitario: item.valor_convenio || item.valor_sugerido || 0
                    });
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                >
                  <div className="flex justify-between">
                    <div>
                      <span className="font-mono text-sm text-blue-600">{item.codigo_tuss}</span>
                      <span className="text-sm ml-2">{item.nome}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      R$ {(item.valor_convenio || item.valor_sugerido || 0).toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {novoItem.codigo && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Código</label>
                <input type="text" value={novoItem.codigo} disabled className="w-full bg-gray-100 rounded px-2 py-1.5 text-sm font-mono" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Procedimento</label>
                <input type="text" value={novoItem.nome} disabled className="w-full bg-gray-100 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={novoItem.quantidade_autorizada}
                  onChange={(e) => setNovoItem({
                    ...novoItem,
                    quantidade_autorizada: parseInt(e.target.value) || 1,
                    valor_total: (parseInt(e.target.value) || 1) * novoItem.valor_unitario
                  })}
                  className="w-full border rounded px-2 py-1.5 text-sm text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor Unit. (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={novoItem.valor_unitario}
                  onChange={(e) => setNovoItem({
                    ...novoItem,
                    valor_unitario: parseFloat(e.target.value) || 0,
                    valor_total: novoItem.quantidade_autorizada * (parseFloat(e.target.value) || 0)
                  })}
                  className="w-full border rounded px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAdicionar}
                  className="w-full bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabela de itens */}
      {itens && itens.length > 0 ? (
        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Procedimento</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qtd</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor Unit.</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor Total</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {itens.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {editandoItem?.id === item.id ? (
                      <>
                        <td className="px-3 py-2 text-xs font-mono">{item.codigo}</td>
                        <td className="px-3 py-2 text-xs">{item.nome}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={editandoItem.quantidade_autorizada}
                            onChange={(e) => setEditandoItem({
                              ...editandoItem,
                              quantidade_autorizada: parseInt(e.target.value) || 1,
                              valor_total: (parseInt(e.target.value) || 1) * editandoItem.valor_unitario
                            })}
                            className="w-20 border rounded px-2 py-1 text-sm text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editandoItem.valor_unitario}
                            onChange={(e) => setEditandoItem({
                              ...editandoItem,
                              valor_unitario: parseFloat(e.target.value) || 0,
                              valor_total: editandoItem.quantidade_autorizada * (parseFloat(e.target.value) || 0)
                            })}
                            className="w-24 border rounded px-2 py-1 text-sm text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          R$ {editandoItem.valor_total.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => handleSalvarEdicao(editandoItem)} className="text-green-600 hover:text-green-800">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditandoItem(null)} className="text-red-600 hover:text-red-800">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                        <td className="px-3 py-2 text-xs">{item.nome}</td>
                        <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_autorizada}</td>
                        <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-right font-semibold">R$ {(item.valor_total || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => setEditandoItem(item)} className="text-blue-600 hover:text-blue-800">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => onRemoverItem(item.id)} className="text-red-600 hover:text-red-800">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                <tr className="border-t">
                  <td colSpan="4" className="px-3 py-2 text-right font-semibold text-gray-700">Total:</td>
                  <td className="px-3 py-2 text-right font-bold text-blue-600">
                    R$ {itens.reduce((sum, i) => sum + (i.valor_total || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-xl bg-gray-50 dark:bg-gray-700/30">
          <p className="text-gray-500">Nenhum item adicionado</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Item" para incluir procedimentos</p>
        </div>
      )}
    </div>
  );
}
