import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  constructor(private router: Router) {}

  onLogin() {
    this.router.navigate(['/tabs']);
  }

  onSignup() {
    this.router.navigate(['/signup']);
  }

  onForgotPassword() {
    // Implement as needed
  }
}
