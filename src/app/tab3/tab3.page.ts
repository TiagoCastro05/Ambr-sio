import { Component } from '@angular/core';
import { Camera, CameraResultType, CameraSource, PermissionStatus } from '@capacitor/camera';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../services/user.service';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { CommonModule } from '@angular/common';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Component({
  selector: 'app-tab3',
  standalone: true,
  imports: [IonicModule, ExploreContainerComponentModule, CommonModule], // <-- Add this line
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
})
export class Tab3Page {
  image: string | undefined;
  barcode: string | undefined;

  constructor(private userService: UserService) {}

  async ionViewDidEnter() {
    // Ask for camera permission
    const permission: PermissionStatus = await Camera.requestPermissions({ permissions: ['camera'] });
    if (permission.camera === 'granted') {
      this.openCamera();
    } else {
      alert('Camera permission is required to use this feature.');
    }
  }

  async openCamera() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    this.image = image.dataUrl;
  }

  async scanBarcode() {
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes && result.barcodes.length > 0) {
        this.barcode = result.barcodes[0].rawValue;
      } else {
        this.barcode = 'No barcode found';
      }
    } catch (error) {
      this.barcode = 'Error scanning barcode';
    }
  }
}
