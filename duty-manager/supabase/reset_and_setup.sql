-- ============================================
-- 당직일정관리 앱 - Supabase 전체 리셋 + 재설정
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- ======= 1단계: 기존 모두 삭제 =======
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists profiles_updated_at on public.profiles;
drop trigger if exists schedules_updated_at on public.duty_schedules;
drop function if exists public.handle_new_user();
drop function if exists public.update_updated_at();
drop function if exists public.delete_user_by_admin(uuid);
drop table if exists public.swap_requests cascade;
drop table if exists public.notifications cascade;
drop table if exists public.duty_schedules cascade;
drop table if exists public.profiles cascade;

-- auth.users의 기존 사용자도 삭제 (깨끗하게 시작)
delete from auth.users;

-- ======= 2단계: 테이블 생성 =======

-- profiles
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

-- duty_schedules
create table public.duty_schedules (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  shift_type text not null check (shift_type in ('duty', 'duty_off', 'leave', 'research', 'conference')),
  status text not null default 'assigned' check (status in ('assigned', 'confirmed', 'swap_requested')),
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- notifications
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

-- swap_requests
create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.duty_schedules(id) on delete cascade,
  requester_id uuid not null references public.profiles(id),
  target_user_id uuid not null references public.profiles(id),
  target_date date not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ======= 3단계: RLS 활성화 + 정책 =======

alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_update_admin" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

alter table public.duty_schedules enable row level security;
create policy "schedules_select" on public.duty_schedules for select using (true);
create policy "schedules_insert" on public.duty_schedules for insert with check (true);
create policy "schedules_update" on public.duty_schedules for update using (true);
create policy "schedules_delete" on public.duty_schedules for delete using (true);

alter table public.notifications enable row level security;
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications for insert with check (true);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

alter table public.swap_requests enable row level security;
create policy "swap_select" on public.swap_requests for select using (auth.uid() = requester_id or auth.uid() = target_user_id);
create policy "swap_insert" on public.swap_requests for insert with check (auth.uid() = requester_id);
create policy "swap_update" on public.swap_requests for update using (auth.uid() = target_user_id or auth.uid() = requester_id);

-- ======= 4단계: 트리거 함수 =======

-- 회원가입 시 자동 프로필 생성 (첫 유저 = admin)
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

-- updated_at 자동 갱신
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

-- ======= 5단계: 관리자 전용 사용자 삭제 함수 =======

create or replace function public.delete_user_by_admin(p_user_id uuid)
returns void as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception '관리자만 사용자를 삭제할 수 있습니다.';
  end if;
  if p_user_id = auth.uid() then
    raise exception '본인 계정은 삭제할 수 없습니다.';
  end if;
  delete from public.notifications where user_id = p_user_id;
  delete from public.swap_requests where requester_id = p_user_id or target_user_id = p_user_id;
  update public.duty_schedules set created_by = null where created_by = p_user_id and user_id != p_user_id;
  delete from public.duty_schedules where user_id = p_user_id;
  delete from public.profiles where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ======= 완료 =======
-- 이제 앱에서 회원가입하면 첫 번째 사용자가 자동으로 admin이 됩니다.
