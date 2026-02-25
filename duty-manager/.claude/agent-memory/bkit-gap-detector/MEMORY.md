# Gap Detector Memory - duty-manager project

## Project Context
- **Project**: duty-manager (online-duty-manager feature)
- **Stack**: Next.js 15 App Router + Tailwind v4 + SWR + localStorage mock
- **Architecture**: Dynamic level (mock-first, bkend.ai BaaS planned)
- **Design Doc**: `/Users/gdragonlee/Claude/docs/02-design/features/online-duty-manager.design.md`
- **Analysis Doc**: `/Users/gdragonlee/Claude/docs/03-analysis/online-duty-manager.analysis.md`

## Analysis History
- Iteration 1: 85.6% (7 actionable gaps found)
- Iteration 2: 93.2% (all 7 resolved, threshold met)

## Intentional Deviations (accepted)
- localStorage mock instead of bkend.ai HTTP client
- No JWT/RLS/CSRF/rate limiting (mock-first approach)
- ProtectedRoute as inline layout guard (App Router pattern)
- usePolling.ts not needed (SWR refreshInterval suffices)
- tailwind.config.ts not needed (Tailwind v4 CSS-based config)
- DutyList.tsx embedded in DutyForm (functionally equivalent)

## Weight Adjustments Applied
- Database/Data Model: 5% (reduced from 10%, mock-first is intentional)
- State Management: 12% (increased from 10%, core to design)
- Real-time Sync: 8% (increased from 5%, polling is core)

## Key Files Changed in Iteration 1
- NEW: `src/lib/hooks/useSwapRequests.ts` (60s polling, create/respond)
- NEW: `src/lib/hooks/useUsers.ts` (5min polling, useAllUsers variant)
- FIXED: `src/components/schedule/AutoAssignPanel.tsx` (excludeWeekends + excludeUserIds)
- FIXED: `src/components/schedule/DutyForm.tsx` (removed extra onUpdate prop)
- FIXED: `src/app/(app)/admin/settings/page.tsx` (fully functional)
