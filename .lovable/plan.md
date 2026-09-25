# Login vinculado ao perfil (Lojinha ou SAC)

## Como vai funcionar
1. A tela inicial mostra só os dois cartões, **Lojinha** e **SAC**, que passam a ser clicáveis. O botão "Entrar" solto sai da tela.
2. Quando a pessoa clica em um cartão, abre a tela de login desse perfil, com o nome e o ícone dele no topo (ex.: "Entrar como Lojinha"). Nela há e-mail, senha e um link "Trocar perfil" para voltar.
3. Ao entrar, o sistema confere se a conta pertence ao perfil escolhido:
   - Se pertencer, abre o painel desse perfil.
   - Se não pertencer, a pessoa sai da conta e vê a mensagem "Este acesso não pertence ao perfil Lojinha/SAC".
4. O cadastro, feito pelo link "Cadastre-se" nessa mesma tela, já cria a conta no perfil escolhido. Com isso, a escolha de perfil dentro do formulário deixa de existir.
5. Se alguém abrir a tela de login sem escolher um perfil, volta para a tela inicial.

## Detalhes técnicos
- `index.tsx`: os cartões viram `Link` para `/auth?perfil=lojinha|sac`, e o botão "Entrar" é removido.
- `auth.tsx`: `validateSearch` recebe `perfil`. Sem perfil, redireciona para `/`. Após `signInWithPassword`, compara `getMyRole()` com o perfil. Se for diferente, faz `signOut` e mostra o erro. O cadastro envia `data.perfil` a partir do parâmetro. O `emailRedirectTo` inclui o perfil.
- Não há mudanças no banco de dados.
