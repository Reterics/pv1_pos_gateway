import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Standard error response format
 */
interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        status: number;
    };
}

/**
 * Error handler middleware
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
) => {
    // Default error status and message
    let statusCode = 500;
    let message = 'Internal Server Error';
    let isOperational = false;

    // If it's our custom AppError, use its properties
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    } else if (err.name === 'SyntaxError') {
        // Handle JSON parsing errors
        statusCode = 400;
        message = 'Invalid JSON payload';
        isOperational = true;
    } else if (err.name === 'ValidationError') {
        // Handle validation errors
        statusCode = 400;
        message = err.message;
        isOperational = true;
    }

    // Log the error
    if (isOperational) {
        logger.warn(`Operational error: ${message}`, { 
            statusCode,
            path: req.path,
            method: req.method
        });
    } else {
        logger.error(`Unhandled error: ${err.message}`, { 
            error: err,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
    }

    // Send error response
    const errorResponse: ErrorResponse = {
        success: false,
        error: {
            message,
            status: statusCode
        }
    };

    res.status(statusCode).json(errorResponse);
};

/**
 * Not found middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};