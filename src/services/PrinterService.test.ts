import { PrinterService } from './PrinterService';
import { PrinterManager } from '../printer/PrinterManager';
import * as config from '../config';

// Mock dependencies
jest.mock('../printer/PrinterManager');
jest.mock('../config');

describe('PrinterService', () => {
  let printerService: PrinterService;
  let mockPrinterManager: jest.Mocked<PrinterManager>;
  
  beforeEach(() => {
    // Setup mock printer config
    const mockConfig = {
      ipAddress: '192.168.1.100',
      type: 'epson' as const,
      interfaceType: 'tcp' as const,
      logging: true,
      logFilePath: 'logs/printer.log'
    };
    
    // Mock the getPrinterConfig function
    jest.spyOn(config, 'getPrinterConfig').mockReturnValue(mockConfig);
    
    // Create a new instance for each test
    printerService = new PrinterService();
    
    // Setup mock PrinterManager
    mockPrinterManager = new PrinterManager({}) as jest.Mocked<PrinterManager>;
    (PrinterManager as jest.Mock).mockReturnValue(mockPrinterManager);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('print', () => {
    it('should create a printer manager and call printLines', async () => {
      // Setup mock return value
      mockPrinterManager.printLines.mockResolvedValue(true);
      
      // Call the method
      const result = await printerService.print('Test text');
      
      // Verify PrinterManager was created with correct options
      expect(PrinterManager).toHaveBeenCalledWith({
        ipAddress: '192.168.1.100',
        type: 'epson',
        interfaceType: 'tcp',
        logging: true,
        logFilePath: 'logs/printer.log'
      });
      
      // Verify printLines was called with the text
      expect(mockPrinterManager.printLines).toHaveBeenCalledWith('Test text');
      
      // Verify the result
      expect(result).toBe(true);
    });
    
    it('should use custom parameters when provided', async () => {
      // Setup mock return value
      mockPrinterManager.printLines.mockResolvedValue(true);
      
      // Call the method with custom parameters
      await printerService.print('Test text', '192.168.1.200', 'star', 'usb');
      
      // Verify PrinterManager was created with custom options
      expect(PrinterManager).toHaveBeenCalledWith({
        ipAddress: '192.168.1.200',
        type: 'star',
        interfaceType: 'usb',
        logging: true,
        logFilePath: 'logs/printer.log'
      });
    });
  });
  
  describe('getPrinterOptions', () => {
    it('should return available printer options', () => {
      const options = printerService.getPrinterOptions();
      
      expect(options).toEqual({
        brands: ['tanca', 'star', 'epson'],
        interfaceTypes: ['tcp', 'usb', 'serial', 'bluetooth'],
        default: {
          ipAddress: '192.168.1.100',
          type: 'epson',
          interfaceType: 'tcp',
          logging: true,
          logFilePath: 'logs/printer.log'
        }
      });
    });
  });
  
  describe('getPrinterStatus', () => {
    it('should return printer status with default parameters', async () => {
      // Setup mock return value
      mockPrinterManager.isPrinterConnected.mockResolvedValue(true);
      
      // Call the method
      const status = await printerService.getPrinterStatus();
      
      // Verify PrinterManager was created with correct options
      expect(PrinterManager).toHaveBeenCalledWith({
        ipAddress: '192.168.1.100',
        type: 'epson',
        interfaceType: 'tcp',
        logging: true,
        logFilePath: 'logs/printer.log'
      });
      
      // Verify isPrinterConnected was called
      expect(mockPrinterManager.isPrinterConnected).toHaveBeenCalled();
      
      // Verify the result
      expect(status).toEqual({
        connected: true,
        ipAddress: '192.168.1.100',
        type: 'epson',
        interfaceType: 'tcp',
        logging: true,
        logFilePath: 'logs/printer.log'
      });
    });
    
    it('should use custom parameters when provided', async () => {
      // Setup mock return value
      mockPrinterManager.isPrinterConnected.mockResolvedValue(false);
      
      // Call the method with custom parameters
      const status = await printerService.getPrinterStatus('192.168.1.200', 'star', 'usb');
      
      // Verify PrinterManager was created with custom options
      expect(PrinterManager).toHaveBeenCalledWith({
        ipAddress: '192.168.1.200',
        type: 'star',
        interfaceType: 'usb',
        logging: true,
        logFilePath: 'logs/printer.log'
      });
      
      // Verify the result
      expect(status).toEqual({
        connected: false,
        ipAddress: '192.168.1.200',
        type: 'star',
        interfaceType: 'usb',
        logging: true,
        logFilePath: 'logs/printer.log'
      });
    });
  });
  
  describe('printTestPage', () => {
    it('should print a test page with default parameters', async () => {
      // Setup spy on print method
      jest.spyOn(printerService, 'print').mockResolvedValue(true);
      
      // Call the method
      const result = await printerService.printTestPage();
      
      // Verify print was called with test content
      expect(printerService.print).toHaveBeenCalledWith(
        expect.stringContaining('TEST PRINT'),
        undefined,
        undefined,
        undefined
      );
      
      // Verify the result
      expect(result).toBe(true);
    });
    
    it('should use custom parameters when provided', async () => {
      // Setup spy on print method
      jest.spyOn(printerService, 'print').mockResolvedValue(true);
      
      // Call the method with custom parameters
      await printerService.printTestPage('192.168.1.200', 'star', 'usb');
      
      // Verify print was called with test content and custom parameters
      expect(printerService.print).toHaveBeenCalledWith(
        expect.stringContaining('TEST PRINT'),
        '192.168.1.200',
        'star',
        'usb'
      );
    });
  });
});