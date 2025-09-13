import { Component, OnInit, OnDestroy } from '@angular/core';
import { Layout } from '../../../service/ui/layout/layout';
import { GlobalConstants } from '../../../common/global-constants';
import { FetchAssetPipe } from '../../../pipe/ui/asset-fetch/asset-fetch-pipe';

@Component({
  selector: 'app-home',
  imports: [FetchAssetPipe],
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  constructor( private layout: Layout ) {}
  public cdn = GlobalConstants.cdn;

  ngOnInit() {
    this.layout.transparentNav.set(true);
  }
  ngOnDestroy() {
    this.layout.transparentNav.set(false)
  }
}
