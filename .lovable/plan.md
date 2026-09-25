# Login vinculado ao perfil (Lojinha, SAC ou Administrador)

## Como vai funcionar
1. A tela inicial mostra três cartões clicáveis: **Lojinha**, **SAC** e **Administrador**. O botão "Entrar" solto sai da tela.
2. Quando a pessoa clica em um cartão, abre a tela de login desse perfil, com o nome e o ícone dele no topo (ex.: "Entrar como Lojinha"). Nela há e-mail, senha e um link "Trocar perfil" para voltar.
3. Ao entrar, o sistema confere se a conta pertence ao perfil escolhido:
   - Se pertencer, abre o painel desse perfil (o Administrador entra no painel da Lojinha).
   - Se não pertencer, a pessoa sai da conta e vê a mensagem "Este acesso não pertence ao perfil escolhido".
4. O cadastro, feito pelo link "Cadastre-se" nessa mesma tela, já cria a conta no perfil escolhido. Com isso, a escolha de perfil dentro do formulário deixa de existir.
5. Se alguém abrir a tela de login sem escolher um perfil, volta para a tela inicial.

## Perfil Administrador
- O Administrador tem acesso aos dois painéis: pode abrir, acompanhar e movimentar chamados tanto na área da Lojinha quanto na do SAC (inclusive mudar status).
- As movimentações feitas pelo Administrador aparecem no histórico do chamado com a identificação "Admin".
- Observação: qualquer pessoa poderá se cadastrar como Administrador. Se preferir, deixo o Administrador fora do cadastro e libero esse perfil manualmente — me avise.

## Detalhes técnicos
- Banco: novo valor `admin` no enum `app_role`; as regras de acesso (RLS) de `chamados` e `chamado_movimentacoes` passam a incluir o admin; o gatilho de movimentação marca o autor como "Admin".
- `index.tsx`: três cartões viram `Link` para `/auth?perfil=lojinha|sac|admin`; o botão "Entrar" é removido.
- `auth.tsx`: `validateSearch` recebe `perfil`; sem perfil, redireciona para `/`. Após `signInWithPassword`, compara o perfil da conta com o escolhido; se diferente, faz `signOut` e mostra erro. O cadastro envia `data.perfil` a partir do parâmetro; o `emailRedirectTo` inclui o perfil.
- Rotas `/lojinha` e `/sac`: aceitam também o perfil admin. Em `/lojinha`, o formulário de novo chamado fica disponível para o admin.
