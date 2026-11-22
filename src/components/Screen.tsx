import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cores, espaco } from '../theme';

interface Props {
  children: ReactNode;
  /** Se verdadeiro, o conteúdo rola. Use falso quando a tela tem uma FlatList própria. */
  rolavel?: boolean;
}

export function Screen({ children, rolavel = true }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {rolavel ? (
          <ScrollView
            contentContainerStyle={styles.conteudo}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.conteudoFixo]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: cores.fundo },
  flex: { flex: 1 },
  conteudo: { padding: espaco.lg, paddingBottom: espaco.xxl, gap: espaco.lg },
  conteudoFixo: { paddingHorizontal: espaco.lg, paddingTop: espaco.lg },
});
