# Design: 온라인 당직관리 앱

> **Feature**: online-duty-manager
> **Plan Reference**: [online-duty-manager.plan.md](../../01-plan/features/online-duty-manager.plan.md)
> **Created**: 2026-02-24
> **Level**: Dynamic (Next.js + bkend.ai BaaS)
> **Status**: Draft

---

## 1. 아키텍처 개요 (Architecture Overview)

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            Next.js 15 App Router (SSR/CSR)          │ │
│  │  ┌───────────┐ ┌───────────┐ ┌────────────────────┐│ │
│  │  │ AuthContext│ │ SWR Cache │ │ Notification Store  ││ │
│  │  └─────┬─────┘ └─────┬─────┘ └─────────┬──────────┘│ │
│  │        │             │                  │           │ │
│  │  ┌─────┴─────────────┴──────────────────┴─────────┐│ │
│  │  │              API Client Layer (lib/api)         ││ │
│  │  └────────────────────┬───────────────────────────┘│ │
│  └───────────────────────┼────────────────────────────┘ │
└──────────────────────────┼──────────────────────────────┘
                           │ REST API (HTTPS)
┌──────────────────────────┼──────────────────────────────┐
│                    bkend.ai BaaS                         │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │
│  │   Auth   │ │ Database │ │   RLS     │ │  Storage  │ │
│  │  (JWT)   │ │ (Tables) │ │ (Policies)│ │  (Files)  │ │
│  └──────────┘ └──────────┘ └───────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 프로젝트 구조 (Project Structure)

```
duty-manager/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 루트 레이아웃 (AuthProvider 포함)
│   │   ├── page.tsx                  # 로그인 페이지 (/)
│   │   ├── (auth)/                   # 인증 관련 라우트 그룹
│   │   │   ├── login/page.tsx        # 로그인
│   │   │   └── signup/page.tsx       # 회원가입
│   │   └── (app)/                    # 인증 필요 라우트 그룹
│   │       ├── layout.tsx            # 앱 레이아웃 (사이드바/헤더)
│   │       ├── dashboard/page.tsx    # 대시보드
│   │       ├── calendar/page.tsx     # 캘린더 뷰
│   │       ├── schedule/
│   │       │   └── [date]/page.tsx   # 날짜별 당직 상세
│   │       ├── swap-requests/page.tsx # 교대 요청
│   │       ├── notifications/page.tsx # 알림
│   │       ├── profile/page.tsx      # 프로필
│   │       └── admin/                # 관리자 전용
│   │           ├── users/page.tsx    # 사용자 관리
│   │           └── settings/page.tsx # 설정
│   ├── components/                   # 공유 컴포넌트
│   │   ├── ui/                       # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── calendar/                 # 캘린더 컴포넌트
│   │   │   ├── CalendarGrid.tsx      # 월간 캘린더 그리드
│   │   │   ├── CalendarDay.tsx       # 개별 날짜 셀
│   │   │   ├── CalendarHeader.tsx    # 월 네비게이션
│   │   │   └── DutyBadge.tsx         # 당직 표시 뱃지
│   │   ├── schedule/                 # 일정 관련 컴포넌트
│   │   │   ├── DutyForm.tsx          # 당직 배정 폼
│   │   │   ├── DutyList.tsx          # 일정 목록
│   │   │   ├── SwapRequestCard.tsx   # 교대 요청 카드
│   │   │   └── AutoAssignPanel.tsx   # 자동 배정 패널
│   │   ├── layout/                   # 레이아웃 컴포넌트
│   │   │   ├── AppHeader.tsx         # 앱 헤더
│   │   │   ├── Sidebar.tsx           # 사이드바 네비게이션
│   │   │   └── MobileNav.tsx         # 모바일 하단 네비
│   │   └── auth/                     # 인증 컴포넌트
│   │       ├── LoginForm.tsx
│   │       ├── SignupForm.tsx
│   │       └── ProtectedRoute.tsx
│   ├── lib/                          # 라이브러리/유틸
│   │   ├── api/                      # API 클라이언트
│   │   │   ├── client.ts             # bkend.ai HTTP 클라이언트
│   │   │   ├── auth.ts               # 인증 API
│   │   │   ├── schedules.ts          # 일정 API
│   │   │   ├── users.ts              # 사용자 API
│   │   │   ├── swapRequests.ts       # 교대 요청 API
│   │   │   └── notifications.ts      # 알림 API
│   │   ├── hooks/                    # Custom Hooks
│   │   │   ├── useAuth.ts            # 인증 상태 훅
│   │   │   ├── useSchedules.ts       # 일정 데이터 훅 (SWR)
│   │   │   ├── useNotifications.ts   # 알림 훅
│   │   │   └── usePolling.ts         # 실시간 폴링 훅
│   │   ├── context/                  # React Context
│   │   │   ├── AuthContext.tsx        # 인증 컨텍스트
│   │   │   └── ToastContext.tsx       # 토스트 알림 컨텍스트
│   │   ├── types/                    # TypeScript 타입
│   │   │   └── index.ts              # 전체 타입 정의
│   │   └── utils/                    # 유틸리티
│   │       ├── date.ts               # 날짜 헬퍼
│   │       └── constants.ts          # 상수값
│   └── styles/
│       └── globals.css               # Tailwind + 글로벌 스타일
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 3. 데이터베이스 설계 (Database Design)

### 3.1 ERD

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│   profiles   │     │  duty_schedules   │     │  swap_requests   │
├──────────────┤     ├───────────────────┤     ├──────────────────┤
│ id (PK)      │◄────│ user_id (FK)      │     │ id (PK)          │
│ email        │     │ id (PK)           │◄────│ schedule_id (FK) │
│ name         │     │ date              │     │ requester_id (FK)│──►┐
│ role         │     │ shift_type        │     │ target_user_id   │──►│
│ position     │◄────│ created_by (FK)   │     │ target_date      │  │
│ phone        │     │ status            │     │ status           │  │
│ is_active    │     │ note              │     │ created_at       │  │
│ created_at   │     │ created_at        │     └──────────────────┘  │
│ updated_at   │     │ updated_at        │                           │
└──────────────┘     └───────────────────┘     ┌──────────────────┐  │
       │                                       │  notifications   │  │
       │                                       ├──────────────────┤  │
       └───────────────────────────────────────│ user_id (FK)     │◄─┘
                                               │ id (PK)          │
                                               │ type             │
                                               │ title            │
                                               │ message          │
                                               │ is_read          │
                                               │ related_id       │
                                               │ created_at       │
                                               └──────────────────┘
```

