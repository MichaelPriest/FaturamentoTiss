import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { TODAS_UNIDADES_ID } from '../services/unidadesService';
import { useUnidade } from '../contexts/UnidadeContext';

export default function UnidadeSelector() {
  const { unidades, unidadeAtualId, selecionarUnidade, loadingUnidades } = useUnidade();

  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <BuildingOffice2Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <select
        value={unidadeAtualId}
        onChange={(event) => selecionarUnidade(event.target.value)}
        disabled={loadingUnidades}
        className="bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none min-w-40"
        title="Selecionar unidade de trabalho"
      >
        <option value={TODAS_UNIDADES_ID}>Todas as unidades</option>
        {unidades.map((unidade) => (
          <option key={unidade.id} value={unidade.id}>
            {unidade.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
