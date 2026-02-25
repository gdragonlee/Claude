-- ============================================
-- 당직일정관리 앱 - Supabase 마이그레이션 SQL
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. profiles 테이블
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  position text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 2. duty_schedules 테이블
create table public.duty_schedules (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  shift_type text not null check (shift_type in ('duty', 'night_duty', 'duty_off', 'leave', 'research', 'conference')),
  status text not null default 'assigned' check (status in ('assigned', 'confirmed', 'swap_requested')),
  note text,
  group_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.duty_schedules enable row level security;

create policy "schedules_select" on public.duty_schedules
  for select using (true);

create policy "schedules_insert" on public.duty_schedules
  for insert with check (true);

create policy "schedules_update" on public.duty_schedules
  for update using (true);

create policy "schedules_delete" on public.duty_schedules
  for delete using (true);

-- 3. notifications 테이블
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('assignment', 'swap_request', 'swap_result', 'change')),
  title text not null,
  message text,
  is_read boolean not null default false,
  related_id uuid,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_insert" on public.notifications
  for insert with check (true);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- 4. swap_requests 테이블
create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.duty_schedules(id) on delete cascade,
  requester_id uuid not null references public.profiles(id),
  target_user_id uuid not null references public.profiles(id),
  target_date date not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.swap_requests enable row level security;

create policy "swap_select" on public.swap_requests
  for select using (auth.uid() = requester_id or auth.uid() = target_user_id);

create policy "swap_insert" on public.swap_requests
  for insert with check (auth.uid() = requester_id);

create policy "swap_update" on public.swap_requests
  for update using (auth.uid() = target_user_id or auth.uid() = requester_id);

-- 5. 회원가입 시 자동 프로필 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_count int;
  user_role text;
begin
  select count(*) into user_count from public.profiles;
  if user_count = 0 then
    user_role := 'admin';
  else
    user_role := 'user';
  end if;

  insert into public.profiles (id, email, name, role, position, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    user_role,
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. updated_at 자동 갱신 트리거
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger schedules_updated_at
  before update on public.duty_schedules
  for each row execute function public.update_updated_at();

-- 7. announcements 테이블 (공지사항)
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- 모든 사용자가 공지를 읽을 수 있음
create policy "announcements_select" on public.announcements
  for select using (true);

-- 관리자만 공지를 작성/수정/삭제할 수 있음
create policy "announcements_insert_admin" on public.announcements
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "announcements_update_admin" on public.announcements
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "announcements_delete_admin" on public.announcements
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.update_updated_at();

-- 8. messages 테이블 (개인 메시지)
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_messages_sender on public.messages(sender_id, created_at desc);
create index idx_messages_receiver on public.messages(receiver_id, created_at desc);

alter table public.messages enable row level security;

-- 본인이 보내거나 받은 메시지만 조회 가능
create policy "messages_select" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- 로그인한 사용자가 메시지를 보낼 수 있음
create policy "messages_insert" on public.messages
  for insert with check (auth.uid() = sender_id);

-- 수신자만 읽음 처리 가능
create policy "messages_update_read" on public.messages
  for update using (auth.uid() = receiver_id);
