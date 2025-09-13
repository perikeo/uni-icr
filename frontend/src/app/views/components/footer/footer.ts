import { Component } from '@angular/core';
import { GlobalConstants } from '../../../common/global-constants';

@Component({
  selector: 'app-footer',
  imports: [],
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  public cdn = GlobalConstants.cdn;

  currentYear = new Date().getFullYear();
}
