# Architecture Overview

> This document defines the architectural principles and boundaries for the Exotic Petshop monorepo. All contributors (human and AI) must respect these rules.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MONOREPO                                 │
├─────────────────────────────┬───────────────────────────────────┤
│        /frontend            │           /backend                 │
│    Angular 20               │      .NET 10 Clean Architecture    │
│                             │                                    │
│  ┌─────────────────────┐    │    ┌─────────────────────────┐    │
│  │   Browser           │    │    │      API Layer          │    │
│  │   main.ts           │◄───┼────►   Controllers, DTOs     │    │
│  └─────────────────────┘    │    └───────────┬─────────────┘    │
│                             │                │                   │
│                             │    ┌───────────▼─────────────┐    │
│                             │    │   Application Layer     │    │
│                             │    │   MediatR, CQRS,        │    │
│                             │    │   FluentValidation      │    │
│                             │    └───────────┬─────────────┘    │
│                             │                │                   │
│                             │    ┌───────────▼─────────────┐    │
│                             │    │    Domain Layer         │    │
│                             │    │   Entities, Value Obj,  │    │
│                             │    │   Domain Services       │    │
│                             │    └───────────┬─────────────┘    │
│                             │                │                   │
│                             │    ┌───────────▼─────────────┐    │
│                             │    │  Infrastructure Layer   │    │
│                             │    │   EF Core, External     │    │
│                             │    │   APIs, Background Jobs │    │
│                             │    └─────────────────────────┘    │
└─────────────────────────────┴───────────────────────────────────┘
```

---

## Backend Architecture (Clean Architecture)

### Layer Dependencies (STRICT)

```
API → Application → Domain ← Infrastructure
                      ↑
                      └── Infrastructure implements Domain interfaces
```

**Rules:**
- Domain has **zero** external dependencies (no EF, no HTTP, no MediatR)
- Application references Domain only
- Infrastructure implements Domain interfaces (Repository pattern)
- API references Application and Infrastructure (for DI registration only)

### Layers

#### 1. API Layer (`/backend/Controllers/`)
**Responsibility:** HTTP presentation, request/response handling

| Component | Purpose |
|-----------|---------|
| Controllers | HTTP endpoints, route mapping |
| DTOs | Request/Response shapes (API contracts) |
| Middleware | Exception handling, logging, auth |
| Filters | Action filters, validation |

**Rules:**
- Controllers are **thin**: validate input shape, call MediatR, return result
- No business logic in controllers
- All DTOs live here, not in Application

#### 2. Application Layer (`/backend/Application/`)
**Responsibility:** Use cases, orchestration, validation

| Component | Purpose |
|-----------|---------|
| Commands | Write operations (MediatR `IRequest<T>`) |
| Queries | Read operations (MediatR `IRequest<T>`) |
| Handlers | Command/Query handlers |
| Validators | FluentValidation rules per Command/Query |
| Behaviors | Cross-cutting (validation, logging, transactions) |

**Rules:**
- One handler per Command/Query (CQRS)
- All input validation via FluentValidation
- No direct database access (use Domain interfaces)
- No HTTP-specific types

> **Note on `IApplicationDbContext`:** The Application layer defines `IApplicationDbContext` with EF Core `DbSet<T>` properties. This is an intentional tradeoff for CQRS query handlers—it allows efficient projections and filtering directly against the DbContext without requiring repository abstractions for every read path. Commands that mutate state should still use repository interfaces defined in Domain when more complex invariant enforcement is needed.

**Structure:**
```
Application/
├── Features/
│   ├── Dogs/
│   │   ├── Commands/
│   │   │   ├── CreateDog/
│   │   │   │   ├── CreateDogCommand.cs
│   │   │   │   ├── CreateDogCommandHandler.cs
│   │   │   │   └── CreateDogCommandValidator.cs
│   │   └── Queries/
│   │       └── GetDogById/
│   │           ├── GetDogByIdQuery.cs
│   │           ├── GetDogByIdQueryHandler.cs
│   │           └── DogDto.cs
├── Common/
│   ├── Behaviors/
│   │   ├── ValidationBehavior.cs
│   │   └── LoggingBehavior.cs
│   └── Interfaces/
│       └── IApplicationDbContext.cs
```

#### 3. Domain Layer (`/backend/Domain/`)
**Responsibility:** Business rules, entities, domain logic

| Component | Purpose |
|-----------|---------|
| Entities | Core business objects with behavior |
| Value Objects | Immutable domain concepts |
| Domain Services | Cross-entity business logic |
| Interfaces | Repository contracts |
| Exceptions | Domain-specific exceptions |
| Events | Domain events |

**Rules:**
- **No framework dependencies** (no EF attributes, no MediatR)
- Entities encapsulate their own rules (rich domain model)
- Use Value Objects for concepts with equality by value
- Repository interfaces defined here, implemented in Infrastructure

#### 4. Infrastructure Layer (`/backend/Infrastructure/`)
**Responsibility:** External concerns, persistence, integrations

| Component | Purpose |
|-----------|---------|
| Persistence | EF Core DbContext, migrations, configurations |
| Repositories | Repository implementations |
| External Services | HTTP clients, third-party APIs |
| Background Jobs | Hosted services, scheduled tasks |
| Identity | Auth providers, token services |

**Rules:**
- Implements Domain interfaces
- All EF configuration here (Fluent API, not attributes)
- External API clients wrapped in services

### Data Access & Performance (CRITICAL)

Performance is a **first-class concern**, not an afterthought. Every query must be designed for efficiency.

#### Mandatory Rules

| Rule | Rationale |
|------|-----------|
| **1 API call = 1–2 SQL queries max** | Predictable latency, easier debugging |
| **Use joins/`Include` + projection** | Fetch related data (Dog → Breed → Size) in single round-trip |
| **NEVER N+1 queries** | Querying per row destroys performance at scale |
| **`AsNoTracking()` for reads** | Avoid change-tracker overhead on read-only paths |
| **Project to DTOs in LINQ** | Reduce memory, avoid loading unused columns |
| **One query per lookup table** | Breeds, Sizes, etc. fetched once, not per entity |

#### Query Design Checklist

Before merging any query handler:

1. [ ] Verified query count with logging/profiler (expect 1–2)
2. [ ] Related entities fetched via `Include()` or join, not separate queries
3. [ ] `AsNoTracking()` used for queries returning DTOs
4. [ ] Projection (`Select(...)`) used when returning read models
5. [ ] No loops that issue database calls

#### EF Core Configuration

```csharp
// In Infrastructure DI setup
services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)); // Default no-tracking
```

> **Exception:** Write operations (commands) should use tracking for change detection.

---

## Frontend Architecture

### Directory Structure

```
frontend/src/app/
├── common/                    # Shared utilities, constants
│   └── global-constants.ts    # CDN URLs, app-wide config
├── pipe/
│   └── ui/                    # UI-related pipes
│       └── asset-fetch/       # SVG fetching pipe
├── service/
│   ├── api/                   # HTTP API services (feature-based)
│   │   └── {feature}/         # e.g., dogs/, users/
│   ├── config/                # Configuration services
│   └── ui/                    # UI state services
│       ├── layout/            # Layout state (nav transparency, etc.)
│       └── asset-fetch/       # Asset caching service
└── views/
    ├── components/            # Reusable UI components
    │   ├── footer/
    │   ├── navigation/
    │   └── inputs/            # Form controls
    │       ├── select/        # PrimeNG wrappers
    │       └── filter-accordion/
    └── pages/                 # Route-level components
        ├── home/
        └── store/
