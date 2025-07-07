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
    
    // Observa as mudanças de autenticação - CARREGAMENTO INSTANTÂNEO
    this.afAuth.authState.subscribe(async (user) => {
      console.log('AUTH SERVICE - 🔐 AuthState changed:', user?.uid, user?.email);
      
      if (user) {
        this.currentUserId = user.uid;
        console.log('AUTH SERVICE - ✅ UserId definido:', this.currentUserId);
        
        // PRIMEIRA PRIORIDADE: Tentar carregar nome do cache local
        const cachedName = this.getUserNameFromCache(user.uid);
        console.log('AUTH SERVICE - 💾 Nome do cache:', cachedName);
        
        const instantUser = {
          id: user.uid,
          nome: cachedName || '', // Usar nome do cache se disponível
          email: user.email || '',
          telefone: ''
        };
        
        this.user = instantUser;
        this.userSubject.next({...instantUser});
        console.log('AUTH SERVICE - ⚡ USER INSTANTÂNEO emitido (com cache):', instantUser);
        
        // SEGUNDA PRIORIDADE: Carregar do Firestore em background (sem await)
        this.loadUserProfileBackground(user.uid, cachedName);
        
      } else {
        console.log('AUTH SERVICE - � Utilizador deslogado');
        this.currentUserId = null;
        this.user = null;
        this.userSubject.next(null);
      }
    });
  }
  
  // Método para carregar perfil em background - VERSÃO OTIMIZADA PARA OFFLINE
  private async loadUserProfileBackground(userId: string, cachedName: string | null): Promise<void> {
    try {
      console.log('AUTH SERVICE - 🔄 Carregando perfil em background...');
      
      const docRef = this.firestore.firestore.doc(`users/${userId}`);
      
      // Usar timeout mais agressivo para background
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout background')), 2000); // 2 segundos apenas
      });
      
      const doc = await Promise.race([
        docRef.get(),
        timeoutPromise
      ]);
      
      if (doc && doc.exists) {
        const userData = doc.data() as UserProfile;
        console.log('AUTH SERVICE - 📄 DADOS DO FIRESTORE (background):', userData);
        
        const userProfile = { 
          ...userData, 
          id: userId
        };
        
        // Atualizar cache se o nome mudou
        if (userData.nome && userData.nome !== cachedName) {
          this.saveUserNameToCache(userId, userData.nome);
        }
        
        this.user = userProfile;
        this.userSubject.next({...userProfile});
        console.log('AUTH SERVICE - ✅ USER FINAL atualizado (background):', userProfile);
      }
    } catch (error) {
      console.log('AUTH SERVICE - ⚠️ Erro no carregamento background (normal quando offline):', error instanceof Error ? error.message : 'Erro desconhecido');
      // Não é um erro crítico, continua com dados do cache
    }
  }

  // Carrega o perfil do utilizador do Firestore - VERSÃO OTIMIZADA PARA OFFLINE
  private async loadUserProfile(userId: string): Promise<UserProfile> {
    try {
      console.log('AUTH SERVICE - 🔍 Carregando perfil para:', userId);
      
      const docRef = this.firestore.firestore.doc(`users/${userId}`);
      
      // Tentar cache offline primeiro (mais rápido)
      try {
        const cachedDoc = await docRef.get({ source: 'cache' });
        if (cachedDoc && cachedDoc.exists) {
          const userData = cachedDoc.data() as UserProfile;
          console.log('AUTH SERVICE - 💾 Dados do cache Firebase:', userData);
          
          const userProfile = { 
            ...userData, 
            id: userId
          };
          
          this.user = userProfile;
          this.userSubject.next({...userProfile});
          console.log('AUTH SERVICE - ⚡ Perfil carregado do cache e emitido:', userProfile);
          
          // Salvar no cache local
          if (userData.nome) {
            this.saveUserNameToCache(userId, userData.nome);
          }
          
          return userProfile;
        }
      } catch (cacheError) {
        console.log('AUTH SERVICE - ⚠️ Cache Firebase não disponível:', cacheError instanceof Error ? cacheError.message : 'Erro desconhecido');
      }
      
      // Se cache não funcionou, tentar servidor (com timeout mais agressivo)
      const docPromise = docRef.get();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout do servidor')), 2000); // 2 segundos apenas
      });
      
      const doc = await Promise.race([docPromise, timeoutPromise]);
      
      if (doc && doc.exists) {
        const userData = doc.data() as UserProfile;
        console.log('AUTH SERVICE - 📄 Dados do Firestore (servidor):', userData);
        
        const userProfile = { 
          ...userData, 
          id: userId
        };
        
        // Salvar no cache
        if (userData.nome) {
          this.saveUserNameToCache(userId, userData.nome);
        }
        
        this.user = userProfile;
        this.userSubject.next({...userProfile});
        console.log('AUTH SERVICE - ✅ Perfil carregado e emitido:', userProfile);
        
        return userProfile;
      } else {
        console.log('AUTH SERVICE - ⚠️ Documento não existe no Firestore');
        return this.user || { id: userId, nome: '', email: '', telefone: '' };
      }
      
    } catch (error) {
      console.log('AUTH SERVICE - ⚠️ Erro ao carregar perfil:', error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Tentar usar cache local como último recurso
      const cachedName = this.getUserNameFromCache(userId);
      if (cachedName) {
        const fallbackUser = {
          id: userId,
          nome: cachedName,
          email: this.user?.email || '',
          telefone: this.user?.telefone || ''
        };
        console.log('AUTH SERVICE - 🔄 Usando cache local como fallback:', fallbackUser);
        return fallbackUser;
      }
      
      return this.user || { id: userId, nome: '', email: '', telefone: '' };
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
      
      // Salvar nome no cache local para acesso instantâneo
      if (userToSave.nome) {
        this.saveUserNameToCache(userId, userToSave.nome);
      }
      
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

  // Força o recarregamento do perfil do utilizador - VERSÃO OTIMIZADA PARA OFFLINE
  async forceReloadProfile(): Promise<void> {
    console.log('AUTH SERVICE - 🔄 Forçando reload do perfil...');
    
    if (!this.currentUserId) {
      console.log('AUTH SERVICE - ⚠️ Nenhum utilizador autenticado');
      return;
    }

    try {
      console.log('AUTH SERVICE - 🚀 Recarregando perfil para:', this.currentUserId);
      
      // PRIMEIRA TENTATIVA: Usar dados do cache local instantaneamente
      const cachedName = this.getUserNameFromCache(this.currentUserId);
      if (cachedName && this.user) {
        console.log('AUTH SERVICE - ⚡ Usando cache local primeiro:', cachedName);
        this.user.nome = cachedName;
        this.userSubject.next({...this.user});
      }
      
      // SEGUNDA TENTATIVA: Tentar Firestore com timeout curto
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 3000); // 3 segundos apenas
      });

      // Carregar com timeout curto
      await Promise.race([
        this.loadUserProfile(this.currentUserId),
        timeoutPromise
      ]);
      
      console.log('AUTH SERVICE - ✅ Perfil recarregado do Firestore');
    } catch (error) {
      console.log('AUTH SERVICE - ⚠️ Erro no forceReloadProfile (usando cache):', error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Se falhar, garantir que pelo menos temos dados do cache
      if (this.user) {
        console.log('AUTH SERVICE - 💾 Mantendo dados do cache local');
        this.userSubject.next({...this.user});
      } else if (this.currentUserId) {
        // Último recurso: criar dados básicos do cache
        const cachedName = this.getUserNameFromCache(this.currentUserId);
        if (cachedName) {
          const fallbackUser = {
            id: this.currentUserId,
            nome: cachedName,
            email: '',
            telefone: ''
          };
          this.user = fallbackUser;
          this.userSubject.next({...fallbackUser});
          console.log('AUTH SERVICE - 🔄 Usando dados básicos do cache:', fallbackUser);
        }
      }
    }
  }

  // Atualiza informações específicas do utilizador
  async updateUser(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    try {
      console.log('AUTH SERVICE - 🔧 Atualizando usuário:', this.currentUserId, 'com dados:', updates);
      
      const docRef = this.firestore.firestore.doc(`users/${this.currentUserId}`);
      
      // Verificar se o documento existe
      const doc = await docRef.get();
      
      if (doc.exists) {
        // Se existe, fazer update
        console.log('AUTH SERVICE - 📝 Documento existe, fazendo update...');
        await docRef.update(updates);
      } else {
        // Se não existe, criar com set
        console.log('AUTH SERVICE - 📝 Documento não existe, criando com set...');
        const currentUser = await this.afAuth.currentUser;
        const fullData = {
          nome: updates.nome || '',
          email: updates.email || currentUser?.email || '',
          telefone: updates.telefone || '',
          ...updates
        };
        await docRef.set(fullData);
      }
      
      console.log('AUTH SERVICE - ✅ Dados salvos no Firestore');
      
      // Atualizar cache local se o nome foi alterado
      if (updates.nome && this.currentUserId) {
        this.saveUserNameToCache(this.currentUserId, updates.nome);
      }
      
      // Atualizar cache local
      if (this.user) {
        this.user = { ...this.user, ...updates, id: this.currentUserId };
      } else {
        this.user = { ...updates, id: this.currentUserId } as UserProfile;
      }
      
      console.log('AUTH SERVICE - 📢 Emitindo usuário atualizado:', this.user);
      this.userSubject.next({...this.user});
      
      // Verificar se foi realmente salvo
      const verification = await docRef.get();
      if (verification.exists) {
        console.log('AUTH SERVICE - ✅ Verificação: Dados confirmados no Firestore:', verification.data());
      } else {
        console.error('AUTH SERVICE - ❌ Verificação: Dados NÃO foram salvos!');
      }
      
    } catch (error) {
      console.error('AUTH SERVICE - ❌ Erro ao atualizar utilizador:', error);
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

  // Método para verificar e corrigir o nome do utilizador automaticamente
  async verificarECorrigirNomeSeNecessario(): Promise<void> {
    console.log('AUTH SERVICE - 🔍 Verificando se o nome precisa ser carregado...');
    
    if (!this.currentUserId) {
      console.log('AUTH SERVICE - ⚠️ Nenhum utilizador autenticado para verificar o nome');
      return;
    }

    try {
      // Verificar se já existe um nome válido no Firestore
      const docRef = this.firestore.firestore.doc(`users/${this.currentUserId}`);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const firestoreData = doc.data() as any;
        const nomeNoFirestore = firestoreData?.nome || '';
        
        console.log('AUTH SERVICE - 📄 Nome no Firestore:', nomeNoFirestore);
        
        // Se existe um nome no Firestore, usar ele
        if (nomeNoFirestore && nomeNoFirestore.trim() !== '') {
          console.log('AUTH SERVICE - ✅ Nome encontrado no Firestore:', nomeNoFirestore);
          
          // Atualizar o cache local com o nome do Firestore
          if (this.user) {
            this.user.nome = nomeNoFirestore;
            this.userSubject.next({...this.user});
            console.log('AUTH SERVICE - 🔄 Cache local atualizado com nome do Firestore:', nomeNoFirestore);
          }
        } else {
          console.log('AUTH SERVICE - ⚠️ Nome não encontrado no Firestore');
        }
      } else {
        console.log('AUTH SERVICE - ⚠️ Documento não existe no Firestore');
      }
      
    } catch (error) {
      console.error('AUTH SERVICE - ❌ Erro ao verificar nome:', error);
    }
  }

  // Método para logout
  async logout(): Promise<void> {
    console.log('AUTH SERVICE - 🚪 Fazendo logout...');
    try {
      await this.afAuth.signOut();
      this.currentUserId = null;
      this.user = null;
      this.userSubject.next(null);
      console.log('AUTH SERVICE - ✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('AUTH SERVICE - ❌ Erro ao fazer logout:', error);
      throw error;
    }
  }

  // Cache local para nome do usuário
  private getUserNameFromCache(userId: string): string | null {
    try {
      const cacheKey = `user_name_${userId}`;
      return localStorage.getItem(cacheKey);
    } catch (error) {
      console.log('AUTH SERVICE - ⚠️ Erro ao ler cache:', error);
      return null;
    }
  }

  private saveUserNameToCache(userId: string, nome: string): void {
    try {
      const cacheKey = `user_name_${userId}`;
      localStorage.setItem(cacheKey, nome);
      console.log('AUTH SERVICE - 💾 Nome salvo no cache:', nome);
    } catch (error) {
      console.log('AUTH SERVICE - ⚠️ Erro ao salvar cache:', error);
    }
  }

  // Método para obter dados instantâneos (sem esperar Firestore) - VERSÃO OTIMIZADA
  getInstantUserData(): UserProfile | null {
    console.log('AUTH SERVICE - ⚡ getInstantUserData chamado, user atual:', this.user);
    
    // Se já temos dados completos, retornar imediatamente
    if (this.user && this.user.nome && this.user.nome.trim() !== '') {
      console.log('AUTH SERVICE - ✅ Dados completos encontrados:', this.user);
      return this.user;
    }
    
    // Tentar obter do cache local se não temos dados completos
    if (this.currentUserId) {
      const cachedName = this.getUserNameFromCache(this.currentUserId);
      if (cachedName && cachedName.trim() !== '') {
        console.log('AUTH SERVICE - 💾 Nome do cache local:', cachedName);
        
        // Atualizar dados atuais com cache
        const instantUser = {
          id: this.currentUserId,
          nome: cachedName,
          email: this.user?.email || '',
          telefone: this.user?.telefone || ''
        };
        
        // Atualizar cache interno
        this.user = instantUser;
        this.userSubject.next({...instantUser});
        console.log('AUTH SERVICE - 🔄 Dados atualizados com cache:', instantUser);
        
        return instantUser;
      }
    }
    
    console.log('AUTH SERVICE - ⚠️ Nenhum dado instantâneo disponível');
    return this.user;
  }



  // Método DIRETO para buscar nome do usuário no Firestore
  async getDirectUserName(): Promise<string> {
    if (!this.currentUserId) {
      console.log('AUTH SERVICE - ⚠️ Nenhum usuário logado');
      return '';
    }

    try {
      console.log('AUTH SERVICE - 🔍 Buscando nome DIRETO do Firestore para:', this.currentUserId);
      
      // Buscar DIRETO do Firestore
      const docRef = this.firestore.firestore.doc(`users/${this.currentUserId}`);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const userData = doc.data() as UserProfile;
        const nome = userData?.nome || '';
        
        console.log('AUTH SERVICE - ✅ Nome encontrado DIRETO:', nome);
        
        if (nome && nome.trim() !== '') {
          // Salvar no cache local para próximas vezes
          this.saveUserNameToCache(this.currentUserId, nome);
          
          // Atualizar dados internos IMEDIATAMENTE
          if (this.user) {
            this.user.nome = nome;
          } else {
            this.user = {
              id: this.currentUserId,
              nome: nome,
              email: '',
              telefone: ''
            };
          }
          
          // Emitir atualização IMEDIATAMENTE
          this.userSubject.next({...this.user});
          console.log('AUTH SERVICE - 🔄 Nome atualizado DIRETAMENTE:', nome);
          
          return nome;
        }
      }
      
      console.log('AUTH SERVICE - ⚠️ Nome não encontrado no Firestore');
      return '';
      
    } catch (error) {
      console.log('AUTH SERVICE - ❌ Erro ao buscar nome direto:', error instanceof Error ? error.message : 'Erro desconhecido');
      return '';
    }
  }
}
