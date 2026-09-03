# Feature Fit Filter - HookLab.AI

## Passes (fits the hook-specialist product)
- Hook history / saved favorites
- Export variants (CSV, script notes, image export)
- Platform-specific hook tuning (TikTok/Reels/Shorts/etc.)
- Score explanations and breakdowns
- Before/after hook comparisons
- Template library / example scripts

## Fails (dilutes the core product, belongs to a different tool)
- Generic caption generator
- Full social media scheduler
- AI thumbnail generator
- Full ChatGPT-style scriptwriter as the CORE product
  (a downstream "expand this hook into a script outline"
  feature is fine - see Phase 3 roadmap - but a general
  scriptwriter as the main offering competes directly with
  ChatGPT/Jasper and dilutes the hook-specialist positioning)

Use this filter before adding any new feature request to the roadmap.

## Architecture Decision — Soft Auth (Non-Blocking)
- **Zero Gating**: The app remains 100% functional without an account (generate, roast, compare all work without login).
- **Value Proposition**: "Sign in to save your hook history across all your devices."
- **Providers**: Google OAuth, Magic Link (hero friction-free option), and Email/Password fallback via Supabase.
