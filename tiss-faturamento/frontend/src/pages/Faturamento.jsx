import { useState, useEffect } from 'react';
import { DocumentArrowDownIcon, PaperAirplaneIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { gerarXMLTISS, converterAtendimentoParaTISS } from '../lib/tissGenerator';

export default function Faturamento() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [guiasGeradas, setGuiasGeradas] = useState([]);
  const [filtroConvenio, setFiltroConvenio] = useState('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    const storedAtendimentos = localStorage.getItem('atendimentos');
    const storedConvenios = localStorage.getItem('convenios');
    
    if (storedAtendimentos) setAtendimentos(JSON.parse(storedAtendimentos));
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
    
    const storedGuias = localStorage.getItem('guias_geradas');
    if (storedGuias) setGuiasGeradas(JSON.parse(storedGuias));
  };

  const pendentes = atendimentos.filter(a => a.status === 'pendente');
  const pendentesPorConvenio = pendentes.reduce((acc, a) => {
    const convenioId = a.paciente_convenio_id;
    if (!acc[convenioId]) acc[convenioId] = [];
    acc[convenioId].push(a);
    return acc;
  }, {});

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

    setGerando(true);

    const guias = atendimentosList.map(atendimento => ({
      ...converterAtendimentoParaTISS(atendimento, convenio),
      codigoPrestadorExecutante: convenio.codigo_prestador
    }));

    const xml = gerarXMLTISS({
      codigoPrestadorNaOperadora: convenio.codigo_prestador,
      registroANS: convenio.registro_ans,
      guias: guias
    });

    const novaGuia = {
      id: Date.now(),
      convenio_id: convenioId,
      convenio_nome: convenio.razao_social,
      numero_lote: `LOTE-${Date.now()}`,
      data_envio: new Date().toISOString().split('T')[0],
      quantidade_guias: atendimentosList.length,
      xml: xml,
      status: 'gerado'
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
    
    setGerando(false);
    toast.success(`${atendimentosList.length} guia(s) do convênio ${convenio.razao_social} gerada(s)!`);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Faturamento TISS</h2>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-xs text-gray-500">Total Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{pendentes.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-xs text-gray-500">Convênios com Pendência</p>
          <p className="text-2xl font-bold text-blue-600">{Object.keys(pendentesPorConvenio).length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-xs text-gray-500">Lotes Gerados</p>
          <p className="text-2xl font-bold text-green-600">{guiasGeradas.length}</p>
        </div>
      </div>

      {/* Lista de atendimentos por convênio */}
      <div className="space-y-4">
        {Object.entries(pendentesPorConvenio).map(([convenioId, convenioAtendimentos]) => {
          const convenio = convenios.find(c => c.id === parseInt(convenioId));
          if (!convenio) return null;
          
          return (
            <div key={convenioId} className="bg-white rounded-lg border overflow-hidden">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-sm">{convenio.razao_social}</span>
                  <span className="text-xs text-gray-500">Código: {convenio.codigo_prestador || 'Não configurado'}</span>
                  <span className="text-xs text-gray-500">ANS: {convenio.registro_ans || 'Não configurado'}</span>
                </div>
                <button 
                  onClick={() => gerarXMLPorConvenio(parseInt(convenioId), convenioAtendimentos)} 
                  disabled={gerando} 
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                >
                  Faturar Lote ({convenioAtendimentos.length})
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
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
                <th className="px-4 py-2 text-center text-xs text-gray-500">XML</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guiasGeradas.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-600">{g.convenio_nome}</td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-500">{g.numero_lote}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{g.data_envio}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{g.quantidade_guias}</td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      onClick={() => {
                        const blob = new Blob([g.xml], { type: 'application/xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${g.numero_lote}.xml`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }} 
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {guiasGeradas.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm">
                    Nenhum lote gerado ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}