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
  
  // Método auxiliar para definir usuário instantâneo (usado para aceleração extrema do login)
  setInstantUser(userData: UserProfile): void {
    console.log('AUTH SERVICE - ⚡ Definindo usuário instantâneo:', userData);
    this.user = userData;
    this.currentUserId = userData.id || null;
    this.userSubject.next({...userData});
  }

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    console.log('AUTH SERVICE - 🚀 Construtor iniciado');
    
    // Observa as mudanças de autenticação - SUPER OTIMIZADO PARA CARREGAMENTO INSTANTÂNEO
    this.afAuth.authState.subscribe((user) => {
      console.log('AUTH SERVICE - 🔐 AuthState changed:', user?.uid, user?.email);
      
      if (user) {
        this.currentUserId = user.uid;
        console.log('AUTH SERVICE - ✅ UserId definido:', this.currentUserId);
        
        // Emitir um usuário básico IMEDIATAMENTE para que a UI possa mostrar algo
        const basicUser = {
          id: user.uid,
          nome: user.displayName || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          telefone: ''
        };
        
        this.user = basicUser;
        
        // Emitir duas vezes em sequência para garantir que todos os componentes recebam
        this.userSubject.next({...basicUser});
        console.log('AUTH SERVICE - ⚡ Emitido usuário básico instantâneo:', basicUser);
        
        // Carrega dados completos do perfil em paralelo sem bloquear a UI
        setTimeout(() => {
          this.loadUserProfile(user.uid)
            .catch(err => console.error('AUTH SERVICE - ❌ Erro ao carregar perfil:', err));
        }, 0);
      } else {
        console.log('AUTH SERVICE - 🚪 Utilizador deslogado');
        this.currentUserId = null;
        this.user = null;
        this.userSubject.next(null);
      }
    });
    
    // Verificar se já há um utilizador autenticado (em background)
    setTimeout(() => {
      this.afAuth.currentUser.then(user => {
        if (user && !this.currentUserId) {
          console.log('AUTH SERVICE - 🔄 Utilizador já autenticado encontrado:', user.uid);
          this.currentUserId = user.uid;
          
          // Emitir um usuário básico imediatamente
          const basicUser = {
            id: user.uid,
            nome: user.displayName || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            telefone: ''
          };
          
          this.user = basicUser;
          this.userSubject.next({...basicUser});
          
          // Carregar perfil completo em background
          this.loadUserProfile(user.uid)
            .catch(err => console.error('AUTH SERVICE - ❌ Erro ao carregar perfil:', err));
        }
      }).catch(error => {
        console.log('AUTH SERVICE - ⚠️ Erro ao verificar utilizador atual:', error);
      });
    }, 0);
  }

  // Carrega o perfil do utilizador do Firestore com ULTRA PERFORMANCE
  private async loadUserProfile(userId: string): Promise<UserProfile> {
    try {
      console.log('AUTH SERVICE - 🔍 CARREGANDO perfil para userId:', userId);
      
      // Implementar um timeout global para toda a operação
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout global')), 3000)
      );
      
      // Criar a promise principal do carregamento
      const loadPromise = new Promise<UserProfile>(async (resolve) => {
        try {
          const docRef = this.firestore.firestore.doc(`users/${userId}`);
          
          // Tentar obter o documento com timeout de 1.5s
          let doc;
          try {
            doc = await Promise.race([
              docRef.get(),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1500))
            ]);
          } catch (fetchErr) {
            console.log('AUTH SERVICE - ⏱️ Timeout ao buscar do Firestore, usando dados básicos');
            throw fetchErr; // Repropagar para usar o fallback
          }
          
          if (doc && doc.exists) {
            const userData = doc.data() as UserProfile;
            console.log('AUTH SERVICE - 📄 DADOS DO FIRESTORE:', userData);
            
            const userProfile = { 
              ...userData, 
              id: userId
            };
            
            this.user = userProfile;
            this.userSubject.next({...userProfile});
            console.log('AUTH SERVICE - ✅ USER FINAL carregado e emitido:', userProfile);
            
            resolve(userProfile);
            return;
          }
          
          throw new Error('Documento não existe');
        } catch (error) {
          // Fallback: criar um usuário básico
          console.log('AUTH SERVICE - ⚠️ Usando fallback para criar user básico');
          const authUser = await this.afAuth.currentUser;
          
          if (!authUser) {
            throw new Error('Usuário Auth não disponível');
          }
          
          const basicProfile = {
            id: userId,
            nome: authUser.displayName || authUser.email?.split('@')[0] || 'Usuário',
            email: authUser.email || '',
            telefone: ''
          };
          
          // Salvar no Firestore sem bloquear
          this.firestore.firestore.doc(`users/${userId}`).set({
            nome: basicProfile.nome,
            email: basicProfile.email,
            telefone: basicProfile.telefone
          }).catch(err => console.error('AUTH SERVICE - Erro ao salvar perfil básico:', err));
          
          this.user = basicProfile;
          this.userSubject.next({...basicProfile});
          console.log('AUTH SERVICE - 📝 User básico criado e emitido:', basicProfile);
          
          resolve(basicProfile);
        }
      });
      
      // Combinar o carregamento com o timeout global
      const userProfile = await Promise.race([loadPromise, timeoutPromise]);
      
      // Emitir novamente após um curto intervalo para garantir que todos os componentes recebam
      setTimeout(() => {
        if (this.user) {
          console.log('AUTH SERVICE - 🔄 Re-emitindo user via observable (delayed)');
          this.userSubject.next({...this.user});
        }
      }, 500);
      
      return userProfile;
    } catch (error) {
      console.error('AUTH SERVICE - ❌ ERRO FINAL ao carregar perfil:', error);
      
      // Último recurso: usar o que tiver ou criar mínimo
      const fallbackProfile = this.user || {
        id: userId,
        nome: '',
        email: '',
        telefone: ''
      };
      
      if (!this.user) {
        this.user = fallbackProfile;
        this.userSubject.next(fallbackProfile);
        console.log('AUTH SERVICE - 🆘 Último recurso: perfil mínimo criado');
      }
      
      return fallbackProfile;
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

  // Força o recarregamento do perfil do utilizador - VERSÃO ULTRA OTIMIZADA
  async forceReloadProfile(): Promise<void> {
    console.log('AUTH SERVICE - 🔄 FORÇANDO reload do perfil...');
    
    if (this.currentUserId) {
      try {
        // Primeiro, emite um perfil básico IMEDIATAMENTE com base nas informações do Auth
        // ou nas informações já em cache
        let instantProfile: UserProfile;
        
        if (this.user) {
          // Se já temos dados no cache, usar imediatamente
          instantProfile = {...this.user};
          console.log('AUTH SERVICE - ⚡ Usando perfil em cache para emissão instantânea');
        } else {
          // Se não tem cache, tentar obter do Auth
          const authUser = await this.afAuth.currentUser;
          instantProfile = {
            id: this.currentUserId,
            nome: authUser?.displayName || authUser?.email?.split('@')[0] || 'Usuário',
            email: authUser?.email || '',
            telefone: ''
          };
          console.log('AUTH SERVICE - ⚡ Criando perfil básico para emissão instantânea');
        }
        
        // Atualizar o perfil no cache e emitir imediatamente
        this.user = instantProfile;
        this.userSubject.next({...instantProfile});
        console.log('AUTH SERVICE - ⚡ Perfil instantâneo emitido:', instantProfile);
        
        // Em background, inicia a busca no Firestore com tempo limite menor
        setTimeout(async () => {
          try {
            const docRef = this.firestore.firestore.doc(`users/${this.currentUserId}`);
            
            // Tentando obter perfil com um limite de tempo mais curto (800ms)
            const doc: any = await Promise.race([
              docRef.get(),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 800)
              )
            ]);
            
            if (doc && doc.exists) {
              const firestoreData = doc.data() as UserProfile;
              console.log('AUTH SERVICE - 📄 Perfil obtido do Firestore:', firestoreData);
              
              // Atualizar o perfil e emitir
              this.user = { 
                ...firestoreData, 
                id: this.currentUserId || undefined 
              };
              
              this.userSubject.next({...this.user});
              console.log('AUTH SERVICE - ✅ Perfil completo do Firestore emitido');
            } else {
              console.log('AUTH SERVICE - ⚠️ Documento não existe no Firestore');
              
              // Se o documento não existe, criar um com o perfil básico
              const authUser = await this.afAuth.currentUser;
              if (authUser) {
                const basicProfile = {
                  nome: authUser.displayName || authUser.email?.split('@')[0] || 'Usuário',
                  email: authUser.email || '',
                  telefone: ''
                };
                
                docRef.set(basicProfile)
                  .then(() => console.log('AUTH SERVICE - ✓ Perfil básico criado no Firestore'))
                  .catch((err: Error) => console.error('AUTH SERVICE - Erro ao salvar perfil:', err));
              }
            }
          } catch (err) {
            console.log('AUTH SERVICE - ⏱️ Timeout ao buscar perfil do Firestore, usando perfil básico', err);
          }
        }, 100);
        
        return;
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
