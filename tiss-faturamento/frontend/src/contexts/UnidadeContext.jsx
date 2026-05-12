import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  TODAS_UNIDADES_ID,
  filterByUnidade,
  getStoredUnidadeId,
  setStoredUnidadeId,
  unidadesService
} from '../services/unidadesService';

const UnidadeContext = createContext({
  unidades: [],
  unidadeAtual: null,
  unidadeAtualId: TODAS_UNIDADES_ID,
  loadingUnidades: false,
  selecionarUnidade: () => {},
  recarregarUnidades: async () => [],
  filtrarPorUnidade: (items) => items
});

export function UnidadeProvider({ children }) {
  const [unidades, setUnidades] = useState([]);
  const [unidadeAtualId, setUnidadeAtualId] = useState(getStoredUnidadeId);
  const [loadingUnidades, setLoadingUnidades] = useState(true);

  const unidadeAtual = useMemo(
    () => unidades.find((unidade) => unidade.id === unidadeAtualId) || null,
    [unidadeAtualId, unidades]
  );

  const recarregarUnidades = async () => {
    setLoadingUnidades(true);
    try {
      const data = await unidadesService.listar();
      setUnidades(data);

      const selectedStillExists = unidadeAtualId === TODAS_UNIDADES_ID || data.some((unidade) => unidade.id === unidadeAtualId);
      if (!selectedStillExists) {
        setUnidadeAtualId(TODAS_UNIDADES_ID);
        setStoredUnidadeId(TODAS_UNIDADES_ID);
      }

      return data;
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      setUnidades([]);
      return [];
    } finally {
      setLoadingUnidades(false);
    }
  };

  useEffect(() => {
    recarregarUnidades();
  }, []);

  const selecionarUnidade = (unidadeId) => {
    const nextUnidadeId = unidadeId || TODAS_UNIDADES_ID;
    setUnidadeAtualId(nextUnidadeId);
    setStoredUnidadeId(nextUnidadeId);

    const unidade = unidades.find((item) => item.id === nextUnidadeId);
    toast.success(nextUnidadeId === TODAS_UNIDADES_ID ? 'Visualizando todas as unidades' : `Unidade ativa: ${unidade?.nome || 'selecionada'}`);
  };

  const filtrarPorUnidade = (items = []) => filterByUnidade(items, unidadeAtualId);

  return (
    <UnidadeContext.Provider value={{
      unidades,
      unidadeAtual,
      unidadeAtualId,
      loadingUnidades,
      selecionarUnidade,
      recarregarUnidades,
      filtrarPorUnidade
    }}>
      {children}
    </UnidadeContext.Provider>
  );
}

export const useUnidade = () => useContext(UnidadeContext);
