import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  filterByUnidade,
  getStoredUnidadeId,
  setStoredUnidadeId,
  unidadesService
} from '../services/unidadesService';

const UnidadeContext = createContext({
  unidades: [],
  unidadeAtual: null,
  unidadeAtualId: null,
  loadingUnidades: false,
  selecionarUnidade: () => {},
  recarregarUnidades: async () => [],
  filtrarPorUnidade: (items) => items
});

export function UnidadeProvider({ children }) {
  const { user } = useAuth();
  const [unidades, setUnidades] = useState([]);
  const [unidadeAtualId, setUnidadeAtualId] = useState(user?.unidade_id || null);
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

      const armazenada = getStoredUnidadeId();
      const unidadePermitida = data.find((unidade) => unidade.id === armazenada)
        || data.find((unidade) => unidade.id === user?.unidade_id)
        || data[0];
      const idPermitido = unidadePermitida?.id || null;
      setUnidadeAtualId(idPermitido);
      if (idPermitido) setStoredUnidadeId(idPermitido);

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
  }, [user?.unidade_id]);

  const selecionarUnidade = (unidadeId) => {
    if (unidades.some((item) => item.id === unidadeId)) {
      setUnidadeAtualId(unidadeId);
      setStoredUnidadeId(unidadeId);
    }
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
