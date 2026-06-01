# Spec-Driven Template Engine — Implementation Plan
_Spaceful · authored 2026-05-30_

---

## Problem with the current approach

Each template is a React `.tsx` file. Adding 100 templates = 100 files + a deployment per template. Admins can't create templates; AI-generated HTML is XSS risk. The system doesn't scale.

---

## Target architecture

**Templates are JSON specs stored in the DB. One trusted React renderer reads the spec and composes from a library of pre-built building blocks.**

```
Template spec (in DB)
  └── SpecRenderer (trusted React component)
        ├── Decoration registry   → BotanicalDecoration, StarfieldDecoration, WaveDecoration …
        └── Section registry      → HeaderSection, GoalsSection, FocusHeroSection, NotepadSection, KanbanSection …
```

Variety comes from the combination of:

| Axis | ~Options | Notes |
|------|----------|-------|
| `decoration.type` | ~20 | botanical, starfield, waves, dunes, petals, constellation, aurora, geometric, forest, rain, smoke, sand-dunes … |
| `layout.sections[]` | ~10 | goals, focus, notepad, kanban, reading-list, habit-tracker, streak, quote, music-taste, photo |
| `decoration.density` | 3 | minimal / medium / lush |
| `cards.style` | 4 | glass, solid, outlined, paper |
| `palette` | ∞ | AI-generated hex values |
| `typography` | 4 | compact / balanced / editorial / display |

**50 decoration variants × section combos × 6 moods = effectively unlimited. No XSS, no extra files, editing stays in React.**

---

## Data model

### New table: `space_templates`

```sql
create table space_templates (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,        -- 'garden-lush', 'cosmos-minimal', etc.
  name         text not null,               -- display name
  description  text,
  spec         jsonb not null,              -- TemplateSpec (see schema below)
  preview_mood text  not null default 'lavender',
  tags         text[] not null default '{}',
  mood_affinity text[] not null default '{}',
  vibe_keywords text[] not null default '{}',
  is_active    bool not null default true,
  is_featured  bool not null default false,
  created_by   uuid references auth.users(id),  -- null = system seed
  created_at   timestamptz not null default now()
);
```

Add migration: `supabase/migrations/002_templates.sql`

### Update `spaces.design_tokens`

Add top-level key:
```json
{
  "template_id": "uuid-or-slug",
  "spec_override": { ... partial spec fields that override the base template ... },
  ...existing palette, mood, layout_variant...
}
```

`spec_override` lets AI generate per-user customisations on top of a base template (e.g. a different decoration density or header style) without duplicating the full spec.

---

## TemplateSpec JSON schema

```typescript
interface TemplateSpec {
  version: 1;

  layout: {
    header_style: 'botanical' | 'cosmic' | 'minimal' | 'editorial' | 'wave' | 'nature' | 'geometric' | 'aurora';
    sections: SectionId[];          // ordered, rendered top-to-bottom
    max_width: 860 | 980 | 1100;
    density: 'spacious' | 'balanced' | 'rich';
  };

  decoration: {
    type: DecorationId;
    density: 'minimal' | 'medium' | 'lush';
    animated: boolean;
    fixed_background: boolean;     // true = fixed; false = scrolls with content
  };

  cards: {
    style: 'glass' | 'solid' | 'outlined' | 'paper';
    radius: 8 | 12 | 16 | 20 | 24;
    shadow: 'none' | 'soft' | 'medium' | 'dramatic';
  };

  typography: {
    title_scale: 'lg' | 'xl' | '2xl' | 'display';
    weight: 700 | 800;
    header_uppercase: boolean;
  };
}

type SectionId =
  | 'goals'           // goal chips with completion toggle
  | 'currently'       // "currently doing X" badge
  | 'focus_hero'      // this week's focus card
  | 'notepad'         // free-text notepad
  | 'kanban'          // weekly goal cards carousel (the Laki's World one)
  | 'reading_list'    // what I'm reading/watching
  | 'habit_tracker'   // streak/habit grid
  | 'streak'          // single streak counter
  | 'quote'           // favourite quote block
  | 'photo'           // one featured photo/image

type DecorationId =
  | 'botanicals'      // animated stems + flowers + wind clouds — like Laki's World
  | 'starfield'       // constellation dots + glowing orbs
  | 'waves'           // animated ocean wave layers
  | 'dunes'           // sand dune horizon + sun orb
  | 'petals'          // floating rose petals
  | 'forest'          // falling leaves + tree silhouettes
  | 'aurora'          // animated northern-lights curtains
  | 'geometric'       // low-poly triangles / Voronoi mesh
  | 'rain'            // light rain particle effect
  | 'smoke'           // soft drifting smoke wisps
  | 'minimal'         // no decoration (whitespace-first)
  | 'clouds'          // puffy clouds drifting slowly
```

---

## File structure

```
src/
  components/space/
    engine/
      SpecRenderer.tsx        ← the single trusted renderer, reads spec + content
      types.ts                ← TemplateSpec, SectionId, DecorationId interfaces
      decorations/
        index.ts              ← DECORATIONS registry: Record<DecorationId, Component>
        Botanicals.tsx        ← migrate from TemplateGarden.GardenHeader (improved)
        Starfield.tsx         ← migrate from TemplateCosmos
        Waves.tsx
        Aurora.tsx
        Geometric.tsx
        Minimal.tsx
        … (one file per decoration type)
      sections/
        index.ts              ← SECTIONS registry: Record<SectionId, Component>
        GoalsSection.tsx
        FocusHeroSection.tsx
        NotepadSection.tsx
        KanbanSection.tsx     ← NEW: weekly scrollable card carousel
        CurrentlySection.tsx
        HabitSection.tsx      ← NEW
        ReadingListSection.tsx ← NEW
        … (one file per section)
      cards.ts                ← card style helpers (glass/solid/outlined/paper)
      typography.ts           ← title scale / weight helpers

  app/
    [username]/
      SpaceView.tsx           ← replace template dispatch with <SpecRenderer>
    admin/
      admin/
        templates/
          page.tsx            ← admin template builder (new page)
          TemplateEditor.tsx  ← spec form + live preview
    api/
      generate/
        route.ts              ← update to produce TemplateSpec JSON
      admin/
        templates/
          route.ts            ← CRUD for space_templates table

supabase/migrations/
  002_templates.sql           ← space_templates table + seed data
```

