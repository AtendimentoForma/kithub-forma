import { describe, expect, it } from "vitest";
import * as deliveryMapping from "./delivery-mapping";
import { DELIVERY_TIMEOUT_MS, DESTINO_DELIVERY_PARA_KITHUB, erroHttpDelivery, mapearPedidoDelivery, validarIdDelivery } from "./delivery-mapping";

const pedido = {
  id: 365177, idPax: 1074447, nomeDestinatario: " PAX TESTE ", nomeNotaFiscal: " RESPONSAVEL TESTE ",
  cpfNotaFiscal: 5405088617, cep: 1310100, logradouro: "RUA TESTE", numero: "339", bairro: "CENTRO", cidade: "CIDADE", uf: " mg ",
  produtosPedidoEntrega: [{ brinde: { destinoId: 55 } }],
};
describe("Delivery: contrato e transformação", () => {
  it("aceita somente strings de 1 a 12 dígitos", () => {
    for (const id of ["1", "365177", "123456789012"]) expect(validarIdDelivery(id)).toBe(true);
    for (const id of ["", "abc", "12 34", "1234567890123", "../1", 1, null]) expect(validarIdDelivery(id)).toBe(false);
  });
  it("restaura CPF e CEP com zero à esquerda", () => {
    const r = mapearPedidoDelivery(pedido);
    expect(r.campos.cpf).toBe("05405088617"); expect(r.campos.endereco?.cep).toBe("01310100");
  });
  it("converte estado e destino e preserva nomes em maiúsculas", () => {
    const r = mapearPedidoDelivery(pedido);
    expect(r.campos.endereco?.estado).toBe("Minas Gerais"); expect(r.campos.destino).toBe("Porto Seguro"); expect(r.campos.paxNome).toBe("PAX TESTE");
  });
  it.each(Object.entries(DESTINO_DELIVERY_PARA_KITHUB))("mapeia exclusivamente o destino %s", (id, nome) => {
    expect(mapearPedidoDelivery({ ...pedido, produtosPedidoEntrega: [{ brinde: { destinoId: Number(id) } }] }).campos.destino).toBe(nome);
  });
  it("destino 114 não preenche e apresenta ID original", () => {
    const r = mapearPedidoDelivery({ ...pedido, produtosPedidoEntrega: [{ brinde: { destinoId: 114 } }] });
    expect(r.campos.destino).toBeUndefined(); expect(r.avisos).toContainEqual(expect.objectContaining({ codigo: "DESTINO_NAO_MAPEADO", valorOriginal: 114 }));
  });
  it("destinos diferentes não preenchem; múltiplos Forfun são um destino", () => {
    const itens = (ids: number[]) => ids.map(destinoId => ({ brinde: { destinoId } }));
    const r = mapearPedidoDelivery({ ...pedido, produtosPedidoEntrega: itens([54, 55]) });
    expect(r.campos.destino).toBeUndefined(); expect(r.avisos.some(a => a.codigo === "DESTINO_MULTIPLO")).toBe(true);
    expect(mapearPedidoDelivery({ ...pedido, produtosPedidoEntrega: itens([124, 153, 156, 163]) }).campos.destino).toBe("Forfun");
  });
  it("um destino desconhecido não é ignorado entre os conhecidos", () => {
    const r = mapearPedidoDelivery({ ...pedido, produtosPedidoEntrega: [{ brinde: { destinoId: 55 } }, { brinde: { destinoId: 114 } }] });
    expect(r.campos.destino).toBeUndefined();
  });
  it.each([["nomeDestinatario", "paxNome", 255], ["nomeNotaFiscal", "responsavel", 255], ["logradouro", "logradouro", 80], ["numero", "numero", 20], ["complemento", "complemento", 60], ["bairro", "bairro", 40], ["cidade", "cidade", 40]] as const)("não trunca %s", (origem, campo, max) => {
    const r = mapearPedidoDelivery({ ...pedido, [origem]: "X".repeat(max + 1) });
    expect({ ...r.campos, ...r.campos.endereco }[campo]).toBeUndefined();
    expect(r.avisos).toContainEqual(expect.objectContaining({ campo, codigo: "COMPRIMENTO_EXCEDIDO" }));
  });
  it("campos ausentes não são inventados e responsável não tem fallback", () => {
    const r = mapearPedidoDelivery({ ...pedido, cpfNotaFiscal: null, nomeNotaFiscal: null, complemento: null });
    expect(r.campos.cpf).toBeUndefined(); expect(r.campos.responsavel).toBeUndefined();
    expect(r.avisos.some(a => a.campo === "complemento")).toBe(false);
  });
  it("retirada sem endereço não sugere envio original", () => {
    const r = mapearPedidoDelivery({ nomeDestinatario: "PAX" });
    expect(r.campos.endereco).toBeUndefined(); expect(r.sugestoes.tipoEnvio).toBeUndefined();
  });
  it("endereço incompleto não é preenchido", () => {
    const r = mapearPedidoDelivery({ ...pedido, numero: null });
    expect(r.campos.endereco).toBeUndefined(); expect(r.sugestoes.tipoEnvio).toBeUndefined();
  });
  it("whitelist não inclui dados pessoais extras ou campos manuais", () => {
    const r = mapearPedidoDelivery({ ...pedido, email: "omitido", telefone: "omitido", ano: "2026", pais: "outro", observacao: "DICA", urlRastreio: "javascript:alert(1)", dataTransmissao: "2026-10-24T15:42:14.000Z" });
    expect(Object.keys(r.campos).sort()).toEqual(["paxNome", "responsavel", "cpf", "paxId", "idDelivery", "destino", "endereco"].sort());
    expect(r.campos.endereco).not.toHaveProperty("pais"); expect(r.sugestoes.observacaoDelivery).toBe("DICA");
    expect(r.campos).not.toHaveProperty("observacao"); expect(r.sugestoes.urlRastreio).toBeUndefined();
  });
  it("classifica falhas sem propagar detalhes", () => {
    expect(erroHttpDelivery(401).codigo).toBe("DELIVERY_AUTH"); expect(erroHttpDelivery(403).codigo).toBe("DELIVERY_AUTH");
    expect(erroHttpDelivery(404).codigo).toBe("NOT_FOUND"); expect(erroHttpDelivery(422).codigo).toBe("NOT_FOUND"); expect(erroHttpDelivery(500).codigo).toBe("DELIVERY_UNAVAILABLE");
  });
  it("mantém timeout 10s e não possui busca automática", () => { expect(DELIVERY_TIMEOUT_MS).toBe(10000); expect(deliveryMapping).not.toHaveProperty("DELIVERY_DEBOUNCE_MS"); });
});