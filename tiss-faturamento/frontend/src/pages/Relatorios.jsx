import { useState, useEffect } from 'react';
import { DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function Relatorios() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [periodo, setPeriodo] = useState('mes');

  useEffect(() => {
    const storedAtendimentos = localStorage.getItem('atendimentos');
    const storedConvenios = localStorage.getItem('convenios');
    if (storedAtendimentos) setAtendimentos(JSON.parse(storedAtendimentos));
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
  }, []);

  const faturadoPorConvenio = () => {
    const resultado = {};
    atendimentos.forEach(a => {
      if (resultado[a.convenio_nome]) {
        resultado[a.convenio_nome] += a.valor_total || 0;
      } else {
        resultado[a.convenio_nome] = a.valor_total || 0;
      }
    });
    return resultado;
  };

  const totalFaturado = atendimentos.reduce((sum, a) => sum + (a.valor_total || 0), 0);
  const totalAtendimentos = atendimentos.length;
  const ticketMedio = totalAtendimentos > 0 ? totalFaturado / totalAtendimentos : 0;

  const gerarRelatorio = (tipo) => {
    let conteudo = '';
    if (tipo === 'faturamento') {
      conteudo = `RELATÓRIO DE FATURAMENTO
Data: ${new Date().toLocaleDateString()}
Total Faturado: R$ ${totalFaturado.toFixed(2)}
Total de Atendimentos: ${totalAtendimentos}
Ticket Médio: R$ ${ticketMedio.toFixed(2)}

Faturamento por Convênio:
${Object.entries(faturadoPorConvenio()).map(([conv, valor]) => `- ${conv}: R$ ${valor.toFixed(2)}`).join('\n')}
`;
    } else if (tipo === 'producao') {
      conteudo = `RELATÓRIO DE PRODUÇÃO
Data: ${new Date().toLocaleDateString()}
Total de Atendimentos: ${totalAtendimentos}

Atendimentos por Período:
${atendimentos.map(a => `- ${a.data_atendimento}: ${a.paciente_nome} - ${a.procedimento_nome} - R$ ${a.valor_total?.toFixed(2)}`).join('\n')}
`;
    }

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${tipo}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório gerado!');
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Relatórios</h2>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-xs text-gray-500">Total Faturado</p>
          <p className="text-xl font-bold text-green-600">R$ {totalFaturado.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-xs text-gray-500">Atendimentos</p>
          <p className="text-xl font-bold text-blue-600">{totalAtendimentos}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-xs text-gray-500">Ticket Médio</p>
          <p className="text-xl font-bold text-purple-600">R$ {ticketMedio.toFixed(2)}</p>
        </div>
      </div>

      {/* Botões de relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold">Relatório de Faturamento</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Resumo financeiro por convênio e período</p>
          <button onClick={() => gerarRelatorio('faturamento')} className="btn-primary text-sm py-1.5">Gerar Relatório</button>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <DocumentArrowDownIcon className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold">Relatório de Produção</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Detalhamento de todos os atendimentos</p>
          <button onClick={() => gerarRelatorio('producao')} className="btn-primary text-sm py-1.5">Gerar Relatório</button>
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <p className="text-xs text-blue-700">📊 Os relatórios são gerados em formato TXT e baixados automaticamente.</p>
      </div>
    </div>
  );
}