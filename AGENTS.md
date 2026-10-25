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

- Admin profile data lives in profiles; authorization lives in user_roles and service-managed admin_access, never in editable profile data.
- Admin invitation server functions verify the caller's role and owner access through the authenticated client before loading the privileged client.
- One shared AuthProvider tracks identity with getUser and clears user-scoped admin queries on sign-out to avoid stale privileges.
- Public /admin is the sign-in entry and gates editing inline; database RLS enforces every content mutation.
- Club media is stored as stable bucket-path references and resolved to temporary URLs for display; public detail dialogs share one accessible presentation component.
