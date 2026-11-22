import { obterServicos } from '../services/container';
import { useAuthStore } from '../store/authStore';
import type { Meta, MetaListada, RegistroProgresso, ResumoUsuario, StatusMeta } from '../types';
import { useCarregar } from './useCarregar';

/** Usuário logado (ou `null` por um instante, durante a saída do app). */
export function useUsuario() {
  return useAuthStore((estado) => estado.usuario);
}

/** Metas do usuário, opcionalmente filtradas por situação. */
export function useMetas(status?: StatusMeta) {
  const usuario = useUsuario();
  return useCarregar<MetaListada[]>(
    () => obterServicos().metas.listarMetas(usuario?.id ?? 0, status),
    [usuario?.id, status],
    usuario !== null,
  );
}

export interface DetalheDaMeta {
  meta: Meta;
  registros: RegistroProgresso[];
}

/** Uma meta com o histórico de valores registrados. */
export function useMetaDetalhe(metaId: number) {
  const usuario = useUsuario();
  return useCarregar<DetalheDaMeta>(
    async () => {
      const servicos = obterServicos();
      const id = usuario?.id ?? 0;
      const meta = await servicos.metas.buscarMeta(id, metaId);
      const registros = await servicos.metas.listarRegistros(id, metaId);
      return { meta, registros };
    },
    [usuario?.id, metaId],
    usuario !== null,
  );
}

/** Números da tela inicial (total guardado, metas e pontos). */
export function useResumo() {
  const usuario = useUsuario();
  return useCarregar<ResumoUsuario>(
    () => obterServicos().metas.resumo(usuario?.id ?? 0),
    [usuario?.id],
    usuario !== null,
  );
}
