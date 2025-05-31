import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { ProductService, Product } from '../services/product.service';
import { ListService } from '../services/list.service';
import { Storage } from '@ionic/storage-angular';

// Add your interfaces here
interface Produto {
  nome: string;
  quantidade: number;
}

interface Lista {
  nome: string;
  products: Produto[];
}

@Component({
  selector: 'app-tab4',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page {
  showCreateInput = false;
  nomeLista = '';

  // Product registration fields
  productNome = '';
  productQuantidade = 1;
  productNomes: string[] = [];
  productQuantidades: number[] = [];

  listas: Lista[] = [];

  constructor(
    private userService: UserService,
    private productService: ProductService, // <-- Inject here
    private listService: ListService,
    private storage: Storage // <-- Add this
  ) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
    await this.loadListas();
  }

  async loadListas() {
    const listas = await this.storage.get('listas');
    this.listas = listas || [];
    this.listService.listas = this.listas; // Keep service in sync if needed
  }

  async saveListas() {
    await this.storage.set('listas', this.listas);
  }


  onAddLista() {
    this.showCreateInput = true;
    this.nomeLista = '';
  }

  async onSaveLista() {
    if (this.nomeLista.trim()) {
      this.listas.push({
        nome: this.nomeLista.trim(),
        products: []
      });
      await this.saveListas(); // Save to storage
      this.showCreateInput = false;
      this.nomeLista = '';
    }
  }

  async registerProduct() {
    if (this.productNome.trim() && this.productQuantidade > 0) {
      await this.productService.addProduct({
        nome: this.productNome.trim(),
        quantidade: this.productQuantidade
      });
      this.productNome = '';
      this.productQuantidade = 1;
      // Optionally show a success message
    }
  }

  // When adding a product to a list:
  async addProductToList(productNome: string, productQuantidade: number, listIndex: number) {
    const product = {
      nome: productNome.trim(),
      quantidade: productQuantidade
    };
    this.listas[listIndex].products.push(product);
    await this.saveListas(); // Save updated listas to storage
  }
}
