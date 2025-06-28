import { Request, Response } from 'express';
import { AppError, errorHandler, notFoundHandler } from './errorHandler';
import logger from '../utils/logger';

// Mock the logger
jest.mock('../utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('AppError', () => {
  it('should create an instance with the correct properties', () => {
    const message = 'Test error message';
    const statusCode = 400;
    const error = new AppError(message, statusCode);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.isOperational).toBe(true);
  });

  it('should allow setting isOperational to false', () => {
    const error = new AppError('Test error', 500, false);
    expect(error.isOperational).toBe(false);
  });
});

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {
      path: '/test',
      method: 'GET',
    };
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };

    jest.clearAllMocks();
  });

  it('should handle AppError correctly', () => {
    const error = new AppError('Bad Request', 400);
    
    errorHandler(error, mockRequest as Request, mockResponse as Response);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Bad Request',
        status: 400
      }
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle SyntaxError correctly', () => {
    const error = new SyntaxError('Invalid JSON');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Invalid JSON payload',
        status: 400
      }
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle ValidationError correctly', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    
    errorHandler(error, mockRequest as Request, mockResponse as Response);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Validation failed',
        status: 400
      }
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle unknown errors correctly', () => {
    const error = new Error('Unknown error');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response);
    
    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Internal Server Error',
        status: 500
      }
    });
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('notFoundHandler', () => {
  it('should create a 404 AppError and pass it to next', () => {
    const mockRequest = {
      originalUrl: '/not-found'
    } as Request;
    
    const mockNext = jest.fn();
    
    notFoundHandler(mockRequest, {} as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not Found - /not-found');
  });
});