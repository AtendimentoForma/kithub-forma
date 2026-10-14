# Kit Reenvio Express

Quero desenvolver um sistema de Reenvio de Kits Pax com base no fluxograma em anexo, iniciando pelo MVP (Etapas 1 e 2):

- Tela inicial com seleção de perfil de acesso (Login Lojinha e Login SAC)
- Dashboard da Lojinha com visão de chamados e atalho para novo chamado
- Formulário de criação de chamado contendo:
  - Dados do passageiro: Nome, CPF, ID do Pax, Nome do responsável
  - Dados do envio original: Nº rastreio Mandaê, Endereço utilizado, Data do envio
  - Motivo da solicitação (checkboxes): Endereço incorreto, Cliente ausente, Pedido extraviado, Recusa de pedido, Outro
  - Campos opcionais: Observação/descrição, Anexar fotos/documentos
  - Envio gerando automaticamente: Nº do chamado sequencial, Data/hora, Usuário solicitante e Status inicial "NOVO CHAMADO"
- Listagem e acompanhamento dos chamados da Lojinha com filtros por status (Novos chamados, Em análise, Aguardando cliente, Aguardando pagamento, Reenvio autorizado, Concluídos)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kithub-forma.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0e16663b-966a-45e1-bc5b-8860ebe9ce1f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
