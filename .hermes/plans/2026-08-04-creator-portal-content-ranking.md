# Creator Portal Content Ranking Fix Implementation Plan

> **For Hermes:** Implement this plan task-by-task in the isolated worktree.

**Goal:** Make the private Club Dosmicos creator portal display the new ranking by classified content instead of the legacy commission ranking.

**Architecture:** Reuse the already-deployed `get_ugc_public_content_ranking` hook and `RankingSection` content metric. Preserve financial cards, but calculate rank from eligible content and show the creator’s classified-piece count.

**Tech Stack:** React, TypeScript, Supabase RPC, Vite.

---

- [x] Switch `CreatorPortalPage` from `rankingByCommission` to `rankingByContent`.
- [x] Derive the creator’s server rank and eligible-content count by normalized handle.
- [x] Update ranking card/title/copy to content terminology while preserving balances and commissions.
- [x] Run TypeScript, scoped ESLint, build, and diff checks.
- [x] Commit, push, and open a PR.
