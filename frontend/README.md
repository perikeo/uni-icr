# Exotic Petshop Frontend

> Angular 20 standalone SPA for the exotic pet marketplace.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4200)
npm start

# Run tests
ng test

# Production build
ng build
```

---

## Folder Structure

```
src/app/
├── common/                    # Shared utilities
│   └── global-constants.ts    # CDN URLs, app-wide config
├── pipe/ui/                   # UI pipes (asset-fetch)
├── service/
│   ├── api/dogs/              # Dog API service + DTOs
│   ├── config/                # Configuration services
│   └── ui/layout/             # Layout state service
└── views/
    ├── components/            # Reusable UI components
    │   ├── dog-card/
    │   ├── footer/
    │   ├── inputs/            # Form controls (select, filter-accordion)
    │   ├── navigation/
    │   └── pagination/
    └── pages/                 # Route-level pages
        ├── home/
        ├── store/
        └── dog-detail/
```

---

## Conventions

### File Naming
```
home.ts, home.html, home.scss, home.spec.ts  ← NOT home.component.ts
```

### Components
- **Standalone only** – no NgModules
- **SCSS per component** – scoped styles
- **Signals for state** – use Angular signals, not BehaviorSubjects

### CDN Assets
```typescript
import { GlobalConstants } from '../../../common/global-constants';
public cdn = GlobalConstants.cdn;
// Template: {{ cdn + '/path/to/asset.svg' | fetchAsset }}
```

### Custom Form Controls
Wrap PrimeNG with `ControlValueAccessor`. Use `custom-` selector prefix.

---

## Environment Configuration

| Variable | Dev | Production |
|----------|-----|------------|
| `apiUrl` | `http://localhost:5223` | TBD |
| `production` | `false` | `true` |

Files: `src/environments/environment.ts`, `environment.production.ts`

---

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home` | Hero section, featured content |
| `/store` | `Store` | Dog listings with filtering/pagination |
| `/store/:id` | `DogDetail` | Individual dog details |

---

## API Integration

The `DogsApi` service (`service/api/dogs/dogs-api.real.ts`) connects to the backend:

```typescript
@Injectable({ providedIn: 'root' })
export class DogsApi {
  getAll(params?: FilterParams): Observable<PaginatedResult<DogDto>>
  getById(id: string): Observable<DogDto>
  getFilterOptions(): Observable<FilterOptionsDto>
}
```

---

## Testing

```bash
# Run all tests
ng test

# Run once (CI mode)
ng test --no-watch --browsers=ChromeHeadless

# With coverage
ng test --code-coverage
```

Test files live next to components: `home.spec.ts` alongside `home.ts`.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| PrimeNG | UI component library (Aura theme) |
| @angular/forms | Reactive forms |
| Karma/Jasmine | Unit testing |

---

## Invariants

- **No NgModules** – standalone components only
- **Signals over BehaviorSubjects** – for local/UI state
- **Design tokens** – use CSS variables (`--primary-*`, `--input-border-radius`)
- **Backend required** – API calls expect `http://localhost:5223` running
