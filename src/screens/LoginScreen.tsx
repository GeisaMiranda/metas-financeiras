import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Screen } from '../components/Screen';
import type { AuthStackParamList } from '../navigation/types';
import { mensagemDeErro } from '../services/errors';
import { useAuthStore } from '../store/authStore';
import { cores, fonte } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const entrar = useAuthStore((e) => e.entrar);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.titulo}>Bem-vindo(a) de volta</Text>
      <Text style={styles.sub}>Entre para acompanhar as suas metas.</Text>
      <Input
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="voce@email.com"
      />
      <Input rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="Sua senha" />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <Button titulo="Entrar" onPress={() => void enviar()} carregando={enviando} />
      <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.link}>Ainda não tem conta? Cadastre-se</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...fonte.titulo, marginTop: 32 },
  sub: { ...fonte.corpo, color: cores.textoSuave },
  erro: { color: cores.perigo, fontSize: 14 },
  link: { color: cores.primaria, fontWeight: '600', textAlign: 'center', paddingVertical: 8 },
});
