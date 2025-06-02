import { Component } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule], // Add required modules here
})
export class Tab3Page {
  barcode: string | undefined;

  async scanBarcode() {
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes && result.barcodes.length > 0) {
        this.barcode = result.barcodes[0].rawValue;
        this.searchItem(this.barcode); // Call a method to search for the item
      } else {
        this.barcode = 'No barcode found';
      }
    } catch (error) {
      this.barcode = 'Error scanning barcode';
    }
  }

  searchItem(barcode: string) {
    console.log(`Searching for item with barcode: ${barcode}`);
    // Implement your logic to fetch item details based on the barcode
  }
}
