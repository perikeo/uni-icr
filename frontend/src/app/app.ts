import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './views/components/navigation/navigation';
import { Footer } from './views/components/footer/footer';
import { Layout } from './service/ui/layout/layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'frontend';
  constructor(public layout: Layout) {}
}
