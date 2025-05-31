import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-tab1',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
})
export class Tab1Page {
  color = this.userService.getColor();

  constructor(private userService: UserService) {}
}
