import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

export interface FilterAccordionOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FilterAccordionSelectionChange {
  value: string;
  selected: boolean;
  values: string[];
}

@Component({
  selector: 'filter-accordion',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './filter-accordion.html',
  styleUrl: './filter-accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterAccordion implements OnInit {

  private static nextId = 0;

  readonly contentId = `filter-accordion-${FilterAccordion.nextId++}`;

  protected readonly expanded = signal(true);
  protected readonly selection = signal<Set<string>>(new Set());

  @Input({ required: true }) title!: string;
  @Input() options: FilterAccordionOption[] = [];
  @Input() startExpanded = true;

  @Input()
  set selectedValues(values: string[] | null | undefined) {
    const normalized = values ?? [];
    const next = new Set(normalized);
    const current = this.selection();
    if (current.size === next.size && [...current].every(item => next.has(item))) {
      return;
    }
    this.selection.set(next);
  }

  get selectedValues(): string[] {
    return Array.from(this.selection());
  }

  @Output() selectedValuesChange = new EventEmitter<string[]>();
  @Output() selectionChange = new EventEmitter<FilterAccordionSelectionChange>();

  readonly selectedCount = computed(() => this.selection().size);

  ngOnInit(): void {
    if (!this.startExpanded) {
      this.expanded.set(false);
    }
  }

  toggle(): void {
    this.expanded.update(isOpen => !isOpen);
  }

  isSelected(value: string): boolean {
    return this.selection().has(value);
  }

  onOptionToggle(value: string, checked: boolean): void {
    const updated = new Set(this.selection());
    if (checked) {
      updated.add(value);
    } else {
      updated.delete(value);
    }

    this.selection.set(updated);
    const values = Array.from(updated);
    this.selectedValuesChange.emit(values);
    this.selectionChange.emit({ value, selected: checked, values });
  }

  trackByValue(_: number, option: FilterAccordionOption): string {
    return option.value;
  }
}
