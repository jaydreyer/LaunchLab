# Phase 2A: Practice Setup Screen — Complete

**Date:** 2026-03-18
**Status:** Complete
**Branch:** feat/phase-2a-practice-setup

---

## What We Built

Replaced the Practice Setup page stub with a fully functional configuration screen. The page loads existing practice data from the backend via a new list endpoint, displays all 7 config sections in editable form (practice name, locations, providers, hours, appointment types, insurance rules, escalation rules), and supports Save, Reset to Defaults, and Load Sample actions with toast notifications. Also installed 8 new shadcn/ui components and established the first Zustand store and API hooks patterns for future screens.

### Key Files Created/Modified
| File/Directory | Purpose |
|----------------|---------|
| `frontend/src/api/practices.ts` | Typed API functions and TypeScript interfaces for all practice data shapes |
| `frontend/src/stores/practiceStore.ts` | Zustand store for practice state: fetch, save, reset, loadSample with loading/saving/error flags |
| `frontend/src/pages/PracticeSetup.tsx` | Main page: loads practice on mount, renders 7 section cards, Save/Reset/Load Sample buttons |
| `frontend/src/components/practice/SectionCard.tsx` | Reusable Card wrapper with title |
| `frontend/src/components/practice/LocationsSection.tsx` | Editable location cards: name, address, phone, same-day sick visits toggle |
| `frontend/src/components/practice/ProvidersSection.tsx` | Editable provider cards: name, title, badge toggles for locations and appointment types |
| `frontend/src/components/practice/HoursSection.tsx` | Per-location day-of-week grid with open/close time inputs and closed toggle |
| `frontend/src/components/practice/AppointmentTypesSection.tsx` | Editable rows: duration input, new patient toggle |
| `frontend/src/components/practice/InsuranceRulesSection.tsx` | Three tag lists (accepted/not accepted/uncertain) with add/remove via Enter or button |
| `frontend/src/components/practice/EscalationRulesSection.tsx` | Trigger keyword tag lists + editable escalation action text |
| `frontend/src/components/ui/{input,card,label,badge,table,sonner,switch,select}.tsx` | New shadcn/ui components installed |
| `frontend/src/App.tsx` | Added Sonner `<Toaster>` for toast notifications |
| `backend/routers/practices.py` | Added `GET /api/practices` list endpoint |
| `backend/services/practice_service.py` | Added `list_practices` service function |
| `docs/phase-2-plan.md` | Updated Phase 2A tasks to complete |

---

## Decisions Made

1. **Added `GET /api/practices` list endpoint.** The original API only had GET-by-ID, which required the frontend to already know the practice ID. Added a list endpoint so the frontend can auto-discover the practice on page load without needing localStorage or URL params. Since v1 only has one practice, the frontend takes the first result.

2. **Component-per-section architecture.** Split the Practice Setup page into 7 separate section components under `frontend/src/components/practice/` to keep files under the ~200 line limit. Each section receives its data slice and an `onChange` callback — the parent page owns the full practice state.

3. **Badge toggles for multi-select fields.** Providers' locations and appointment types use clickable Badge components that toggle on/off, rather than checkboxes or multi-select dropdowns. This keeps the UI compact and visually clear.

4. **Tag-based add/remove for lists.** Insurance rules and escalation triggers use a badge+input pattern: existing items shown as removable badges, new items added via text input with Enter key support. This avoids the complexity of editable tables for simple string lists.

5. **Sonner for toasts.** Used the shadcn/ui `sonner` component (Sonner library) for save/error/success notifications, positioned top-right with `richColors` enabled.

---

## Challenges and Resolutions

1. **base-ui Switch API compatibility.** shadcn v4 uses `@base-ui/react` instead of Radix. Confirmed that the base-ui Switch component supports the same `checked` / `onCheckedChange` prop API, so no adaptation was needed.

2. **Stash/merge conflict with docs branch.** The `docs/phase-2-3-plans` branch hadn't been merged to main yet. Had to merge the docs branch into main first, then create the feature branch, to avoid conflicts with the phase-2-plan.md file.

---

## What's Next: Phase 2B — Agent Config Screen

Build the Agent Config page with a two-column layout: an editor panel (left) for system prompt, workflow steps, guardrails, escalation triggers, tool policies, and tone guidelines, and a live preview panel (right) showing the assembled system prompt as Claude would receive it. See `docs/phase-2-plan.md` Phase 2B section and `docs/launchlab-v1-scope.md` Screen 2.
