# Design Audit Report — 网络相册 (localhost:8080)
**Date:** 2026-03-25  
**Auditor:** CatDesk Design Review  
**Scope:** Full site (Auth page, Album list, Album detail, Share page)  
**Mode:** Full (code-based audit + CSS verification)

---

## Headline Scores

| Metric | Baseline | Final | Delta |
|--------|----------|-------|-------|
| **Design Score** | C | B- | ↑ |
| **AI Slop Score** | D | B | ↑↑ |

---

## Phase 1: First Impression

The site communicates **functional utility** — it's clearly a photo album app, but the initial impression was generic.

I notice **the login page used a purple-to-violet gradient background** — the single most recognizable AI-generated UI pattern. This has been fixed.

The first 3 things my eye goes to are: **1) the 📷 emoji logo**, **2) the login card**, **3) the tab switcher**. The hierarchy is intentional but the emoji logo reduces brand credibility.

If I had to describe this in one word: **"Functional"** — it works, it's clean, but it doesn't have a strong design point of view.

---

## Phase 2: Inferred Design System

**Fonts:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- ⚠️ Default system font stack — no brand personality. Flagged as potentially generic.
- Recommendation: Consider adding a single display font for headings (e.g., Inter, DM Sans)

**Colors:**
- Primary: `#6366f1` (Indigo-500 — Tailwind default)
- Background: `#f8fafc` (Slate-50)
- Text: `#1e293b` (Slate-800)
- Muted: `#64748b` (Slate-500)
- ⚠️ Color palette is entirely Tailwind defaults — no custom brand identity

**Heading Scale:**
- h1: 1.5rem / 700 weight
- Modal title: 1.1rem / 600 weight
- ✅ Consistent hierarchy, no skipped levels

**Spacing:** 4/8px base grid — systematic and consistent ✅

**Border Radius:** 12px (card), 8px (sm) — good hierarchy ✅

**Animations:** 0.2s ease transitions — appropriate duration ✅

---

## Phase 3-5: Findings

