import { describe, expect, it } from 'vitest';
import { evaluatePasswordRules, passwordRulesAllMet } from './passwordRules';

describe('passwordRules', () => {
  it('evaluates each rule correctly', () => {
    const result = evaluatePasswordRules('Abc12345@');

    expect(result).toEqual({
      minLength: true,
      hasDigit: true,
      hasLower: true,
      hasUpper: true,
      hasSpecial: true,
      noSpaces: true
    });
  });

  it('rejects passwords with missing requirements', () => {
    expect(passwordRulesAllMet('short')).toBe(false);
    expect(passwordRulesAllMet('NoDigitsHere@')).toBe(false);
    expect(passwordRulesAllMet('Has digits 123')).toBe(false);
  });

  it('accepts a valid password', () => {
    expect(passwordRulesAllMet('Test1234@')).toBe(true);
  });
});
