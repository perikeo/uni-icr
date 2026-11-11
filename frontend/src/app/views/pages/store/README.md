# Store Page

> Product listing page with filtering, sorting, pagination, and grid display.

---

## Purpose

Displays available dogs with filtering, sorting, and pagination capabilities. Users can:
- Browse all available dogs in a 3x4 responsive grid
- Filter by breed, gender, age, size, price
- Sort by various criteria
- Navigate between pages of results
- Click cards to view dog detail pages

**Not responsible for:**
- Pet details view (separate `DogDetailPage` component)
- Cart/checkout flow
- Admin product management

---

## Public API

### Component: `Store`

**Route:** `/store`

**Selector:** `app-store`

### Related Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/store` | `Store` | Grid listing with filters |
| `/store/:id` | `DogDetailPage` | Individual dog details |

---

## Key Features

### Filter System

```typescript
// Filter state structure
type FilterKey = 'breed' | 'gender' | 'age' | 'size' | 'price';

interface FilterState {
  [key: FilterKey]: string[];
}
```

### Sorting Options

| Value | Description |
|-------|-------------|
| `newest` | Most recently added |
| `price-asc` | Price low to high |
| `price-desc` | Price high to low |
| `youngest` | Youngest first |
| `oldest` | Oldest first |
| `popular` | Most popular |
| `best-rated` | Highest rated |

### Pagination

- 12 items per page (3x4 grid)
- "Previous | Page X of Y | Next" navigation
- Automatically resets to page 1 when filters change

---

## Components Used

| Component | Purpose |
|-----------|---------|
| `FetchAssetPipe` | SVG icon rendering |
| `Select` | Sort dropdown (PrimeNG wrapper) |
| `FilterAccordion` | Expandable filter groups |
| `DogCard` | Individual dog card in grid |
| `Pagination` | Page navigation controls |

---

## State Management

Uses Angular signals for reactive state:

```typescript
// UI state
readonly filterMenuActive = signal(false);
readonly isLoading = signal(false);
readonly error = signal<string | null>(null);

// Filter selections
readonly filters = signal<Record<FilterKey, string[]>>(createEmptyFilters());
readonly currentSort = signal('newest');

// Pagination
readonly currentPage = signal(1);
readonly totalPages = signal(1);

// Data
readonly dogs = signal<DogListItem[]>([]);
```

### Data Flow

```
Filter/Sort/Page Change
         │
         ▼
    effect() triggers
         │
         ▼
   DogsApi.getDogs()
         │
         ▼
  Update dogs, totalPages signals
```

---

## API Integration

### DogsApi Service

```typescript
// Located at: service/api/dogs/dogs-api.ts

// Get filtered, sorted, paginated dogs
getDogs(params: DogsFilterParams): Observable<PaginatedResult<DogListItem>>

// Get individual dog details
getDogById(id: number): Observable<DogDetail | null>

// Get available filter options
getFilterOptions(): Observable<FilterOptions>
```

### Mock Data

Currently uses a mock implementation with 15 sample dogs. The service simulates:
- 150ms network delay
- Full filtering logic (OR within category, AND across categories)
- Pagination at database level

---

## Invariants

1. **Filter independence**: Each filter category operates independently
2. **Multi-select within category**: Multiple values can be selected per filter
3. **AND across categories**: Filters across categories are AND-ed (breed=X AND gender=Y)
4. **OR within category**: Multiple values in same category are OR-ed (breed=X OR breed=Y)
5. **Page reset on filter change**: Changing filters resets to page 1
6. **Loading state**: Shows loading indicator during API calls
7. **Error handling**: Displays error message with retry option

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `GlobalConstants` | CDN URL for assets |
| `DogsApi` | Data fetching service |
| `FetchAssetPipe` | Asset rendering |
| `Select`, `FilterAccordion` | Filter UI components |
| `DogCard` | Grid item component |
| `Pagination` | Page navigation |

---

## Testing

**Location:** `store.spec.ts`

**Run:**
```bash
ng test --include=**/store.spec.ts
```

### Key Test Scenarios

- [x] Renders without errors
- [x] Filter menu toggle works
- [x] Filter selections update state
- [x] Sort selection triggers data reload
- [x] Clear filters resets all state
- [x] Pagination navigation works
- [x] Loading state displays during fetch
- [x] Error state displays on failure

---

## Gotchas

- Filter accordion maintains its own expanded state; `startExpanded` only affects initial render
- Sort dropdown uses custom `Select` wrapper, not raw PrimeNG
- `effect()` for data fetching runs on any signal change - be careful adding dependencies
- Page change doesn't reset filters (intentional)
- Filter change resets page to 1 (intentional)
