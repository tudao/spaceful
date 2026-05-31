-- Phase 6: Space snapshots + monthly letter infrastructure

create table if not exists space_snapshots (
  space_id     uuid not null references spaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  snapshot_at  date not null,
  content_json jsonb not null,
  primary key (space_id, snapshot_at)
);
alter table space_snapshots enable row level security;
create policy "owner_all" on space_snapshots
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create index space_snapshots_user on space_snapshots (user_id, snapshot_at desc);
