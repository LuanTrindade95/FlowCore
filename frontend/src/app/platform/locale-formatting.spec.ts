import { formatCurrency, formatDate, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

describe('pt-BR locale formatting', () => {
  beforeAll(() => {
    registerLocaleData(localePt);
  });

  it('formats dates as dd/mm/yyyy', () => {
    expect(formatDate(new Date(2026, 5, 10), 'dd/MM/yyyy', 'pt-BR')).toBe('10/06/2026');
  });

  it('formats BRL currency with Brazilian separators', () => {
    const formatted = formatCurrency(1234.56, 'pt-BR', 'R$', 'BRL');

    expect(formatted).toContain('R$');
    expect(formatted).toContain('1.234,56');
  });
});
