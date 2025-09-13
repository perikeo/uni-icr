// fetch-asset.pipe.ts (standalone, impure)
import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SafeHtml } from '@angular/platform-browser';
import { AssetFetchService } from '../../../service/ui/asset-fetch/asset-fetch-service';

@Pipe({ name: 'fetchAsset', standalone: true, pure: false })
export class FetchAssetPipe implements PipeTransform, OnDestroy {
  private sub?: Subscription;
  private lastUrl?: string;
  private value: SafeHtml | null = null;

  constructor(private assets: AssetFetchService) {}

  transform(url: string | null | undefined): SafeHtml | null {
    if (!url) return null;
    if (url === this.lastUrl) return this.value;

    this.lastUrl = url;
    this.sub?.unsubscribe();
    this.value = null;

    this.sub = this.assets.getSvg(url).subscribe(v => (this.value = v));
    return this.value; // returns last value until fetch completes
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
