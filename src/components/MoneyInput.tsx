import { Input } from './Input';
import { digitosParaCentavos, formatarReais } from '../utils/money';

interface Props {
  rotulo: string;
  /** valor em centavos */
  valor: number;
  onChange: (centavos: number) => void;
  erro?: string | null;
}

/** Campo de dinheiro: a pessoa digita só números e o campo mostra "R$ 1.234,56". */
export function MoneyInput({ rotulo, valor, onChange, erro }: Props) {
  return (
    <Input
      rotulo={rotulo}
      erro={erro}
      keyboardType="number-pad"
      value={valor > 0 ? formatarReais(valor) : ''}
      placeholder="R$ 0,00"
      onChangeText={(texto) => onChange(digitosParaCentavos(texto))}
    />
  );
}
