import Anthropic from '@anthropic-ai/sdk';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ARCHETYPE_PROMPTS: Record<string, string> = {
  stoic:      'You are a stoic advisor. Speak with calm clarity, grounded in practical wisdom. Reference Stoic principles naturally. Be concise.',
  coach:      'You are an energetic life coach. Speak with warmth and actionable encouragement. Focus on momentum and progress. Be concise.',
  poet:       'You are a poetic guide. Speak with gentle beauty and metaphor. Help the user find meaning in the everyday. Be concise.',
  sage:       'You are a wise sage. Speak with depth and gentle provocation. Ask questions that illuminate. Be concise.',
  challenger: 'You are a bold challenger. Speak directly and push the user toward growth. Name comfort zones. Be concise.',
};

const BodySchema = z.object({
  space_id:  z.string().uuid(),
  message:   z.string().min(1).max(500),
  history:   z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).max(10).optional(),
});

function sse(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return new Response('Invalid input', { status: 400 });
  const { space_id, message, history = [] } = parsed.data;

  // Verify ownership
  const { data: space } = await supabase
    .from('spaces')
    .select('companion_archetype, content_json')
    .eq('id', space_id)
    .eq('user_id', user.id)
    .single();
  if (!space) return new Response('Not found', { status: 404 });

  // Deduct 0.1 credit via service role (companion_chat action)
  const svc = await createServiceClient();
  const { error: creditError } = await (svc as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> }).rpc('deduct_credits', {
    p_user_id: user.id,
    p_delta:   0.1,
    p_action:  'companion_chat',
    p_note:    'Companion chat message',
  });
  if (creditError) {
    if (creditError.message?.includes('insufficient')) {
      return new Response(JSON.stringify({ error: 'insufficient_credits' }), { status: 402, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Credit error', { status: 500 });
  }

  const archetype = space.companion_archetype ?? 'sage';
  const systemPrompt = ARCHETYPE_PROMPTS[archetype] + '\nKeep responses to 3-4 sentences max.';

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...history,
    { role: 'user', content: message },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = '';
      try {
        const ai = new Anthropic();
        const resp = await ai.messages.create({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system:     systemPrompt,
          messages,
          stream:     true,
        });

        for await (const event of resp) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(encoder.encode(sse({ chunk })));
          }
        }

        controller.enqueue(encoder.encode(sse({ done: true })));

        // Persist interaction (fire-and-forget)
        supabase.from('companion_interactions').insert([
          { space_id, user_id: user.id, role: 'user',      content: message   },
          { space_id, user_id: user.id, role: 'assistant', content: fullText  },
        ]).then(() => {}).catch(() => {});

      } catch {
        controller.enqueue(encoder.encode(sse({ error: 'Generation failed' })));
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
