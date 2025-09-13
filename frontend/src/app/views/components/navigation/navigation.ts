import { Component } from '@angular/core';
import { GlobalConstants } from '../../../common/global-constants';

@Component({
  selector: 'app-navigation',
  imports: [],
  standalone: true,
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss'
})
export class Navigation {
  public cdn = GlobalConstants.cdn;
  
}
