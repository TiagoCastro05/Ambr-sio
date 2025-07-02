import { Injectable } from '@angular/core';

// Interface que representa um produto individual
export interface Product {
  nome: string;
  quantidade: number;
}

// Interface que representa uma lista contendo vários produtos
export interface Lista {
  nome: string;
  products: Product[];
}

@Injectable({ providedIn: 'root' })
export class ListService {
  // Array que armazena todas as listas com os respetivos produtos
  listas: Lista[] = [];

  // Método que devolve todos os produtos de todas as listas combinadas
  getAllProducts(): Product[] {
    // Utiliza reduce para percorrer todas as listas e concatenar os arrays de produtos num único array
    return this.listas.reduce(
      (all: Product[], lista: Lista) => all.concat(lista.products),
      [] // valor inicial do acumulador
    );
  }
}
