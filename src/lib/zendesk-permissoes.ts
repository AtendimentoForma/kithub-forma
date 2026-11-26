/** Roles must come from user_roles for the authenticated user, never request data. */
export function perfilPrincipal(papeis: readonly string[]): "admin" | "sac" | "lojinha" | null {
  if (papeis.includes("admin")) return "admin";
  if (papeis.includes("sac")) return "sac";
  return papeis.includes("lojinha") ? "lojinha" : null;
}

export function podeEnviarEmailZendesk(papeis: readonly string[] | null | undefined): boolean {
  return papeis?.some((papel) => papel === "sac" || papel === "admin") ?? false;
}

export function opcaoEmailZendesk(papeis: readonly string[] | null | undefined, enviar: boolean, texto: string | null | undefined) {
  if (!podeEnviarEmailZendesk(papeis) || !enviar) return { enviarEmail: false, emailTexto: null };
  if (!texto?.trim()) throw new Error("Escreva a mensagem do e-mail.");
  return { enviarEmail: true, emailTexto: texto.trim() };
}