---

## Build phases

### Phase 1 — Core engine (2–3 hours)
**Goal:** SpecRenderer works, existing templates migrate to specs, SpaceView uses it.

1. Write `engine/types.ts` — `TemplateSpec`, all type unions
2. Write `engine/SpecRenderer.tsx` — reads spec, applies palette vars, maps sections + decoration
3. Create `decorations/index.ts` registry + migrate `Botanicals.tsx` (richer) and `Starfield.tsx`
4. Create `sections/index.ts` registry + migrate `GoalsSection`, `FocusHeroSection`, `NotepadSection`
5. Seed 3 base template specs in code (later move to DB)
6. Update `SpaceView.tsx` to use `<SpecRenderer>` — delete `TemplateGarden/Cosmos/Journal` dispatch
7. Typecheck + build green

### Phase 2 — DB + admin CRUD (2–3 hours)
**Goal:** Templates live in the DB, admin can create/edit them.

1. Write `002_templates.sql` migration — `space_templates` table
2. Seed the 3 migrated templates into the table
3. Admin API route: `GET /api/admin/templates`, `POST`, `PUT`, `DELETE`
4. Admin page `/admin/templates` — list + edit specs with live preview
5. Update `SpecRenderer` to load spec from DB (server component fetches by `template_id`)

### Phase 3 — Richer sections (1–2 hours each)
**Goal:** Match Laki's World quality. Build in priority order:

1. **`KanbanSection`** — horizontally scrollable weekly goal cards (W1–W52), status pills (Planned/In progress/Done), contentEditable titles/notes — this is the biggest visual gap
2. **`HabitSection`** — streak grid (GitHub-style contribution graph), toggleable days
3. **`ReadingListSection`** — book/article cards, "currently reading" highlight
4. **`PhotoSection`** — single featured image with caption

### Phase 4 — More decorations (30–60 min each)
Build in visual impact order:
1. **`Aurora`** — animated northern lights (SVG/CSS gradient curtains), best with midnight mood
2. **`Geometric`** — low-poly triangles covering the background, works for bold/focused
3. **`Clouds`** — fluffy slow-drifting clouds, great for dreamy/cozy
4. **`Rain`** — light rain streaks via canvas, moody/creative feel

### Phase 5 — AI spec generation (1–2 hours)
**Goal:** Claude generates a TemplateSpec, not just palette tokens.

Update `src/app/api/generate/route.ts`:
- Extend `TokenSchema` → `SpecSchema` (includes `layout`, `decoration`, `cards`, `typography`)
- Prompt includes full spec shape and explains each field
- Validation remains: Zod parse → retry ×2 → fallback to default spec for that mood

Example AI output:
```json
{
  "mood": "forest",
  "layout": { "header_style": "nature", "sections": ["goals","currently","focus_hero","notepad","kanban"], "density": "rich" },
  "decoration": { "type": "forest", "density": "lush", "animated": true, "fixed_background": true },
  "cards": { "style": "glass", "radius": 20, "shadow": "soft" },
  "typography": { "title_scale": "xl", "weight": 800, "header_uppercase": false },
  "palette": { ... }
}
```

### Phase 6 — User template catalog (1 hour)
Add a template picker in onboarding Step 5 (currently just "Spacious / Rich"):
- Show a 2×3 grid of `<MiniSpec>` thumbnails — one per featured template
- User picks a base; AI customises the spec on top of it (spec_override)
- "Let AI surprise me" option → full AI spec generation

---

## Key design decisions

### Editing stays in React
Every section component receives `content`, `isOwner`, `mode`, and `onUpdate(patch)`. The section reads from `content_json` and writes back via `onUpdate`. The template spec only controls *what* sections appear and *how* they look — not the edit mechanism. This is the safety boundary between spec (data) and behaviour (code).

### Spec overrides, not forks
User-specific customisations live in `spaces.design_tokens.spec_override` — a partial spec that deep-merges over the base template's spec at render time. This means fixing a bug in a base template fixes it for all users who built on it.

### No arbitrary HTML or JS in specs
Spec fields are validated enums + numbers. `DecorationId` and `SectionId` are whitelisted. There is no `html` or `script` field. Claude outputs enum values, not markup. XSS surface is zero.

### Template versioning
`space_templates` has `created_at` but no version column yet. Add `version int` in Phase 2 if needed — spaces store `template_id + spec_version` so a template update doesn't break existing spaces.

---

## Success criteria

- [ ] Admin can create a new template by filling in a spec form — no code change, no deployment
- [ ] Claude generates a unique spec per user → their space looks different from everyone else's
- [ ] 20+ decoration + section combinations available (effectively unlimited visual variety)
- [ ] Adding a new section or decoration type = 1 component file + 1 registry entry
- [ ] All editing (contentEditable, goal toggles, autosave) works identically on every template
- [ ] Zero XSS: no spec field accepts arbitrary HTML or JS
