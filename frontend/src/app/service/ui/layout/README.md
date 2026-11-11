# Layout Service

> UI state management for layout-related concerns (navigation transparency, sidebar state, etc.)

---

## Purpose

Provides reactive state for layout components that need to coordinate across the app. Currently manages:
- Navigation bar transparency

**Not responsible for:**
- Business logic
- API calls
- Routing

---

## Public API

### Service: `Layout`

```typescript
import { Layout } from './layout';

// Inject
constructor(public layout: Layout) {}
```

| Property | Type | Description |
|----------|------|-------------|
| `transparentNav` | `Signal<boolean>` | Whether nav should be transparent |

### Usage

**In component:**
```typescript
export class Home implements OnInit, OnDestroy {
  constructor(private layout: Layout) {}

  ngOnInit() {
    this.layout.transparentNav.set(true);
  }
  
  ngOnDestroy() {
    this.layout.transparentNav.set(false);
  }
}
```

**In template:**
```html
<app-navigation [class.navigation--transparent]="layout.transparentNav()">
```

---

## Invariants

1. **Default state**: `transparentNav` is `false` by default
2. **Cleanup required**: Components that set `transparentNav(true)` MUST reset it in `ngOnDestroy`
3. **Single source of truth**: Only one component should "own" the transparent state at a time

---

## Dependencies

- None (standalone injectable)

---

## Testing

**Location:** `layout.spec.ts`

**Run:**
```bash
ng test --include=**/layout.spec.ts
```

---

## Gotchas

- Forgetting to reset state in `ngOnDestroy` will leave navigation transparent on other pages
- If multiple components try to control transparency, last one wins (no conflict resolution)
