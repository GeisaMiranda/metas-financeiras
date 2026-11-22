import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoDatabaseService } from '../database/connection';
import { criarServicos } from './factory';
import type { Servicos } from './factory';
import { HasherExpo } from './hasherExpo';
import { NotificationService } from './notificationService';

export interface ServicosDoApp extends Servicos {
  notificacoes: NotificationService;
}

let instancia: ServicosDoApp | null = null;
let iniciando: Promise<ServicosDoApp> | null = null;

/**
 * Abre o banco, cria as tabelas (se preciso) e monta todos os serviços.
 * Pode ser chamada várias vezes: só inicializa uma vez.
 */
export function inicializarServicos(): Promise<ServicosDoApp> {
  if (instancia) return Promise.resolve(instancia);
  if (!iniciando) {
    iniciando = (async () => {
      const db = await ExpoDatabaseService.abrir();
      await db.migrar();
      const base = criarServicos({ db, hasher: new HasherExpo(), armazenamento: AsyncStorage });
      const pronto: ServicosDoApp = { ...base, notificacoes: new NotificationService(base.preferencias) };
      instancia = pronto;
      return pronto;
    })().catch((erro: unknown) => {
      iniciando = null; // permite tentar de novo
      throw erro;
    });
  }
  return iniciando;
}

/** Serviços já inicializados. Só use depois de `inicializarServicos()` (o app faz isso ao abrir). */
export function obterServicos(): ServicosDoApp {
  if (!instancia) throw new Error('Os serviços ainda não foram inicializados.');
  return instancia;
}
