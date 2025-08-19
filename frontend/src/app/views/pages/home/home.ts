import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Layout } from '../../../service/ui/layout/layout';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  constructor( private layout: Layout ) {}

  ngOnInit() {
    this.layout.transparentNav.set(true);
  }
  ngOnDestroy() {
    this.layout.transparentNav.set(false)
  }
}
