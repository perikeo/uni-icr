import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterAccordion } from './filter-accordion';

describe('FilterAccordion', () => {
  let component: FilterAccordion;
  let fixture: ComponentFixture<FilterAccordion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterAccordion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterAccordion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
