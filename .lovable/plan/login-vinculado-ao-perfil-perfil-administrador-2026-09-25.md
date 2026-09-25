# Login vinculado ao perfil + perfil Administrador

## Tela inicial e login por perfil
1. A tela inicial mantém **dois cartões clicáveis: Lojinha e SAC**. O botão "Entrar" solto sai da tela.
2. Ao clicar em um cartão, abre a tela de login desse perfil, com o nome e o ícone dele no topo (ex.: "Entrar como Lojinha"), com e-mail, senha e um link "Trocar perfil" para voltar.
3. Ao entrar, o sistema confere o perfil da conta:
   - Conta do perfil escolhido → abre o painel desse perfil.
   - Conta de outro perfil → sai da conta e mostra "Este acesso não pertence ao perfil escolhido".
   - **Conta de Administrador → entra por qualquer um dos dois cartões.**
4. O cadastro (link "Cadastre-se") cria a conta no perfil escolhido; a escolha de perfil dentro do formulário deixa de existir. **O cadastro só oferece Lojinha e SAC — ninguém se cadastra como Administrador.**
5. Se alguém abrir a tela de login sem escolher um perfil, volta para a tela inicial.

## Perfil Administrador
- A conta **julia.sales@formaturismo.com.br** (já cadastrada) recebe o perfil Administrador.
- O Administrador acessa os dois painéis (Lojinha e SAC): vê todos os chamados, abre novos, registra movimentações e muda status nos dois ambientes.
- No menu dos dois painéis aparece um atalho para alternar entre "Lojinha" e "SAC" (visível só para o Administrador).
- As movimentações feitas pelo Administrador aparecem no histórico do chamado com a identificação "Admin".

## Detalhes técnicos
- Banco: novo valor `admin` no enum `app_role`; as regras de acesso (RLS) de `chamados` e `chamado_movimentacoes` passam a incluir o admin; o gatilho de movimentação marca o autor como "Admin"; a conta de Julia recebe o papel `admin` (via run_sql, mantendo o papel atual dela).
- `index.tsx`: os dois cartões viram `Link` para `/auth?perfil=lojinha|sac`; o botão "Entrar" é removido.
- `auth.tsx`: `validateSearch` recebe `perfil`; sem perfil, redireciona para `/`. Após `signInWithPassword`, compara o perfil da conta com o escolhido; admin passa em ambos; se diferente, faz `signOut` e mostra erro. O cadastro envia `data.perfil` a partir do parâmetro; o `emailRedirectTo` inclui o perfil.
- Rotas `/lojinha` e `/sac`: aceitam também o perfil admin. `Shell` mostra o atalho de alternância entre os painéis quando o usuário é admin.
- `getMyRole()` passa a retornar também "admin".
