import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class Tab5Page implements OnInit {
  user: { nome?: string; email?: string; telefone?: string } = {};
  color = '#fff';
  showColorOption = false;

  constructor(private userService: UserService) {}

  async ngOnInit() {
    this.user = await this.userService.getUser();
  }

  changeColor(event: any) {
    this.color = event.target.value;
    document.documentElement.style.setProperty('--app-bg', this.color);
    document.documentElement.style.setProperty('--ion-color-primary', this.color);
  }

  toggleColorOption() {
    this.showColorOption = !this.showColorOption;
  }
}
