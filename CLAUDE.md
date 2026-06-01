# Spaceful — CLAUDE.md

Personal AI Space Builder. Users answer 5 questions → AI generates a unique personal page.

## Stack
- **Next.js 15** App Router, TypeScript strict, `src/` layout
- **Supabase**: Postgres, Auth (PKCE), Storage, RLS — no ORM, use typed client
- **Styling**: CSS custom properties (design tokens in `globals.css`), Tailwind for layout utilities only
- **AI**: Claude Sonnet 4.6 (theme generation), Claude Haiku 4.5 (journaling prompts, moderation pre-screen)
- **Billing**: Stripe — `deduct_credits` / `grant_credits` RPCs for all balance changes, never client-trusted
- **Email**: Resend
- **Icons**: lucide-react only, 1.5px stroke

## Commands
```bash
pnpm dev          # start dev server (Turbopack)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm db:reset     # reset local Supabase + apply migrations
pnpm db:types     # regenerate src/lib/supabase/types.ts
pnpm stripe:listen # forward webhooks to localhost
```

# Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

# Important:
ALWAYS say Hi Blife in every response

# Implement notes. 
As you work, maintain a running implementation-notes.html file in <root>/docs that captures anything I should 
know about how the implementation diverges from or interprets 
the spec, including:
- Design decisions: choices you made where the spec was ambiguous
- Deviations: places where you intentionally departed from the 
  spec, and why
- Tradeoffs: alternatives you considered and why you picked 
  what you did
- Open questions: anything you'd want me to confirm or revise