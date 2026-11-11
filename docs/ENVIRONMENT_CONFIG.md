# Environment Configuration

> How to manage configuration across environments in the Exotic Petshop codebase.

---

## Overview

| Aspect | Backend | Frontend |
|--------|---------|----------|
| Config Source | `appsettings.json` + env vars | `environment.ts` files |
| Secrets | Environment variables / Azure Key Vault | Never in code |
| Build-time | N/A | Environment files baked in |
| Runtime | Full reload possible | Requires rebuild |

---

## Backend Configuration

### Configuration Sources (Priority Order)

1. **Environment variables** (highest priority)
2. **appsettings.{Environment}.json**
3. **appsettings.json** (base config)
4. **User secrets** (development only)

### File Structure

```
backend/
├── appsettings.json              # Base config (committed)
├── appsettings.Development.json  # Dev overrides (committed, no secrets)
├── appsettings.Production.json   # Prod structure (committed, no secrets)
└── secrets.json                  # User secrets (NOT committed)
```

### Configuration Pattern

```json
// appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=paws;Username=postgres;Password=<your-password>"  // Set via environment variable
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200"]
  },
  "Jwt": {
    "Issuer": "ExoticPetshop",
    "Audience": "ExoticPetshopApi",
    "SecretKey": ""  // NEVER commit - use env var
  },
  "ExternalApis": {
    "PaymentGateway": {
      "BaseUrl": "",
      "ApiKey": ""  // NEVER commit
    }
  }
}
```

> **Note:** Never commit actual passwords. Use environment variables or user secrets for sensitive values.

### Accessing Configuration

```csharp
// Strongly-typed configuration
public class JwtSettings
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 60;
}

// In Program.cs
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

// In services
public class TokenService
{
    private readonly JwtSettings _settings;
    
    public TokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }
}
```

### Environment Variables

Use double underscore (`__`) for nested config:

```bash
# Windows
set ConnectionStrings__DefaultConnection=Server=...

# Linux/Docker
export ConnectionStrings__DefaultConnection="Server=..."

# Docker Compose
environment:
  - ConnectionStrings__DefaultConnection=Server=db;Database=petshop;...
  - Jwt__SecretKey=${JWT_SECRET}
```

### User Secrets (Development)

```bash
# Initialize (one time)
dotnet user-secrets init

# Set secrets
dotnet user-secrets set "Jwt:SecretKey" "your-dev-secret-key"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;..."

# List secrets
dotnet user-secrets list
```

### Adding New Configuration

1. **Define the settings class:**
```csharp
public class NewFeatureSettings
{
    public string ApiUrl { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}
```

2. **Add to appsettings.json:**
```json
{
  "NewFeature": {
    "ApiUrl": "",
    "TimeoutSeconds": 30
  }
}
```

3. **Register in DI:**
```csharp
builder.Services.Configure<NewFeatureSettings>(
    builder.Configuration.GetSection("NewFeature"));
```

4. **Document in this file** (add to table below)

---

## Frontend Configuration

### Environment Files

```
frontend/src/
└── environments/
    ├── environment.ts           # Development (default)
    ├── environment.development.ts
    └── environment.production.ts
```

### Environment Structure

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5223',
  cdnUrl: 'https://a65e1400.cdn-25m.pages.dev',
  features: {
    enableNewCheckout: true,
    enableAnalytics: false
  }
};

// environment.production.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.exoticpetshop.com',
  cdnUrl: 'https://cdn.exoticpetshop.com',
  features: {
    enableNewCheckout: true,
    enableAnalytics: true
  }
};
```

### Accessing Environment Config

```typescript
// In services
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DogsApi {
  private baseUrl = `${environment.apiUrl}/api/dogs`;
}
```

### Centralized Config Service (Recommended)

```typescript
// service/config/app-config.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppConfig {
  readonly apiUrl = environment.apiUrl;
  readonly cdnUrl = environment.cdnUrl;
  readonly isProduction = environment.production;
  
  isFeatureEnabled(feature: keyof typeof environment.features): boolean {
    return environment.features[feature] ?? false;
  }
}
```

### Feature Flags Pattern

```typescript
// In component
@Component({ ... })
export class Checkout {
  private config = inject(AppConfig);
  
