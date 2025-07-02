import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface Product {
  id?: string;
  nome: string;
  quantidade: number;
}

export interface Lista {
  id?: string;
  nome: string;
  products: Product[];
  userId?: string;
}

export interface Produto {
  id?: string;
  loja: string;
  tipoProduto: string;
  produto: string;
  quantidade: string;
  quantidadeNumero?: number;
  unidade?: string;
  validade: string;
  preco: string;
  listaNome: string;
  userId?: string;
}

export interface HistoricoProduto {
  id?: string;
  nome: string;
  quantidade: number;
  userId?: string;
  data?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private currentUserId: string | null = null;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    // Observa as mudanças de autenticação
    this.afAuth.authState.subscribe(user => {
      const oldUserId = this.currentUserId;
      this.currentUserId = user ? user.uid : null;
      
      console.log('FIREBASE - 🔐 Auth state changed:', {
        oldUserId,
        newUserId: this.currentUserId,
        userEmail: user?.email
      });
      
      // Quando há mudança de utilizador, garantir que os dados estão isolados
      if (oldUserId !== this.currentUserId) {
        console.log('FIREBASE - 🔄 Utilizador mudou, dados serão filtrados para:', this.currentUserId);
      }
    });
  }

  // Listas
  async addLista(lista: Lista): Promise<string> {
    if (!this.currentUserId) {
      console.error('FIREBASE - ❌ ERRO: Tentativa de criar lista sem utilizador autenticado!');
      throw new Error('Utilizador não autenticado');
    }
    
    console.log('FIREBASE - 📝 Adicionando lista para userId:', this.currentUserId);
    console.log('FIREBASE - 📋 Dados da lista recebidos:', lista);
    
    // GARANTIR que o userId está definido
    const listaComUserId = {
      ...lista,
      userId: this.currentUserId
    };
    
    console.log('FIREBASE - 💾 Lista FINAL a ser salva:', listaComUserId);
    
    try {
      const docRef = await this.firestore.collection('listas').add(listaComUserId);
      console.log('FIREBASE - ✅ Lista salva com ID:', docRef.id);
      
      // Verificação: ler de volta para confirmar
      const verificacao = await docRef.get();
      if (verificacao.exists) {
        console.log('FIREBASE - ✅ VERIFICAÇÃO: Lista confirmada no banco:', verificacao.data());
      } else {
        console.error('FIREBASE - ❌ VERIFICAÇÃO: Lista NÃO encontrada após salvamento!');
      }
      
      return docRef.id;
    } catch (error) {
      console.error('FIREBASE - ❌ ERRO ao salvar lista:', error);
      throw error;
    }
  }

  getListas(): Observable<Lista[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        console.log('FIREBASE - 🔍 getListas - User state:', user?.uid);
        
        if (!user) {
          console.log('FIREBASE - ⚠️ getListas - Nenhum utilizador autenticado, retornando array vazio');
          return from([]);
        }
        
        console.log('FIREBASE - 📊 getListas - Buscando listas APENAS para userId:', user.uid);
        
        // FILTRO RIGOROSO: Apenas listas com userId correspondente
        return this.firestore.collection<Lista>('listas', ref => 
          ref.where('userId', '==', user.uid)
        ).snapshotChanges().pipe(
          map(actions => {
            const listasDoUser = actions.map(a => {
              const data = a.payload.doc.data() as Lista;
              const id = a.payload.doc.id;
              return { id, ...data };
            });
            
            console.log('FIREBASE - ✅ getListas - RESULTADO FINAL para', user.uid, ':', listasDoUser.length, 'listas');
            console.log('FIREBASE - 📋 Listas encontradas:', listasDoUser);
            
            if (listasDoUser.length === 0) {
              console.log('FIREBASE - ℹ️ Nenhuma lista encontrada para este utilizador. Isso é normal para contas novas.');
            }
            
            return listasDoUser;
          })
        );
      })
    );
  }

  async updateLista(id: string, lista: Partial<Lista>): Promise<void> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    return this.firestore.doc(`listas/${id}`).update(lista);
  }

  async deleteLista(id: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    // Primeiro eliminar todos os produtos desta lista
    const produtos = await this.firestore.collection('produtos', ref => 
      ref.where('listaNome', '==', id).where('userId', '==', this.currentUserId)
    ).get().toPromise();
    
    const batch = this.firestore.firestore.batch();
    produtos?.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Eliminar a lista
    batch.delete(this.firestore.doc(`listas/${id}`).ref);
    
    return batch.commit();
  }

  // Produtos
  async addProduto(produto: Produto): Promise<string> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    produto.userId = this.currentUserId;
    const docRef = await this.firestore.collection('produtos').add(produto);
    return docRef.id;
  }

  getProdutosByLista(listaNome: string): Observable<Produto[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        console.log('FIREBASE - getProdutosByLista - User state:', user?.uid, 'Lista:', listaNome);
        
        if (!user) {
          console.log('FIREBASE - getProdutosByLista - Sem utilizador autenticado');
          return from([]);
        }
        
        console.log('FIREBASE - getProdutosByLista - Buscando produtos APENAS para userId:', user.uid);
        
        return this.firestore.collection<Produto>('produtos', ref => 
          ref.where('listaNome', '==', listaNome)
             .where('userId', '==', user.uid)
        ).snapshotChanges().pipe(
          map(actions => {
            const produtos = actions.map(a => {
              const data = a.payload.doc.data() as Produto;
              const id = a.payload.doc.id;
              return { id, ...data };
            });
            
            console.log('FIREBASE - getProdutosByLista - Produtos encontrados:', produtos.length, produtos);
            return produtos;
          })
        );
      })
    );
  }

  async updateProduto(id: string, produto: Partial<Produto>): Promise<void> {
    return this.firestore.doc(`produtos/${id}`).update(produto);
  }

  async deleteProduto(id: string): Promise<void> {
    return this.firestore.doc(`produtos/${id}`).delete();
  }

  // Produtos Gerais (para o tab4)
  async addProduct(product: Product): Promise<string> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    const productWithUser = { ...product, userId: this.currentUserId };
    const docRef = await this.firestore.collection('products').add(productWithUser);
    return docRef.id;
  }

  getProducts(): Observable<Product[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) return from([]);
        
        return this.firestore.collection<Product>('products', ref => 
          ref.where('userId', '==', user.uid)
        ).snapshotChanges().pipe(
          map(actions => actions.map(a => {
            const data = a.payload.doc.data() as Product;
            const id = a.payload.doc.id;
            return { id, ...data };
          }))
        );
      })
    );
  }

  // Histórico
  async addHistorico(historico: HistoricoProduto): Promise<string> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    const historicoWithUser = { 
      ...historico, 
      userId: this.currentUserId,
      data: new Date()
    };
    const docRef = await this.firestore.collection('historico').add(historicoWithUser);
    return docRef.id;
  }

  getHistorico(): Observable<HistoricoProduto[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) return from([]);
        
        return this.firestore.collection<HistoricoProduto>('historico', ref => 
          ref.where('userId', '==', user.uid)
             .orderBy('data', 'desc')
        ).snapshotChanges().pipe(
          map(actions => actions.map(a => {
            const data = a.payload.doc.data() as HistoricoProduto;
            const id = a.payload.doc.id;
            return { id, ...data };
          }))
        );
      })
    );
  }

  // Tipos de produtos e lojas para os dropdowns
  getTiposProdutos(): string[] {
    return [
      'Fruta',
      'Legumes',
      'Carne',
      'Peixe',
      'Laticínios',
      'Cereais',
      'Padaria',
      'Congelados',
      'Bebidas',
      'Doces',
      'Conservas',
      'Higiene',
      'Limpeza',
      'Outros'
    ];
  }

  getLojas(): string[] {
    return [
      'Continente',
      'Pingo Doce',
      'Intermarché',
      'Lidl',
      'Auchan',
      'El Corte Inglés',
      'Jumbo',
      'Minipreço',
      'Mercadona',
      'Froiz',
      'Outro'
    ];
  }

  getNomesProdutos(): { [categoria: string]: string[] } {
    return {
      'Fruta': ['Maçã', 'Banana', 'Laranja', 'Pera', 'Uvas', 'Morango', 'Kiwi', 'Ananás', 'Manga', 'Pêssego'],
      'Legumes': ['Tomate', 'Cebola', 'Alho', 'Cenoura', 'Batata', 'Alface', 'Pepino', 'Pimento', 'Brócolos', 'Couve-flor'],
      'Carne': ['Frango', 'Porco', 'Vaca', 'Borrego', 'Peru', 'Pato', 'Vitela', 'Cabrito'],
      'Peixe': ['Salmão', 'Bacalhau', 'Sardinha', 'Dourada', 'Robalo', 'Atum', 'Linguado', 'Pescada'],
      'Laticínios': ['Leite', 'Queijo', 'Iogurte', 'Manteiga', 'Natas', 'Requeijão', 'Mozzarella'],
      'Cereais': ['Arroz', 'Massa', 'Aveia', 'Quinoa', 'Cevada', 'Centeio', 'Farinha'],
      'Padaria': ['Pão', 'Croissant', 'Baguete', 'Broa', 'Pão de forma', 'Tostas'],
      'Congelados': ['Pizza', 'Gelado', 'Batatas fritas', 'Peixe panado', 'Legumes mistos'],
      'Bebidas': ['Água', 'Sumo', 'Refrigerante', 'Cerveja', 'Vinho', 'Café', 'Chá'],
      'Doces': ['Chocolate', 'Bolachas', 'Bolo', 'Pastéis', 'Rebuçados', 'Gomas'],
      'Conservas': ['Atum em lata', 'Sardinha em lata', 'Tomate pelado', 'Feijão', 'Grão'],
      'Higiene': ['Pasta de dentes', 'Champô', 'Sabonete', 'Desodorizante', 'Papel higiénico'],
      'Limpeza': ['Detergente', 'Amaciador', 'Produto de limpeza', 'Esponjas', 'Papel de cozinha'],
      'Outros': ['Pilhas', 'Lâmpadas', 'Flores', 'Velas']
    };
  }

  // Método para verificar dados órfãos (apenas logging)
  async verificarDadosOrfaos(): Promise<void> {
    if (!this.currentUserId) {
      console.log('VERIFICACAO - Nenhum utilizador autenticado');
      return;
    }

    try {
      console.log('VERIFICACAO - Verificando dados órfãos para userId:', this.currentUserId);
      
      // Buscar todas as listas e verificar quais não têm userId
      const todasListasSnapshot = await this.firestore.firestore.collection('listas').get();
      const listasOrfas = todasListasSnapshot.docs.filter(doc => !doc.data()['userId']);
      const listasDoUser = todasListasSnapshot.docs.filter(doc => doc.data()['userId'] === this.currentUserId);
      
      console.log('VERIFICACAO - Total de listas no sistema:', todasListasSnapshot.size);
      console.log('VERIFICACAO - Listas órfãs (sem userId):', listasOrfas.length);
      console.log('VERIFICACAO - Listas do utilizador atual:', listasDoUser.length);
      
      if (listasOrfas.length > 0) {
        console.warn('VERIFICACAO - Listas órfãs encontradas:', listasOrfas.map(doc => doc.data()));
      }
      
      // Verificar produtos
      const todosProdutosSnapshot = await this.firestore.firestore.collection('produtos').get();
      const produtosOrfaos = todosProdutosSnapshot.docs.filter(doc => !doc.data()['userId']);
      const produtosDoUser = todosProdutosSnapshot.docs.filter(doc => doc.data()['userId'] === this.currentUserId);
      
      console.log('VERIFICACAO - Total de produtos no sistema:', todosProdutosSnapshot.size);
      console.log('VERIFICACAO - Produtos órfãos (sem userId):', produtosOrfaos.length);
      console.log('VERIFICACAO - Produtos do utilizador atual:', produtosDoUser.length);
      
      if (produtosOrfaos.length > 0) {
        console.warn('VERIFICACAO - Produtos órfãos encontrados:', produtosOrfaos.map(doc => doc.data()));
      }
      
    } catch (error) {
      console.error('VERIFICACAO - Erro na verificação:', error);
    }
  }
}
