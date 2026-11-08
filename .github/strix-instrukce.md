<!-- Pokyny pro bezpečnostní test Strix. Používá je .github/workflows/strix.yml. Psáno anglicky, protože je čte AI. -->
# Scope

- Target: "Aero pozice", a static PWA (vanilla JavaScript, no build step) hosted on GitHub Pages at https://zkovacevicfilip-del.github.io/test/, and its source code in this repository.
- Backend: one Supabase project, https://mtkxpqvrlvwicnnraevw.supabase.co. The publishable key in `share.js` is public by design. The `anon` role may only INSERT into `public.submissions` and call the RPC functions `get_my_data(p_device uuid)` and `delete_my_data(p_device uuid)`. The database rules (RLS, grants, trigger with content checks and rate limits) are in `supabase/schema.sql`. Verify that these rules really hold.
- Out of scope: the infrastructure of GitHub, Supabase and Google; denial of service; social engineering.

# Rules for live testing (only when the live URL is one of the targets)

- No load tests and no brute force. At most 30 requests per minute to Supabase.
- Every write to Supabase must use the device_id `00000000-0000-4000-8000-0000000000aa`, at most 20 inserts in total.
- Test that SELECT, UPDATE and DELETE are denied only with the filter `device_id=eq.00000000-0000-4000-8000-0000000000aa`. Never send them without a filter or with a filter that could match other rows.
- Call `delete_my_data` only with `00000000-0000-4000-8000-0000000000aa`. When you finish, call it once more with that ID to remove your test rows.
- Do not sign up or log in to Supabase Auth.

# Focus

- DOM XSS: `innerHTML` sinks, backup import in `history.js`, FIT file parsing in `aero.js`, file names shown in the UI.
- Content Security Policy (meta tags in `index.html` and the legal pages) and clickjacking protection (`boot.js`, `legal.js`).
- Data stored in `localStorage`, data sent without consent, free text reaching the database.
- Supply chain: `vendor/mediapipe`, the segmentation model loaded from storage.googleapis.com with a SHA-256 integrity check.
- Supabase: RLS, RPC functions, bypassing the rate limits and the content checks.
- The GitHub Actions workflows in `.github/workflows`.
- GitHub Pages cannot set HTTP response headers (X-Frame-Options, frame-ancestors, Permissions-Policy). Report missing headers only as informational.

# Report

Write the final report and every finding in Czech, in plain and short language. For every finding give the severity, the file and line, how to reproduce it, and a concrete fix.
