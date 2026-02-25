-- profiles 테이블에 INSERT 정책 추가
-- 사용자가 자신의 프로필을 생성할 수 있도록 허용
-- Supabase SQL Editor에서 실행하세요

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
