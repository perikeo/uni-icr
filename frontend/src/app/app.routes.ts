import { Routes } from '@angular/router';
import { Home } from './views/pages/home/home';
import { Store } from './views/pages/store/store';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'home', redirectTo: '', pathMatch: 'full'},
  
  {path: 'store', component: Store},
  // {path: 'store/:id', component: DogDetailPage},
];
