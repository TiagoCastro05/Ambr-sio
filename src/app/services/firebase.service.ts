import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, from, of, combineLatest } from 'rxjs';
import { map, switchMap, finalize, take, tap, catchError } from 'rxjs/operators';
import { CacheService } from './cache.service';

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
  quantidadeNumero: number;
  unidade: string;
  validade: string;
  preco: string | number; // Aceitar tanto string quanto number
  listaNome: string;
  userId?: string;
  imagemUrl?: string; // URL da imagem no Firebase Storage
  imagemPath?: string; // Caminho da imagem no Storage (para deletar)
  quantidadeConsumida?: number; // Quantidade consumida pelo utilizador
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
  private isOnline = navigator.onLine;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: AngularFireStorage,
    private cacheService: CacheService
  ) {
    // Observa as mudanças de conectividade
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('FIREBASE - 🌐 Online: Sincronizando dados...');
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('FIREBASE - 📴 Offline: Usando dados em cache...');
    });

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
    console.log('FIREBASE - 🚀 addLista chamado');
    
    // Aguardar autenticação apenas se necessário
    if (!this.currentUserId) {
      const currentUser = await this.afAuth.currentUser;
      if (currentUser) {
        this.currentUserId = currentUser.uid;
      } else {
        throw new Error('Utilizador não autenticado');
      }
    }
    
    // Preparar dados da lista
    const listaComUserId = {
      ...lista,
      userId: this.currentUserId,
      products: Array.isArray(lista.products) ? lista.products : [],
      criadaEm: new Date().toISOString()
    };
    
    console.log('FIREBASE - 💾 Salvando lista:', listaComUserId);
    
    try {
      // Tentar salvar no Firebase se online
      if (this.isOnline) {
        const docRef = await this.firestore.collection('listas').add(listaComUserId);
        console.log('FIREBASE - ✅ Lista salva com ID:', docRef.id);
        
        // Adicionar ao cache também
        const listaComId = { ...listaComUserId, id: docRef.id };
        await this.cacheService.addLista(listaComId);
        
        return docRef.id;
      } else {
        // Se offline, salvar apenas no cache com ID temporário
        const tempId = 'temp_' + Date.now();
        const listaComId = { ...listaComUserId, id: tempId };
        await this.cacheService.addLista(listaComId);
        
        console.log('FIREBASE - 📴 Lista salva offline com ID temporário:', tempId);
        return tempId;
      }
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao salvar lista:', error);
      // Em caso de erro, salvar no cache
      const tempId = 'temp_' + Date.now();
      const listaComId = { ...listaComUserId, id: tempId };
      await this.cacheService.addLista(listaComId);
      return tempId;
    }
  }

  getListas(): Observable<Lista[]> {
    console.log('FIREBASE - 📋 getListas() chamado');
    
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        console.log('FIREBASE - 👤 User state em getListas:', user?.uid);
        
        if (!user) {
          console.log('FIREBASE - ❌ Nenhum usuário autenticado em getListas');
          // Limpar cache quando não há usuário
          this.cacheService.clearUserData();
          return of([]);
        }
        
        console.log('FIREBASE - 🔍 Buscando listas para userId:', user.uid);
        
        // Se offline, retornar dados do cache
        if (!this.isOnline) {
          console.log('FIREBASE - 📴 Modo offline: carregando do cache');
          return this.cacheService.getListas();
        }
        
        // Se online, buscar do Firebase e salvar no cache
        return this.firestore
          .collection<Lista>('listas', ref => ref.where('userId', '==', user.uid))
          .valueChanges({ idField: 'id' })
          .pipe(
            tap((listas: Lista[]) => {
              console.log('FIREBASE - 📋 Listas encontradas:', listas.length);
              // Salvar no cache
              this.cacheService.saveListas(listas, user.uid);
            }),
            map((listas: any[]) => {
              console.log('FIREBASE - 📋 Dados das listas:', listas);
              
              return listas.map(lista => ({
                ...lista,
                id: lista.id
              }));
            }),
            catchError((error) => {
              console.error('FIREBASE - ❌ Erro ao buscar listas:', error);
              // Em caso de erro, retornar dados do cache
              return this.cacheService.getListas();
            })
          );
      })
    );
  }

  async updateLista(id: string, lista: Partial<Lista>): Promise<void> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    try {
      // Atualizar no Firebase se online
      if (this.isOnline) {
        await this.firestore.doc(`listas/${id}`).update(lista);
        console.log('FIREBASE - ✅ Lista atualizada no servidor:', id);
      }
      
      // Sempre atualizar no cache
      await this.cacheService.updateLista(id, lista);
      console.log('FIREBASE - ✅ Lista atualizada no cache:', id);
      
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao atualizar lista:', error);
      // Em caso de erro, atualizar apenas no cache
      await this.cacheService.updateLista(id, lista);
    }
  }

  async deleteLista(id: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    try {
      // Se online, eliminar do Firebase
      if (this.isOnline) {
        // Primeiro eliminar todos os produtos desta lista
        const produtos = await this.firestore.collection('produtos', ref => 
          ref.where('listaNome', '==', id).where('userId', '==', this.currentUserId)
        ).get().toPromise();
        
        const batch = this.firestore.firestore.batch();
        produtos?.docs.forEach((doc: any) => {
          batch.delete(doc.ref);
        });
        
        // Eliminar a lista
        batch.delete(this.firestore.doc(`listas/${id}`).ref);
        await batch.commit();
        console.log('FIREBASE - ✅ Lista deletada no servidor:', id);
      }
      
      // Sempre remover do cache
      await this.cacheService.removeLista(id);
      console.log('FIREBASE - ✅ Lista removida do cache:', id);
      
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao deletar lista:', error);
      // Em caso de erro, remover apenas do cache
      await this.cacheService.removeLista(id);
    }
  }

  // Produtos
  async addProduto(produto: Produto): Promise<string> {
    console.log('FIREBASE - 🚀 addProduto chamado');
    
    // Aguardar autenticação se necessário
    if (!this.currentUserId) {
      const currentUser = await this.afAuth.currentUser;
      if (currentUser) {
        this.currentUserId = currentUser.uid;
      } else {
        throw new Error('Utilizador não autenticado');
      }
    }
    
    // Preparar dados do produto
    const produtoComUserId = {
      ...produto,
      userId: this.currentUserId,
      criadoEm: new Date().toISOString()
    };
    
    console.log('FIREBASE - 💾 Salvando produto:', produtoComUserId);
    
    try {
      // Tentar salvar no Firebase se online
      if (this.isOnline) {
        const docRef = await this.firestore.collection('produtos').add(produtoComUserId);
        console.log('FIREBASE - ✅ Produto salvo com ID:', docRef.id);
        
        // Adicionar ao cache também
        const produtoComId = { ...produtoComUserId, id: docRef.id };
        await this.cacheService.addProduto(produtoComId);
        
        // Adicionar ao histórico automaticamente
        await this.adicionarAoHistorico({
          nome: produto.produto,
          quantidade: produto.quantidadeNumero,
          listaNome: produto.listaNome
        });
        
        return docRef.id;
      } else {
        // Se offline, salvar apenas no cache com ID temporário
        const tempId = 'temp_produto_' + Date.now();
        const produtoComId = { ...produtoComUserId, id: tempId };
        await this.cacheService.addProduto(produtoComId);
        
        console.log('FIREBASE - 📴 Produto salvo offline com ID temporário:', tempId);
        return tempId;
      }
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao salvar produto:', error);
      // Em caso de erro, salvar no cache
      const tempId = 'temp_produto_' + Date.now();
      const produtoComId = { ...produtoComUserId, id: tempId };
      await this.cacheService.addProduto(produtoComId);
      return tempId;
    }
  }

  getProdutosByLista(listaNome: string): Observable<Produto[]> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        console.log('FIREBASE - getProdutosByLista - User state:', user?.uid, 'Lista:', listaNome);
        
        if (!user) {
          console.log('FIREBASE - getProdutosByLista - Usuário não autenticado');
          return of([]);
        }
        
        console.log('FIREBASE - getProdutosByLista - Buscando produtos APENAS para userId:', user.uid);
        
        // Se offline, retornar dados do cache filtrados por lista
        if (!this.isOnline) {
          console.log('FIREBASE - 📴 Modo offline: carregando produtos do cache');
          return this.cacheService.getProdutos().pipe(
            map(produtos => produtos.filter(p => p.listaNome === listaNome && p.userId === user.uid))
          );
        }
        
        // Se online, buscar do Firebase e salvar no cache
        return this.firestore
          .collection<Produto>('produtos', ref => 
            ref.where('userId', '==', user.uid)
               .where('listaNome', '==', listaNome)
          )
          .valueChanges({ idField: 'id' })
          .pipe(
            tap((produtos: Produto[]) => {
              console.log('FIREBASE - getProdutosByLista - Produtos encontrados:', produtos.length);
              // Salvar no cache (todos os produtos do usuário)
              this.cacheService.saveProdutos(produtos, user.uid);
            }),
            map((produtos: any[]) => {
              console.log('FIREBASE - getProdutosByLista - Dados dos produtos:', produtos);
              
              return produtos.map(produto => ({
                ...produto,
                id: produto.id
              }));
            }),
            catchError((error) => {
              console.error('FIREBASE - ❌ Erro ao buscar produtos:', error);
              // Em caso de erro, retornar dados do cache
              return this.cacheService.getProdutos().pipe(
                map(produtos => produtos.filter(p => p.listaNome === listaNome && p.userId === user.uid))
              );
            })
          );
      })
    );
  }

  async updateProduto(id: string, produto: Partial<Produto>): Promise<void> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    try {
      // Atualizar no Firebase se online
      if (this.isOnline) {
        await this.firestore.doc(`produtos/${id}`).update(produto);
        console.log('FIREBASE - ✅ Produto atualizado no servidor:', id);
      }
      
      // Sempre atualizar no cache
      await this.cacheService.updateProduto(id, produto);
      console.log('FIREBASE - ✅ Produto atualizado no cache:', id);
      
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao atualizar produto:', error);
      // Em caso de erro, atualizar apenas no cache
      await this.cacheService.updateProduto(id, produto);
    }
  }

  async updateQuantidadeConsumida(id: string, quantidadeConsumida: number): Promise<void> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    try {
      const dadosAtualizados = { quantidadeConsumida };
      
      // Atualizar no Firebase se online
      if (this.isOnline) {
        await this.firestore.doc(`produtos/${id}`).update(dadosAtualizados);
        console.log('FIREBASE - ✅ Quantidade consumida atualizada no servidor:', id);
        
        // Buscar dados do produto para adicionar ao histórico
        const produtoDoc = await this.firestore.doc(`produtos/${id}`).get().toPromise();
        if (produtoDoc?.exists) {
          const produto = produtoDoc.data() as Produto;
          
          // Adicionar ao histórico quando consumir
          await this.adicionarAoHistorico({
            nome: produto.produto,
            quantidade: quantidadeConsumida,
            listaNome: produto.listaNome
          });
        }
      }
      
      // Sempre atualizar no cache
      await this.cacheService.updateProduto(id, dadosAtualizados);
      console.log('FIREBASE - ✅ Quantidade consumida atualizada no cache:', id);
      
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao atualizar quantidade consumida:', error);
      // Em caso de erro, atualizar apenas no cache
      await this.cacheService.updateProduto(id, { quantidadeConsumida });
    }
  }

  async deleteProduto(id: string): Promise<void> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    try {
      // Se online, eliminar do Firebase
      if (this.isOnline) {
        await this.firestore.doc(`produtos/${id}`).delete();
        console.log('FIREBASE - ✅ Produto deletado no servidor:', id);
      }
      
      // Sempre remover do cache
      await this.cacheService.removeProduto(id);
      console.log('FIREBASE - ✅ Produto removido do cache:', id);
      
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao deletar produto:', error);
      // Em caso de erro, remover apenas do cache
      await this.cacheService.removeProduto(id);
    }
  }

  // Produtos Gerais (para o tab4)
  async addProduct(product: Product): Promise<string> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    try {
      const productWithUser = { ...product, userId: this.currentUserId };
      const docRef = await this.firestore.collection('products').add(productWithUser);
      console.log('FIREBASE - ✅ Product salvo com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao adicionar product:', error);
      throw error;
    }
  }

  getProducts(): Observable<Product[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) return of([]);
        
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
    
    try {
      const historicoWithUser = { 
        ...historico, 
        userId: this.currentUserId,
        data: new Date()
      };
      const docRef = await this.firestore.collection('historico').add(historicoWithUser);
      console.log('FIREBASE - ✅ Histórico salvo com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao adicionar histórico:', error);
      throw error;
    }
  }

  // Método privado para adicionar ao histórico automaticamente
  private async adicionarAoHistorico(item: { nome: string; quantidade: number; listaNome: string }): Promise<void> {
    if (!this.currentUserId) return;
    
    try {
      // Verificar se já existe um item similar na última hora (para evitar duplicatas)
      const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
      
      const existingSnapshot = await this.firestore.collection('historico', ref => 
        ref.where('userId', '==', this.currentUserId)
           .where('nome', '==', item.nome)
           .where('listaNome', '==', item.listaNome)
           .where('quantidade', '==', item.quantidade)
           .where('data', '>=', umaHoraAtras)
      ).get().toPromise();

      if (existingSnapshot && existingSnapshot.docs.length > 0) {
        console.log('FIREBASE - Item já existe no histórico recente, não adicionando duplicata');
        return;
      }

      // Adicionar ao histórico
      await this.firestore.collection('historico').add({
        nome: item.nome,
        quantidade: item.quantidade,
        listaNome: item.listaNome,
        userId: this.currentUserId,
        data: new Date()
      });
      
      console.log('FIREBASE - ✅ Item adicionado ao histórico automaticamente:', item.nome);
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao adicionar ao histórico automaticamente:', error);
      // Não relançar o erro para não afetar o fluxo principal
    }
  }

  getHistorico(): Observable<HistoricoProduto[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) return of([]);
        
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
      
      // Buscar todas as listas do usuário atual
      const listasDoUser = await this.firestore.collection('listas', ref =>
        ref.where('userId', '==', this.currentUserId)
      ).get().toPromise();
      
      console.log('VERIFICACAO - Listas do utilizador atual:', listasDoUser?.size || 0);
      
      // Buscar todos os produtos do usuário atual
      const produtosDoUser = await this.firestore.collection('produtos', ref =>
        ref.where('userId', '==', this.currentUserId)
      ).get().toPromise();
      
      console.log('VERIFICACAO - Produtos do utilizador atual:', produtosDoUser?.size || 0);
      
    } catch (error) {
      console.error('VERIFICACAO - Erro na verificação:', error);
    }
  }

  // === MÉTODOS PARA IMAGENS DE PRODUTOS ===
  
  /**
   * Upload de imagem para o Firebase Storage
   * @param file - Arquivo de imagem
   * @param produtoNome - Nome do produto (para organizar)
   * @returns Observable com o progresso e URL final
   */
  async uploadImagemProduto(file: File, produtoNome: string): Promise<{ url: string, path: string }> {
    if (!this.currentUserId) throw new Error('Utilizador não autenticado');
    
    // Criar um nome único para a imagem
    const timestamp = Date.now();
    const fileName = `${produtoNome.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;
    const filePath = `produtos/${this.currentUserId}/${fileName}`;
    
    console.log('FIREBASE - 📸 Upload de imagem iniciado:', filePath);
    
    try {
      // Upload do arquivo
      const task = this.storage.upload(filePath, file);
      await task;
      
      // Obter URL de download
      const url = await this.storage.ref(filePath).getDownloadURL().toPromise();
      
      console.log('FIREBASE - ✅ Imagem carregada com sucesso:', url);
      
      return { url, path: filePath };
    } catch (error) {
      console.error('FIREBASE - ❌ Erro no upload da imagem:', error);
      throw error;
    }
  }

  /**
   * Deletar imagem do Storage
   * @param imagePath - Caminho da imagem no Storage
   */
  async deleteImagemProduto(imagePath: string): Promise<void> {
    if (!imagePath) return;
    
    try {
      await this.storage.ref(imagePath).delete().toPromise();
      console.log('FIREBASE - 🗑️ Imagem deletada:', imagePath);
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao deletar imagem:', error);
      // Não lançar erro pois o produto pode ser deletado mesmo se a imagem falhar
    }
  }

  /**
   * Obter imagem padrão para um tipo de produto
   * @param tipoProduto - Categoria do produto
   * @returns URL da imagem padrão
   */
  getImagemPadrao(tipoProduto: string): string {
    const imagensPadrao: { [key: string]: string } = {
      'Fruta': 'assets/imagens/produtos/fruta-default.png',
      'Legumes': 'assets/imagens/produtos/legumes-default.png',
      'Carne': 'assets/imagens/produtos/carne-default.png',
      'Peixe': 'assets/imagens/produtos/peixe-default.png',
      'Laticínios': 'assets/imagens/produtos/laticinios-default.png',
      'Cereais': 'assets/imagens/produtos/cereais-default.png',
      'Padaria': 'assets/imagens/produtos/padaria-default.png',
      'Congelados': 'assets/imagens/produtos/congelados-default.png',
      'Bebidas': 'assets/imagens/produtos/bebidas-default.png',
      'Doces': 'assets/imagens/produtos/doces-default.png',
      'Conservas': 'assets/imagens/produtos/conservas-default.png',
      'Higiene': 'assets/imagens/produtos/higiene-default.png',
      'Limpeza': 'assets/imagens/produtos/limpeza-default.png'
    };
    
    return imagensPadrao[tipoProduto] || 'assets/imagens/produtos/default.png';
  }

  /**
   * Base de dados de imagens específicas por produto
   * @param nomeProduto - Nome específico do produto
   * @returns URL da imagem específica ou null
   */
  getImagemEspecifica(nomeProduto: string): string | null {
    const imagensEspecificas: { [key: string]: string } = {
      // Frutas
      'Maçã': 'assets/imagens/produtos/especificas/maca.png',
      'Banana': 'assets/imagens/produtos/especificas/banana.png',
      'Laranja': 'assets/imagens/produtos/especificas/laranja.png',
      'Morango': 'assets/imagens/produtos/especificas/morango.png',
      
      // Legumes
      'Tomate': 'assets/imagens/produtos/especificas/tomate.png',
      'Cebola': 'assets/imagens/produtos/especificas/cebola.png',
      'Cenoura': 'assets/imagens/produtos/especificas/cenoura.png',
      'Batata': 'assets/imagens/produtos/especificas/batata.png',
      
      // Laticínios
      'Leite': 'assets/imagens/produtos/especificas/leite.png',
      'Queijo': 'assets/imagens/produtos/especificas/queijo.png',
      'Iogurte': 'assets/imagens/produtos/especificas/iogurte.png',
      
      // Bebidas
      'Água': 'assets/imagens/produtos/especificas/agua.png',
      'Cerveja': 'assets/imagens/produtos/especificas/cerveja.png',
      'Vinho': 'assets/imagens/produtos/especificas/vinho.png',
      
      // Adicione mais produtos conforme necessário...
    };
    
    return imagensEspecificas[nomeProduto] || null;
  }

  /**
   * Obter URL final da imagem do produto (prioriza: personalizada > específica > padrão)
   * @param produto - Objeto do produto
   * @returns URL da imagem a ser exibida
   */
  getImagemFinalProduto(produto: Produto): string {
    // 1. Se tem imagem personalizada (upload do usuário)
    if (produto.imagemUrl) {
      return produto.imagemUrl;
    }
    
    // 2. Se tem imagem específica do produto
    const imagemEspecifica = this.getImagemEspecifica(produto.produto);
    if (imagemEspecifica) {
      return imagemEspecifica;
    }
    
    // 3. Imagem padrão da categoria
    return this.getImagemPadrao(produto.tipoProduto);
  }

  // === FIM DOS MÉTODOS DE IMAGENS ===

  // === MÉTODOS DE DEBUG ===
  
  /**
   * Método para debug - verificar estado atual da autenticação
   */
  async debugAuthState(): Promise<void> {
    console.log('🔍 === DEBUG AUTH STATE ===');
    console.log('currentUserId (service):', this.currentUserId);
    
    const currentUser = await this.afAuth.currentUser;
    console.log('currentUser (auth):', currentUser?.uid);
    console.log('currentUser email:', currentUser?.email);
    
    this.afAuth.authState.subscribe(user => {
      console.log('authState observable:', user?.uid);
    });
    
    // Verificar todas as listas no banco (sem filtro)
    try {
      const todasListas = await this.firestore.collection('listas').get().toPromise();
      console.log('Total de listas no banco:', todasListas?.size || 0);
      
      if (todasListas) {
        todasListas.docs.forEach((doc: any) => {
          const data = doc.data();
          console.log('Lista encontrada:', {
            id: doc.id,
            nome: data?.nome,
            userId: data?.userId
          });
        });
      }
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
    }
    
    console.log('🔍 === FIM DEBUG ===');
  }
  
  /**
   * Método para forçar re-autenticação
   */
  async forceRefreshAuth(): Promise<void> {
    const currentUser = await this.afAuth.currentUser;
    if (currentUser) {
      this.currentUserId = currentUser.uid;
      console.log('FIREBASE - 🔄 Auth forçada, userId:', this.currentUserId);
    }
  }
  
  // === FIM MÉTODOS DE DEBUG ===

  // === MÉTODOS DE SINCRONIZAÇÃO OFFLINE ===
  
  // Sincronizar dados offline com o servidor quando voltar online
  private async syncOfflineData() {
    if (!this.currentUserId || !this.isOnline) return;
    
    try {
      console.log('FIREBASE - 🔄 Iniciando sincronização offline...');
      
      // Sincronizar listas temporárias (criadas offline)
      await this.syncTempListas();
      
      // Sincronizar produtos temporários (criados offline)
      await this.syncTempProdutos();
      
      // Recarregar listas do servidor
      const listas = await this.firestore
        .collection<Lista>('listas', ref => ref.where('userId', '==', this.currentUserId))
        .get()
        .toPromise();
      
      if (listas) {
        const listasData = listas.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await this.cacheService.saveListas(listasData, this.currentUserId);
        console.log('FIREBASE - ✅ Listas sincronizadas:', listasData.length);
      }
      
      // Recarregar produtos do servidor
      const produtos = await this.firestore
        .collection<Produto>('produtos', ref => ref.where('userId', '==', this.currentUserId))
        .get()
        .toPromise();
      
      if (produtos) {
        const produtosData = produtos.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await this.cacheService.saveProdutos(produtosData, this.currentUserId);
        console.log('FIREBASE - ✅ Produtos sincronizados:', produtosData.length);
      }
      
    } catch (error) {
      console.error('FIREBASE - ❌ Erro na sincronização offline:', error);
    }
  }
  
  // Sincronizar listas temporárias criadas offline
  private async syncTempListas() {
    try {
      const listasCache = await this.cacheService.getListasSync();
      const listasTemp = listasCache.filter(lista => lista.id?.startsWith('temp_'));
      
      console.log('FIREBASE - 🔄 Sincronizando listas temporárias:', listasTemp.length);
      
      for (const lista of listasTemp) {
        try {
          // Remover ID temporário
          const { id, ...listaSemId } = lista;
          
          // Adicionar ao Firebase
          const docRef = await this.firestore.collection('listas').add(listaSemId);
          console.log('FIREBASE - ✅ Lista temporária sincronizada:', docRef.id);
          
          // Atualizar cache com novo ID
          await this.cacheService.removeLista(id!);
          await this.cacheService.addLista({ ...listaSemId, id: docRef.id });
          
        } catch (error) {
          console.error('FIREBASE - ❌ Erro ao sincronizar lista temporária:', error);
        }
      }
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao sincronizar listas temporárias:', error);
    }
  }
  
  // Sincronizar produtos temporários criados offline
  private async syncTempProdutos() {
    try {
      const produtosCache = await this.cacheService.getProdutosSync();
      const produtosTemp = produtosCache.filter(produto => produto.id?.startsWith('temp_produto_'));
      
      console.log('FIREBASE - 🔄 Sincronizando produtos temporários:', produtosTemp.length);
      
      for (const produto of produtosTemp) {
        try {
          // Remover ID temporário
          const { id, ...produtoSemId } = produto;
          
          // Adicionar ao Firebase
          const docRef = await this.firestore.collection('produtos').add(produtoSemId);
          console.log('FIREBASE - ✅ Produto temporário sincronizado:', docRef.id);
          
          // Atualizar cache com novo ID
          await this.cacheService.removeProduto(id!);
          await this.cacheService.addProduto({ ...produtoSemId, id: docRef.id });
          
        } catch (error) {
          console.error('FIREBASE - ❌ Erro ao sincronizar produto temporário:', error);
        }
      }
    } catch (error) {
      console.error('FIREBASE - ❌ Erro ao sincronizar produtos temporários:', error);
    }
  }
  
  // Verificar se há conexão com o Firebase
  async checkConnection(): Promise<boolean> {
    try {
      // Tentar fazer uma query simples
      await this.firestore.collection('test').get().toPromise();
      return true;
    } catch (error) {
      console.log('FIREBASE - 📴 Sem conexão com o Firebase');
      return false;
    }
  }
  
  // Método para forçar sincronização manual
  async forceSyncData() {
    if (this.isOnline && this.currentUserId) {
      await this.syncOfflineData();
    }
  }
  
  // === FIM MÉTODOS DE SINCRONIZAÇÃO OFFLINE ===
}