```

### Component Rules

1. **Standalone components only** - no NgModules
2. **SCSS per component** - scoped styles
3. **File naming**: `{name}.ts`, `{name}.html`, `{name}.scss`, `{name}.spec.ts`
4. **Signals for state** - use Angular signals, not BehaviorSubjects

### Service Categories

| Category | Location | Purpose |
|----------|----------|---------|
| API Services | `service/api/{feature}/` | HTTP calls to backend |
| UI Services | `service/ui/` | UI state management |
| Config Services | `service/config/` | Environment, feature flags |

### API Communication Pattern

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Component      │────►│  Feature API     │────►│  BaseHttpService │
│                  │     │  (DogsApi)       │     │  (centralized)   │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  HTTP Interceptors│
                                                  │  - Auth token     │
                                                  │  - Error logging  │
                                                  │  - Loading state  │
                                                  └──────────────────┘
```

---

## Cross-Cutting Concerns

### Error Handling

**Backend:**
- Global exception middleware in API layer
- Consistent error response shape:
```json
{
  "type": "string",
  "title": "string",
  "status": 400,
  "detail": "string",
  "errors": { "field": ["error1", "error2"] }
}
```

**Frontend:**
- HTTP interceptor catches errors
- Error service provides user-friendly messages
- Components handle local error states

### Authentication Flow

```
Frontend                    Backend
   │                           │
   │  POST /auth/login         │
   ├──────────────────────────►│
   │                           │
   │  { accessToken, refresh } │
   │◄──────────────────────────┤
   │                           │
   │  GET /api/* (Bearer)      │
   ├──────────────────────────►│
   │                           │
```

### Validation Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend | Angular Forms | UX validation, immediate feedback |
| API | FluentValidation | Contract validation |
| Domain | Entity methods | Business rule enforcement |

### Operational Guidelines

- **Security** – AuthZ checks live in API/Application layers; Domain has no security framework dependencies.
- **Logging** – Use structured logging (`ILogger<T>`); let middleware and pipeline behaviors handle request/response logging.
- **Migrations** – Use EF Core migrations; prefer additive, backwards-compatible schema changes.

---

## Forbidden Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Business logic in controllers | Use Application handlers |
| EF types in Domain | Define interfaces, implement in Infra |
| Raw `HttpClient` in components | Use feature API services |
| Hardcoded URLs | Use `GlobalConstants` or environment |
| `any` types for API responses | Define explicit DTOs |
| God services with all methods | One handler per use case (CQRS) |

---

## Adding New Capabilities

### Backend: New Feature Checklist

1. [ ] Define Domain entities/value objects (if new)
2. [ ] Define Repository interface in Domain (if new)
3. [ ] Implement Repository in Infrastructure
4. [ ] Create Command/Query in Application
5. [ ] Create FluentValidation validator
6. [ ] Create MediatR handler
7. [ ] Add Controller endpoint in API
8. [ ] Write unit tests (handler, validator)
9. [ ] Write integration tests (endpoint)
10. [ ] Update feature README.md

### Frontend: New Feature Checklist

1. [ ] Create API service in `service/api/{feature}/`
2. [ ] Define DTO types
3. [ ] Create page component in `views/pages/`
4. [ ] Add route in `app.routes.ts`
5. [ ] Create reusable components in `views/components/`
6. [ ] Write component tests
7. [ ] Update feature README.md
