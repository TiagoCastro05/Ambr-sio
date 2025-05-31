import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class Tab1Page implements OnInit, OnDestroy {
  images: string[] = [
    'assets/imagens/Cinemajpg.jpg',
    'assets/imagens/vitinha.png',
    'assets/your-image3.jpg'
  ];
  currentImageIndex = 0;
  intervalId: any;

  notificationsActive = false;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    }, 7000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  toggleNotifications() {
    this.notificationsActive = !this.notificationsActive;
  }

}