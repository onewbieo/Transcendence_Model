export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase();
}

export function validateEmail(email: string) {
  if (!EMAIL_RE.test(email))
    return "invalid email format";
  if (email.length > 254)
    return "email too long";
  return null;
}

export function validatePassword(pw: string) {
  if (pw.length < 8)
    return "password must be at least 8 characters";
  if (pw.length > 72)
    return "password must be at most 72 characters";
  return null;
}

