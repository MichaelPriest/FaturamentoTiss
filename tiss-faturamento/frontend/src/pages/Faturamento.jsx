import { useState, useEffect } from 'react';
import { DocumentArrowDownIcon, PaperAirplaneIcon, BuildingOfficeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { gerarXMLTISS, converterAtendimentoParaTISS, setVersao, VERSAO_TISS } from '../lib/tissGenerator';

// Constantes para o componente
const MAX_GUIAS_POR_LOTE = 100;

export default function Faturamento() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [guiasGeradas, setGuiasGeradas] = useState([]);
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [versaoTISS, setVersaoTISS] = useState('4.03.00');

  useEffect(() => {
    carregarDados();
    carregarVersao();
  }, []);

  const carregarDados = () => {
    const storedAtendimentos = localStorage.getItem('atendimentos');
    const storedConvenios = localStorage.getItem('convenios');
    
    if (storedAtendimentos) setAtendimentos(JSON.parse(storedAtendimentos));
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
    
    const storedGuias = localStorage.getItem('guias_geradas');
    if (storedGuias) setGuiasGeradas(JSON.parse(storedGuias));
  };

  const carregarVersao = () => {
    const stored = localStorage.getItem('config_sistema');
    if (stored) {
      const config = JSON.parse(stored);
      const versao = config.versao_tiss || '4.03.00';
      setVersaoTISS(versao);
      setVersao(versao);
    }
  };

  const pendentes = atendimentos.filter(a => a.status === 'pendente');
  
  const pendentesPorConvenio = pendentes.reduce((acc, a) => {
    const convenioId = a.paciente_convenio_id;
    if (!acc[convenioId]) acc[convenioId] = [];
    acc[convenioId].push(a);
    return acc;
  }, {});

  const handleSelectAll = (convenioId, convenioAtendimentos) => {
    const ids = convenioAtendimentos.map(a => a.id);
    if (selecionados.some(id => ids.includes(id))) {
      setSelecionados(selecionados.filter(id => !ids.includes(id)));
    } else {
      if (selecionados.length + ids.length > MAX_GUIAS_POR_LOTE) {
        toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote!`);
        const limite = MAX_GUIAS_POR_LOTE - selecionados.length;
        setSelecionados([...selecionados, ...ids.slice(0, limite)]);
      } else {
        setSelecionados([...selecionados, ...ids]);
      }
    }
  };

  const handleSelectItem = (id) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(i => i !== id));
    } else {
      if (selecionados.length >= MAX_GUIAS_POR_LOTE) {
        toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote atingido!`);
        return;
      }
      setSelecionados([...selecionados, id]);
    }
  };

  const gerarXMLPorConvenio = async (convenioId, atendimentosList) => {
    const convenio = convenios.find(c => c.id === convenioId);
    if (!convenio) {
      toast.error('Convênio não encontrado');
      return;
    }

    if (!convenio.codigo_prestador) {
      toast.error(`Convênio ${convenio.razao_social} não possui código de prestador configurado`);
      return;
    }

    if (atendimentosList.length > MAX_GUIAS_POR_LOTE) {
      toast.warning(`O lote tem ${atendimentosList.length} guias. O limite é ${MAX_GUIAS_POR_LOTE}. Serão geradas apenas as primeiras ${MAX_GUIAS_POR_LOTE}.`);
      atendimentosList = atendimentosList.slice(0, MAX_GUIAS_POR_LOTE);
    }

    setGerando(true);

    const guias = atendimentosList.map(atendimento => ({
      ...converterAtendimentoParaTISS(atendimento, convenio),
      codigoPrestadorExecutante: convenio.codigo_prestador,
      versao: versaoTISS
    }));

    const xml = gerarXMLTISS({
      versao: versaoTISS,
      codigoPrestadorNaOperadora: convenio.codigo_prestador,
      registroANS: convenio.registro_ans,
      guias: guias,
      convenio: convenio
    });

    const novaGuia = {
      id: Date.now(),
      convenio_id: convenioId,
      convenio_nome: convenio.razao_social,
      numero_lote: `LOTE-${Date.now()}`,
      data_envio: new Date().toISOString().split('T')[0],
      quantidade_guias: atendimentosList.length,
      guias_ids: atendimentosList.map(a => a.id),
      xml: xml,
      status: 'gerado',
      versao: versaoTISS
    };
    
    const guiasAtualizadas = [...guiasGeradas, novaGuia];
    localStorage.setItem('guias_geradas', JSON.stringify(guiasAtualizadas));
    setGuiasGeradas(guiasAtualizadas);

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lote_${convenio.registro_ans}_${novaGuia.numero_lote}.xml`;
    a.click();
    URL.revokeObjectURL(url);

    const atendimentosAtualizados = atendimentos.map(a => 
      atendimentosList.some(item => item.id === a.id) ? { ...a, status: 'faturado' } : a
    );
    localStorage.setItem('atendimentos', JSON.stringify(atendimentosAtualizados));
    setAtendimentos(atendimentosAtualizados);
    
    setSelecionados([]);
    setGerando(false);
    toast.success(`${atendimentosList.length} guia(s) do convênio ${convenio.razao_social} gerada(s)!`);
  };

  const gerarLoteSelecionado = async () => {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos uma guia para faturar');
      return;
    }

    const atendimentosSelecionados = pendentes.filter(a => selecionados.includes(a.id));
    const agrupadosPorConvenio = atendimentosSelecionados.reduce((acc, a) => {
      const convenioId = a.paciente_convenio_id;
      if (!acc[convenioId]) acc[convenioId] = [];
      acc[convenioId].push(a);
      return acc;
    }, {});

    for (const [convenioId, lista] of Object.entries(agrupadosPorConvenio)) {
      await gerarXMLPorConvenio(parseInt(convenioId), lista);
    }
  };

  const regenerarLote = async (guia) => {
    if (!confirm(`Deseja regenerar o lote ${guia.numero_lote}? Isso irá recriar o XML e marcar as guias como pendentes novamente.`)) {
      return;
    }

    setGerando(true);
    
    const atendimentosOriginais = atendimentos.filter(a => guia.guias_ids?.includes(a.id));
    
    if (atendimentosOriginais.length === 0) {
      toast.error('Não foi possível recuperar os atendimentos originais');
      setGerando(false);
      return;
    }

    const convenio = convenios.find(c => c.id === guia.convenio_id);
    if (!convenio) {
      toast.error('Convênio não encontrado');
      setGerando(false);
      return;
    }

    const atendimentosAtualizados = atendimentos.map(a => 
      guia.guias_ids?.includes(a.id) ? { ...a, status: 'pendente' } : a
    );
    localStorage.setItem('atendimentos', JSON.stringify(atendimentosAtualizados));
    setAtendimentos(atendimentosAtualizados);

    const guiasAtualizadas = guiasGeradas.filter(g => g.id !== guia.id);
    localStorage.setItem('guias_geradas', JSON.stringify(guiasAtualizadas));
    setGuiasGeradas(guiasAtualizadas);

    const novasGuias = atendimentosOriginais.map(atendimento => ({
      ...converterAtendimentoParaTISS(atendimento, convenio),
      codigoPrestadorExecutante: convenio.codigo_prestador,
      versao: versaoTISS
    }));

    const xml = gerarXMLTISS({
      versao: versaoTISS,
      codigoPrestadorNaOperadora: convenio.codigo_prestador,
      registroANS: convenio.registro_ans,
      guias: novasGuias,
      convenio: convenio
    });

    const novaGuia = {
      ...guia,
      id: Date.now(),
      numero_lote: `LOTE-${Date.now()}`,
      data_envio: new Date().toISOString().split('T')[0],
      xml: xml,
      regenerado: true,
      regenerado_de: guia.numero_lote
    };
    
    const guiasAtualizadasComNovo = [...guiasAtualizadas, novaGuia];
    localStorage.setItem('guias_geradas', JSON.stringify(guiasAtualizadasComNovo));
    setGuiasGeradas(guiasAtualizadasComNovo);

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lote_${convenio.registro_ans}_${novaGuia.numero_lote}.xml`;
    a.click();
    URL.revokeObjectURL(url);

    const atendimentosFinal = atendimentosAtualizados.map(a => 
      guia.guias_ids?.includes(a.id) ? { ...a, status: 'faturado' } : a
    );
    localStorage.setItem('atendimentos', JSON.stringify(atendimentosFinal));
    setAtendimentos(atendimentosFinal);

    setGerando(false);
    toast.success(`Lote ${guia.numero_lote} regenerado com sucesso!`);
  };

  const selecionadosPorConvenio = (convenioId) => {
    return selecionados.filter(id => 
      pendentes.find(a => a.id === id && a.paciente_convenio_id === convenioId)
    ).length;
  };

  const totalSelecionados = selecionados.length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Faturamento TISS</h2>
        <div className="flex gap-2">
          <select 
            value={versaoTISS} 
            onChange={(e) => { setVersaoTISS(e.target.value); setVersao(e.target.value); }}
            className="border rounded-lg px-3 py-1.5 text-sm bg-gray-50"
          >
            <option value="4.01.00">TISS 4.01.00</option>
            <option value="4.02.00">TISS 4.02.00</option>
            <option value="4.03.00">TISS 4.03.00</option>
          </select>
          {totalSelecionados > 0 && (
            <button 
              onClick={gerarLoteSelecionado} 
              disabled={gerando} 
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-green-700"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Faturar Selecionados ({totalSelecionados}/{MAX_GUIAS_POR_LOTE})
            </button>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Total Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{pendentes.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Convênios com Pendência</p>
          <p className="text-2xl font-bold text-blue-600">{Object.keys(pendentesPorConvenio).length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Lotes Gerados</p>
          <p className="text-2xl font-bold text-green-600">{guiasGeradas.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Limite por Lote</p>
          <p className="text-2xl font-bold text-purple-600">{MAX_GUIAS_POR_LOTE}</p>
        </div>
      </div>

      {/* Seletor de Convênio */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button onClick={() => setFiltroConvenio('todos')} className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${filtroConvenio === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Todos ({pendentes.length})
        </button>
        {convenios.map(c => {
          const count = pendentes.filter(a => a.paciente_convenio_id === c.id).length;
          if (count === 0) return null;
          return (
            <button key={c.id} onClick={() => setFiltroConvenio(c.id.toString())} className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${filtroConvenio === c.id.toString() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {c.razao_social} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de atendimentos por convênio */}
      <div className="space-y-4">
        {Object.entries(pendentesPorConvenio)
          .filter(([convenioId]) => filtroConvenio === 'todos' || filtroConvenio === convenioId)
          .map(([convenioId, convenioAtendimentos]) => {
            const convenio = convenios.find(c => c.id === parseInt(convenioId));
            if (!convenio) return null;
            const selecionadosCount = selecionadosPorConvenio(parseInt(convenioId));
            
            return (
              <div key={convenioId} className="bg-white rounded-lg border overflow-hidden">
                <div className="p-3 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={selecionadosCount === convenioAtendimentos.length && convenioAtendimentos.length > 0}
                      onChange={() => handleSelectAll(parseInt(convenioId), convenioAtendimentos)}
                      className="rounded w-4 h-4"
                    />
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-sm">{convenio.razao_social}</span>
                    <span className="text-xs text-gray-500">Código: {convenio.codigo_prestador || 'Não configurado'}</span>
                    <span className="text-xs text-gray-500">ANS: {convenio.registro_ans || 'Não configurado'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-500">
                      {selecionadosCount} selecionados
                    </span>
                    <button 
                      onClick={() => gerarXMLPorConvenio(parseInt(convenioId), convenioAtendimentos)} 
                      disabled={gerando} 
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                    >
                      Faturar Tudo ({convenioAtendimentos.length})
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left w-8"></th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Data</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Paciente</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Carteira</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Procedimento</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {convenioAtendimentos.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <input 
                              type="checkbox" 
                              checked={selecionados.includes(a.id)}
                              onChange={() => handleSelectItem(a.id)}
                              disabled={!selecionados.includes(a.id) && selecionados.length >= MAX_GUIAS_POR_LOTE}
                              className="rounded w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">{a.data_atendimento}</td>
                          <td className="px-4 py-2 text-xs text-gray-800">{a.paciente_nome}</td>
                          <td className="px-4 py-2 text-xs font-mono text-gray-600">{a.numero_carteira}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">{a.procedimento_nome}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">R$ {a.valor_total?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
      </div>

      {pendentes.length === 0 && (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500 text-sm">
          Nenhum atendimento pendente de faturamento
        </div>
      )}

      {/* Histórico de lotes gerados */}
      <div className="mt-6 bg-white rounded-lg border overflow-hidden">
        <div className="p-3 border-b bg-gray-50">
          <h3 className="font-semibold text-sm">Histórico de Lotes Gerados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Convênio</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Lote</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Data</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Guias</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Versão</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guiasGeradas.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-600">{g.convenio_nome}</td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-500">{g.numero_lote}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{g.data_envio}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{g.quantidade_guias}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{g.versao || '4.03.00'}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => {
                          const blob = new Blob([g.xml], { type: 'application/xml' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${g.numero_lote}.xml`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success('XML baixado!');
                        }} 
                        className="text-blue-600 hover:text-blue-800"
                        title="Baixar XML"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => regenerarLote(g)} 
                        disabled={gerando}
                        className="text-green-600 hover:text-green-800"
                        title="Regenerar Lote"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guiasGeradas.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">
                    Nenhum lote gerado ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 Informações</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Limite máximo de <strong>{MAX_GUIAS_POR_LOTE} guias por lote</strong></li>
          <li>• Selecione as guias desejadas e clique em "Faturar Selecionados"</li>
          <li>• O XML será gerado conforme a versão TISS selecionada</li>
          <li>• Use o botão de regenerar para recriar um lote e corrigir erros</li>
        </ul>
      </div>
    </div>
  );
}
