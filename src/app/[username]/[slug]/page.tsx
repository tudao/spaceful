import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

export default async function UserSlugSpacePage({ params }: Props) {
  const { username, slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // TODO: fetch space by username + slug

  return (
    <main>
      <p>Space: {username}/{slug} — coming soon</p>
    </main>
  );
}
