# Modernização visual completa do KitHub

## Objetivo
Aplicar uma identidade visual única baseada na referência enviada, preservando integralmente dados, permissões, campos, validações, status, fluxos e navegação.

## Componentes compartilhados identificados
- `Shell`: estrutura interna, navegação, retorno, identificação do perfil e saída.
- `ChamadosRecentes`: pesquisa, ordenação, alertas de leitura e abertura dos detalhes.
- `NovoChamadoForm`: formulário compartilhado entre Lojinha e SAC.
- `ChamadoDetalhe` e `FluxoChamado`: consulta, histórico e ações do chamado.
- Componentes de interface existentes: botões, campos, badges, tabelas, menu lateral, menu suspenso, modal e alternância.

## Implementação
1. **Design System KitHub**
   - Definir tokens semânticos claros e escuros com amarelo `#FFC400/#FFD000`, grafite, branco, cinza muito claro e cinza azulado.
   - Aplicar Inter, foco amarelo, raios de 8–14 px, sombras discretas e transições suaves.
   - Criar componentes reutilizáveis para marca, alternância de tema, títulos, indicadores, estados vazios e superfícies.

2. **Tema persistente**
   - Adicionar alternância claro/escuro no topo da seleção, login e área autenticada.
   - Persistir a escolha no navegador e aplicá-la antes da renderização para evitar mudança visual durante o carregamento.

3. **Seleção de perfil e login**
   - Reproduzir o conceito da referência: marca com caixa, subtítulo exato “Gestão de Controle”, cartões Lojinha/SAC com ícones circulares e botões amarelos.
   - Adicionar detalhes gráficos amarelos discretos sem usar a imagem como conteúdo.
   - Levar a mesma identidade ao formulário de acesso e cadastro.

4. **Estrutura interna**
   - Transformar o `Shell` em menu lateral recolhível no desktop e drawer no celular.
   - Incluir Início, Lojinha e SAC respeitando acessos existentes; manter Usuários apenas para administrador.
   - Criar cabeçalho com notificações, avatar amarelo, nome/perfil e menu do usuário, preservando saída e navegação atuais.

5. **Dashboards, chamados e administração**
   - Redesenhar indicadores, pesquisa, tabelas, filtros, badges e estados vazios com o novo padrão.
   - Manter todos os status, contagens, alertas, ordenações, marcações de não lido e restrições atuais.
   - Garantir tabelas roláveis e legíveis em telas pequenas.

6. **Formulário e detalhes**
   - Reorganizar visualmente as seções existentes do novo chamado, sem remover ou alterar campos e validações.
   - Redesenhar o detalhe como modal acessível, com informações agrupadas e histórico em timeline vertical.
   - Manter integralmente ações de pagamento, reenvio, despacho e movimentação.

7. **Validação**
   - Conferir seleção de perfil, login, dashboards, filtros, novo chamado, listagens, detalhes e administração.
   - Validar modo claro/escuro, persistência, desktop e celular, além de erros de compilação e execução.

## Direção visual bloqueada
- Paleta e proporções seguem a imagem enviada.
- Fonte: Inter.
- Amarelo apenas em ações, seleção, ícones, bordas de destaque e indicadores.
- Sem gradientes excessivos, sombras pesadas ou mudanças funcionais.
