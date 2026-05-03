/** Mirrors backend `TraderCreateRequest` / `LoginRequest` password rules (no spaces, charset, length). */

export type PasswordRuleStatus = {
  minLength: boolean;
  hasDigit: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasSpecial: boolean;
  noSpaces: boolean;
};

export function evaluatePasswordRules(password: string): PasswordRuleStatus {
  return {
    minLength: password.length >= 8,
    hasDigit: /[0-9]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasSpecial: /[@#$%^&+=]/.test(password),
    noSpaces: password.length > 0 && !/\s/.test(password)
  };
}

export function passwordRulesAllMet(password: string): boolean {
  const rules = evaluatePasswordRules(password);
  return Object.values(rules).every(Boolean);
}
