import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { PrinterService } from './services/PrinterService';
import { PrinterController } from './controllers/PrinterController';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { validatePrintRequest, validatePrinterQueryParams } from './middleware/validation';

// Mock the PrinterService
jest.mock('./services/PrinterService');

describe('API Endpoints', () => {
  let app: express.Application;
  let mockPrinterService: jest.Mocked<PrinterService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    app.use(cors());
    
    // Create mock for PrinterService
    mockPrinterService = new PrinterService() as jest.Mocked<PrinterService>;
    
    // Create controller with mock service
    const printerController = new PrinterController(mockPrinterService);
    
    // Set up routes
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
    
    // Add error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);
  });
  
  describe('POST /api/print', () => {
    it('should return 200 when print is successful', async () => {
      // Arrange
      mockPrinterService.print = jest.fn().mockResolvedValue(true);
      
      // Act & Assert
      await request(app)
        .post('/api/print')
        .send({
          text: 'Test message',
          ip: '192.168.1.100',
          brand: 'epson',
          interface_type: 'tcp'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ status: 'Printed successfully' });
        });
      
      expect(mockPrinterService.print).toHaveBeenCalledWith(
        'Test message',
        '192.168.1.100',
        'epson',
        'tcp'
      );
    });
    
    it('should return 400 when print fails', async () => {
      // Arrange
      mockPrinterService.print = jest.fn().mockResolvedValue(false);
      
      // Act & Assert
      await request(app)
        .post('/api/print')
        .send({
          text: 'Test message',
          ip: '192.168.1.100',
          brand: 'epson',
          interface_type: 'tcp'
        })
        .expect(400)
    });
    
    it('should return 400 when validation fails', async () => {
      // Act & Assert
      await request(app)
        .post('/api/print')
        .send({
          // Missing text
          ip: '192.168.1.100',
          brand: 'epson',
          interface_type: 'tcp'
        })
        .expect(400)
    });
  });
  
  describe('GET /api/options', () => {
    it('should return printer options', async () => {
      // Arrange
      const mockOptions = {
        brands: ['epson', 'star', 'tanca'],
        interfaces: ['tcp', 'usb', 'serial', 'bluetooth']
      };
      
      mockPrinterService.getPrinterOptions = jest.fn().mockReturnValue(mockOptions);
      
      // Act & Assert
      await request(app)
        .get('/api/options')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(mockOptions);
        });
    });
  });
  
  describe('GET /api/status', () => {
    it('should return printer status', async () => {
      // Arrange
      const mockStatus = { connected: true, ready: true };
      mockPrinterService.getPrinterStatus = jest.fn().mockResolvedValue(mockStatus);
      
      // Act & Assert
      await request(app)
        .get('/api/status?ip=192.168.1.100&brand=epson&interface_type=tcp')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(mockStatus);
        });
      
      expect(mockPrinterService.getPrinterStatus).toHaveBeenCalledWith(
        '192.168.1.100',
        'epson',
        'tcp'
      );
    });
    
    it('should return 400 when validation fails', async () => {
      // Act & Assert
      await request(app)
        .get('/api/status?ip=invalid-ip&brand=epson&interface_type=tcp')
        .expect(400)
    });
  });
  
  describe('GET /api/test-print', () => {
    it('should return 400 when test print fails', async () => {
      // Arrange
      mockPrinterService.print = jest.fn().mockResolvedValue(false);
      
      // Act & Assert
      await request(app)
        .get('/api/test-print?ip=192.168.1.100&brand=epson&interface_type=tcp')
        .expect(400)
    });
  });
  
  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/non-existent')
        .expect(404);
    });
  });
});