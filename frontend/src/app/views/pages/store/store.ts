import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GlobalConstants } from '../../../common/global-constants';
import { FetchAssetPipe } from '../../../pipe/ui/asset-fetch/asset-fetch-pipe';

import { Select } from '../../components/inputs/select/select';
import { FilterAccordion, FilterAccordionOption } from '../../components/inputs/filter-accordion/filter-accordion';

type FilterKey = 'breed' | 'gender' | 'age' | 'size' | 'price';

interface FilterGroupConfig {
  key: FilterKey;
  title: string;
  options: FilterAccordionOption[];
  startExpanded?: boolean;
}

const createEmptyFilters = (): Record<FilterKey, string[]> => ({
  breed: [],
  gender: [],
  age: [],
  size: [],
  price: [],
});

@Component({
  selector: 'app-store',
  imports: [FetchAssetPipe, CommonModule, FormsModule, Select, FilterAccordion],
  standalone: true,
  templateUrl: './store.html',
  styleUrl: './store.scss'
})
export class Store {

  public cdn = GlobalConstants.cdn;

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

  readonly filterMenuActive = signal(false);
  readonly filters = signal<Record<FilterKey, string[]>>(createEmptyFilters());
  readonly appliedProductCount = signal<number | null>(null);

  readonly filterGroups: FilterGroupConfig[] = [
    {
      key: 'breed',
      title: 'Breed',
      startExpanded: true,
      options: [
        { label: 'Cocker Spaniel', value: 'breed-cocker-spaniel' },
        { label: 'Doberman', value: 'breed-doberman' },
        { label: 'Dachshund', value: 'breed-dachshund' },
        { label: 'Boerboel', value: 'breed-boerboel' },
        { label: 'French Bulldog', value: 'breed-french-bulldog' },
        { label: 'Papillon', value: 'breed-papillon' },
        { label: 'Golden Retriever', value: 'breed-golden-retriever' },
        { label: 'Husky', value: 'breed-husky' },
        { label: 'Wolfdog', value: 'breed-wolfdog' },
      ],
    },
    {
      key: 'gender',
      title: 'Gender',
      startExpanded: false,
      options: [
        { label: 'Boy', value: 'gender-boy' },
        { label: 'Girl', value: 'gender-girl' },
      ],
    },
    {
      key: 'age',
      title: 'Age',
      startExpanded: false,
      options: [
        { label: '0.5 - 1.5 yrs', value: 'age-pup' },
        { label: '1.5 - 3 yrs', value: 'age-young' },
        { label: '3 - 7 yrs', value: 'age-adult' },
        { label: '7+ yrs', value: 'age-senior' },
      ],
    },
    {
      key: 'size',
      title: 'Size',
      startExpanded: false,
      options: [
        { label: 'Small', value: 'size-small' },
        { label: 'Medium', value: 'size-medium' },
        { label: 'Large', value: 'size-large' },
      ],
    },
    {
      key: 'price',
      title: 'Price',
      startExpanded: false,
      options: [
        { label: '€0 - €150', value: 'price-low' },
        { label: '€150 - €500', value: 'price-medium' },
        { label: '€500 - €1250', value: 'price-high' },
        { label: '€1250+', value: 'price-very-high' },
      ],
    },
  ];

  readonly filterMenuButtonLabel = computed(() =>
    this.filterMenuActive() ? 'Hide filters' : 'Show filters'
  );

  readonly appliedFilters = computed(() =>
    Object.values(this.filters()).flat()
  );

  readonly appliedFilterCount = computed(
    () => this.appliedFilters().length
  );

  toggleFilterMenu(): void {
    this.filterMenuActive.update(value => !value);
    const isActive = this.filterMenuActive();
    switch (isActive) {
      case true:
        // console.log('Filter menu is now active');
        break;
      case false:
        // console.log('Filter menu is now inactive');
        break;
      default:
        throw new Error();
        break;
    }
  }

  clearFilters(): void {
    this.filters.set(createEmptyFilters());
    this.appliedProductCount.set(null);
  }

  applyFilters(): void {
    // TODO: integrate real filter application logic
    // console.log('Applying filters', this.appliedFilters());
  }

  onFilterSelectedValuesChange(key: FilterKey, values: string[]): void {
    this.filters.update(current => ({
      ...current,
      [key]: values,
    }));
  }
}