# Verificação da busca Delivery

- A busca está habilitada nos dois perfis (SAC e Lojinha); o servidor exige perfil aprovado de SAC/Lojinha/admin com permissão "chamados" ou "reenvios".
- No site publicado, `AbortSignal.any` não existe no runtime e derrubava toda busca com "Delivery indisponível" (log com status null, duração 0); a chamada usa apenas `AbortSignal.timeout(10000)`.
- Consultas reais no SAC da conta solicitante: IDs 365177 e 365178 preenchidos, campos manuais preservados, CPF com 11 dígitos e endereço separado.
- ID 999999999999: o Delivery respondeu HTTP 200 com pedido ausente; KitHub devolveu NOT_FOUND / HTTP 404.
- Sem sessão: HTTP 401. ID inválido autenticado: HTTP 400. Resultados e erros com Cache-Control: no-store.
- Nenhuma chamada do navegador ao host Delivery; logs do servidor limitados a identificador do pedido/usuário, HTTP e duração.
- A busca dispara só ao clicar na lupa ou ao pressionar Enter no campo (Enter não envia o chamado). Digitar não faz nenhuma chamada. Botão desabilitado com campo vazio, com texto que não é só número ou com busca em andamento (spinner no botão). Falha de rede simulada: aviso, campos continuam editáveis. Apagar ID preserva valores; editar remove selo.
- 39 testes de transformação passaram, além de 17 testes existentes de reversos/correções.
- Timeout real do serviço não foi forçado. A chamada usa AbortSignal.timeout(10000), sem retry automático.
- Limite por usuário sugerido no documento não implementado: não há mecanismo padrão; solução ad-hoc exige confirmação da limitação técnica.
- Publicação não realizada; alterações e novos segredos precisam ser publicados para atualizar o site publicado.