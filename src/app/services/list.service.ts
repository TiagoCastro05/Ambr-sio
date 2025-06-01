import { Injectable } from '@angular/core';

export interface Product {
  nome: string;
  quantidade: number;
}
export interface Lista {
  nome: string;
  products: Product[];
}

@Injectable({ providedIn: 'root' })
export class ListService {
  listas: Lista[] = [];

  getAllProducts(): Product[] {
    return this.listas.reduce((all: Product[], lista: any) => all.concat(lista.products), []);
  }
}