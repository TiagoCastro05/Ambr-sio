import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../services/product.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
 
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HistoricoPage implements OnInit {
  products: Product[] = [];

  constructor(private productService: ProductService) {}

  async ngOnInit() {
    this.products = await this.productService.getProducts();
  }

  async ionViewWillEnter() {
    this.products = await this.productService.getProducts();
  }
}