import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

// Interface que representa um produto com nome e quantidade
export interface Product {
  nome: string;
  quantidade: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Referência ao storage, inicializada mais tarde
  private _storage: Storage | null = null;

  // Promise que garante que o storage está pronto antes de ser usado
  private _ready: Promise<void>;

  constructor(private storage: Storage) {
    // Inicializa o storage quando o serviço é instanciado
    this._ready = this.init();
  }

  // Método privado que cria a instância do storage
  private async init() {
    this._storage = await this.storage.create();
  }

  // Adiciona um produto à lista armazenada
  async addProduct(product: Product) {
    await this._ready; // Garante que o storage está pronto
    const products = await this.getProducts(); // Obtém a lista atual de produtos
    products.push(product); // Adiciona o novo produto
    await this._storage?.set('products', products); // Guarda novamente no storage

    // Log útil para debugging (pode ser removido em produção)
    console.log('All products in storage:', products);
  }

  // Obtém todos os produtos armazenados
  async getProducts(): Promise<Product[]> {
    await this._ready; // Garante que o storage está pronto
    // Retorna os produtos ou um array vazio se ainda não existirem
    return (await this._storage?.get('products')) || [];
  }
}
