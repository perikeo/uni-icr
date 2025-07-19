import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './views/components/navigation/navigation';
import { Footer } from './views/components/footer/footer';
import { Home } from './views/pages/home/home';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, Footer, Home],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'frontend';
}
