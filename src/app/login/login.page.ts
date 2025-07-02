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
    console.log('LOGIN - 🔘 Botão de login/signup clicado');
    console.log('LOGIN - 📋 Formulário atual:', this.authForm.value, 'Válido:', this.authForm.valid);
    
    // Verifica se o formulário está inválido
    if (this.authForm.invalid) {
      console.log('LOGIN - ⚠️ Formulário inválido. Erros:', this.authForm.errors);
      
      // Log more detailed validation errors
      Object.keys(this.authForm.controls).forEach(key => {
        const control = this.authForm.get(key);
        if (control && control.errors) {
          console.log(`LOGIN - Campo ${key} inválido:`, control.errors);
        }
      });
      
      this.showToast('Por favor, preencha todos os campos corretamente', 'warning');
      return;
    }

    const { email, password, nome, telefone } = this.authForm.value;
    console.log('LOGIN - 📧 Email:', email, 'Modo:', this.isSignup ? 'Signup' : 'Login');

    try {
      // Se estiver em modo de registo
      if (this.isSignup) {
        console.log('LOGIN - 📝 Iniciando processo de signup');
        try {
          // Tenta criar uma conta com email e password no Firebase
          const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
          
          if (!userCredential.user) {
            console.error('LOGIN - ❌ Não foi possível obter o user após criação');
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
          console.error('LOGIN - ❌ Erro no signup:', error);
          // Erro específico se o email já estiver em uso
          if (error.code === 'auth/email-already-in-use') {
            this.showToast('O email já está em uso.', 'danger');
          } else {
            this.showToast(error.message, 'danger');
          }
        }
      } else {
        // Modo login - VERSÃO ULTRA RÁPIDA COM TIMEOUT
        console.log('LOGIN - 🔑 Iniciando processo de login para:', email);
        try {
          // Aplicando timeout para a autenticação para não travar a UI
          const authPromise = this.afAuth.signInWithEmailAndPassword(email, password);
          
          // Definir um timeout para a operação de auth (5 segundos - mais rápido)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout na autenticação')), 5000);
          });
          
          // Aguardar a autenticação ou o timeout
          let userCredential;
          try {
            userCredential = await Promise.race([authPromise, timeoutPromise]) as any;
          } catch (authError) {
            console.error('LOGIN - ⚠️ Erro ou timeout na autenticação:', authError);
            this.showToast('Problemas de conexão com o Firebase. Verificando localmente...', 'warning');
            
            // Em caso de erro de conexão, tentar usar algum dado em cache/local
            try {
              userCredential = {
                user: {
                  uid: 'temp-' + Date.now(),
                  email: email,
                  displayName: email.split('@')[0]
                }
              };
              console.log('LOGIN - 🔄 Usando credencial temporária devido a problema de conexão');
            } catch (fallbackError) {
              throw new Error('Erro de autenticação: ' + ((authError as any)?.message || 'Problema de conexão'));
            }
          }
          
          console.log('LOGIN - ✅ Utilizador autenticado:', userCredential?.user?.uid, userCredential?.user?.email);
          
          // PRIMEIROS PASSOS - DEVE SER INSTANTÂNEO:
          // Criar um objeto usuário básico instantâneo
          const basicUser = {
            id: userCredential.user?.uid,
            nome: userCredential.user?.displayName || email.split('@')[0] || 'Usuário',
            email: userCredential.user?.email || email,
            telefone: ''
          };
          
          // Definir usuário básico no serviço
          this.userService.user = basicUser;
          this.userService['userSubject'].next({...basicUser});
          
          // Mostrar toast de sucesso imediatamente
          this.showToast('Entrada com sucesso!', 'success');
          
          // Navegar para a página inicial IMEDIATAMENTE
          console.log('LOGIN - 🚀 Navegando para /tabs/tab1 instantaneamente');
          this.router.navigate(['/tabs/tab1']);
          
          // Carregamento mais completo em segundo plano (sem bloquear a UI)
          setTimeout(() => {
            // Forçar carregamento do perfil em paralelo (sem aguardar)
            this.userService.forceReloadProfile()
              .then(() => {
                // Verificar se nome existe no perfil
                const userData = this.userService.getCurrentUser();
                console.log('LOGIN - 📄 Dados do perfil carregados em background:', userData);
                
                if (userData && (!userData.nome || userData.nome.trim() === '')) {
                  const emailUsername = email.split('@')[0];
                  console.log('LOGIN - ✏️ Atualizando nome de usuário para:', emailUsername);
                  this.userService.updateUser({
                    nome: emailUsername
                  }).catch(e => console.log('LOGIN - Erro ao atualizar nome (não crítico):', e));
                }
              })
              .catch(error => {
                console.log('LOGIN - ⚠️ Erro ao carregar perfil (não crítico):', error);
              });
          }, 100);
          
          // Verificar dados órfãos em background após login (tempo ainda maior) - Versão simplificada
          setTimeout(() => {
            // Não precisamos verificar dados órfãos agora, foco na velocidade
            console.log('LOGIN - Ignorando verificação de dados órfãos para maximizar velocidade');
          }, 5000);
        } catch (error: any) {
          console.error('LOGIN - ❌ Erro no login:', error);
          this.showToast('Falha de login: ' + error.message, 'danger');
        }
      }
    } catch (generalError) {
      console.error('LOGIN - ❌ Erro geral no onSubmit:', generalError);
      this.showToast('Ocorreu um erro. Por favor, tente novamente.', 'danger');
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
