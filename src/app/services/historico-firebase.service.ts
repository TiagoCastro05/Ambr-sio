import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface que representa um produto no histórico
export interface HistoricoProduto {
  id?: string;
  nome: string;
  quantidade: number;
  userId?: string;
  data?: Date;
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

  // Adiciona um novo produto ao histórico
  async adicionar(produto: HistoricoProduto): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    const historicoItem = {
      ...produto,
      userId: this.currentUserId,
      data: new Date()
    };

    try {
      const docRef = await this.firestore.collection('historico').add(historicoItem);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar ao histórico:', error);
      throw error;
    }
  }

  // Retorna todos os produtos do histórico do utilizador atual
  getAll(): Observable<HistoricoProduto[]> {
    if (!this.currentUserId) {
      return from([]);
    }

    return this.firestore.collection<HistoricoProduto>('historico', ref => 
      ref.where('userId', '==', this.currentUserId)
         .orderBy('data', 'desc')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as HistoricoProduto;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
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
