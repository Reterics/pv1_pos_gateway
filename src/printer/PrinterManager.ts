import { promises as fs } from 'fs';
import path from 'path';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';

export type SupportedPrinterBrand = 'tanca' | 'star' | 'epson';
export type PrinterInterfaceType = 'tcp' | 'usb' | 'serial' | 'bluetooth';

export interface PrinterManagerOptions {
    ipAddress?: string;
    type?: SupportedPrinterBrand;
    interfaceType?: PrinterInterfaceType;
    logging?: boolean;
    logFilePath?: string;
}

export class PrinterManager {
    private readonly printerType: SupportedPrinterBrand;
    private readonly interfaceType: PrinterInterfaceType;
    private readonly ipAddress?: string;
    private readonly logging: boolean;
    private readonly logFile: string;
    private connectedPrinter: ThermalPrinter;

    constructor(options: PrinterManagerOptions) {
        this.printerType = options.type ?? 'tanca';
        this.interfaceType = options.interfaceType ?? 'tcp';
        this.ipAddress = options.ipAddress;
        this.logging = options.logging ?? false;

        const outSideFolder = process.cwd();
        this.logFile = options.logFilePath ?? path.join(outSideFolder, 'logs.log');

        const printerInterface = this.buildInterfaceString();
        this.connectedPrinter = new ThermalPrinter({
            type: this.mapPrinterBrandToType(this.printerType),
            interface: printerInterface
        });
    }

    private buildInterfaceString(): string {
        switch (this.interfaceType) {
            case 'tcp':
                if (!this.ipAddress) throw new Error('TCP interface requires an IP address');
                return `tcp://${this.ipAddress}`;
            case 'usb':
                return 'usb';
            case 'serial':
                return 'serial:/dev/ttyUSB0'; // customize if needed
            case 'bluetooth':
                return 'bluetooth';
            default:
                throw new Error(`Unsupported interface type: ${this.interfaceType}`);
        }
    }

    private mapPrinterBrandToType(brand: SupportedPrinterBrand): PrinterTypes {
        switch (brand) {
            case 'epson': return PrinterTypes.EPSON;
            case 'star': return PrinterTypes.STAR;
            case 'tanca': return PrinterTypes.TANCA;
            default: throw new Error(`Unsupported printer brand: ${brand}`);
        }
    }

    private async log(message: string) {
        if (this.logging) {
            const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
            const log = `${timestamp} - ${message}\n`;
            await fs.appendFile(this.logFile, log);
        }
    }

    /**
     * Example partial IP masking
     */
    public getInterfaceEncoded(): string | undefined {
        if (!this.ipAddress) return undefined;
        const ipParts = this.ipAddress.split('.');
        return ipParts.length >= 4
            ? `x.x.${ipParts[2]}.${ipParts[3]}`
            : this.ipAddress;
    }

    /**
     * Check if printer is connected
     */
    public async isPrinterConnected(): Promise<boolean> {
        return await this.connectedPrinter.isPrinterConnected();
    }

    /**
     * Print lines
     */
    public async printLines(message: string): Promise<boolean> {
        try {
            const isConnected = await this.isPrinterConnected();
            console.log(`Is connected: ${isConnected}`);
            await this.log(`Connection status: ${isConnected}`);

            if (!isConnected) {
                await this.log('Printer not connected');
                return false;
            }

            message.split('\n').forEach(line => {
                this.connectedPrinter.println(line);
            });

            this.connectedPrinter.cut();

            await this.connectedPrinter.execute();
            await this.log('Printed message successfully');
            this.connectedPrinter.clear();

            return true;
        } catch (error: any) {
            console.error('Print error:', error);
            await this.log(`Print error: ${error.message}`);
            return false;
        }
    }
}
