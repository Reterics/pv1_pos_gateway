import { Request, Response } from 'express';
import { PrinterService } from '../services/PrinterService';
import { SupportedPrinterBrand, PrinterInterfaceType } from '../printer/PrinterManager';

/**
 * Controller handling printer-related HTTP requests
 */
export class PrinterController {
  private printerService: PrinterService;

  constructor(printerService: PrinterService) {
    this.printerService = printerService;
  }

  /**
   * Print text using the configured printer
   */
  async printText(req: Request, res: Response): Promise<void> {
    const { text, ip, brand, interfaceType } = req.body;

    try {
      const success = await this.printerService.print(text, ip, brand, interfaceType);

      if (success) {
        res.json({ status: 'Printed successfully' });
      } else {
        res.status(400).json({ error: 'Printer not connected or print failed' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get available printer options
   */
  getOptions(req: Request, res: Response): void {
    const options = this.printerService.getPrinterOptions();
    res.json(options);
  }

  /**
   * Get printer status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    // Use query parameters instead of body for GET requests
    const ip = req.query.ip as string | undefined;
    const brand = req.query.brand as SupportedPrinterBrand | undefined;
    const interfaceType = req.query.interfaceType as PrinterInterfaceType | undefined;

    try {
      const status = await this.printerService.getPrinterStatus(ip, brand, interfaceType);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Print a test message
   */
  async testPrint(req: Request, res: Response): Promise<void> {
    const ip = req.query.ip as string | undefined;
    const brand = req.query.brand as SupportedPrinterBrand | undefined;
    const interfaceType = req.query.interfaceType as PrinterInterfaceType | undefined;

    try {
      const success = await this.printerService.printTestPage(ip, brand, interfaceType);

      if (success) {
        res.json({ status: 'Test print sent successfully' });
      } else {
        res.status(400).json({ error: 'Printer not connected or test print failed' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
