# Asset Fetch Service & Pipe

> Fetches and caches SVG assets for inline rendering with proper sanitization.

---

## Purpose

Safely fetch SVG assets from CDN and render them inline in templates. Provides:
- HTTP caching to prevent duplicate requests
- DOM sanitization for security
- Error handling with fallback

**Not responsible for:**
- Non-SVG assets (images, fonts)
- Asset upload
- CDN configuration

---

## Public API

### Service: `AssetFetchService`

```typescript
import { AssetFetchService } from './asset-fetch-service';

// Inject
constructor(private assetService: AssetFetchService) {}

// Fetch SVG
this.assetService.getSvg(url).subscribe(safeHtml => {
  // safeHtml is sanitized and safe to render
});
```

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getSvg(url)` | `string` | `Observable<SafeHtml>` | Fetches and caches SVG |

### Pipe: `FetchAssetPipe`

```typescript
// In component imports
import { FetchAssetPipe } from '../../pipe/ui/asset-fetch/asset-fetch-pipe';

@Component({
  imports: [FetchAssetPipe],
  // ...
})
```

**Template usage:**
```html
<span [innerHTML]="cdn + '/icons/logo.svg' | fetchAsset"></span>
```

---

## Invariants

1. **SVG only**: Only `.svg` files are allowed; other extensions throw error
2. **Cache hit**: Same URL returns cached result without HTTP request
3. **In-flight dedup**: Concurrent requests for same URL share single HTTP call
4. **Safe output**: All output is sanitized via `DomSanitizer.bypassSecurityTrustHtml`
5. **Error fallback**: Failed requests return empty HTML comment, not throw

---

## Usage Pattern

```typescript
// Component
import { Component } from '@angular/core';
import { GlobalConstants } from '../../../common/global-constants';
import { FetchAssetPipe } from '../../../pipe/ui/asset-fetch/asset-fetch-pipe';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [FetchAssetPipe],
  template: `
    <span [innerHTML]="cdn + '/icons/arrow.svg' | fetchAsset"></span>
  `
})
export class Example {
  public cdn = GlobalConstants.cdn;
}
```

---

## Dependencies

- `HttpClient` - for HTTP requests
- `DomSanitizer` - for HTML sanitization

---

## Testing

**Location:** 
- `asset-fetch-service.spec.ts`
- `asset-fetch-pipe.spec.ts`

**Run:**
```bash
ng test --include=**/asset-fetch*.spec.ts
```

---

## Gotchas

- **Impure pipe**: `FetchAssetPipe` is impure (`pure: false`) because it returns async values. This means it runs on every change detection cycle, but caching prevents redundant HTTP calls.
- **Memory**: Cache grows unbounded. For apps with many unique SVGs, consider implementing cache eviction.
- **CORS**: CDN must allow CORS for SVG requests from app origin.
- **SSR consideration**: HTTP calls during SSR may need TransferState to avoid double-fetching.
