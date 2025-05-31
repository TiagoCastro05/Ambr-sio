/// <reference types="google.maps" />

import { Component, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-tab2',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
})
export class Tab2Page implements AfterViewInit {
  map: google.maps.Map | undefined;


  constructor(private userService: UserService) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadMap();
    }, 0);
  }

  loadMap() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.initMap(userLocation);
      }, () => {
        this.initMap({ lat: 38.7223, lng: -9.1393 }); // fallback: Lisbon
      });
    } else {
      this.initMap({ lat: 38.7223, lng: -9.1393 });
    }
  }

  initMap(location: { lat: number, lng: number }) {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    this.map = new google.maps.Map(mapEl, {
      center: location,
      zoom: 15
    });

    new google.maps.Marker({
      position: location,
      map: this.map,
      title: 'Você está aqui'
    });
  }
}
