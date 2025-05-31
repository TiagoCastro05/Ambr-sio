import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { ProductService, Product } from '../services/product.service'; // <-- Import Product
import { ListService, Lista } from '../services/list.service';

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

  constructor(
    private userService: UserService,
    private productService: ProductService, // <-- Inject here
    private listService: ListService,
  ) {}

  get listas(): Lista[] {
    return this.listService.listas;
  }

  onAddLista() {
    this.showCreateInput = true;
    this.nomeLista = '';
  }

  onSaveLista() {
    if (this.nomeLista.trim()) {
      this.listService.listas.push({
        nome: this.nomeLista.trim(),
        products: []
      });
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
    this.listService.listas[listIndex].products.push(product);
    // No need to call productService.addProduct if you want historico to be derived from lists
  }
}
