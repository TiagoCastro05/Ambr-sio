import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface Product {
  nome: string;
  quantidade: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private _storage: Storage | null = null;
  private _ready: Promise<void>;

  constructor(private storage: Storage) {
    this._ready = this.init();
  }

  private async init() {
    this._storage = await this.storage.create();
  }

  async addProduct(product: Product) {
    await this._ready;
    const products = await this.getProducts();
    products.push(product);
    await this._storage?.set('products', products);
  }

  async getProducts(): Promise<Product[]> {
    await this._ready;
    return (await this._storage?.get('products')) || [];
  }
}