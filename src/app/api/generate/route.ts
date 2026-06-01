import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { languagePrompt } from '@/lib/languages';
import { z } from 'zod';
import { SPACE_PALETTES, type SpaceMood } from '@/lib/utils';
import { pickTemplate } from '@/components/space/engine/templateCatalog';
import { DECORATION_IDS, SECTION_IDS } from '@/components/space/engine/types';

const InputSchema = z.object({
  name:        z.string().min(1).max(60),
  vibes:       z.array(z.string()).max(3),
  goal:        z.string().max(120),
  mood:        z.enum(['lavender','sand','forest','ocean','rose','midnight']),
  layout:      z.enum(['spacious','rich']),
  template_id: z.string().optional(), // '' or omitted = AI picks via pickTemplate
});

const SpecSchema = z.object({
  layout: z.object({
    header_style: z.enum(['botanical','cosmic','minimal','editorial','wave','nature','geometric','aurora']),
    sections: z.array(z.enum(SECTION_IDS)).min(3).max(7),
    max_width: z.union([z.literal(860), z.literal(980), z.literal(1100)]),
    density: z.enum(['spacious','balanced','rich']),
  }),
  decoration: z.object({
    type: z.enum(DECORATION_IDS),
    density: z.enum(['minimal','medium','lush']),
    animated: z.boolean(),
    fixed_background: z.boolean(),
  }),
  cards: z.object({
    style: z.enum(['glass','solid','outlined','paper']),
    radius: z.union([z.literal(8), z.literal(12), z.literal(16), z.literal(20), z.literal(24)]),
    shadow: z.enum(['none','soft','medium','dramatic']),
  }),
  typography: z.object({
    title_scale: z.enum(['lg','xl','2xl','display']),
    weight: z.union([z.literal(700), z.literal(800)]),
    header_uppercase: z.boolean(),
  }),
});

const TokenSchema = z.object({
  mood:             z.string(),
  layout_variant:   z.enum(['spacious','rich']),
  animation_level:  z.enum(['none','subtle','full']),
  layout:           SpecSchema.shape.layout,
  decoration:       SpecSchema.shape.decoration,
  cards:            SpecSchema.shape.cards,
  typography:       SpecSchema.shape.typography,
  palette: z.object({
    bg: z.string(), bg2: z.string(), surface: z.string(),
    accent: z.string(), accent2: z.string(),
    text: z.string(), text2: z.string(), glow: z.string(),
  }),
  tagline:                z.string().max(120),
  hero_title_placeholder: z.string().max(80),
  notepad_starter:        z.string().max(200),
  currently_placeholder:  z.string().max(80),
});

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function fallbackTokens(mood: SpaceMood, layout: 'spacious' | 'rich', vibes: string[]) {
  return {
    mood,
    layout_variant: layout,
    animation_level: 'subtle' as const,
    template_id: pickTemplate(mood, vibes),
    spec_override: {
      layout: {
        header_style: mood === 'midnight' ? 'cosmic' : mood === 'forest' ? 'nature' : 'botanical',
        sections: layout === 'rich' ? ['goals', 'currently', 'focus_hero', 'notepad', 'kanban'] : ['goals', 'currently', 'focus_hero', 'notepad'],
        max_width: layout === 'spacious' ? 860 : 980,
        density: layout === 'spacious' ? 'spacious' : 'rich',
      },
      decoration: {
        type: mood === 'midnight' ? 'starfield' : mood === 'ocean' ? 'waves' : mood === 'forest' ? 'forest' : 'botanicals',
        density: layout === 'rich' ? 'lush' : 'medium',
        animated: true,
        fixed_background: true,
      },
      cards: { style: 'glass', radius: 20, shadow: 'soft' },
      typography: { title_scale: layout === 'spacious' ? '2xl' : 'xl', weight: 800, header_uppercase: false },
    },
    palette: SPACE_PALETTES[mood],
    tagline: 'A quiet corner of the internet, made just for you.',
    hero_title_placeholder: "What's on your mind this week?",
    notepad_starter: '',
    currently_placeholder: 'Currently…',
  };
}

