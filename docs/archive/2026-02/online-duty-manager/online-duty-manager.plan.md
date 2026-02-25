# Plan: 온라인 당직관리 앱

> **Feature**: online-duty-manager
> **Created**: 2026-02-24
> **Level**: Dynamic (Next.js + bkend.ai BaaS)
> **Status**: Draft

---

## 1. 개요 (Overview)

현재 단일 HTML 파일로 구현된 당직일정관리 앱을 **온라인 다수 접속 가능한 웹 앱**으로 업그레이드한다.
bkend.ai BaaS를 활용하여 별도 서버 구축 없이 인증, 데이터베이스, 실시간 동기화를 구현한다.

### 현재 상태 (As-Is)
- 단일 `index.html` 파일 (약 51KB)
- localStorage 기반 데이터 저장
- 오프라인 단독 사용만 가능
- 인증/권한 관리 없음

### 목표 상태 (To-Be)
- Next.js App Router 기반 웹 앱
- 온라인 다수 접속 및 실시간 동기화
- 사용자 인증 (이메일 로그인/회원가입)
- 역할 기반 권한 관리 (관리자/일반 사용자)
- 당직 배정 시 알림 기능

---

## 2. 사용자 (Users)

| 역할 | 설명 | 권한 |
|------|------|------|
| **관리자 (Admin)** | 전체 당직 일정을 관리하는 책임자 | 모든 일정 CRUD, 사용자 관리, 알림 발송 |
| **일반 사용자 (User)** | 당직에 배정되는 직원 | 본인 일정 조회/수정, 교대 요청, 알림 수신 |

---

## 3. 핵심 기능 (Features)

### F1. 사용자 인증
- 이메일/비밀번호 회원가입 및 로그인
- 로그인 유지 (JWT 기반 세션)
- 프로필 관리 (이름, 직급, 연락처)

### F2. 당직 일정 관리
- **캘린더 뷰**: 월간/주간 당직 일정 표시
- **당직 배정**: 관리자가 날짜별 당직자 지정
- **본인 일정 수정**: 일반 사용자가 본인 당직 일정 수정 가능
- **교대 요청**: 사용자 간 당직 교대 요청/승인
- **일정 충돌 감지**: 동일 날짜 중복 배정 경고

### F3. 권한 관리
- **관리자**: 모든 당직 일정 생성/수정/삭제, 사용자 역할 관리
- **일반 사용자**: 본인 당직 일정만 수정 가능, 타인 일정은 조회만
- 역할 변경은 관리자만 가능

### F4. 실시간 동기화
- 당직 일정 변경 시 접속 중인 모든 사용자에게 즉시 반영
- 폴링 또는 SSE 기반 실시간 업데이트
- 변경 알림 표시 (토스트 메시지)

### F5. 알림 기능
- 당직 배정/변경 시 인앱 알림
- 이메일 알림 (선택)
- 알림 히스토리 조회

---

## 4. 기술 스택 (Tech Stack)

| 영역 | 기술 | 이유 |
|------|------|------|
| **Frontend** | Next.js 15 (App Router) | SSR/SSG, 파일 기반 라우팅, React 생태계 |
| **UI** | Tailwind CSS | 기존 디자인 톤 유지, 빠른 스타일링 |
| **Backend/DB** | bkend.ai BaaS | 별도 서버 없이 인증/DB/API 제공 |
| **인증** | bkend.ai Auth | 이메일 로그인, JWT 세션 관리 |
| **상태관리** | React Context + SWR | 서버 상태 캐싱 및 실시간 리페치 |
| **배포** | Vercel | Next.js 네이티브 지원, 무료 티어 |

---

## 5. 데이터 모델 (Data Model)

### users (bkend.ai Auth 확장)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 사용자 고유 ID (Auth 자동 생성) |
| email | string | 이메일 |
| name | string | 이름 |
| role | enum | `admin` / `user` |
| position | string | 직급 |
| phone | string | 연락처 |
| createdAt | datetime | 가입일 |

### duty_schedules
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 일정 ID |
| date | date | 당직 날짜 |
| userId | UUID (FK) | 배정된 사용자 |
| shift | enum | `day` / `night` / `full` |
| status | enum | `assigned` / `confirmed` / `swap_requested` |
| note | string | 메모 |
| createdBy | UUID (FK) | 생성자 (관리자) |
| createdAt | datetime | 생성일 |
| updatedAt | datetime | 수정일 |

### swap_requests
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 요청 ID |
| scheduleId | UUID (FK) | 대상 일정 |
| requesterId | UUID (FK) | 요청자 |
| targetUserId | UUID (FK) | 교대 대상자 |
| targetDate | date | 교대 희망 날짜 |
| status | enum | `pending` / `approved` / `rejected` |
| createdAt | datetime | 요청일 |

### notifications
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 알림 ID |
| userId | UUID (FK) | 수신자 |
| type | enum | `assignment` / `swap_request` / `swap_result` / `change` |
| title | string | 알림 제목 |
| message | string | 알림 내용 |
| isRead | boolean | 읽음 여부 |
| createdAt | datetime | 생성일 |

---

## 6. 페이지 구조 (Page Structure)

```
/                         → 로그인 페이지 (미인증 시)
/dashboard                → 대시보드 (월간 캘린더 + 오늘 당직)
/calendar                 → 캘린더 뷰 (월간/주간 전환)
/schedule/[date]          → 특정 날짜 당직 상세/편집
/swap-requests            → 교대 요청 목록
/notifications            → 알림 목록
/profile                  → 내 프로필 관리
/admin/users              → [관리자] 사용자 관리
/admin/settings           → [관리자] 설정
```

---

## 7. 구현 우선순위 (Priority)

| 순위 | 기능 | 중요도 | 난이도 |
|------|------|--------|--------|
| P0 | 사용자 인증 (로그인/회원가입) | 높음 | 중간 |
| P0 | 당직 일정 CRUD (캘린더 뷰) | 높음 | 중간 |
| P0 | 권한 관리 (관리자/일반) | 높음 | 낮음 |
| P1 | 본인 일정 수정 기능 | 높음 | 낮음 |
| P1 | 실시간 동기화 (폴링) | 높음 | 중간 |
| P2 | 교대 요청/승인 | 중간 | 중간 |
| P2 | 인앱 알림 | 중간 | 중간 |
| P3 | 이메일 알림 | 낮음 | 높음 |

---

## 8. 제약사항 및 고려사항

### 제약사항
- bkend.ai 무료 티어 범위 내 구현 (제한 확인 필요)
- 실시간 동기화는 WebSocket 대신 폴링/SWR revalidation으로 시작
- 첫 가입 사용자를 자동 관리자로 설정

### 비기능 요구사항
- 모바일 반응형 디자인 (기존 앱 디자인 유지)
- 페이지 로딩 2초 이내
- 동시 접속 50명 이상 지원

### 마이그레이션
- 기존 `index.html`의 UI 디자인/컬러 톤 최대한 유지
- localStorage 데이터 → bkend.ai DB 마이그레이션 가이드 제공

---

## 9. 성공 기준 (Success Criteria)

- [ ] 다수 사용자가 동시에 접속하여 당직 일정을 조회할 수 있다
- [ ] 관리자가 당직 일정을 생성/수정/삭제할 수 있다
- [ ] 일반 사용자가 본인의 당직 일정을 수정할 수 있다
- [ ] 일정 변경 시 실시간으로 다른 사용자에게 반영된다
- [ ] 당직 배정/변경 시 알림이 발송된다
- [ ] 모바일에서도 정상적으로 사용할 수 있다
