import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-tab5',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page {
  user = this.userService.getUser() || { nome: '', email: '', telefone: '' };
  color = this.userService.getColor();

  constructor(private userService: UserService) {}

  changeColor(event: any) {
    this.color = event.target.value;
    this.userService.setColor(this.color);
    document.documentElement.style.setProperty('--app-bg', this.color);
    document.documentElement.style.setProperty('--ion-color-primary', this.color);
  }
}
