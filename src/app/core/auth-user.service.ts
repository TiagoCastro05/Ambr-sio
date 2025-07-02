import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface UserProfile {
  id?: string;
  nome?: string;
  email?: string;
  telefone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthUserService {
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  public user$ = this.userSubject.asObservable();
  private currentUserId: string | null = null;
  public user: UserProfile | null = null;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    console.log('AUTH SERVICE - 🚀 Construtor iniciado');
    
    // Observa as mudanças de autenticação - OTIMIZADO PARA CARREGAMENTO RÁPIDO
    this.afAuth.authState.subscribe(async (user) => {
      console.log('AUTH SERVICE - 🔐 AuthState changed:', user?.uid, user?.email);
      
      if (user) {
        this.currentUserId = user.uid;
        console.log('AUTH SERVICE - ✅ UserId definido:', this.currentUserId);
        
        // Emitir um usuário básico imediatamente para que a UI possa mostrar algo
        const basicUser = {
          id: user.uid,
          nome: user.displayName || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          telefone: ''
        };
        
        this.user = basicUser;
        this.userSubject.next(basicUser);
        console.log('AUTH SERVICE - ⚡ Emitido usuário básico rápido:', basicUser);
        
        // Carrega dados completos do perfil em paralelo
        this.loadUserProfile(user.uid);
      } else {
        console.log('AUTH SERVICE - 🚪 Utilizador deslogado');
        this.currentUserId = null;
        this.user = null;
        this.userSubject.next(null);
      }
    });
    
    // Verificar se já há um utilizador autenticado
    this.afAuth.currentUser.then(user => {
      if (user && !this.currentUserId) {
        console.log('AUTH SERVICE - 🔄 Utilizador já autenticado encontrado:', user.uid);
        this.currentUserId = user.uid;
        this.loadUserProfile(user.uid);
      }
    }).catch(error => {
      console.log('AUTH SERVICE - ⚠️ Erro ao verificar utilizador atual:', error);
    });
  }

  // Carrega o perfil do utilizador do Firestore
  private async loadUserProfile(userId: string) {
    try {
      console.log('AUTH SERVICE - 🔍 CARREGANDO perfil para userId:', userId);
      
      const docRef = this.firestore.firestore.doc(`users/${userId}`);
      const doc = await docRef.get();
      
      console.log('AUTH SERVICE - Documento existe no Firestore?', doc.exists);
      
      if (doc.exists) {
        const userData = doc.data() as UserProfile;
        console.log('AUTH SERVICE - 📄 DADOS DO FIRESTORE:', userData);
        
        this.user = { 
          ...userData, 
          id: userId
        };
        
        console.log('AUTH SERVICE - ✅ USER FINAL carregado:', this.user);
      } else {
        console.log('AUTH SERVICE - ⚠️ DOCUMENTO NÃO EXISTE, criando user básico');
        
        // Obter email do Firebase Auth
        const authUser = await this.afAuth.currentUser;
        const authEmail = authUser?.email || '';
        
        this.user = {
          id: userId,
          nome: '',
          email: authEmail,
          telefone: ''
        };
        
        console.log('AUTH SERVICE - 📝 User básico criado:', this.user);
      }
      
      // IMPORTANTE: Garantir que o userSubject sempre emite o utilizador
      this.userSubject.next(this.user);
      console.log('AUTH SERVICE - 📡 User emitido via observable:', this.user);
      
      // Aguardar um pouco e forçar outra emissão para garantir que chegue aos componentes
      setTimeout(() => {
        console.log('AUTH SERVICE - 🔄 Re-emitindo user via observable (delayed):', this.user);
        this.userSubject.next(this.user);
      }, 500);
      
    } catch (error) {
      console.error('AUTH SERVICE - ❌ ERRO ao carregar perfil:', error);
      
      // Mesmo com erro, criar um user básico para não deixar null
      try {
        const authUser = await this.afAuth.currentUser;
        const authEmail = authUser?.email || '';
        
        this.user = {
          id: userId,
          nome: '',
          email: authEmail,
          telefone: ''
        };
        
        this.userSubject.next(this.user);
        console.log('AUTH SERVICE - 🆘 User de fallback criado:', this.user);
      } catch (fallbackError) {
        console.error('AUTH SERVICE - ❌ Erro crítico no fallback:', fallbackError);
      }
    }
  }

  // Guarda as informações do utilizador no Firestore
  async saveUser(userData: Partial<UserProfile>, targetUserId?: string): Promise<void> {
    const userId = targetUserId || this.currentUserId;
    
    if (!userId) {
      console.error('AUTH SERVICE - ERRO: Utilizador não autenticado!');
      throw new Error('Utilizador não autenticado');
    }

    try {
      console.log('AUTH SERVICE - SALVANDO utilizador:', userData, 'para userId:', userId);
      
      // FORÇAR os dados exatos sem defaults
      const userToSave = {
        nome: userData.nome,
        email: userData.email,
        telefone: userData.telefone || ''
      };
      
      console.log('AUTH SERVICE - DADOS FINAIS para salvar:', userToSave);
      
      // Salvar diretamente no Firestore
      await this.firestore.firestore.doc(`users/${userId}`).set(userToSave);
      
      console.log('AUTH SERVICE - ✅ SALVO NO FIRESTORE! Atualizando cache local...');
      
      this.user = { ...userToSave, id: userId };
      this.userSubject.next(this.user);
      
      console.log('AUTH SERVICE - ✅ CACHE ATUALIZADO:', this.user);
      
      // Verificar se foi realmente salvo
      const verificacao = await this.firestore.firestore.doc(`users/${userId}`).get();
      if (verificacao.exists) {
        console.log('AUTH SERVICE - ✅ VERIFICAÇÃO: Dados confirmados no Firestore:', verificacao.data());
      } else {
        console.error('AUTH SERVICE - ❌ VERIFICAÇÃO: Dados NÃO encontrados no Firestore!');
      }
      
    } catch (error) {
      console.error('AUTH SERVICE - ❌ ERRO CRÍTICO ao guardar utilizador:', error);
      throw error;
    }
  }

  // Obtém o utilizador atual
  getCurrentUser(): UserProfile | null {
    console.log('AUTH SERVICE - 📋 getCurrentUser chamado, user atual:', this.user);
    return this.user;
  }

  // Obtém o ID do utilizador atual
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // Método compatível com código existente
  async getUser(): Promise<UserProfile | null> {
    console.log('AUTH SERVICE - 📋 getUser chamado, user atual:', this.user);
    return this.getCurrentUser();
  }

  // Força o recarregamento do perfil do utilizador - OTIMIZADO
  async forceReloadProfile(): Promise<void> {
    console.log('AUTH SERVICE - 🔄 FORÇANDO reload do perfil...');
    
    if (this.currentUserId) {
      try {
        const docRef = this.firestore.firestore.doc(`users/${this.currentUserId}`);
        const doc = await docRef.get();
        
        if (doc.exists) {
          const userData = doc.data() as UserProfile;
          this.user = { 
            ...userData, 
            id: this.currentUserId 
          };
          
          // Emitir imediatamente
          this.userSubject.next(this.user);
          console.log('AUTH SERVICE - ✅ Perfil atualizado e emitido:', this.user);
          return;
        } else {
          // Criar perfil básico se não existir
          const authUser = await this.afAuth.currentUser;
          if (authUser) {
            const basicProfile = {
              id: this.currentUserId,
              nome: authUser.displayName || authUser.email?.split('@')[0] || 'Usuário',
              email: authUser.email || '',
              telefone: ''
            };
            
            // Salvar no Firestore e emitir
            await docRef.set({
              nome: basicProfile.nome,
              email: basicProfile.email,
              telefone: basicProfile.telefone
            });
            
            this.user = basicProfile;
            this.userSubject.next(this.user);
            console.log('AUTH SERVICE - ✅ Perfil básico criado e emitido:', basicProfile);
          }
        }
      } catch (error) {
        console.error('AUTH SERVICE - ❌ Erro no forceReloadProfile:', error);
      }
    } else {
      console.log('AUTH SERVICE - ⚠️ Nenhum utilizador autenticado para reload');
    }
  }

  // Atualiza informações específicas do utilizador
  async updateUser(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    try {
      await this.firestore.firestore.doc(`users/${this.currentUserId}`).update(updates);
      if (this.user) {
        this.user = { ...this.user, ...updates };
        this.userSubject.next(this.user);
      }
    } catch (error) {
      console.error('Erro ao atualizar utilizador:', error);
      throw error;
    }
  }

  // Busca usuário por username
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    try {
      const querySnapshot = await this.firestore.firestore
        .collection('users')
        .where('nome', '==', username)
        .limit(1)
        .get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { ...doc.data() as UserProfile, id: doc.id };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário por username:', error);
      return null;
    }
  }

  // Observable para obter informações do utilizador atual
  getUserData(): Observable<UserProfile | null> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return new Observable<UserProfile | null>(observer => {
            const unsubscribe = this.firestore.firestore
              .doc(`users/${user.uid}`)
              .onSnapshot(doc => {
                if (doc.exists) {
                  const userData = doc.data() as UserProfile;
                  observer.next({ ...userData, id: user.uid });
                } else {
                  observer.next(null);
                }
              }, error => {
                observer.error(error);
              });
            
            return () => unsubscribe();
          });
        } else {
          return from([null]);
        }
      })
    );
  }
}
