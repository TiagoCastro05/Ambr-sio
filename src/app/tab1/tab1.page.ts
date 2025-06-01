import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class Tab1Page implements OnInit, OnDestroy {
  images: string[] = [
    'assets/imagens/doce.png',
    'assets/imagens/folheto.png',
    'assets/imagens/pingo.png'
  ];
  currentImageIndex = 0;
  intervalId: any;

  notificationsActive = false;

  constructor(private router: Router) {}

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

  goToListas() {
    this.router.navigate(['/tabs/tab4']);
  }

 goToHistorico(event: Event) {
  (event.target as HTMLElement).blur();
  this.router.navigate(['/historico']);
}

   goToEstatisticas() {
    // Replace with your actual route for estatísticas
    this.router.navigate(['/estatisticas']);
  }
}