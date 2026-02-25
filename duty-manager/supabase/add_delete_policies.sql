-- 사용자 삭제 함수 (관리자 전용, RLS 우회)
-- Supabase SQL Editor에서 실행하세요

create or replace function public.delete_user_by_admin(p_user_id uuid)
returns void as $$
begin
  -- 관리자 권한 확인
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception '관리자만 사용자를 삭제할 수 있습니다.';
  end if;
  -- 본인 삭제 방지
  if p_user_id = auth.uid() then
    raise exception '본인 계정은 삭제할 수 없습니다.';
  end if;
  -- 관련 데이터 삭제 (FK 순서)
  delete from public.notifications where user_id = p_user_id;
  delete from public.swap_requests where requester_id = p_user_id or target_user_id = p_user_id;
  update public.duty_schedules set created_by = null where created_by = p_user_id and user_id != p_user_id;
  delete from public.duty_schedules where user_id = p_user_id;
  delete from public.profiles where id = p_user_id;
end;
$$ language plpgsql security definer;
