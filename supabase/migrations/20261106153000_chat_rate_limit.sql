-- Hourly message limit for the AI chat, shared by every server instance.
-- Only the chat edge function (service role) touches this table; nobody can
-- read or write it from the browser.
create table if not exists public.chat_usage (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.chat_usage enable row level security;
revoke all on public.chat_usage from anon, authenticated;

-- Counts one message for p_key and says whether it is within p_limit for the
-- current hour. Atomic, so parallel requests cannot slip past the limit.
create or replace function public.chat_rate_limit(p_key text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  insert into public.chat_usage as u (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case when u.window_start < now() - interval '1 hour' then 1 else u.count + 1 end,
        window_start = case when u.window_start < now() - interval '1 hour' then now() else u.window_start end
  returning u.count into used;
  return used <= p_limit;
end;
$$;

revoke all on function public.chat_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.chat_rate_limit(text, integer) to service_role;
