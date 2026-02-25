-- ============================================
-- 남은 방수 테이블 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================

create table public.remaining_rooms (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time_slot text not null default '17:30',
  count integer not null default 0 check (count >= 0 and count <= 10),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique(date, time_slot)
);

alter table public.remaining_rooms enable row level security;

-- 모든 인증 사용자가 조회 가능
create policy "remaining_rooms_select" on public.remaining_rooms
  for select using (auth.uid() is not null);

-- 모든 인증 사용자가 삽입 가능
create policy "remaining_rooms_insert" on public.remaining_rooms
  for insert with check (auth.uid() is not null);

-- 모든 인증 사용자가 수정 가능
create policy "remaining_rooms_update" on public.remaining_rooms
  for update using (auth.uid() is not null);
