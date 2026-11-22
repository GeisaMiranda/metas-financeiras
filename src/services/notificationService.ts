import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PreferenciasStorage } from './storage';

const CANAL_ID = 'lembretes';
const HORA_DO_LEMBRETE = 20;
const MINUTO_DO_LEMBRETE = 0;

/**
 * Lembretes diários por notificação local (RF18).
 * É também o uso de "permissão nativa" do app: pedimos a permissão de notificações
 * só quando o usuário liga o lembrete, e tratamos o caso de ele negar.
 */
export class NotificationService {
  private readonly preferencias: PreferenciasStorage;

  constructor(preferencias: PreferenciasStorage) {
    this.preferencias = preferencias;
  }

  /** Define como a notificação aparece com o app aberto. Chamar uma vez ao iniciar o app. */
  configurarExibicao(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }

  async lembretesAtivos(usuarioId: number): Promise<boolean> {
    return this.preferencias.lembretesAtivos(usuarioId);
  }

  /**
   * Liga ou desliga o lembrete diário das 20h.
   * Devolve o estado final: `false` se o usuário não deu a permissão.
   */
  async definirLembretes(usuarioId: number, ativar: boolean): Promise<boolean> {
    if (!ativar) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await this.preferencias.definirLembretes(usuarioId, false);
      return false;
    }

    if (!(await this.garantirPermissao())) {
      await this.preferencias.definirLembretes(usuarioId, false);
      return false;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de guardar um pouquinho 💰',
        body: 'Registre o que você guardou hoje e mantenha as suas metas em dia.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: HORA_DO_LEMBRETE,
        minute: MINUTO_DO_LEMBRETE,
        channelId: CANAL_ID,
      },
    });
    await this.preferencias.definirLembretes(usuarioId, true);
    return true;
  }

  private async garantirPermissao(): Promise<boolean> {
    if (Platform.OS === 'android') {
      // No Android o canal precisa existir antes de pedir a permissão.
      await Notifications.setNotificationChannelAsync(CANAL_ID, {
        name: 'Lembretes das metas',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
    if (!atual.canAskAgain) return false;
    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  }
}
