import { Request, Response, NextFunction } from 'express';
import { ValidationError, validatePrinterParams, validatePrintRequest, validatePrinterQueryParams } from './validation';
import { AppError } from './errorHandler';

describe('ValidationError', () => {
  it('should create an instance with the correct properties', () => {
    const message = 'Test validation error';
    const error = new ValidationError(message);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe(message);
    expect(error.name).toBe('ValidationError');
  });
});

describe('validatePrinterParams', () => {
  it('should not throw error for valid parameters', () => {
    expect(() => validatePrinterParams('192.168.1.1', 'epson', 'tcp')).not.toThrow();
  });

  it('should not throw error for undefined parameters', () => {
    expect(() => validatePrinterParams()).not.toThrow();
  });

  it('should throw error for invalid IP address', () => {
    expect(() => validatePrinterParams('invalid-ip')).toThrow(ValidationError);
    expect(() => validatePrinterParams('invalid-ip')).toThrow('Invalid IP address format');
  });

  it('should throw error for invalid printer brand', () => {
    expect(() => validatePrinterParams('192.168.1.1', 'invalid-brand')).toThrow(ValidationError);
    expect(() => validatePrinterParams('192.168.1.1', 'invalid-brand')).toThrow('Invalid printer brand');
  });

  it('should throw error for invalid interface type', () => {
    expect(() => validatePrinterParams('192.168.1.1', 'epson', 'invalid-interface')).toThrow(ValidationError);
    expect(() => validatePrinterParams('192.168.1.1', 'epson', 'invalid-interface')).toThrow('Invalid interface type');
  });

  it('should throw error when IP is missing for TCP interface', () => {
    expect(() => validatePrinterParams(undefined, 'epson', 'tcp')).toThrow(ValidationError);
    expect(() => validatePrinterParams(undefined, 'epson', 'tcp')).toThrow('IP address is required for TCP interface');
  });
});

describe('validatePrintRequest', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {
        text: 'Test print text',
        ip: '192.168.1.1',
        brand: 'epson',
        interfaceType: 'tcp'
      }
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should call next() for valid request', () => {
    validatePrintRequest(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with error for missing text', () => {
    mockRequest.body.text = '';
    validatePrintRequest(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Text is required');
  });

  it('should call next with error for invalid printer parameters', () => {
    mockRequest.body.ip = 'invalid-ip';
    validatePrintRequest(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toContain('Invalid IP address format');
  });
});

describe('validatePrinterQueryParams', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      query: {
        ip: '192.168.1.1',
        brand: 'epson',
        interfaceType: 'tcp'
      } as Record<string, string>
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should call next() for valid query parameters', () => {
    validatePrinterQueryParams(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with original error for non-validation errors', () => {
    const originalError = new Error('Some other error');

    // Mock validatePrinterParams to throw a non-ValidationError
    jest.spyOn(require('./validation'), 'validatePrinterParams').mockImplementationOnce(() => {
      throw originalError;
    });

    validatePrinterQueryParams(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(originalError);
  });
});
