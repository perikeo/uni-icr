# Custom Select Component

> PrimeNG Select wrapper with custom styling and form integration.

---

## Purpose

Wraps PrimeNG's `Select` component to:
- Apply custom styling consistent with design system
- Provide `ControlValueAccessor` for Angular forms
- Handle open/close animations (border radius changes)

**Not responsible for:**
- Data fetching
- Option filtering logic (handled by parent)

---

## Public API

### Component: `Select`

**Selector:** `custom-select`

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `options` | `any[]` | `[]` | Dropdown options |
| `optionLabel` | `string` | `'label'` | Property name for display |
| `placeholder` | `string` | `''` | Placeholder text |
| `showClear` | `boolean` | `false` | Show clear button |
| `checkmark` | `boolean` | `false` | Show checkmark on selected |

### Form Integration

```html
<!-- Template-driven -->
<custom-select
  [(ngModel)]="selectedOption"
  [options]="options"
  optionLabel="label"
  placeholder="Select...">
</custom-select>

<!-- Reactive forms -->
<custom-select
  formControlName="category"
  [options]="categories"
  optionLabel="name">
</custom-select>
```

---

## Usage Example

```typescript
// Component
@Component({
  imports: [FormsModule, Select],
  template: `
    <custom-select
      [(ngModel)]="sortBy"
      [options]="sortOptions"
      optionLabel="label"
      placeholder="Sort by">
    </custom-select>
  `
})
export class Store {
  sortBy: { label: string; value: string } | null = null;
  
  sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price ↑', value: 'price-asc' },
    { label: 'Price ↓', value: 'price-desc' }
  ];
}
```

---

## Styling

### CSS Variables Used

- `--input-border-radius` - Border radius (default: `1.75rem`)
- Applied via inline style manipulation for open/close states

### Open/Close Animation

Border radius changes when dropdown opens:
- **Closed:** `1.75rem` all corners
- **Open:** `1.75rem 1.75rem 0.5rem 0.5rem` (sharp bottom)

---

## Dependencies

- `primeng/select` - Base component
- `FormsModule` - Form integration
- `FetchAssetPipe` - Custom dropdown icon
- `GlobalConstants` - CDN URL

---

## Invariants

1. **ControlValueAccessor contract**: Must call `onChange` when value changes
2. **Disabled state**: Must respect `setDisabledState` calls
3. **Border radius reset**: Must restore border radius when dropdown closes

---

## Testing

**Location:** `select.spec.ts`

**Run:**
```bash
ng test --include=**/select.spec.ts
```

### Key Test Scenarios

- [ ] Renders with options
- [ ] Value changes propagate to form
- [ ] Disabled state works
- [ ] Border radius toggles on open/close

---

## Gotchas

- **Parent element lookup**: Uses `closest('.input.dropdown')` to find wrapper; ensure parent has these classes
- **PrimeNG version**: Depends on PrimeNG 20.x; selector is `p-select`, not `p-dropdown`
- **Renderer2 usage**: Uses Angular's Renderer2 for DOM manipulation (SSR-safe)
