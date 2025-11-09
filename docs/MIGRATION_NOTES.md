# Migration Notes - Phase 0 to Phase 1

## Component Duplication (Intentional)

### Current State
There are currently **two sets of UI components**:

1. **Old Components** (in `apps/web/components/ui/`)
   - `avatar.tsx`
   - `button.tsx`
   - `card.tsx`
   - `dropdown-menu.tsx`
   - `input.tsx`
   - `label.tsx`
   - `radio-group.tsx`

2. **New Shared Components** (in `packages/shared/src/components/`)
   - `button.tsx`
   - `card.tsx`
   - `input.tsx`
   - `textarea.tsx`
   - `badge.tsx`

### Why Both Exist
- **Old components** are still used by the existing SaaS starter pages (dashboard, pricing, login)
- **New shared components** follow Apple design principles and are ready for Phase 1+ features
- Keeping both prevents breaking existing functionality during Phase 0

### Migration Plan (Phase 1+)
When implementing new ReplyGenie features:
1. **Use new shared components** from `@replygenie/shared`
2. **Gradually migrate** old pages to use new components
3. **Remove old components** once all pages are migrated
4. **Update imports** from `@/components/ui` to `@replygenie/shared`

### Import Patterns

**Old (existing pages):**
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

**New (Phase 1+ features):**
```typescript
import { Button, Card, Input, Badge } from '@replygenie/shared';
```

## Utilities

### ✅ Consolidated
The `cn()` utility function has been consolidated:
- **Source**: `packages/shared/src/utils.ts`
- **Re-exported**: `apps/web/lib/utils.ts` (for backward compatibility)
- All existing code continues to work without changes

## TypeScript Configuration

### ✅ Cleaned Up
- **Removed**: Duplicate `tsconfig.json` in root
- **Kept**: `tsconfig.base.json` (shared config for all packages)
- Each workspace package has its own `tsconfig.json` extending the base

## Documentation

### Active Documents
- ✅ `README.md` - Main project documentation
- ✅ `docs/plan.md` - Complete 3-phase implementation plan
- ✅ `docs/PHASE_0_COMPLETE.md` - Phase 0 completion report
- ✅ `docs/DESIGN_REFACTOR.md` - Apple design principles reference
- ✅ `docs/PRD.md` - Product requirements document
- ✅ `docs/MIGRATION_NOTES.md` - This file

### Removed/Cleaned
- ✅ `README_OLD.md` - Removed (replaced with new README)
- ✅ Duplicate `tsconfig.json` - Removed (using tsconfig.base.json)

## Next Steps for Phase 1

1. **Database Schema**: Create new tables for ReplyGenie (locations, reviews, drafts, etc.)
2. **New Pages**: Use shared components from `@replygenie/shared`
3. **Gradual Migration**: Optionally migrate existing pages to new components
4. **Component Cleanup**: Remove old components once migration is complete

---

**Status**: Phase 0 complete, ready for Phase 1 implementation
