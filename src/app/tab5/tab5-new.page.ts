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
    
    // Teste direto do estado do userService
    const currentUser = this.userService.getCurrentUser();
    console.log('TAB5 - 🔍 getCurrentUser() retorna:', currentUser);
    
    // Subscrever ao estado de autenticação
    this.afAuth.authState.subscribe(async (authUser) => {
      console.log('TAB5 - 🔐 Auth state:', authUser?.uid, authUser?.email);
      
      if (authUser) {
        // Teste direto do Firestore
        try {
          const docRef = await this.firestore.firestore.doc(`users/${authUser.uid}`).get();
          console.log('TAB5 - 📄 Documento existe?', docRef.exists);
          
          if (docRef.exists) {
            const userData = docRef.data() as any;
            console.log('TAB5 - 📊 Dados do Firestore:', userData);
            
            this.user = {
              nome: userData.nome || '',
              email: userData.email || authUser.email || '',
              telefone: userData.telefone || ''
            };
            console.log('TAB5 - ✅ User final:', this.user);
          } else {
            console.log('TAB5 - ⚠️ Documento não existe, usando dados básicos');
            this.user = {
              nome: '',
              email: authUser.email || '',
              telefone: ''
            };
          }
        } catch (error) {
          console.error('TAB5 - ❌ Erro no Firestore:', error);
          this.user = {
            nome: '',
            email: authUser.email || '',
            telefone: ''
          };
        }
      } else {
        console.log('TAB5 - 🚪 Não autenticado');
        this.user = {};
      }
    });

    // Observable do userService
    this.userSubscription = this.userService.user$.subscribe((userData) => {
      console.log('TAB5 - 📡 Observable user$:', userData);
      if (userData && userData.nome) {
        this.user = userData;
        console.log('TAB5 - ✅ Atualizado via observable:', this.user);
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
