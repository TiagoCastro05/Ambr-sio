import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule], // Add required modules here
})
export class LoginPage {
  authForm: FormGroup;
  isSignup = false;

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth, // Inject AngularFireAuth here
    private router: Router,
    private toastCtrl: ToastController
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefone: [''], // Optional field for signup
    });
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    const { email, password } = this.authForm.value;

    if (this.isSignup) {
      try {
        await this.afAuth.createUserWithEmailAndPassword(email, password); // Use afAuth here
        this.router.navigate(['/tabs/tab1']);
        this.showToast('Account created successfully!', 'success');
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          this.showToast('O email já está em uso.', 'danger');
        } else {
          this.showToast(error.message, 'danger');
        }
      }
    } else {
      try {
        await this.afAuth.signInWithEmailAndPassword(email, password); // Use afAuth here
        this.router.navigate(['/tabs/tab1']);
        this.showToast('Entrada com sucesso!', 'success');
      } catch (error: any) {
        this.showToast('Falha de login: ' + error.message, 'danger');
      }
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
    });
    toast.present();
  }

  toggleMode() {
    this.isSignup = !this.isSignup;
  }
}