### 3.2 테이블 상세

#### profiles
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'user',   -- 'admin' | 'user'
  position    VARCHAR(50),                           -- 직급: 의사, 간호사 등
  phone       VARCHAR(20),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

#### duty_schedules
```sql
CREATE TABLE duty_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  user_id     UUID NOT NULL REFERENCES profiles(id),
  shift_type  VARCHAR(10) NOT NULL,                  -- 'day' | 'night' | 'full'
  status      VARCHAR(20) DEFAULT 'assigned',        -- 'assigned' | 'confirmed' | 'swap_requested'
  note        TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, user_id, shift_type)                  -- 같은날 같은사람 같은타입 중복 방지
);
```

#### swap_requests
```sql
CREATE TABLE swap_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id     UUID NOT NULL REFERENCES duty_schedules(id),
  requester_id    UUID NOT NULL REFERENCES profiles(id),
  target_user_id  UUID NOT NULL REFERENCES profiles(id),
  target_date     DATE NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',     -- 'pending' | 'approved' | 'rejected'
  created_at      TIMESTAMP DEFAULT NOW()
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  type        VARCHAR(30) NOT NULL,                  -- 'assignment' | 'swap_request' | 'swap_result' | 'change'
  title       VARCHAR(200) NOT NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  related_id  UUID,                                  -- 관련 schedule/swap ID
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### 3.3 RLS (Row Level Security) 정책

| 테이블 | 작업 | 정책 |
|--------|------|------|
| profiles | SELECT | 인증된 사용자 → 전체 조회 가능 |
| profiles | UPDATE | 본인 프로필만 수정 (role 변경 제외) |
| profiles | UPDATE (role) | admin만 타인 role 변경 가능 |
| duty_schedules | SELECT | 인증된 사용자 → 전체 조회 |
| duty_schedules | INSERT | admin만 생성 가능 |
| duty_schedules | UPDATE | admin → 전체 수정, user → 본인 일정만 수정 |
| duty_schedules | DELETE | admin만 삭제 가능 |
| swap_requests | SELECT | 본인 요청/수신만 조회 |
| swap_requests | INSERT | 인증된 사용자 생성 가능 |
| swap_requests | UPDATE | 요청 대상자(target) 또는 admin만 승인/거절 |
| notifications | SELECT | 본인 알림만 조회 |
| notifications | UPDATE | 본인 알림만 읽음 처리 |

---

## 4. API 설계 (API Design)

### 4.1 인증 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/auth/signup` | 회원가입 | Public |
| POST | `/auth/login` | 로그인 | Public |
| POST | `/auth/logout` | 로그아웃 | Auth |
| GET | `/auth/me` | 현재 사용자 정보 | Auth |

