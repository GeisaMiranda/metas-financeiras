export const cores = {
  primaria: '#0F766E',
  primariaEscura: '#115E59',
  primariaClara: '#CCFBF1',
  fundo: '#F4F7F6',
  superficie: '#FFFFFF',
  texto: '#14201F',
  textoSuave: '#5B6B69',
  borda: '#DDE5E3',
  sucesso: '#15803D',
  sucessoClaro: '#DCFCE7',
  alerta: '#B45309',
  alertaClaro: '#FEF3C7',
  perigo: '#B91C1C',
  perigoClaro: '#FEE2E2',
  destaque: '#F59E0B',
};

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const raio = { sm: 8, md: 12, lg: 16, pill: 999 };

export const fonte = {
  titulo: { fontSize: 24, fontWeight: '700' as const, color: cores.texto },
  subtitulo: { fontSize: 18, fontWeight: '600' as const, color: cores.texto },
  corpo: { fontSize: 16, color: cores.texto },
  pequeno: { fontSize: 13, color: cores.textoSuave },
};
