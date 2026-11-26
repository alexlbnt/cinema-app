export const TIPOS_INGRESSO = ['Inteira', 'Meia'] as const;
export type TipoIngresso = (typeof TIPOS_INGRESSO)[number];

/** Preço cobrado por um ingresso: o valor da sessão, ou metade na meia-entrada. */
export function precoIngresso(valorSessao: number, tipo: string): number {
  const valor = tipo === 'Meia' ? valorSessao / 2 : valorSessao;
  return Math.round(valor * 100) / 100;
}