### 4.2 프로필 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/profiles` | 전체 사용자 목록 | Auth |
| GET | `/profiles/:id` | 사용자 상세 | Auth |
| PATCH | `/profiles/:id` | 프로필 수정 | Self / Admin |
| PATCH | `/profiles/:id/role` | 역할 변경 | Admin |

### 4.3 당직 일정 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/schedules?month=YYYY-MM` | 월별 일정 조회 | Auth |
| GET | `/schedules/:id` | 일정 상세 | Auth |
| POST | `/schedules` | 일정 생성 | Admin |
| POST | `/schedules/bulk` | 자동 배정 (대량 생성) | Admin |
| PATCH | `/schedules/:id` | 일정 수정 | Admin / Self |
| DELETE | `/schedules/:id` | 일정 삭제 | Admin |
| DELETE | `/schedules?month=YYYY-MM` | 월별 일정 초기화 | Admin |

### 4.4 교대 요청 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/swap-requests` | 내 교대 요청 목록 | Auth |
| POST | `/swap-requests` | 교대 요청 생성 | Auth |
| PATCH | `/swap-requests/:id` | 승인/거절 | Target / Admin |

### 4.5 알림 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/notifications` | 내 알림 목록 | Auth |
| GET | `/notifications/unread-count` | 읽지 않은 알림 수 | Auth |
| PATCH | `/notifications/:id/read` | 알림 읽음 처리 | Self |
| PATCH | `/notifications/read-all` | 전체 읽음 처리 | Self |

---

## 5. 컴포넌트 설계 (Component Design)

### 5.1 컴포넌트 트리

```
RootLayout
├── AuthProvider
│   ├── ToastProvider
│   │   ├── (auth)/login → LoginForm
│   │   ├── (auth)/signup → SignupForm
│   │   └── (app)/layout
│   │       ├── AppHeader (로고, 알림 아이콘, 프로필 메뉴)
│   │       ├── Sidebar (PC) / MobileNav (모바일)
│   │       └── Page Content
│   │           ├── Dashboard
│   │           │   ├── TodayDutyCard
│   │           │   ├── CalendarGrid (mini)
│   │           │   └── RecentNotifications
│   │           ├── Calendar
│   │           │   ├── CalendarHeader (월 네비게이션)
│   │           │   ├── AutoAssignPanel (admin only)
│   │           │   └── CalendarGrid
│   │           │       └── CalendarDay[]
│   │           │           └── DutyBadge[]
│   │           ├── Schedule/[date]
│   │           │   ├── DutyList
│   │           │   └── DutyForm (admin/self)
│   │           ├── SwapRequests
│   │           │   └── SwapRequestCard[]
│   │           └── Notifications
│   │               └── NotificationItem[]
│   └── Toast (floating)
```

### 5.2 주요 컴포넌트 인터페이스

#### CalendarGrid
```typescript
interface CalendarGridProps {
  year: number;
  month: number;          // 0-indexed
  schedules: DutySchedule[];
  onDayClick: (date: string) => void;
  compact?: boolean;      // 대시보드용 미니 캘린더
}
```

#### DutyBadge
```typescript
interface DutyBadgeProps {
  schedule: DutySchedule;
  showName?: boolean;     // 사용자 이름 표시 여부
}
// shift_type별 색상:
// day → bg-blue-100 text-blue-800
// night → bg-pink-100 text-pink-800
// full → bg-purple-100 text-purple-800
```

#### DutyForm
```typescript
interface DutyFormProps {
  date: string;           // YYYY-MM-DD
  existingSchedules: DutySchedule[];
  users: Profile[];
  currentUser: Profile;
  onSave: (data: CreateScheduleDTO) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
```

#### AutoAssignPanel
```typescript
interface AutoAssignPanelProps {
  year: number;
  month: number;
  users: Profile[];
  onGenerate: (options: AutoAssignOptions) => Promise<void>;
  onClearMonth: () => Promise<void>;
}

interface AutoAssignOptions {
  shiftType: 'day' | 'night' | 'both';
  excludeWeekends?: boolean;
  excludeUserIds?: string[];
}
```

---

## 6. 타입 정의 (Type Definitions)