const STAGES = [
  'Reading your vibe…',
  'Choosing your palette…',
  'Setting the atmosphere…',
  'Writing your story…',
  'Composing your world…',
];

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) return new Response('Invalid input', { status: 400 });
  const input = parsed.data;

  // Fetch language preference
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('user_id', user.id)
    .single() as { data: { preferred_language: string } | null };
  const langInstr = languagePrompt(profile?.preferred_language ?? 'en');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(sse(data)));
      }

      // Emit the first stage immediately so the UI isn't blank
      emit({ stage: STAGES[0], progress: 0.05 });

      const prompt = buildPrompt(input);
      const client = new Anthropic();

      let raw = '';
      let stageIdx = 0;
      let charCount = 0;

      try {
        const response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          stream: true,
          system: `You are a creative designer generating personalised space themes for a personal journaling SaaS.
Respond ONLY with a valid JSON object matching the schema — no markdown fences, no explanation.
Colour values must be valid CSS hex (#RRGGBB). glow must be a valid rgba() string.${langInstr ? `\nFor all text fields (placeholders, labels, titles), use the user's language: ${langInstr.trim()}` : ''}`,
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            raw += event.delta.text;
            charCount += event.delta.text.length;

            // Advance through fake stages as tokens arrive (~200 chars each)
            const newStageIdx = Math.min(
              STAGES.length - 1,
              Math.floor(charCount / 180)
            );
            if (newStageIdx > stageIdx) {
              stageIdx = newStageIdx;
              emit({ stage: STAGES[stageIdx], progress: 0.1 + stageIdx * 0.18 });
            }
          }
        }

        // Parse and validate
        const jsonStart = raw.indexOf('{');
        const jsonEnd   = raw.lastIndexOf('}');
        const jsonStr   = jsonStart >= 0 && jsonEnd > jsonStart ? raw.slice(jsonStart, jsonEnd + 1) : '{}';
        const validated = TokenSchema.safeParse(JSON.parse(jsonStr));

        const resolveTemplateId = (mood: string) =>
          input.template_id || pickTemplate(mood as SpaceMood, input.vibes);

        const toTokens = (data: z.infer<typeof TokenSchema>) => {
          const { layout, decoration, cards, typography, ...rest } = data;
          return { ...rest, template_id: resolveTemplateId(data.mood), spec_override: { layout, decoration, cards, typography } };
        };

        if (validated.success) {
          emit({ stage: 'done', tokens: toTokens(validated.data) });
        } else {
          // Retry once with stricter prompt
          const retry = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: 'Respond ONLY with valid JSON, no markdown. All hex colors must be #RRGGBB format.',
            messages: [
              { role: 'user', content: prompt },
              { role: 'assistant', content: raw },
              { role: 'user', content: `The JSON above had validation errors: ${JSON.stringify(validated.error.issues)}. Return corrected JSON only.` },
            ],
          });
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : '';
          const js = retryText.indexOf('{');
          const je = retryText.lastIndexOf('}');
          const retryValidated = TokenSchema.safeParse(
            JSON.parse(js >= 0 && je > js ? retryText.slice(js, je + 1) : '{}')
          );
          emit({ stage: 'done', tokens: retryValidated.success ? toTokens(retryValidated.data) : fallbackTokens(input.mood, input.layout, input.vibes) });
        }
      } catch (err) {
        console.error('[generate] error:', err);
        emit({ stage: 'done', tokens: fallbackTokens(input.mood, input.layout, input.vibes) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}

function buildPrompt(input: z.infer<typeof InputSchema>): string {
  const base = SPACE_PALETTES[input.mood];
  const templateHint = input.template_id
    ? `- Chosen base template: "${input.template_id}" — honour its decoration type and header style spirit, but personalise the palette, density, and section selection for this specific person.`
    : `- No base template chosen — pick the decoration type and header style that best fits the vibe.`;
  return `
Generate a personalised space theme for someone with these preferences:

- Space name: "${input.name}"
- Vibe words: ${input.vibes.join(', ') || 'none specified'}
- Current big goal: "${input.goal || 'not specified'}"
- Colour mood chosen: ${input.mood} (base palette: bg=${base.bg}, accent=${base.accent})
- Layout preference: ${input.layout} (spacious = breathing room, rich = dense info)
${templateHint}

Return ONLY this JSON object (no markdown):
{
  "mood": "${input.mood}",
  "layout_variant": "${input.layout}",
  "animation_level": "subtle",
  "layout": {
    "header_style": "<one of botanical, cosmic, minimal, editorial, wave, nature, geometric, aurora>",
    "sections": ["goals", "currently", "focus_hero", "notepad", "<optional: kanban, streak, quote, reading_list, habit_tracker, photo>"],
    "max_width": ${input.layout === 'spacious' ? 860 : 980},
    "density": "${input.layout === 'spacious' ? 'spacious' : 'rich'}"
  },
  "decoration": {
    "type": "<one of ${DECORATION_IDS.join(', ')}>",
    "density": "<minimal, medium, or lush>",
    "animated": true,
    "fixed_background": true
  },
  "cards": { "style": "<glass, solid, outlined, or paper>", "radius": 20, "shadow": "<none, soft, medium, or dramatic>" },
  "typography": { "title_scale": "<lg, xl, 2xl, or display>", "weight": 800, "header_uppercase": false },
  "palette": {
    "bg":      "<main background — should feel like ${input.mood}, vary from base>",
    "bg2":     "<slightly deeper/richer variant of bg>",
    "surface": "<card surface — white/near-white for light, dark tint for dark moods>",
    "accent":  "<primary accent — most expressive colour for this person's vibe>",
    "accent2": "<complementary accent — harmonious with accent>",
    "text":    "<main text — high contrast on bg>",
    "text2":   "<secondary text — softer, still readable>",
    "glow":    "rgba(r,g,b,0.28)"
  },
  "tagline": "<a one-line poetic description of this space, 10-18 words, reflects their goal/vibe>",
  "hero_title_placeholder": "<a short prompt for their weekly focus, 6-10 words, matches their goal>",
  "notepad_starter": "<a single evocative opening sentence to inspire writing, max 20 words>",
  "currently_placeholder": "<a currently-doing phrase that fits their vibe, e.g. 'Currently building…', 'Currently writing…'>"
}

Rules:
- All hex colours must be 6-digit #RRGGBB
- glow must be rgba() with alpha 0.20–0.35
- For dark moods (forest, midnight): bg should be dark (#0a–#1f range), surface slightly lighter than bg
- For light moods: bg should be soft/pastel, surface near-white
- Make the palette distinctly personal — don't just return the base palette exactly, vary it to match their vibes
- tagline should reference their goal if provided
- sections must only use the allowed section ids; include kanban for rich goal-oriented spaces
- decoration.type must only use the allowed decoration ids; never return HTML, CSS, or JS
`.trim();
}
