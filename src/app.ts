import express from 'express';
import cors from 'cors';
import path from "path";
import { PrinterService } from './services/PrinterService';
import { PrinterController } from './controllers/PrinterController';
import {getPrinterConfig, getServerConfig} from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { validatePrintRequest, validatePrinterQueryParams } from './middleware/validation';

const app = express();
app.use(express.json());
app.use(cors());
app.use('/', express.static(path.join(process.cwd(), 'public')));

const printerService = new PrinterService();
const printerController = new PrinterController(printerService);

app.post('/api/print', validatePrintRequest, (req, res, next) => {
    try {
        printerController.printText(req, res);
    } catch (error) {
        next(error);
    }
});

app.get('/api/options', (req, res, next) => {
    try {
        printerController.getOptions(req, res);
    } catch (error) {
        next(error);
    }
});

app.get('/api/status', validatePrinterQueryParams, (req, res, next) => {
    try {
        printerController.getStatus(req, res);
    } catch (error) {
        next(error);
    }
});

app.get('/api/test-print', validatePrinterQueryParams, (req, res, next) => {
    try {
        printerController.testPrint(req, res);
    } catch (error) {
        next(error);
    }
});

app.get('/api/config', (req, res, next) => {
    try {
        const config = {
            server: getServerConfig(),
            printer: getPrinterConfig()
        };
        res.json(config);
    } catch (error) {
        next(error);
    }
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