```typescript
// --- 사용자 ---
interface Profile {
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
interface DutySchedule {
  id: string;
  date: string;           // YYYY-MM-DD
  userId: string;
  user?: Profile;         // JOIN 시 포함
  shiftType: 'day' | 'night' | 'full';
  status: 'assigned' | 'confirmed' | 'swap_requested';
  note: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateScheduleDTO {
  date: string;
  userId: string;
  shiftType: 'day' | 'night' | 'full';
  note?: string;
}

// --- 교대 요청 ---
interface SwapRequest {
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
interface Notification {
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
interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginDTO {
  email: string;
  password: string;
}

interface SignupDTO {
  email: string;
  password: string;
  name: string;
  position?: string;
  phone?: string;
}
```

---

## 7. 상태 관리 설계 (State Management)

### 7.1 AuthContext
```
AuthContext
├── user: Profile | null
├── isLoading: boolean
├── login(email, password) → Promise<void>
├── signup(data) → Promise<void>
├── logout() → Promise<void>
└── updateProfile(data) → Promise<void>
```

### 7.2 SWR 기반 서버 상태
```
useSchedules(year, month)
├── data: DutySchedule[]
├── isLoading: boolean
├── mutate() → 수동 리페치
└── refreshInterval: 30000  ← 30초 폴링 (실시간 동기화)

useNotifications()
├── data: Notification[]
├── unreadCount: number
├── markAsRead(id) → Promise<void>
├── markAllAsRead() → Promise<void>
└── refreshInterval: 15000  ← 15초 폴링

useUsers()
├── data: Profile[]
└── isLoading: boolean

useSwapRequests()
├── data: SwapRequest[]
├── create(data) → Promise<void>
└── respond(id, status) → Promise<void>
```

### 7.3 ToastContext
```
ToastContext
├── toasts: Toast[]
├── addToast(message, type) → void
└── removeToast(id) → void
```

---

## 8. 인증 흐름 (Authentication Flow)

```
                    ┌──────────┐
                    │  앱 시작  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ JWT 토큰  │──── 없음 ────► 로그인 페이지
                    │ 확인     │
                    └────┬─────┘
                         │ 있음
                    ┌────▼─────┐
                    │ /auth/me │──── 401 ─────► 토큰 삭제 → 로그인
                    │  요청    │
                    └────┬─────┘
                         │ 200 OK
                    ┌────▼─────┐
                    │ AuthCtx  │
                    │ user 설정│
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ role 확인 │──── admin ──► 전체 기능 접근
                    └────┬─────┘
                         │ user
                    ┌────▼──────┐
                    │ 제한 기능  │
                    │ 접근      │
                    └───────────┘
```

### 첫 사용자 = 관리자 규칙
- 회원가입 시 profiles 테이블에 레코드가 0건이면 → `role: 'admin'`
- 이후 가입자는 → `role: 'user'`

---

## 9. 실시간 동기화 설계 (Real-time Sync)

### SWR 폴링 전략

| 데이터 | 폴링 간격 | 조건 |
|--------|-----------|------|
| 당직 일정 | 30초 | 캘린더/대시보드 페이지 활성 시 |
| 알림 | 15초 | 항상 (앱 전체) |
| 사용자 목록 | 5분 | 관리자 페이지 활성 시 |
| 교대 요청 | 1분 | 교대 요청 페이지 활성 시 |

### 변경 감지 및 알림
```
일정 변경 발생
  │
  ├─► SWR mutate → UI 즉시 갱신 (Optimistic Update)
  │
  └─► 서버 → notifications 테이블에 레코드 추가
       │
       └─► 다른 사용자의 알림 폴링 → 토스트 표시
```

---

## 10. UI/UX 설계 (UI/UX Design)

### 10.1 디자인 토큰 (기존 앱 유지)

```css
/* 기존 index.html의 CSS 변수를 Tailwind으로 매핑 */
--primary: #2563eb      → blue-600
--primary-hover: #1d4ed8 → blue-700
--danger: #dc2626       → red-600
--success: #16a34a      → green-600
--warning: #f59e0b      → amber-500
--bg: #f8fafc           → slate-50
--card: #ffffff          → white
--border: #e2e8f0       → slate-200
--text: #1e293b         → slate-800
--text-light: #64748b   → slate-500
```

### 10.2 반응형 브레이크포인트

| 크기 | 범위 | 레이아웃 |
|------|------|---------|
| Mobile | < 768px | 하단 네비게이션, 스택 레이아웃 |
| Tablet | 768px ~ 1024px | 축소 사이드바, 2열 그리드 |
| Desktop | > 1024px | 전체 사이드바, 7열 캘린더 |

### 10.3 페이지별 레이아웃

