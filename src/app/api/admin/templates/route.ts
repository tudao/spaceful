/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== 'admin') return { supabase, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { supabase, user, error: null };
}

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;
  const { data, error: dbError } = await (supabase as any)
    .from('space_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user, error } = await requireAdmin();
  if (error) return error;
  const body = await request.json().catch(() => null);
  if (!body?.slug || !body?.name || !body?.spec) return NextResponse.json({ error: 'slug, name, and spec are required' }, { status: 400 });

  const payload = {
    slug: String(body.slug),
    name: String(body.name),
    description: body.description ? String(body.description) : null,
    spec: body.spec,
    preview_mood: body.preview_mood ?? 'lavender',
    tags: body.tags ?? [],
    mood_affinity: body.mood_affinity ?? [],
    vibe_keywords: body.vibe_keywords ?? [],
    is_active: body.is_active ?? true,
    is_featured: body.is_featured ?? false,
    created_by: user!.id,
  };

  const { data, error: dbError } = await (supabase as any).from('space_templates').insert(payload).select('*').single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ template: data });
}

export async function PUT(request: Request) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { id, ...updates } = body;
  const { data, error: dbError } = await (supabase as any)
    .from('space_templates')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ template: data });
}

export async function DELETE(request: Request) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error: dbError } = await (supabase as any).from('space_templates').delete().eq('id', id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

