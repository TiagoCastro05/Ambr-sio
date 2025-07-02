import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthUserService } from '../core/auth-user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  isLoading = false;

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private afAuth: AngularFireAuth,
    private userService: AuthUserService
  ) {}

  async onSignup() {
    if (this.password !== this.confirmPassword) {
      this.showToast('As senhas não coincidem!', 'danger');
      return;
    }
    
    if (!this.email || !this.username || !this.password) {
      this.showToast('Por favor, preencha todos os campos', 'warning');
      return;
    }

    this.isLoading = true;
    
    try {
      console.log('SIGNUP - Iniciando criação de conta para:', this.email);
      
      // Criar usuário no Firebase
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      
      if (!userCredential.user) {
        throw new Error('Não foi possível criar a conta');
      }
      
      console.log('SIGNUP - Conta criada com UID:', userCredential.user.uid);
      
      // Criar perfil do usuário
      const userProfile = {
        nome: this.username,
        email: this.email,
        telefone: ''
      };
      
      // Salvar perfil
      await this.userService.saveUser(userProfile);
      console.log('SIGNUP - Perfil salvo com sucesso');
      
      // Logout para garantir que o usuário faça login novamente
      await this.afAuth.signOut();
      
      // Mostrar mensagem de sucesso com toast customizado e garantir maior visibilidade
      const successToast = await this.toastCtrl.create({
        message: 'Conta criada com sucesso! Redirecionando para login...',
        duration: 3000,
        color: 'success',
        position: 'middle',
        cssClass: 'custom-toast ion-color-success',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      
      await successToast.present();
      
      // Redirecionar para a página de login após mostrar a mensagem
      // Usa um timeout mais curto para não deixar o usuário esperando
      setTimeout(() => {
        this.router.navigate(['/login'], { 
          queryParams: { email: this.email }  // Passar o email como parâmetro
        });
      }, 1000);
    } catch (error: any) {
      console.error('SIGNUP - Erro ao criar conta:', error);
      
      // Tratar erros específicos
      if (error.code === 'auth/email-already-in-use') {
        this.showToast('Este email já está em uso', 'danger');
      } else if (error.code === 'auth/weak-password') {
        this.showToast('A senha deve ter pelo menos 6 caracteres', 'danger');
      } else if (error.code === 'auth/invalid-email') {
        this.showToast('Email inválido', 'danger');
      } else {
        this.showToast('Erro ao criar conta: ' + (error.message || 'Tente novamente'), 'danger');
      }
    } finally {
      this.isLoading = false;
    }
  }
  
  // Método para mostrar toast
  private async showToast(message: string, color: string, cssClass: string = 'toast-message') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      cssClass: cssClass
    });
    await toast.present();
    return toast;
  }

  onBack() {
    this.router.navigate(['/login']);
  }
}
