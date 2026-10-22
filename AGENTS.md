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

New ticket submissions go through an authenticated server function with shared address validation and persist the formatted address in the existing text column, preserving legacy ticket display without a schema migration.

All authenticated screens share the KitHub shell and semantic design tokens so navigation, theme, and responsive behavior stay consistent without changing business flows.

Reverse shipments use a separate RLS-protected public.reversos table and profile-specific routes; authenticated server functions share validation with the form, while actual attachment files live in private storage and are verified before insertion, keeping existing ticket workflows unchanged.

Ticket attachment bytes use private storage with metadata in anexos_arquivos; the legacy anexos filename column stays readable because historical tickets never stored attachment bytes. Authenticated functions verify record membership before signing URLs, and tickets and reverse shipments share the internal attachment viewer.

Reverse shipment status changes use an authenticated RPC with server-side role and permission checks, not direct table update grants, to prevent unrelated field edits.
