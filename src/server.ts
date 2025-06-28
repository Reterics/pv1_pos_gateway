import express, { Request, Response } from 'express';
import {PrinterInterfaceType, PrinterManager, SupportedPrinterBrand} from './printer/PrinterManager';
import cors from 'cors';
import {getPrinterConfig} from "./config";
import path from "path";

const app = express();
app.use(express.json());
app.use(cors());
app.use('/', express.static(path.join(process.cwd(), 'public')));

const defaultPrinterConfig = getPrinterConfig();

function print(text: string, ip?: string, brand?: SupportedPrinterBrand, interfaceType?: PrinterInterfaceType ) {
    const printerManager = new PrinterManager({
        ipAddress: ip ?? defaultPrinterConfig.ipAddress,
        type: brand ?? defaultPrinterConfig.type,
        interfaceType: interfaceType ?? defaultPrinterConfig.interfaceType,
        logging: defaultPrinterConfig.logging,
        logFilePath: defaultPrinterConfig.logFilePath
    });

    return printerManager.printLines(text);
}

app.post('/api/print', async (req: Request, res: Response) => {
    const { text, ip, brand, interfaceType } = req.body;

    try {
        const success = await print(text, ip, brand, interfaceType)

        if (success) {
            res.json({ status: 'Printed successfully' });
        } else {
            res.status(400).json({ error: 'Printer not connected or print failed' });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/options', (req, res) => {
    res.json({
        brands: ['tanca', 'star', 'epson'],
        interfaceTypes: ['tcp', 'usb', 'serial', 'bluetooth'],
        default: defaultPrinterConfig
    });
});

app.get('/api/status', async (req, res) => {
    const { ip, brand, interfaceType } = req.body;
    const config = {
        ipAddress: ip ?? defaultPrinterConfig.ipAddress,
        type: brand ?? defaultPrinterConfig.type,
        interfaceType: interfaceType ?? defaultPrinterConfig.interfaceType,
        logging: defaultPrinterConfig.logging,
        logFilePath: defaultPrinterConfig.logFilePath
    }

    const printerManager = new PrinterManager(config);

    try {
        const isConnected = await printerManager.isPrinterConnected();
        res.json({
            connected: isConnected,
            ...config
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(3000, () => {
    console.log('POS Gateway listening on port 3000');
});
