/** E-mail normalizado: sem espaços nas pontas, em NFC, em minúsculas (CA-15). */
export function normalizarEmail(email: string): string {
  return email.trim().normalize("NFC").toLowerCase();
}

/** E-mail mascarado para mostrar a quem tem o token: `p***@exemplo.com.br`. */
export function mascararEmail(email: string): string {
  const arroba = email.indexOf("@");
  if (arroba < 1) return "***";
  return `${email[0]}***${email.slice(arroba)}`;
}
