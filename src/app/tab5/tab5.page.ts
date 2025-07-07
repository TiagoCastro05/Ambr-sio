import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } fr        // Atualizar UI após sucesso apenas se não temos nome ainda
        if (!this.user.nome || this.user.nome === '[Nome não definido]') {
          const updatedUser = this.userService.getCurrentUser();
          if (updatedUser) {
            this.user = {
              nome: updatedUser.nome || '[Nome não definido]',
              email: updatedUser.email || '[Email não definido]',
              telefone: updatedUser.telefone || ''
            };
            this.cdr.detectChanges();
            console.log('TAB5 - ✅ UI atualizada após reload do Firestore');
          }
        }angular';
import { FormsModule } from '@angular/forms';
import { AuthUserService, UserProfile } from '../core/auth-user.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class Tab5Page implements OnInit, OnDestroy {
  user: { nome?: string; email?: string; telefone?: string } = {};
  color = '#fff';
  showColorOption = false;
  isLoading = false;
  private userSubscription?: Subscription;

  constructor(
    private userService: AuthUserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    console.log('TAB5 - 🔄 Iniciando carregamento do perfil...');
    
    // PRIMEIRA PRIORIDADE: Buscar nome DIRETO do Firestore
    try {
      const nomeDirecto = await this.userService.getDirectUserName();
      if (nomeDirecto && nomeDirecto.trim() !== '') {
        console.log('TAB5 - ⚡ Nome DIRETO encontrado:', nomeDirecto);
        this.user = {
          nome: nomeDirecto,
          email: this.user.email || '[Email não definido]',
          telefone: this.user.telefone || ''
        };
        this.cdr.detectChanges();
        console.log('TAB5 - ✅ UI atualizada com nome DIRETO');
      }
    } catch (error) {
      console.log('TAB5 - ⚠️ Erro na busca direta (tentando fallback):', error);
    }
    
    // SEGUNDA PRIORIDADE: Carregar dados instantâneos como fallback
    const instantUser = this.userService.getInstantUserData();
    if (instantUser && (!this.user.nome || this.user.nome === '[Nome não definido]')) {
      console.log('TAB5 - � Dados instantâneos de fallback:', instantUser);
      this.user = {
        nome: instantUser.nome || '[Nome não definido]',
        email: instantUser.email || '[Email não definido]',
        telefone: instantUser.telefone || ''
      };
      this.cdr.detectChanges();
    }
    
    // TERCEIRA PRIORIDADE: Subscrever ao observable do usuário
    this.userSubscription = this.userService.user$.subscribe((userData) => {
      console.log('TAB5 - 📄 Dados recebidos do serviço:', userData);
      if (userData && userData.nome && userData.nome.trim() !== '') {
        this.user = {
          nome: userData.nome || '[Nome não definido]',
          email: userData.email || '[Email não definido]',
          telefone: userData.telefone || ''
        };
        console.log('TAB5 - ✅ User atualizado na UI:', this.user);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  changeColor(event: any) {
    this.color = event.target.value;
  }

  toggleColorOption() {
    this.showColorOption = !this.showColorOption;
  }

  async logout() {
    try {
      console.log('TAB5 - 🚪 Iniciando logout...');
      await this.userService.logout();
      console.log('TAB5 - ✅ Logout realizado, redirecionando para login');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('TAB5 - ❌ Erro ao fazer logout:', error);
    }
  }

  async reloadProfile() {
    console.log('TAB5 - 🔄 Botão de recarregar perfil pressionado');
    
    this.isLoading = true;
    
    try {
      // Mostrar feedback visual imediato
      const button = document.querySelector('.reload-button ion-icon');
      if (button) {
        button.classList.add('spin-animation');
      }
      
      // PRIMEIRA PRIORIDADE: Buscar nome DIRETO do Firestore
      try {
        const nomeDirecto = await this.userService.getDirectUserName();
        if (nomeDirecto && nomeDirecto.trim() !== '') {
          console.log('TAB5 - ⚡ Nome DIRETO encontrado no reload:', nomeDirecto);
          this.user = {
            nome: nomeDirecto,
            email: this.user.email || '[Email não definido]',
            telefone: this.user.telefone || ''
          };
          this.cdr.detectChanges();
          console.log('TAB5 - ✅ UI atualizada com nome DIRETO no reload');
        }
      } catch (error) {
        console.log('TAB5 - ⚠️ Erro na busca direta no reload:', error);
      }
      
      // SEGUNDA TENTATIVA: Buscar dados instantâneos (sempre disponível)
      const instantUser = this.userService.getInstantUserData();
      if (instantUser && instantUser.nome && (!this.user.nome || this.user.nome === '[Nome não definido]')) {
        console.log('TAB5 - 💾 Dados instantâneos encontrados:', instantUser);
        this.user = {
          nome: instantUser.nome || '[Nome não definido]',
          email: instantUser.email || '[Email não definido]',
          telefone: instantUser.telefone || ''
        };
        this.cdr.detectChanges();
        console.log('TAB5 - ✅ UI atualizada com dados instantâneos');
      }
      
      // TERCEIRA TENTATIVA: Reload do Firestore com timeout reduzido
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 3000); // 3 segundos apenas
      });

      try {
        // Forçar reload do perfil com timeout curto
        await Promise.race([
          this.userService.forceReloadProfile(),
          timeoutPromise
        ]);
        
        console.log('TAB5 - ✅ Perfil recarregado do Firestore');
        
        // Atualizar UI após sucesso
        const updatedUser = this.userService.getCurrentUser();
        if (updatedUser) {
          this.user = {
            nome: updatedUser.nome || '[Nome não definido]',
            email: updatedUser.email || '[Email não definido]',
            telefone: updatedUser.telefone || ''
          };
          this.cdr.detectChanges();
          console.log('TAB5 - � UI atualizada após reload do Firestore');
        }
        
      } catch (reloadError) {
        console.log('TAB5 - ⚠️ Timeout/erro no reload (normal quando offline):', reloadError instanceof Error ? reloadError.message : 'Erro desconhecido');
        // Não é um erro crítico, já temos dados instantâneos
      }
      
    } catch (error) {
      console.error('TAB5 - ❌ Erro geral ao recarregar perfil:', error);
      
      // Fallback final: tentar obter qualquer dado disponível
      const fallbackUser = this.userService.getCurrentUser();
      if (fallbackUser) {
        console.log('TAB5 - 💾 Usando dados de fallback:', fallbackUser);
        this.user = {
          nome: fallbackUser.nome || '[Nome não definido]',
          email: fallbackUser.email || '[Email não definido]',
          telefone: fallbackUser.telefone || ''
        };
        this.cdr.detectChanges();
      }
    } finally {
      this.isLoading = false;
      
      // Remover animação
      setTimeout(() => {
        const button = document.querySelector('.reload-button ion-icon');
        if (button) {
          button.classList.remove('spin-animation');
        }
      }, 500);
    }
  }
}
