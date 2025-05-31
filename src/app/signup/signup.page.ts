import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  email = '';
  username = '';
  password = '';
  confirmPassword = '';

  constructor(private router: Router) {}

  onSignup() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // Store user info in localStorage
    localStorage.setItem('user', JSON.stringify({
      email: this.email,
      username: this.username,
      password: this.password
    }));
    this.router.navigate(['/login']);
  }

  onBack() {
    this.router.navigate(['/login']);
  }
}
