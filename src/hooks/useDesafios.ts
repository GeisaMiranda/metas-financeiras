import { obterServicos } from '../services/container';
import type { DesafioComSituacao } from '../types';
import { useCarregar } from './useCarregar';
import { useUsuario } from './useMetas';

/** Todos os desafios, com a situação de cada um para o usuário logado. */
export function useDesafios() {
  const usuario = useUsuario();
  return useCarregar<DesafioComSituacao[]>(
    () => obterServicos().desafios.listarDesafios(usuario?.id ?? 0),
    [usuario?.id],
    usuario !== null,
  );
}

export function useDesafio(desafioId: number) {
  const usuario = useUsuario();
  return useCarregar<DesafioComSituacao>(
    () => obterServicos().desafios.buscarDesafio(usuario?.id ?? 0, desafioId),
    [usuario?.id, desafioId],
    usuario !== null,
  );
}
