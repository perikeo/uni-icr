import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GlobalConstants } from '../../../common/global-constants';
import { LpSelectComponent } from '../../components/inputs/select/select';
import { FetchAssetPipe } from '../../../pipe/ui/asset-fetch/asset-fetch-pipe';


@Component({
  selector: 'app-store',
  imports: [FetchAssetPipe, LpSelectComponent, CommonModule, FormsModule],
  standalone: true,
  templateUrl: './store.html',
  styleUrl: './store.scss'
})
export class Store {
  public cdn = GlobalConstants.cdn;

  sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price - Asc ↑', value: 'price-asc' },
    { label: 'Price - Desc ↓', value: 'price-desc' },
    { label: 'Youngest (Sort by youngest age first)', value: 'youngest' },
    { label: 'Oldest (Sort by oldest age first)', value: 'oldest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Best Rated', value: 'best-rated' },
  ];
  sort = 'newest';
  onSort(v: string) { /* side effects */ }
}
