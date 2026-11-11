# Home Page

> Landing page with hero section and key marketing content.

---

## Purpose

Main entry point for the application. Displays:
- Hero section with transparent navigation
- Featured content
- Call-to-action elements

**Not responsible for:**
- Product listing (see Store)
- Navigation logic (see Navigation component)

---

## Public API

### Component: `Home`

**Route:** `/` (default), `/home` (redirects to `/`)

**Selector:** `app-home`

---

## Key Behavior

### Transparent Navigation

The home page activates transparent navigation mode for visual effect with hero section:

```typescript
ngOnInit() {
  this.layout.transparentNav.set(true);
}

ngOnDestroy() {
  this.layout.transparentNav.set(false);
}
```

**Critical:** Must reset in `ngOnDestroy` to prevent transparency persisting on other pages.

---

## Dependencies

- `Layout` service - Controls navigation transparency
- `GlobalConstants` - CDN URL for assets
- `FetchAssetPipe` - SVG rendering

---

## Invariants

1. **Navigation transparency**: Always transparent on home, never transparent elsewhere
2. **Cleanup required**: `ngOnDestroy` must reset `transparentNav`

---

## Testing

**Location:** `home.spec.ts`

**Run:**
```bash
ng test --include=**/home.spec.ts
```

### Key Test Scenarios

- [x] Component creates successfully
- [x] Sets `transparentNav` to `true` on init
- [x] Resets `transparentNav` to `false` on destroy

---

## Gotchas

- If you copy this component as a template, remember to remove the transparency logic unless needed
- SSR: The `ngOnInit`/`ngOnDestroy` lifecycle runs on server too; `Layout` service must be SSR-compatible
