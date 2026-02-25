// --- 사용자 ---
export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  position: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- 당직 일정 ---
export type ShiftType = 'duty' | 'duty_off' | 'leave' | 'research' | 'conference';

export interface DutySchedule {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  user?: Profile;
  shiftType: ShiftType;
  status: 'assigned' | 'confirmed' | 'swap_requested';
  note: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleDTO {
  date: string;
  userId: string;
  shiftType: ShiftType;
  note?: string;
}

// --- 교대 요청 ---
export interface SwapRequest {
  id: string;
  scheduleId: string;
  schedule?: DutySchedule;
  requesterId: string;
  requester?: Profile;
  targetUserId: string;
  targetUser?: Profile;
  targetDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// --- 알림 ---
export interface Notification {
  id: string;
  userId: string;
  type: 'assignment' | 'swap_request' | 'swap_result' | 'change';
  title: string;
  message: string | null;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

// --- 인증 ---
export interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface SignupDTO {
  email: string;
  password: string;
  name: string;
  position?: string;
  phone?: string;
}

export interface AutoAssignOptions {
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
  excludeUserIds?: string[];
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
