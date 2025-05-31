import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-tab4',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page {
  showCreateInput = false;
  nomeLista = '';
  listas: string[] = [];
  color = this.userService.getColor();

  constructor(private userService: UserService) {}

  onAddLista() {
    this.showCreateInput = true;
    this.nomeLista = '';
  }

  onSaveLista() {
    if (this.nomeLista.trim()) {
      this.listas.push(this.nomeLista.trim());
      this.showCreateInput = false;
      this.nomeLista = '';
    }
  }
}
