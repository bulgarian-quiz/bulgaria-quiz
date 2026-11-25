-- Third game: "Познай мястото" (photo quiz). Multiplayer rooms carry the game
-- type, and the two answer modes are separate types so public matchmaking only
-- pairs players who chose the same mode:
--   photo        – choose from four answers (а/б/в/г)
--   photo_typed  – type the answer
do $$
declare
  c record;
begin
  -- Drop the original inline CHECK on game_type, whatever name it was given.
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public' and rel.relname = 'game_rooms' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%game_type%'
  loop
    execute format('alter table public.game_rooms drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.game_rooms
  add constraint game_rooms_game_type_check
  check (game_type in ('quiz', 'dragdrop', 'photo', 'photo_typed'));
