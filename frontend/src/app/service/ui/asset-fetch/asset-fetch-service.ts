// asset-fetch.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of, throwError } from 'rxjs';
import { finalize, map, shareReplay, tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AssetFetchService {
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  private cache = new Map<string, SafeHtml>();
  private inflight = new Map<string, Observable<SafeHtml>>();

  getSvg(url: string): Observable<SafeHtml> {
    if (!url) return throwError(() => new Error('fetch-asset: empty URL'));
    if (!/\.svg(\?.*)?$/i.test(url)) {
      return throwError(() => new Error(`fetch-asset: only .svg allowed (${url})`));
    }
    if (this.cache.has(url)) return of(this.cache.get(url)!);
    if (this.inflight.has(url)) return this.inflight.get(url)!;

    const req$ = this.http.get(url, { responseType: 'text' }).pipe(
      map(svg => this.sanitizer.bypassSecurityTrustHtml(svg)),
      tap(safe => this.cache.set(url, safe)),
      catchError(err => {
        console.error('fetch-asset failed', url, err);
        return of(this.sanitizer.bypassSecurityTrustHtml('<!-- fetch-asset failed -->'));
      }),
      finalize(() => this.inflight.delete(url)),
      shareReplay(1)
    );

    this.inflight.set(url, req$);
    return req$;
  }
}