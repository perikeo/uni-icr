# Filter Accordion Component

> Expandable filter group with multi-select checkboxes.

---

## Purpose

Displays a collapsible group of checkbox options for filtering. Used in store filters for categories like breed, gender, age, etc.

**Not responsible for:**
- Filter logic/application (handled by parent)
- API calls
- Persisting filter state

---

## Public API

### Component: `FilterAccordion`

**Selector:** `filter-accordion`

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | ✅ | Header text |
| `options` | `FilterAccordionOption[]` | No | Available options |
| `startExpanded` | `boolean` | No | Initial expanded state (default: `true`) |
| `selectedValues` | `string[]` | No | Pre-selected values |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `selectionChange` | `FilterAccordionSelectionChange` | Emitted when selection changes |

### Types

```typescript
interface FilterAccordionOption {
  label: string;   // Display text
  value: string;   // Unique identifier
  disabled?: boolean;
}

interface FilterAccordionSelectionChange {
  value: string;      // Changed option value
  selected: boolean;  // New selection state
  values: string[];   // All currently selected values
}
```

---

## Usage Example

```typescript
@Component({
  imports: [FilterAccordion],
  template: `
    <filter-accordion
      title="Breed"
      [options]="breedOptions"
      [selectedValues]="selectedBreeds()"
      [startExpanded]="true"
      (selectionChange)="onBreedChange($event)">
    </filter-accordion>
  `
})
export class Store {
  readonly selectedBreeds = signal<string[]>([]);
  
  breedOptions: FilterAccordionOption[] = [
    { label: 'Golden Retriever', value: 'golden' },
    { label: 'Husky', value: 'husky' },
    { label: 'Bulldog', value: 'bulldog' }
  ];
  
  onBreedChange(event: FilterAccordionSelectionChange) {
    this.selectedBreeds.set(event.values);
  }
}
```

---

## State Management

Uses signals internally:

```typescript
// Expanded/collapsed state
protected readonly expanded = signal(true);

// Selected values (Set for O(1) lookup)
protected readonly selection = signal<Set<string>>(new Set());
```

---

## Accessibility

- Uses `role="region"` with `aria-labelledby`
- Trigger has `aria-expanded` and `aria-controls`
- Generates unique `contentId` per instance

---

## Dependencies

- `FetchAssetPipe` - Chevron icon
- `GlobalConstants` - CDN URL
- `NgFor`, `NgIf` - Template directives

---

## Invariants

1. **Selection sync**: `selectedValues` input syncs to internal state (one-way binding)
2. **Event emission**: Every toggle emits `selectionChange` with complete current selection
3. **Unique IDs**: Each instance has unique `contentId` for ARIA
4. **Initial state**: `startExpanded` only affects initial render, not subsequent changes

---

## Testing

**Location:** `filter-accordion.spec.ts`

**Run:**
```bash
ng test --include=**/filter-accordion.spec.ts
```

### Key Test Scenarios

- [ ] Renders with title and options
- [ ] Toggle expands/collapses content
- [ ] Checkbox selection emits event
- [ ] `selectedValues` input syncs state
- [ ] Disabled options cannot be selected

---

## Gotchas

- **Set comparison**: Uses deep comparison for `selectedValues` input to avoid unnecessary updates
- **ChangeDetectionStrategy.OnPush**: Uses OnPush for performance; ensure inputs are immutable
- **startExpanded**: Only affects initial state; changing after mount has no effect
