import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController, LoadingController, IonContent } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthUserService } from '../core/auth-user.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  
  email = '';
  username = '';
  password = '';
  confirmPassword = '';

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private userService: AuthUserService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async onSignup() {
    console.log('SIGNUP - Iniciando processo de criação de conta');
    
    // Validações básicas
    if (!this.email || !this.username || !this.password || !this.confirmPassword) {
      this.showToast('Por favor, preencha todos os campos', 'warning');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showToast('As palavras-passe não coincidem!', 'warning');
      return;
    }

    if (this.password.length < 6) {
      this.showToast('A palavra-passe deve ter pelo menos 6 caracteres', 'warning');
      return;
    }

    // Mostrar loading
    const loading = await this.loadingCtrl.create({
      message: 'Criando conta...',
      duration: 10000
    });
    await loading.present();

    try {
      console.log('SIGNUP - Tentando criar conta com Firebase');
      
      // Criar conta no Firebase
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      
      if (!userCredential.user) {
        throw new Error('Não foi possível criar a conta');
      }

      console.log('SIGNUP - Conta criada com sucesso no Firebase:', userCredential.user.uid);

      // Criar perfil do usuário
      const userProfile = {
        nome: this.username,
        email: this.email,
        telefone: ''
      };

      console.log('SIGNUP - Salvando perfil do usuário:', userProfile);

      // Aguardar um momento para garantir que o utilizador está autenticado
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        await this.userService.saveUser(userProfile);
        console.log('SIGNUP - Perfil salvo com sucesso');
      } catch (saveError) {
        console.error('SIGNUP - Erro ao salvar perfil (não crítico):', saveError);
      }

      // Fazer logout para garantir que o usuário tem que fazer login novamente
      await this.afAuth.signOut();
      console.log('SIGNUP - Logout realizado após criação da conta');

      // Fechar loading
      await loading.dismiss();

      // Mostrar mensagem de sucesso
      this.showToast('Conta criada com sucesso! Faça login para continuar.', 'success');

      // Aguardar um momento para mostrar a mensagem
      setTimeout(() => {
        console.log('SIGNUP - Redirecionando para login');
        this.router.navigate(['/login']);
      }, 2000);

    } catch (error: any) {
      console.error('SIGNUP - Erro ao criar conta:', error);
      
      // Fechar loading
      await loading.dismiss();

      // Mostrar erro específico
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'O e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A palavra-passe é muito fraca.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.showToast(errorMessage, 'danger');
    }
  }

  onBack() {
    this.router.navigate(['/login']);
  }

  // Método para mostrar mensagens toast
  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Método para fazer scroll automático quando o teclado aparece
  scrollToElement(event: any) {
    setTimeout(() => {
      const element = event.target;
      if (element && this.content) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 300);
  }
}
