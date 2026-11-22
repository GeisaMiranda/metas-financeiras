import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { cores, espaco, fonte } from '../theme';

/** Tela de abertura. Se o banco não abrir, mostra o erro e deixa tentar de novo. */
export function AberturaScreen() {
  const erro = useAuthStore((e) => e.erroInicial);
  const iniciar = useAuthStore((e) => e.iniciar);
  return (
    <View style={styles.tela}>
      <Text style={styles.logo}>💰</Text>
      <Text style={styles.nome}>Metas Financeiras</Text>
      <Text style={styles.frase}>Planeje, guarde e conquiste</Text>
      {erro ? (
        <View style={styles.erroCaixa}>
          <Text style={styles.erro}>{erro}</Text>
          <Button titulo="Tentar de novo" variante="secundario" onPress={() => void iniciar()} />
        </View>
      ) : (
        <ActivityIndicator color="#FFFFFF" style={styles.carregando} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center', padding: espaco.xl },
  logo: { fontSize: 64 },
  nome: { ...fonte.titulo, color: '#FFFFFF', marginTop: espaco.md },
  frase: { ...fonte.corpo, color: cores.primariaClara, marginTop: espaco.xs },
  carregando: { marginTop: espaco.xl },
  erroCaixa: { marginTop: espaco.xl, gap: espaco.md, alignSelf: 'stretch' },
  erro: { color: '#FFFFFF', textAlign: 'center', fontSize: 16 },
});
