import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  authForm: FormGroup;
  isSignup = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    this.authForm = this.fb.group({
      nome: ['', Validators.required],
      email: [''],
      telefone: [''],
      password: ['', Validators.required]
    });
  }

  toggleMode() {
    this.isSignup = !this.isSignup;
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    if (this.isSignup) {
      // Save user info on signup, including password
      await this.userService.setUser({
        nome: this.authForm.value.nome,
        email: this.authForm.value.email,
        telefone: this.authForm.value.telefone,
        password: this.authForm.value.password
      });
      this.router.navigate(['/tabs/tab1']);
    } else {
      // On login, check if username exists in storage
      const storedUser = await this.userService.getUser();
      if (storedUser && storedUser.nome === this.authForm.value.nome) {
        if (storedUser.password === this.authForm.value.password) {
          // Username and password match
          this.router.navigate(['/tabs/tab1']);
        } else {
          // Password is wrong
          const toast = await this.toastCtrl.create({
            message: 'Palavra-passe incorreta.',
            duration: 3000,
            color: 'danger'
          });
          toast.present();
        }
      } else {
        // Username does not exist
        const toast = await this.toastCtrl.create({
          message: 'Utilizador não encontrado. Por favor, crie uma conta primeiro.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    }
  }
}
