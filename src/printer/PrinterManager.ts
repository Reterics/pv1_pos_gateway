import { promises as fs } from 'fs';
import path from 'path';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import logger from '../utils/logger';

export type SupportedPrinterBrand = 'tanca' | 'star' | 'epson';
export type PrinterInterfaceType = 'tcp' | 'usb' | 'serial' | 'bluetooth';

export interface PrinterManagerOptions {
    ipAddress?: string;
    type?: SupportedPrinterBrand;
    interfaceType?: PrinterInterfaceType;
    logging?: boolean;
    logFilePath?: string;
    serialPath?: string;
    usbPath?: string;
    maxRetries?: number;
    retryDelay?: number; // in milliseconds
}

export class PrinterManager {
    private readonly printerType: SupportedPrinterBrand;
    private readonly interfaceType: PrinterInterfaceType;
    private readonly ipAddress?: string;
    private readonly logging: boolean;
    private readonly logFile: string;
    private readonly serialPath: string;
    private readonly usbPath: string;
    private readonly maxRetries: number;
    private readonly retryDelay: number;
    private connectedPrinter: ThermalPrinter;

    constructor(options: PrinterManagerOptions) {
        this.printerType = options.type ?? 'tanca';
        this.interfaceType = options.interfaceType ?? 'tcp';
        this.ipAddress = options.ipAddress;
        this.logging = options.logging ?? false;
        this.serialPath = options.serialPath ?? '/dev/ttyUSB0';
        this.usbPath = options.usbPath ?? 'usb';
        this.maxRetries = options.maxRetries ?? 3;
        this.retryDelay = options.retryDelay ?? 1000;

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
                return this.usbPath;
            case 'serial':
                return `serial:${this.serialPath}`;
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
     * Helper method to retry an operation with exponential backoff
     * @param operation The async operation to retry
     * @param retryMessage Message to log on retry
     * @returns The result of the operation or throws the last error
     */
    private async retryOperation<T>(
        operation: () => Promise<T>,
        retryMessage: string
    ): Promise<T> {
        let lastError: Error | undefined;
        let delay = this.retryDelay;

        for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;

                if (attempt <= this.maxRetries) {
                    const retryLog = `${retryMessage} - Attempt ${attempt}/${this.maxRetries + 1} failed: ${error.message}. Retrying in ${delay}ms...`;
                    logger.warn(retryLog);
                    await this.log(retryLog);

                    // Wait before retrying with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                }
            }
        }

        // If we get here, all retries failed
        throw lastError || new Error('Operation failed after retries');
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
     * Print lines with retry mechanism
     * @param message The text to print
     * @returns True if printing was successful, false otherwise
     */
    public async printLines(message: string): Promise<boolean> {
        try {
            // Check printer connection with retry
            let isConnected = false;
            try {
                isConnected = await this.retryOperation(
                    async () => await this.isPrinterConnected(),
                    'Checking printer connection'
                );
            } catch (error: any) {
                logger.error('Failed to connect to printer after retries', { 
                    error: error.message,
                    interfaceType: this.interfaceType,
                    printerType: this.printerType
                });
                await this.log(`Connection failed after retries: ${error.message}`);
                return false;
            }

            logger.debug(`Printer connection status: ${isConnected}`, {
                interfaceType: this.interfaceType,
                printerType: this.printerType
            });
            await this.log(`Connection status: ${isConnected}`);

            if (!isConnected) {
                const errorMsg = `Printer not connected. Please check that the printer is powered on and properly connected via ${this.interfaceType}.`;
                logger.warn(errorMsg);
                await this.log(errorMsg);
                return false;
            }

            // Prepare print job
            message.split('\n').forEach(line => {
                this.connectedPrinter.println(line);
            });

            this.connectedPrinter.cut();

            // Execute print job with retry
            try {
                await this.retryOperation(
                    async () => await this.connectedPrinter.execute(),
                    'Executing print job'
                );

                const successMsg = 'Printed message successfully';
                logger.info(successMsg);
                await this.log(successMsg);
                this.connectedPrinter.clear();
                return true;
            } catch (error: any) {
                const errorType = this.getPrinterErrorType(error);
                logger.error(`Print execution failed: ${errorType}`, { 
                    error: error.message,
                    interfaceType: this.interfaceType,
                    printerType: this.printerType
                });
                await this.log(`Print error: ${errorType} - ${error.message}`);
                this.connectedPrinter.clear();
                return false;
            }
        } catch (error: any) {
            logger.error('Unexpected error during print operation', { 
                error: error.message,
                stack: error.stack,
                interfaceType: this.interfaceType,
                printerType: this.printerType
            });
            await this.log(`Unexpected print error: ${error.message}`);
            return false;
        }
    }

    /**
     * Get a more descriptive error type based on the error message
     */
    private getPrinterErrorType(error: Error): string {
        const msg = error.message.toLowerCase();

        if (msg.includes('timeout') || msg.includes('timed out')) {
            return 'Connection Timeout';
        } else if (msg.includes('paper') || msg.includes('out of paper')) {
            return 'Out of Paper';
        } else if (msg.includes('offline') || msg.includes('not responding')) {
            return 'Printer Offline';
        } else if (msg.includes('busy') || msg.includes('in use')) {
            return 'Printer Busy';
        } else if (msg.includes('permission') || msg.includes('access denied')) {
            return 'Permission Error';
        } else if (msg.includes('buffer') || msg.includes('memory')) {
            return 'Buffer Overflow';
        } else {
            return 'Print Error';
        }
    }
}
