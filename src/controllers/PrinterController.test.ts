import { Request, Response } from 'express';
import { PrinterController } from './PrinterController';
import { PrinterService } from '../services/PrinterService';

// Mock the PrinterService
jest.mock('../services/PrinterService');

describe('PrinterController', () => {
  let printerController: PrinterController;
  let mockPrinterService: jest.Mocked<PrinterService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    // Create mock for PrinterService
    mockPrinterService = new PrinterService() as jest.Mocked<PrinterService>;
    
    // Create mock for request and response
    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnThis();
    
    mockRequest = {
      body: {},
      query: {}
    };
    
    mockResponse = {
      json: jsonSpy,
      status: statusSpy
    };
    
    // Create controller with mock service
    printerController = new PrinterController(mockPrinterService);
  });

  describe('printText', () => {
    it('should return success response when print is successful', async () => {
      // Arrange
      mockRequest.body = {
        text: 'Test message',
        ip: '192.168.1.100',
        brand: 'epson',
        interface_type: 'tcp'
      };
      
      mockPrinterService.print = jest.fn().mockResolvedValue(true);
      
      // Act
      await printerController.printText(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockPrinterService.print).toHaveBeenCalledWith(
        'Test message',
        '192.168.1.100',
        'epson',
        'tcp'
      );
      expect(jsonSpy).toHaveBeenCalledWith({ status: 'Printed successfully' });
      expect(statusSpy).not.toHaveBeenCalled();
    });
    
    it('should return error response when print fails', async () => {
      // Arrange
      mockRequest.body = {
        text: 'Test message',
        ip: '192.168.1.100',
        brand: 'epson',
        interface_type: 'tcp'
      };
      
      mockPrinterService.print = jest.fn().mockResolvedValue(false);
      
      // Act
      await printerController.printText(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockPrinterService.print).toHaveBeenCalledWith(
        'Test message',
        '192.168.1.100',
        'epson',
        'tcp'
      );
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Printer not connected or print failed' });
    });
    
    it('should handle errors and return 500 response', async () => {
      // Arrange
      mockRequest.body = {
        text: 'Test message',
        ip: '192.168.1.100',
        brand: 'epson',
        interface_type: 'tcp'
      };
      
      const error = new Error('Test error');
      mockPrinterService.print = jest.fn().mockRejectedValue(error);
      
      // Act
      await printerController.printText(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockPrinterService.print).toHaveBeenCalledWith(
        'Test message',
        '192.168.1.100',
        'epson',
        'tcp'
      );
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Test error' });
    });
  });
  
  describe('getOptions', () => {
    it('should return printer options', () => {
      // Arrange
      const mockOptions = {
        brands: ['epson', 'star', 'tanca'],
        interfaces: ['tcp', 'usb', 'serial', 'bluetooth']
      };
      
      mockPrinterService.getPrinterOptions = jest.fn().mockReturnValue(mockOptions);
      
      // Act
      printerController.getOptions(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockPrinterService.getPrinterOptions).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(mockOptions);
    });
  });
  
  describe('getStatus', () => {
    it('should return printer status', async () => {
      // Arrange
      mockRequest.query = {
        ip: '192.168.1.100',
        brand: 'epson',
        interface_type: 'tcp'
      };
      
      const mockStatus = { connected: true, ready: true };
      mockPrinterService.getPrinterStatus = jest.fn().mockResolvedValue(mockStatus);
      
      // Act
      await printerController.getStatus(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockPrinterService.getPrinterStatus).toHaveBeenCalledWith(
        '192.168.1.100',
        'epson',
        'tcp'
      );
      expect(jsonSpy).toHaveBeenCalledWith(mockStatus);
    });
    
    it('should handle errors and return 500 response', async () => {
      // Arrange
      mockRequest.query = {
        ip: '192.168.1.100',
        brand: 'epson',
        interface_type: 'tcp'
      };
      
      const error = new Error('Test error');
      mockPrinterService.getPrinterStatus = jest.fn().mockRejectedValue(error);
      
      // Act
      await printerController.getStatus(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockPrinterService.getPrinterStatus).toHaveBeenCalledWith(
        '192.168.1.100',
        'epson',
        'tcp'
      );
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Test error' });
    });
  });
});