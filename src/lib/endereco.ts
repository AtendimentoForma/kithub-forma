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