import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { SPACE_PALETTES, type SpaceMood } from '@/lib/utils';
import { pickTemplate } from '@/components/space/templates/types';

const InputSchema = z.object({
  name:   z.string().min(1).max(60),
  vibes:  z.array(z.string()).max(3),
  goal:   z.string().max(120),
  mood:   z.enum(['lavender','sand','forest','ocean','rose','midnight']),
  layout: z.enum(['spacious','rich']),
});

const TokenSchema = z.object({
  mood:             z.string(),
  layout_variant:   z.enum(['spacious','rich']),
  animation_level:  z.enum(['none','subtle','full']),
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
Colour values must be valid CSS hex (#RRGGBB). glow must be a valid rgba() string.`,
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

        if (validated.success) {
          // Attach template_id (picked from mood + vibes, not from LLM output)
          const tokens = { ...validated.data, template_id: pickTemplate(validated.data.mood as SpaceMood, input.vibes) };
          emit({ stage: 'done', tokens });
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
          const retryTokens = retryValidated.success
            ? { ...retryValidated.data, template_id: pickTemplate(retryValidated.data.mood as SpaceMood, input.vibes) }
            : fallbackTokens(input.mood, input.layout, input.vibes);
          emit({ stage: 'done', tokens: retryTokens });
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
  return `
Generate a personalised space theme for someone with these preferences:

- Space name: "${input.name}"
- Vibe words: ${input.vibes.join(', ') || 'none specified'}
- Current big goal: "${input.goal || 'not specified'}"
- Colour mood chosen: ${input.mood} (base palette: bg=${base.bg}, accent=${base.accent})
- Layout preference: ${input.layout} (spacious = breathing room, rich = dense info)

Return ONLY this JSON object (no markdown):
{
  "mood": "${input.mood}",
  "layout_variant": "${input.layout}",
  "animation_level": "subtle",
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
`.trim();
}
