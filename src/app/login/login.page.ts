import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthUserService, UserProfile } from '../core/auth-user.service';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule], // Módulos necessários para a página
})
export class LoginPage {
  // Formulário reativo para autenticação
  authForm: FormGroup;

  // Define se está em modo de registo (signup) ou login
  isSignup = false;

  constructor(
    private fb: FormBuilder,                // Utilizado para criar o formulário
    private afAuth: AngularFireAuth,        // Serviço de autenticação do Firebase
    private router: Router,                 // Usado para navegar após login/signup
    private toastCtrl: ToastController,     // Mostra mensagens (toasts) de feedback
    private userService: AuthUserService,  // Serviço para gestão do utilizador
    private firebaseService: FirebaseService // Serviço para operações Firebase
  ) {
    // Criação do formulário com validações básicas
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],       // Campo obrigatório para login e signup
      password: ['', [Validators.required, Validators.minLength(6)]], // Campo obrigatório com mínimo de 6 caracteres
      nome: [''],                                                 // Campo obrigatório apenas para signup
      telefone: [''],                                             // Campo opcional (pode ser usado em registo)
    });
  }

  // Método chamado ao submeter o formulário
  async onSubmit() {
    // Verifica se o formulário está inválido
    if (this.authForm.invalid) return;

    const { email, password, nome, telefone } = this.authForm.value;

    // Se estiver em modo de registo
    if (this.isSignup) {
      try {
        // Tenta criar uma conta com email e password no Firebase
        const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
        
        if (!userCredential.user) {
          this.showToast('Erro ao criar conta. Tente novamente.', 'danger');
          return;
        }

        const userProfile = {
          nome: nome,
          email: email,
          telefone: telefone || ''
        };
        
        console.log('SIGNUP - Dados do formulário:', { nome, email, telefone });
        console.log('SIGNUP - Criando perfil do utilizador:', userProfile);
        console.log('SIGNUP - UID do utilizador criado:', userCredential.user.uid);
        
        // Aguarda um momento para garantir que o utilizador está autenticado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          await this.userService.saveUser(userProfile);
          console.log('SIGNUP - Perfil salvo com sucesso');
        } catch (saveError) {
          console.error('SIGNUP - Erro ao salvar utilizador:', saveError);
        }
        
        // Faz logout para garantir que o utilizador tem que fazer login novamente
        await this.afAuth.signOut();
        
        // Volta para o modo login e limpa o formulário
        this.isSignup = false;
        this.updateFormValidations();
        this.authForm.reset();
        
        // Mostra mensagem de sucesso
        this.showToast('Conta criada com sucesso! Faça login para continuar.', 'success');
      } catch (error: any) {
        // Erro específico se o email já estiver em uso
        if (error.code === 'auth/email-already-in-use') {
          this.showToast('O email já está em uso.', 'danger');
        } else {
          this.showToast(error.message, 'danger');
        }
      }
    } else {
      // Modo login
      try {
        // Tenta iniciar sessão com email e password
        const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
        console.log('LOGIN - ✅ Utilizador autenticado:', userCredential.user?.uid, userCredential.user?.email);
        
        // Forçar recarregamento do perfil imediatamente (sem espera)
        try {
          console.log('LOGIN - 🔄 Forçando reload do perfil imediatamente...');
          await this.userService.forceReloadProfile();
          
          // Se o usuário não tiver um nome no perfil, vamos criar um com base no email
          const userData = this.userService.getCurrentUser();
          console.log('LOGIN - � Dados do perfil carregados:', userData);
          
          if (userData && (!userData.nome || userData.nome.trim() === '')) {
            const emailUsername = email.split('@')[0];
            console.log('LOGIN - ✏️ Atualizando nome de usuário para:', emailUsername);
            await this.userService.updateUser({
              nome: emailUsername
            });
          }
        } catch (error) {
          console.log('LOGIN - ⚠️ Erro ao carregar perfil (não crítico):', error);
        }
        
        // Verificar dados órfãos após login bem-sucedido
        setTimeout(async () => {
          try {
            await this.firebaseService.verificarDadosOrfaos();
          } catch (error) {
            console.log('LOGIN - Erro na verificação (não crítico):', error);
          }
        }, 2000);
        
        this.router.navigate(['/tabs/tab1']); // Redireciona após login
        this.showToast('Entrada com sucesso!', 'success');
      } catch (error: any) {
        this.showToast('Falha de login: ' + error.message, 'danger');
      }
    }
  }

  // Método para mostrar uma mensagem de toast
  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
    });
    toast.present();
  }

  // Alterna entre modo login e registo
  toggleMode() {
    this.isSignup = !this.isSignup;
    this.updateFormValidations();
  }

  // Atualiza as validações do formulário baseado no modo atual
  private updateFormValidations() {
    if (this.isSignup) {
      // No signup, email e nome são obrigatórios
      this.authForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.authForm.get('nome')?.setValidators([Validators.required]);
    } else {
      // No login, email é obrigatório mas nome não
      this.authForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.authForm.get('nome')?.clearValidators();
    }
    this.authForm.get('email')?.updateValueAndValidity();
    this.authForm.get('nome')?.updateValueAndValidity();
  }
}
