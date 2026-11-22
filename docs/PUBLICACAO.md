# Publicação

## Android (Google Play)

1. Criar conta em [expo.dev](https://expo.dev) e instalar: `npm i -g eas-cli` → `eas login`
2. `eas build:configure`
3. Gerar o pacote: `eas build --platform android --profile production` (gera o `.aab`). A chave de assinatura (Keystore) é criada e guardada pelo EAS — **guarde o backup** (`eas credentials`).
4. Conta de desenvolvedor Google Play (taxa única de US$ 25) → criar app → enviar o `.aab` primeiro em **Teste interno**.
5. Preencher a ficha da loja (abaixo) e a política de privacidade (`POLITICA_PRIVACIDADE.md`, hospedada em um link público, ex.: GitHub Pages).

## iOS (TestFlight / App Store)

Exige **conta Apple Developer paga (US$ 99/ano)** e conta de desenvolvedor aprovada.
`eas build --platform ios --profile production` → `eas submit --platform ios` → distribuir pelo **TestFlight**.
Sem a conta paga não é possível gerar o `.ipa` instalável. Alternativa para a apresentação: Expo Go / emulador / `.apk` no Android (`--profile preview`).

## Ficha da loja

- **Nome:** Metas Financeiras
- **Descrição curta:** Crie metas, guarde dinheiro e ganhe pontos com desafios.
- **Descrição completa:** Planeje seus objetivos financeiros: defina o valor e o prazo, registre quanto guardou, acompanhe o progresso em porcentagem e participe de desafios de economia que dão pontos. Tudo fica salvo no seu celular, sem precisar de internet.
- **Categoria:** Finanças · **Classificação:** Livre
- **Capturas de tela:** tirar 4–8 do app (Início, Metas, Detalhe da meta, Desafios, Perfil)
- **Ícone:** `assets/icon.png`
