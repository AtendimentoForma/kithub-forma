import { describe, it, expect } from "vitest";
import { statusReversoSchema } from "./reversos-schema";
describe("status Finalizado do reverso", () => {
  it("exige descrição", () => expect(statusReversoSchema.safeParse({ numero: 1, status: "FINALIZADO", finalizacao: " " }).success).toBe(false));
  it("aceita com descrição", () => expect(statusReversoSchema.safeParse({ numero: 1, status: "FINALIZADO", finalizacao: "Kit trocado" }).success).toBe(true));
});
