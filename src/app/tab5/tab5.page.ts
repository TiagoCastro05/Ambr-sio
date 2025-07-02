import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthUserService, UserProfile } from '../core/auth-user.service';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
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
  private userSubscription?: Subscription;

  constructor(
    private userService: AuthUserService,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('TAB5 - 🚀 ngOnInit iniciado');
    
    // ESTRATÉGIA DUPLA: Observable + Refresh manual
    
    // 1. Subscrever ao observable primeiro
    this.userSubscription = this.userService.user$.subscribe((userData) => {
      console.log('TAB5 - � Observable user$ recebido:', userData);
      
      if (userData) {
        this.user = {
          nome: userData.nome || '',
          email: userData.email || '',
          telefone: userData.telefone || ''
        };
        console.log('TAB5 - ✅ User atualizado via observable:', this.user);
      }
    });
    
    // 2. Forçar refresh do perfil
    setTimeout(async () => {
      console.log('TAB5 - � Forçando refresh do perfil...');
      try {
        await this.userService.forceReloadProfile();
        
        // Verificar o user depois do reload
        const currentUser = this.userService.getCurrentUser();
        console.log('TAB5 - � User após reload forçado:', currentUser);
        
        if (currentUser) {
          this.user = {
            nome: currentUser.nome || '',
            email: currentUser.email || '',
            telefone: currentUser.telefone || ''
          };
          console.log('TAB5 - ✅ User final após reload:', this.user);
        }
      } catch (error) {
        console.error('TAB5 - ❌ Erro no reload forçado:', error);
      }
    }, 1000);
    
    // 3. Fallback: verificação direta do Firestore se nada funcionar
    this.afAuth.authState.subscribe(async (authUser) => {
      if (authUser && (!this.user.nome || this.user.nome === '')) {
        console.log('TAB5 - 🆘 Fallback: verificação direta do Firestore para:', authUser.uid);
        
        try {
          const docRef = await this.firestore.firestore.doc(`users/${authUser.uid}`).get();
          
          if (docRef.exists) {
            const userData = docRef.data() as any;
            console.log('TAB5 - 📄 Dados diretos do Firestore (fallback):', userData);
            
            if (userData.nome) {
              this.user = {
                nome: userData.nome || '',
                email: userData.email || authUser.email || '',
                telefone: userData.telefone || ''
              };
              console.log('TAB5 - ✅ User atualizado via fallback:', this.user);
            }
          }
        } catch (error) {
          console.error('TAB5 - ❌ Erro no fallback:', error);
        }
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
      await this.afAuth.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}
