# Spaceful — Product Overview

## What is Spaceful?

Spaceful is a personal AI space builder. Users answer five questions and Claude generates a unique, animated personal page — their "space" — that reflects their personality, current goals, and aesthetic preferences.

A space is a living dashboard: it shows what the owner is working toward, what they're focused on this week, what they're reading, and what their current habits look like. It's half personal homepage, half weekly intention tracker.

Every space is accessible at `spaceful.io/:username`. The owner can edit it directly in the browser (click-to-edit, no forms), and visitors can leave a short reaction.

---

## The Five Questions

During onboarding, users answer:

1. **Name** — what to call the space (e.g. "Laki's World")
2. **Vibes** — up to 3 words from a curated list (calm, creative, focused, cozy, bold, playful, minimal, dreamy, grounded, energetic)
3. **Big goal** — their current most important goal, optional
4. **Colour mood** — one of six palettes (lavender, sand, forest, ocean, rose, midnight), with a live preview
5. **World** — a choice of base template (Garden, Cosmos, Ocean, Sky, Journal, Laki's World) or "Let AI surprise me"

Claude Haiku then generates a full design spec: layout, decoration type and density, card style, typography, colour palette, and personalised copy — all tailored to that specific combination of inputs.

---

## What a Space Contains

A space is made of **sections**, chosen by the AI and editable by the owner:

| Section | Purpose |
|---|---|
| Header | Name, tagline, monogram, goal completion % |
| Goals | Chip-style goal cards with done/undone toggle |
| Currently | A single "currently doing X" status badge |
| Focus hero | This week's focus card with title and notes |
| Notepad | Free-text area with free / checklist / bullets tabs |
| Kanban | Week-by-week card carousel (W1–W52), status pills |
| Habit tracker | 7-day contribution-graph grid per habit |
| Reading list | Book/article cards with reading → queued → done cycling |
| Quote | A featured quote with attribution |
| Photo | A featured image with caption |
| Streak | A focused-days counter |

The AI picks 4–7 sections based on the user's layout preference and vibes.

---

## Decoration System

Spaces have animated decorations rendered behind the content:

| ID | Visual |
|---|---|
| `botanicals` | Swaying stems, petals drifting in the wind |
| `starfield` | Twinkling constellation dots, star lines |
| `waves` | Animated ocean wave layers with swimming fish |
| `dunes` | SVG sand ridges, blurred sun orb, drifting particles |
| `aurora` | Blurred northern-light gradient curtains |
| `geometric` | Low-poly triangle mesh |
| `clouds` | Drifting cloud SVGs with birds |
| `rain` | Diagonal rain streaks with puddle ripples |
| `minimal` | No decoration — whitespace-first |
| `forest` / `petals` / `smoke` | Aliases to botanical / aurora variants |

---

## Credits

Every action on Spaceful costs credits. Credits are a `numeric(6,2)` value — fractional costs exist.

| Action | Cost |
|---|---|
| Generate a new space | 3 credits |
| Regenerate theme | 2 credits |
| AI journaling prompt | 0.25 credits |
| OG image regeneration | 0.5 credits |

New accounts receive 3 credits on signup (enough for one space). Credits are purchased via Stripe or granted via subscription renewal.

---

## Gallery

Spaces can be submitted to the public gallery by their owners. Gallery submission goes through a moderation queue. Approved spaces appear at `/gallery`, filterable by mood tag. The gallery doubles as the landing page hero.

---

## Vision

Spaceful is built on the premise that your corner of the internet should feel like *you* — not like a generic profile page or a productivity tool with a dashboard you didn't design.

The long-term vision:
- **AI as interior designer, not content author.** Claude designs the space; the owner fills it with their real life. The AI never writes their goals or journal — it sets the atmosphere.
- **A living record.** The kanban and habit tracker are intended to be updated weekly. The space evolves with the owner over time.
- **Beautiful by default.** Every combination of mood + template + AI customisation should look like something the owner would be proud to share. Visual quality is a non-negotiable constraint.
- **Small and personal, not social.** Spaceful is not a social network. There are no follows, feeds, or engagement metrics. The gallery exists to inspire, not to compete.
