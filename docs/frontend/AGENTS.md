# Agent Operating Guardrails (MetaChrome)

- Always use the **personal GitHub account**: `IgorGanapolsky` with the personal PAT provided. Do **not** use the Subway org/`ganapolsky_i-subway` account.
- Default remote: `https://github.com/IgorGanapolsky/MetaChrome.git`. Ensure pushes/PRs target this origin.
- Git identity in this repo: `user.name=Igor Ganapolsky`, `user.email=iganapolsky@gmail.com` (already set).
- Branch protection: open PRs, get review, then merge; avoid force-push to `main`.
- Secrets: keep LANGSMITH and GCP keys in `.env` (never commit). RAG/LLM tooling should read from env only.
- Source of truth for docs: `README.md`; any .md additions belong under `docs/` and must be linked from README.

Action on startup:
1) Verify `git remote -v` points to personal origin.
2) Verify `git config user.name/user.email` match personal identity.
3) Use personal PAT for pushes/PRs.
