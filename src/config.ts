import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface PrinterConfig {
    ipAddress?: string;
    type?: 'tanca' | 'star' | 'epson';
    interfaceType?: 'tcp' | 'usb' | 'serial' | 'bluetooth';
    logging?: boolean;
    logFilePath?: string;
}

interface AppConfig {
    printer: PrinterConfig;
}

// Load JSON file
function loadConfigFile(): AppConfig {
    const configPath = path.join(process.cwd(), 'config', 'default.json');
    if (!fs.existsSync(configPath)) {
        throw new Error('Missing config/default.json');
    }
    const file = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(file);
}

// Merge env overrides
export function getPrinterConfig(): PrinterConfig {
    const fileConfig = loadConfigFile();

    return {
        ipAddress: process.env.PRINTER_IP ?? fileConfig.printer.ipAddress,
        type: (process.env.PRINTER_TYPE as PrinterConfig['type']) ?? fileConfig.printer.type,
        interfaceType: (process.env.PRINTER_INTERFACE as PrinterConfig['interfaceType']) ?? fileConfig.printer.interfaceType,
        logging: process.env.PRINTER_LOGGING ? process.env.PRINTER_LOGGING === 'true' : fileConfig.printer.logging,
        logFilePath: process.env.PRINTER_LOG_FILE ?? fileConfig.printer.logFilePath
    };
}
