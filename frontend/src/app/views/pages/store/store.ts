import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GlobalConstants } from '../../../common/global-constants';
import { FetchAssetPipe } from '../../../pipe/ui/asset-fetch/asset-fetch-pipe';

import { Select } from '../../components/inputs/select/select';
import { FilterAccordion, FilterAccordionOption } from '../../components/inputs/filter-accordion/filter-accordion';
@Component({
  selector: 'app-store',
  imports: [FetchAssetPipe, CommonModule, FormsModule, Select, FilterAccordion],
  standalone: true,
  templateUrl: './store.html',
  styleUrl: './store.scss'
})
export class Store {

  public cdn = GlobalConstants.cdn;
  
  
}