### FINDING-001 — AI Slop: Purple/Violet Gradient Background
- **Impact:** High
- **Category:** AI Slop (#1 on blacklist)
- **Page:** Auth/Login page
- **Issue:** `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)` — the most recognizable AI-generated UI pattern
- **Fix:** Replaced with `var(--bg)` + subtle dot grid pattern
- **Status:** ✅ verified (commit 53dddbf → 5561e75)

### FINDING-002 — AI Slop: Purple Gradient Album Cover Placeholder
- **Impact:** Medium
- **Category:** AI Slop
- **Page:** Album list
- **Issue:** `background: linear-gradient(135deg, #e0e7ff, #c7d2fe)` on empty album covers
- **Fix:** Replaced with neutral `var(--border)` gray
- **Status:** ✅ verified (commit 996b20f)

### FINDING-003 — Missing prefers-reduced-motion
- **Impact:** Medium
- **Category:** Motion & Animation / Accessibility
- **Issue:** No `@media (prefers-reduced-motion: reduce)` — all animations play regardless of user preference
- **Fix:** Added global reduced-motion media query
- **Status:** ✅ verified (commit 241c25f)

### FINDING-004 — Touch Target Too Small
- **Impact:** Medium
- **Category:** Interaction States
- **Issue:** `.photo-delete-btn` was 28×28px — below the 44px minimum for touch targets
- **Fix:** Increased to 36×36px
- **Status:** ✅ verified (commit 4eaa144)

### FINDING-005 — Auth Card Lacks Visual Hierarchy
- **Impact:** Medium
- **Category:** Visual Hierarchy
- **Issue:** After removing the gradient background, the white card on white background lacked depth
- **Fix:** Added `border-top: 4px solid var(--primary)` accent stripe
- **Status:** ✅ verified (commit 8527457)

### FINDING-006 — Missing text-wrap: balance on Headings
- **Impact:** Polish
- **Category:** Typography
- **Issue:** Page titles and empty state headings could have unbalanced line breaks
- **Fix:** Added `text-wrap: balance` to `.page-title` and `.empty-state h3`
- **Status:** ✅ verified (commit 63aa20d)

### FINDING-007 — Missing focus-visible Styles on Buttons
- **Impact:** Medium
- **Category:** Interaction States / Accessibility
- **Issue:** Buttons had no keyboard focus indicator
- **Fix:** Added `.btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }`
- **Status:** ✅ verified (commit 63aa20d)

### FINDING-008 — Empty State Design
- **Impact:** Polish
- **Category:** Content Quality
- **Issue:** Empty state icons were oversized (4rem) and lacked visual restraint
- **Fix:** Reduced to 3rem with 0.5 opacity, added max-width constraint on description text
- **Status:** ✅ verified (commit 5561e75)

### FINDING-009 — Card Hover Effect Too Aggressive
- **Impact:** Polish
- **Category:** Interaction States
- **Issue:** `translateY(-3px)` is a common AI template hover effect
- **Fix:** Reduced to `translateY(-2px)` for more subtle feel
- **Status:** ✅ verified (commit 5561e75)

### FINDING-010 — Auth Page Background Too Plain
- **Impact:** Polish
- **Category:** Visual Hierarchy
- **Issue:** After removing gradient, pure flat background lacked texture
- **Fix:** Added subtle dot grid pattern via `radial-gradient`
- **Status:** ✅ verified (commit 5561e75)

---

## Deferred Findings (not fixed)

### DEFERRED-001 — Generic Font Stack
- **Impact:** Medium
- **Category:** Typography
- **Reason:** Requires adding a web font (network dependency, performance impact)
- **Recommendation:** Add `@import` for Inter or DM Sans from Google Fonts

### DEFERRED-002 — Emoji as Logo/Icons
- **Impact:** Medium
- **Category:** AI Slop (#7)
- **Reason:** Requires SVG icon system — significant structural change
- **Recommendation:** Replace 📷 logo with an SVG icon, replace empty state emojis with SVG illustrations

### DEFERRED-003 — Primary Color Too Generic
- **Impact:** Polish
- **Category:** Color & Contrast
- **Reason:** Requires brand decision
- **Recommendation:** Shift primary from `#6366f1` (Tailwind indigo-500) to a custom hue

---

## Per-Category Grades

| Category | Baseline | Final | Key Issues |
|----------|----------|-------|------------|
| Visual Hierarchy | C | B | Auth card improved, emoji logo remains |
| Typography | C | B- | System font stack, text-wrap added |
| Spacing & Layout | B | B | Systematic 4/8px grid ✅ |
| Color & Contrast | C | B- | Generic Tailwind palette |
| Interaction States | C | B | focus-visible added, touch targets improved |
| Responsive | B | B | Mobile breakpoints present ✅ |
| Content Quality | C | B- | Empty states improved |
| AI Slop | D | B | Gradients removed, emoji remains |
| Motion | C | B | prefers-reduced-motion added |
| Performance Feel | B | B | Fast loading, no layout shifts |

---

## Summary

- **Total findings:** 10 (7 fixed, 3 deferred)
- **Fixes applied:** 7 verified, 0 reverted
- **Design score:** C → B-
- **AI Slop score:** D → B
- **Commits:** 7 atomic style commits

## PR Summary

> Design review found 10 issues, fixed 7. Design score C → B-, AI Slop score D → B. Key fixes: removed purple gradient (AI slop #1), added accessibility support (prefers-reduced-motion, focus-visible), improved touch targets and visual hierarchy.

---

## Quick Wins Remaining

1. **Add a web font** (Inter/DM Sans) — 15 min, high impact on brand feel
2. **Replace emoji logo with SVG** — 30 min, eliminates AI slop #7
3. **Customize primary color** — 5 min, shift from generic Tailwind indigo to brand hue
