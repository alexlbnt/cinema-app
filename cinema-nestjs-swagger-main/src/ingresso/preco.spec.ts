import { precoIngresso } from './preco';

describe('precoIngresso', () => {
  it('cobra o valor da sessão na inteira', () => {
    expect(precoIngresso(30, 'Inteira')).toBe(30);
  });

  it('cobra metade na meia-entrada', () => {
    expect(precoIngresso(30, 'Meia')).toBe(15);
  });

  it('arredonda para centavos', () => {
    expect(precoIngresso(25.55, 'Meia')).toBe(12.78);
  });
});