#### 로그인/회원가입
```
┌─────────────────────────────┐
│         로고 + 앱 이름        │
│  ┌───────────────────────┐  │
│  │      이메일 입력        │  │
│  │      비밀번호 입력      │  │
│  │      [로그인 버튼]      │  │
│  │    회원가입 링크         │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

#### 대시보드 (Desktop)
```
┌──────┬──────────────────────────────┐
│      │  오늘의 당직                   │
│ 사이드│  ┌──────┬──────┬──────┐      │
│  바  │  │주간   │야간   │전체   │      │
│      │  └──────┴──────┴──────┘      │
│ - 대시│                              │
│ - 캘린│  미니 캘린더 (월간)            │
│ - 교대│  ┌─┬─┬─┬─┬─┬─┬─┐           │
│ - 알림│  │ │ │ │ │ │ │ │           │
│ - 프로│  ├─┼─┼─┼─┼─┼─┼─┤           │
│      │  │ │ │ │ │ │ │ │           │
│ ─────│  └─┴─┴─┴─┴─┴─┴─┘           │
│ 관리자│                              │
│ - 사용│  최근 알림                     │
│ - 설정│  ┌──────────────────────┐    │
│      │  │ 알림 1                │    │
│      │  │ 알림 2                │    │
│      │  └──────────────────────┘    │
└──────┴──────────────────────────────┘
```

#### 캘린더 페이지 (Desktop)
```
┌──────┬──────────────────────────────┐
│      │  ◄ 2026년 3월 ►   [자동배정]  │
│ 사이드│  ┌──┬──┬──┬──┬──┬──┬──┐     │
│  바  │  │일│월│화│수│목│금│토│     │
│      │  ├──┼──┼──┼──┼──┼──┼──┤     │
│      │  │  │1 │2 │3 │4 │5 │6 │     │
│      │  │  │주│  │야│  │주│  │     │
│      │  │  │김│  │이│  │박│  │     │
│      │  ├──┼──┼──┼──┼──┼──┼──┤     │
│      │  │  │  │  │  │  │  │  │     │
│      │  │  │  │  │  │  │  │  │     │
│      │  ├──┼──┼──┼──┼──┼──┼──┤     │
│      │  │  │  │  │  │  │  │  │     │
│      │  └──┴──┴──┴──┴──┴──┴──┘     │
└──────┴──────────────────────────────┘
```

---

## 11. 구현 순서 (Implementation Order)

### Phase 1: 프로젝트 초기화 및 인증
1. Next.js 프로젝트 생성 (App Router, TypeScript, Tailwind)
2. bkend.ai 프로젝트 설정 및 테이블 생성
3. API 클라이언트 설정 (`lib/api/client.ts`)
4. 인증 구현 (AuthContext, LoginForm, SignupForm)
5. 보호 라우트 설정 (`(app)/layout.tsx`)

### Phase 2: 핵심 UI 레이아웃
6. AppHeader, Sidebar, MobileNav 컴포넌트
7. 기본 UI 컴포넌트 (Button, Modal, Toast, Badge)
8. 대시보드 페이지 기본 구조

### Phase 3: 캘린더 및 일정 관리
9. CalendarGrid, CalendarDay, CalendarHeader
10. DutyBadge 컴포넌트 (shift 타입별 색상)
11. 날짜별 상세 페이지 (DutyForm)
12. 일정 CRUD API 연동
13. 자동 배정 기능 (AutoAssignPanel)

### Phase 4: 권한 및 교대
14. 권한별 UI 분기 (admin/user)
15. 본인 일정 수정 기능
16. 교대 요청 생성/승인/거절

### Phase 5: 실시간 동기화 및 알림
17. SWR 폴링 설정 (useSchedules, useNotifications)
18. 인앱 알림 (NotificationItem, 뱃지 카운트)
19. 토스트 알림 (실시간 변경 감지)

### Phase 6: 관리자 기능 및 마무리
20. 관리자 사용자 관리 페이지
21. 프로필 관리 페이지
22. 반응형 디자인 최적화
23. 에러 처리 및 로딩 상태

---

## 12. 보안 고려사항

| 항목 | 대응 |
|------|------|
| JWT 저장 | httpOnly cookie 또는 메모리 (XSS 방지) |
| API 인증 | 모든 API 요청에 Bearer 토큰 포함 |
| 권한 검증 | 서버 RLS + 클라이언트 UI 분기 이중 검증 |
| 입력 검증 | 클라이언트 + 서버 양측 유효성 검사 |
| CSRF | SameSite 쿠키 + Origin 헤더 검증 |
| Rate Limiting | bkend.ai 기본 제한 활용 |

---

## 13. 의존성 패키지

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "swr": "^2.2.0",
    "date-fns": "^3.0.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```
