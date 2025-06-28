import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {PrinterInterfaceType, SupportedPrinterBrand} from "./printer/PrinterManager";

dotenv.config();

interface PrinterConfig {
    ipAddress?: string;
    type?: 'tanca' | 'star' | 'epson';
    interfaceType?: 'tcp' | 'usb' | 'serial' | 'bluetooth';
    logging?: boolean;
    logFilePath?: string;
}

interface ServerConfig {
    port: number;
}

interface AppConfig {
    server: ServerConfig;
    printer: PrinterConfig;
}

// Load JSON file
function loadConfigFile(): AppConfig {
    let configPath = path.join(process.cwd(), 'config', 'default.json');
    if (!fs.existsSync(configPath)) {
        configPath = path.join(process.cwd(), '../config', 'default.json');
        if (!fs.existsSync(configPath)) {
            throw new Error('Missing config/default.json');
        }
    }
    const file = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(file);
}

// Validate server configuration
function validateServerConfig(config: ServerConfig): void {
    if (!config.port) {
        throw new Error('Server port is required');
    }

    if (Number.isNaN(Number(config.port)) || config.port <= 0 || config.port > 65535) {
        throw new Error('Server port must be a number between 1 and 65535');
    }
}

// Validate printer configuration
function validatePrinterConfig(config: PrinterConfig): void {
    const validTypes: SupportedPrinterBrand[] = ['tanca', 'star', 'epson'];
    const validInterfaces: PrinterInterfaceType[] = ['tcp', 'usb', 'serial', 'bluetooth'];

    if (config.type && !validTypes.includes(config.type)) {
        throw new Error(`Invalid printer type: ${config.type}. Valid types are: ${validTypes.join(', ')}`);
    }

    if (config.interfaceType && !validInterfaces.includes(config.interfaceType)) {
        throw new Error(`Invalid interface type: ${config.interfaceType}. Valid interfaces are: ${validInterfaces.join(', ')}`);
    }

    if (config.interfaceType === 'tcp' && !config.ipAddress) {
        throw new Error('IP address is required for TCP interface');
    }

    if (config.logging !== true && config.logging !== false) {
        throw new Error('Logging must be a boolean value');
    }
}

// Get server configuration with env overrides
export function getServerConfig(): ServerConfig {
    const fileConfig = loadConfigFile();

    const config = {
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : fileConfig.server.port
    };

    validateServerConfig(config);
    return config;
}

// Get printer configuration with env overrides
export function getPrinterConfig(): PrinterConfig {
    const fileConfig = loadConfigFile();

    const config = {
        ipAddress: process.env.PRINTER_IP ?? fileConfig.printer.ipAddress,
        type: (process.env.PRINTER_TYPE as PrinterConfig['type']) ?? fileConfig.printer.type,
        interfaceType: (process.env.PRINTER_INTERFACE as PrinterConfig['interfaceType']) ?? fileConfig.printer.interfaceType,
        logging: process.env.PRINTER_LOGGING ? process.env.PRINTER_LOGGING === 'true' : fileConfig.printer.logging,
        logFilePath: process.env.PRINTER_LOG_FILE ?? fileConfig.printer.logFilePath
    };

    validatePrinterConfig(config);
    return config;
}
