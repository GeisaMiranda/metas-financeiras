import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import type { DependencyList } from 'react';
import { mensagemDeErro } from '../services/errors';

export interface EstadoCarregamento<T> {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

/**
 * Carrega dados assincronamente e recarrega toda vez que a tela volta ao foco
 * (assim a lista fica atualizada depois de criar uma meta, registrar um valor etc.).
 * Se `habilitado` for falso, não busca nada.
 */
export function useCarregar<T>(
  buscar: () => Promise<T>,
  dependencias: DependencyList,
  habilitado = true,
): EstadoCarregamento<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(habilitado);
  const [erro, setErro] = useState<string | null>(null);
  const emUso = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const carregar = useCallback(async () => {
    if (!habilitado) {
      setCarregando(false);
      return;
    }
    try {
      const resultado = await buscar();
      if (!emUso.current) return;
      setDados(resultado);
      setErro(null);
    } catch (e) {
      if (!emUso.current) return;
      setErro(mensagemDeErro(e));
    } finally {
      if (emUso.current) setCarregando(false);
    }
  }, [habilitado, ...dependencias]);

  useFocusEffect(
    useCallback(() => {
      emUso.current = true;
      void carregar();
      return () => {
        emUso.current = false;
      };
    }, [carregar]),
  );

  return { dados, carregando, erro, recarregar: carregar };
}
