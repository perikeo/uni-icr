/** Usage guide
 * 
 */


import { Component, Input, forwardRef as ngForwardRef, ElementRef, Renderer2 } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Select as PrimeSelect } from 'primeng/select';
import { FetchAssetPipe } from '../../../../pipe/ui/asset-fetch/asset-fetch-pipe';
import { GlobalConstants } from '../../../../common/global-constants';

@Component({
  selector: 'custom-select',
  standalone: true,
  imports: [FormsModule, PrimeSelect, FetchAssetPipe],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: ngForwardRef(() => Select),
    multi: true
  }]
})
export class Select implements ControlValueAccessor {

  public cdn = GlobalConstants.cdn;

  @Input() options: any[] = [];
  @Input() optionLabel = 'label';
  @Input() placeholder = '';
  @Input() showClear = false;
  @Input() checkmark = false;

  value: any = null;
  disabled = false;

  constructor(private host: ElementRef<HTMLElement>, private renderer2: Renderer2) {}
  // open = true  -> 1.75rem 1.75rem 0.5rem 0.5rem
  // open = false -> 1.75rem 1.75rem 1.75rem 1.75rem
  toggleBorderRadius(open: boolean): void {
    const wrapper  = this.host.nativeElement.closest('.input.dropdown') as HTMLElement;
    const customEl = wrapper.querySelector('.p-select') as HTMLElement | null;
    if (!wrapper) return;
    const radius = open ? '1.75rem 1.75rem 0.5rem 0.5rem' : '1.75rem';
    this.renderer2.setStyle(wrapper, 'border-radius', radius);
    // If you need to restore via CSS var instead, use:
    // this.r2.removeStyle(wrapper, 'border-radius'); // when closing
  }

  rotateIcon(open: boolean): void {
    const wrapper  = this.host.nativeElement.closest('.input.dropdown') as HTMLElement;
    const icon = this.host.nativeElement.querySelector('div[role="button"] > span > div.icon') as HTMLElement;
    if (!wrapper) return;
    const rotation = open ? 'rotateX(180deg)' : 'rotateX(0deg)';
    this.renderer2.setStyle(icon, 'transform', rotation);
  }

  private _onChange: (v: any) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(v: any) { this.value = v; }
  registerOnChange(fn: any) { this._onChange = fn; }
  registerOnTouched(fn: any) { this._onTouched = fn; }

  /* public */ handleModelChange(v: any) { this.value = v; this._onChange(v); }
  /* public */ handleBlur() { this._onTouched(); } 
  setDisabledState(isDisabled: boolean) { this.disabled = isDisabled; }
}




