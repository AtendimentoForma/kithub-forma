<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Notifications of new ticket movements use per-user `chamado_leituras` records, not shared role flags, so opening a ticket only clears the current user's alert across devices.

Email signups are auto-confirmed; `profiles.aprovado`, role, and permissions assigned by an administrator are the access gate, so users do not depend on confirmation email delivery.
