import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Interface que representa um produto no histórico
export interface HistoricoProduto {
  id?: string;
  nome: string;
  quantidade: number;
  userId?: string;
  data?: Date;
  listaNome?: string;  // Nome da lista onde o produto foi adicionado
  listaId?: string;    // ID da lista onde o produto foi adicionado
}

@Injectable({ providedIn: 'root' })
export class HistoricoService {
  private currentUserId: string | null = null;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    // Observa as mudanças de autenticação
    this.afAuth.authState.subscribe(user => {
      this.currentUserId = user ? user.uid : null;
    });
  }

  // Adiciona um novo produto ao histórico (evitando duplicações)
  async adicionar(produto: HistoricoProduto): Promise<string> {
    console.log('HISTORICO-SERVICE - Tentando adicionar produto:', produto);
    
    if (!this.currentUserId) {
      // Tentar obter o usuário atual
      const currentUser = await this.afAuth.currentUser;
      if (currentUser) {
        this.currentUserId = currentUser.uid;
        console.log('HISTORICO-SERVICE - Usuário obtido:', this.currentUserId);
      } else {
        console.error('HISTORICO-SERVICE - Utilizador não autenticado');
        throw new Error('Utilizador não autenticado');
      }
    }

    // Verificar se já existe um produto EXATAMENTE igual no histórico recente (última hora)
    const umaHoraAtras = new Date();
    umaHoraAtras.setHours(umaHoraAtras.getHours() - 1);

    try {
      const existingSnapshot = await this.firestore.collection('historico', ref => 
        ref.where('userId', '==', this.currentUserId)
           .where('nome', '==', produto.nome)
           .where('listaNome', '==', produto.listaNome)
           .where('quantidade', '==', produto.quantidade) // Verificar quantidade também
           .where('data', '>=', umaHoraAtras) // Reduzir para última hora
      ).get().toPromise();

      if (existingSnapshot && existingSnapshot.docs.length > 0) {
        console.log('HISTORICO-SERVICE - Produto exatamente igual já existe no histórico recente, não adicionando duplicação');
        return existingSnapshot.docs[0].id;
      }

      const historicoItem = {
        ...produto,
        userId: this.currentUserId,
        data: new Date()
      };

      console.log('HISTORICO-SERVICE - Dados a serem salvos:', historicoItem);

      const docRef = await this.firestore.collection('historico').add(historicoItem);
      console.log('HISTORICO-SERVICE - Produto adicionado com sucesso, ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('HISTORICO-SERVICE - Erro ao adicionar ao histórico:', error);
      throw error;
    }
  }

  // Retorna todos os produtos do histórico do utilizador atual
  getAll(): Observable<HistoricoProduto[]> {
    console.log('HISTORICO - getAll() chamado');
    
    return this.afAuth.authState.pipe(
      switchMap(user => {
        console.log('HISTORICO - AuthState em getAll:', user?.uid);
        
        if (!user) {
          console.log('HISTORICO - Nenhum utilizador autenticado');
          return from([]);
        }

        console.log('HISTORICO - Carregando histórico para utilizador:', user.uid);
        
        // Carregar histórico sem orderBy para evitar problemas de índice
        return this.firestore.collection<HistoricoProduto>('historico', ref => {
          console.log('HISTORICO - Criando query para userId:', user.uid);
          return ref.where('userId', '==', user.uid);
        }).snapshotChanges().pipe(
          map(actions => {
            console.log('HISTORICO - Raw actions recebidas:', actions.length);
            
            if (actions.length === 0) {
              console.log('HISTORICO - Nenhum documento encontrado na coleção historico');
              return [];
            }
            
            const products = actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              
              console.log('HISTORICO - Processando documento:', id, data);
              
              // Converter data corretamente
              let dataConvertida: Date | undefined;
              if (data.data) {
                if (data.data.seconds) {
                  // Firestore Timestamp
                  dataConvertida = new Date(data.data.seconds * 1000);
                } else if (data.data.toDate) {
                  // Firestore Timestamp com método toDate
                  dataConvertida = data.data.toDate();
                } else if (typeof data.data === 'string' || data.data instanceof Date) {
                  dataConvertida = new Date(data.data);
                } else {
                  dataConvertida = new Date();
                }
              }
              
              const produto: HistoricoProduto = {
                id,
                nome: data.nome || 'Produto sem nome',
                quantidade: data.quantidade || 0,
                userId: data.userId,
                data: dataConvertida,
                listaNome: data.listaNome,
                listaId: data.listaId
              };
              
              console.log('HISTORICO - Produto processado:', produto);
              return produto;
            });
            
            // Ordenar no cliente por data
            products.sort((a, b) => {
              if (!a.data || !b.data) return 0;
              return new Date(b.data).getTime() - new Date(a.data).getTime();
            });
            
            console.log('HISTORICO - Produtos finais ordenados:', products.length, products);
            return products;
          })
        );
      })
    );
  }

  // Obtém histórico como Promise (para compatibilidade)
  async getAllAsPromise(): Promise<HistoricoProduto[]> {
    if (!this.currentUserId) {
      return [];
    }

    try {
      const snapshot = await this.firestore.collection<HistoricoProduto>('historico', ref => 
        ref.where('userId', '==', this.currentUserId)
           .orderBy('data', 'desc')
      ).get().toPromise();

      return snapshot?.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) || [];
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return [];
    }
  }

  // Remove um item do histórico
  async remover(id: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    try {
      await this.firestore.doc(`historico/${id}`).delete();
    } catch (error) {
      console.error('Erro ao remover do histórico:', error);
      throw error;
    }
  }

  // Limpa todo o histórico do utilizador
  async limparHistorico(): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    try {
      const snapshot = await this.firestore.collection('historico', ref => 
        ref.where('userId', '==', this.currentUserId)
      ).get().toPromise();

      const batch = this.firestore.firestore.batch();
      snapshot?.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      throw error;
    }
  }

  // Métodos de compatibilidade (para não quebrar código existente)
  async initStorage(): Promise<void> {
    // Método vazio para compatibilidade
    return Promise.resolve();
  }
}
