import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Layout {

  constructor() { }
  transparentNav = signal(false);
}
