import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GlobalConstants } from '../../../common/global-constants';
import { FetchAssetPipe } from '../../../pipe/ui/asset-fetch/asset-fetch-pipe';

import { Select } from '../../components/inputs/select/select';
import { filter } from 'rxjs';


@Component({
  selector: 'app-store',
  imports: [FetchAssetPipe, CommonModule, FormsModule, Select],
  standalone: true,
  templateUrl: './store.html',
  styleUrl: './store.scss'
})
export class Store {
  
  // CDN Variable
  public cdn = GlobalConstants.cdn;
  // Sorting variables
  selectedOption: { label: string; value: string } | null = null;
  options = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price | Asc ↑', value: 'price-asc' },
    { label: 'Price | Desc ↓', value: 'price-desc' },
    { label: 'Youngest', value: 'youngest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Best Rated', value: 'best-rated' },
  ];
  

  // TODO Add disabled state for idempotency
  // Filter variables
  filterMenuActive = signal(false);
  filterOptions = [];

  toggleFilterMenu(): void {

    // Change state
    this.filterMenuActive.update(value => !value);
    // Button text change
    document.querySelector('.input.filter button span')!.textContent = this.filterMenuActive() ? 'Hide filters' : 'Show filters';
    // Switch for further functionality decision making
    const isActive = this.filterMenuActive();
    switch (isActive) {
      case true:
        console.log('Filter menu is now active'); // Open menu functionality protocol
        break;
      case false:
        console.log('Filter menu is now inactive'); // Close menu functionality protocol
        break;
      default:
        console.log('Error!');
        break;
    }
  }

  clearFilters(): void {
    this.filterOptions = [];
  }

  applyFilters(): void {


    document.querySelector('.filter-text__product-count')!.textContent = ``; // Calculate this based on query results


    document.querySelector('.filter-text__filter-count')!.textContent = `(${this.filterOptions.length} applied)`;
  }
}