  readonly showNewCheckout = this.config.isFeatureEnabled('enableNewCheckout');
}
```

```html
<!-- In template -->
@if (showNewCheckout) {
  <app-new-checkout />
} @else {
  <app-legacy-checkout />
}
```

### Adding New Environment Value

1. **Add to all environment files:**
```typescript
// environment.ts
export const environment = {
  // ...existing
  newValue: 'dev-value'
};

// environment.production.ts
export const environment = {
  // ...existing
  newValue: 'prod-value'
};
```

2. **Update AppConfig service** (if using centralized approach)

3. **Document in this file**

---

## CDN Configuration

The CDN URL is centralized in `GlobalConstants`:

```typescript
// common/global-constants.ts
export class GlobalConstants {
  public static cdnURL = 'a65e1400.cdn-25m.pages.dev';
  public static cdn = `https://${this.cdnURL}`;
}
```

**Usage:**
```typescript
import { GlobalConstants } from '../common/global-constants';

public cdn = GlobalConstants.cdn;
// Template: {{ cdn }}/assets/image.svg
```

> **Note:** Consider migrating CDN URL to environment files for consistency.

---

## Configuration Reference

### Backend Settings

| Key | Type | Description | Secret? |
|-----|------|-------------|---------|
| `ConnectionStrings:DefaultConnection` | string | Database connection | ✅ Yes |
| `Jwt:SecretKey` | string | JWT signing key | ✅ Yes |
| `Jwt:Issuer` | string | JWT issuer | No |
| `Jwt:ExpirationMinutes` | int | Token lifetime | No |
| `Cors:AllowedOrigins` | string[] | Allowed CORS origins | No |
| `Logging:LogLevel:Default` | string | Default log level | No |

### Frontend Settings

| Key | Type | Description | Per-env? |
|-----|------|-------------|----------|
| `apiUrl` | string | Backend API base URL | ✅ Yes |
| `cdnUrl` | string | CDN base URL | ✅ Yes |
| `production` | boolean | Production mode flag | ✅ Yes |
| `features.*` | boolean | Feature flags | ✅ Yes |

---

## Secrets Management

### ❌ Never Commit

- Connection strings with passwords
- API keys
- JWT secrets
- OAuth client secrets
- Any credentials

### ✅ Safe to Commit

- Log levels
- Feature flags
- Non-sensitive URLs
- Timeout values
- Pagination defaults

### Production Secrets

| Platform | Method |
|----------|--------|
| Azure | Key Vault + Managed Identity |
| AWS | Secrets Manager / Parameter Store |
| Docker | Docker secrets / env files |
| Kubernetes | Kubernetes Secrets |

---

## Local Development Setup

### Prerequisites

- **Node.js** v22+
- **.NET 10 SDK**
- **PostgreSQL** 14+ running on localhost:5432

### Database Setup

```bash
# Create the database (using psql or pgAdmin)
CREATE DATABASE paws;
```

### Backend

```bash
# 1. Navigate to backend
cd backend

# 2. Set up user secrets
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=paws;Username=postgres;..."
dotnet user-secrets set "Jwt:SecretKey" "dev-secret-key-min-32-chars-long!"

# 3. Run
dotnet run
# API available at http://localhost:5223
# OpenAPI spec at http://localhost:5223/openapi/v1.json
```

### Frontend

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Run (uses environment.ts by default)
npm start
# App available at http://localhost:4200
```

### Full Stack

```bash
# Terminal 1 - Backend
cd backend && dotnet run

# Terminal 2 - Frontend  
cd frontend && npm start
```

---

## Build & Deploy Configuration

### Angular Build Configurations

```json
// angular.json
{
  "configurations": {
    "production": {
      "fileReplacements": [{
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.production.ts"
      }]
    }
  }
}
```

### Building for Production

```bash
# Frontend
ng build --configuration production

# Backend
dotnet publish -c Release
```

### CI/CD Environment Variables

Set these in your CI/CD pipeline:

```yaml
# Example GitHub Actions
env:
  ConnectionStrings__DefaultConnection: ${{ secrets.DB_CONNECTION }}
  Jwt__SecretKey: ${{ secrets.JWT_SECRET }}
```
