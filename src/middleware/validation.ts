import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Validation error class
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Validate printer parameters
 */
export const validatePrinterParams = (
    ip?: string,
    brand?: string,
    interfaceType?: string
): void => {
    // Validate IP address if provided
    if (ip && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
        throw new ValidationError('Invalid IP address format');
    }

    // Validate printer brand if provided
    if (brand && !['tanca', 'star', 'epson'].includes(brand)) {
        throw new ValidationError('Invalid printer brand. Supported brands: tanca, star, epson');
    }

    // Validate interface type if provided
    if (interfaceType && !['tcp', 'usb', 'serial', 'bluetooth'].includes(interfaceType)) {
        throw new ValidationError('Invalid interface type. Supported types: tcp, usb, serial, bluetooth');
    }

    // Validate that IP is provided when interface type is tcp
    if (interfaceType === 'tcp' && !ip) {
        throw new ValidationError('IP address is required for TCP interface');
    }
};

/**
 * Validate print text request
 */
export const validatePrintRequest = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const { text, ip, brand, interfaceType } = req.body;

        // Validate text
        if (!text || typeof text !== 'string' || text.trim() === '') {
            next(new AppError('Text is required and must be a non-empty string', 400, true));
            return;
        }

        // Validate printer parameters
        validatePrinterParams(ip, brand, interfaceType);

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Validate status and test-print request query parameters
 */
export const validatePrinterQueryParams = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const ip = req.query.ip as string | undefined;
        const brand = req.query.brand as string | undefined;
        const interfaceType = req.query.interfaceType as string | undefined;

        // Validate printer parameters
        validatePrinterParams(ip, brand, interfaceType);

        next();
    } catch (error) {
        if (error instanceof ValidationError) {
            next(new AppError(error.message, 400, true));
        } else {
            next(error);
        }
    }
};