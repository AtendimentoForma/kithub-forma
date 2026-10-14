import { z } from "zod";

export const ESTADOS = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo",
  "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba",
  "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul",
  "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
] as const;

const required = (label: string, max: number) => z.string().trim().min(1, `Preencha ${label}.`).max(max, `${label} deve ter até ${max} caracteres.`);

export const enderecoSchema = z.object({
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, "Informe um CEP válido com 8 dígitos."),
  logradouro: required("o endereço", 80),
  numero: required("o número", 20),
  complemento: z.string().trim().max(60, "Complemento deve ter até 60 caracteres."),
  bairro: required("o bairro", 40),
  cidade: required("a cidade", 40),
  estado: z.enum(ESTADOS, { errorMap: () => ({ message: "Selecione um estado válido." }) }),
  pais: required("o país", 40),
  referencia: z.string().trim().max(100, "Ponto de referência deve ter até 100 caracteres."),
});

export type Endereco = z.infer<typeof enderecoSchema>;

export function formatarEndereco(e: Endereco) {
  const cep = e.cep.replace(/\D/g, "");
  return `${e.logradouro}, ${e.numero}${e.complemento ? `, ${e.complemento}` : ""} — ${e.bairro}, ${e.cidade} - ${e.estado}, ${e.pais} — CEP ${cep.slice(0, 5)}-${cep.slice(5)}${e.referencia ? ` — Referência: ${e.referencia}` : ""}`;
}

const UF_PARA_ESTADO: Record<string, (typeof ESTADOS)[number]> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

export function mascararCep(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export type EnderecoCep = { logradouro: string; bairro: string; cidade: string; estado: (typeof ESTADOS)[number] | "" };

/** Consulta o ViaCEP. Retorna null se o CEP não existir; lança erro se a consulta falhar. */
export async function buscarCep(cep: string, signal?: AbortSignal): Promise<EnderecoCep | null> {
  const digitos = cep.replace(/\D/g, "");
  const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, signal ? { signal } : {});
  if (!res.ok) throw new Error("Falha ao consultar o CEP.");
  const d = await res.json();
  if (d.erro) return null;
  return { logradouro: d.logradouro ?? "", bairro: d.bairro ?? "", cidade: d.localidade ?? "", estado: UF_PARA_ESTADO[d.uf] ?? "" };
}
