import { describe, expect, it } from 'vitest';
import {
  calculatePercentageChange,
  formatCurrency,
  formatRelativeTime,
  getInitials,
  slugify,
  validateEmail,
  validatePhone,
} from './utils';

describe('formatCurrency', () => {
  it('formatea pesos colombianos sin decimales', () => {
    expect(formatCurrency(80_000)).toContain('80.000');
  });
});

describe('validateEmail', () => {
  it('acepta emails con formato válido', () => {
    expect(validateEmail('cliente@canchazo.co')).toBe(true);
  });

  it('rechaza emails sin dominio o sin @', () => {
    expect(validateEmail('cliente@')).toBe(false);
    expect(validateEmail('cliente.canchazo.co')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('acepta 10 dígitos colombianos', () => {
    expect(validatePhone('3208184980')).toBe(true);
  });

  it('rechaza números con menos de 10 dígitos', () => {
    expect(validatePhone('123')).toBe(false);
  });

  it('ignora separadores como espacios o guiones', () => {
    expect(validatePhone('320-818-4980')).toBe(true);
  });
});

describe('slugify', () => {
  it('convierte a minúsculas y usa guiones', () => {
    expect(slugify('Cancha El Vergel')).toBe('cancha-el-vergel');
  });

  it('quita tildes', () => {
    expect(slugify('Fútbol en Ibagué')).toBe('futbol-en-ibague');
  });
});

describe('getInitials', () => {
  it('toma la primera letra de cada palabra, máximo 2', () => {
    expect(getInitials('Nelson Garzón')).toBe('NG');
    expect(getInitials('Ana María Torres')).toBe('AM');
  });
});

describe('calculatePercentageChange', () => {
  it('calcula el cambio porcentual normal', () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
  });

  it('devuelve 0 cuando no hay cambio y el valor previo es 0', () => {
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  it('devuelve 100 cuando se pasa de 0 a un valor positivo', () => {
    expect(calculatePercentageChange(50, 0)).toBe(100);
  });
});

describe('formatRelativeTime', () => {
  it('devuelve cadena vacía para fechas nulas o inválidas', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime(undefined)).toBe('');
    expect(formatRelativeTime('fecha-invalida')).toBe('');
  });

  it('describe segundos recientes como "Hace un momento"', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Hace un momento');
  });
});
