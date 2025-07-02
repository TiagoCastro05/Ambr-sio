import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface que representa um produto com nome e quantidade
export interface Product {
  id?: string;
  nome: string;
  quantidade: number;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
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

  // Adiciona um produto à lista armazenada
  async addProduct(product: Product): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    const productWithUser = {
      ...product,
      userId: this.currentUserId
    };

    try {
      const docRef = await this.firestore.collection('products').add(productWithUser);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      throw error;
    }
  }

  // Obtém todos os produtos armazenados
  getProducts(): Observable<Product[]> {
    if (!this.currentUserId) {
      return from([]);
    }

    return this.firestore.collection<Product>('products', ref => 
      ref.where('userId', '==', this.currentUserId)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Product;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  // Obtém produtos como Promise (para compatibilidade)
  async getProductsAsPromise(): Promise<Product[]> {
    if (!this.currentUserId) {
      return [];
    }

    try {
      const snapshot = await this.firestore.collection<Product>('products', ref => 
        ref.where('userId', '==', this.currentUserId)
      ).get().toPromise();

      return snapshot?.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) || [];
    } catch (error) {
      console.error('Erro ao obter produtos:', error);
      return [];
    }
  }

  // Atualiza um produto
  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    try {
      await this.firestore.doc(`products/${id}`).update(updates);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  }

  // Remove um produto
  async deleteProduct(id: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    try {
      await this.firestore.doc(`products/${id}`).delete();
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      throw error;
    }
  }

  // Limpa todos os produtos do utilizador
  async clearAllProducts(): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Utilizador não autenticado');
    }

    try {
      const snapshot = await this.firestore.collection('products', ref => 
        ref.where('userId', '==', this.currentUserId)
      ).get().toPromise();

      const batch = this.firestore.firestore.batch();
      snapshot?.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao limpar produtos:', error);
      throw error;
    }
  }
}
