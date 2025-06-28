import { PrinterManager, PrinterInterfaceType, SupportedPrinterBrand, PrinterManagerOptions } from '../printer/PrinterManager';
import { getPrinterConfig } from '../config';

/**
 * Service handling printer-related business logic
 */
export class PrinterService {
  private defaultPrinterConfig: PrinterManagerOptions;

  constructor() {
    this.defaultPrinterConfig = getPrinterConfig();
  }

  /**
   * Print text using the configured printer
   */
  async print(
    text: string, 
    ip?: string, 
    brand?: SupportedPrinterBrand, 
    interfaceType?: PrinterInterfaceType
  ): Promise<boolean> {
    const printerManager = this.createPrinterManager(ip, brand, interfaceType);
    return await printerManager.printLines(text);
  }

  /**
   * Get available printer options
   */
  getPrinterOptions() {
    return {
      brands: ['tanca', 'star', 'epson'],
      interfaceTypes: ['tcp', 'usb', 'serial', 'bluetooth'],
      default: this.defaultPrinterConfig
    };
  }

  /**
   * Get printer status
   */
  async getPrinterStatus(
    ip?: string, 
    brand?: SupportedPrinterBrand, 
    interfaceType?: PrinterInterfaceType
  ) {
    const printerManager = this.createPrinterManager(ip, brand, interfaceType);
    const config = {
      ipAddress: ip ?? this.defaultPrinterConfig.ipAddress,
      type: brand ?? this.defaultPrinterConfig.type,
      interfaceType: interfaceType ?? this.defaultPrinterConfig.interfaceType,
      logging: this.defaultPrinterConfig.logging,
      logFilePath: this.defaultPrinterConfig.logFilePath
    };

    const isConnected = await printerManager.isPrinterConnected();
    return {
      connected: isConnected,
      ...config
    };
  }

  /**
   * Print a test page
   */
  async printTestPage(
      ip?: string,
      brand?: SupportedPrinterBrand,
      interfaceType?: PrinterInterfaceType
  ): Promise<boolean> {
    const testContent = 
      "=== TEST PRINT ===\n" +
      "POS Gateway Test\n" +
      "Printer: " + this.defaultPrinterConfig.type + "\n" +
      "Interface: " + this.defaultPrinterConfig.interfaceType + "\n" +
      "Time: " + new Date().toISOString() + "\n" +
      "=================";
    
    return await this.print(testContent, ip, brand, interfaceType);
  }

  /**
   * Create a printer manager instance with the given options or defaults
   */
  private createPrinterManager(
    ip?: string, 
    brand?: SupportedPrinterBrand, 
    interfaceType?: PrinterInterfaceType
  ): PrinterManager {
    return new PrinterManager({
      ipAddress: ip ?? this.defaultPrinterConfig.ipAddress,
      type: brand ?? this.defaultPrinterConfig.type,
      interfaceType: interfaceType ?? this.defaultPrinterConfig.interfaceType,
      logging: this.defaultPrinterConfig.logging,
      logFilePath: this.defaultPrinterConfig.logFilePath
    });
  }
}