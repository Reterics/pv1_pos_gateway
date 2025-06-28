import { PrinterManager, PrinterManagerOptions } from './PrinterManager';

// Mock the node-thermal-printer module
jest.mock('node-thermal-printer', () => ({
  printer: jest.fn().mockImplementation(() => ({
    isPrinterConnected: jest.fn().mockResolvedValue(true),
    println: jest.fn(),
    cut: jest.fn(),
    execute: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn()
  })),
  types: {
    EPSON: 'epson',
    STAR: 'star',
    TANCA: 'tanca'
  }
}));

// Mock the fs module
jest.mock('fs', () => ({
  promises: {
    appendFile: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock the logger
jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('PrinterManager', () => {
  let printerManager: PrinterManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new PrinterManager instance with default options
    const options: PrinterManagerOptions = {
      ipAddress: '192.168.1.100',
      type: 'epson',
      interfaceType: 'tcp'
    };
    
    printerManager = new PrinterManager(options);
  });
  
  describe('constructor', () => {
    it('should create an instance with default options', () => {
      const defaultOptions: PrinterManagerOptions = {
        ipAddress: '192.168.1.101',
      };
      const manager = new PrinterManager(defaultOptions);
      
      expect(manager).toBeInstanceOf(PrinterManager);
    });
    
    it('should create an instance with custom options', () => {
      const customOptions: PrinterManagerOptions = {
        ipAddress: '192.168.1.100',
        type: 'epson',
        interfaceType: 'tcp',
        logging: true,
        serialPath: '/dev/custom',
        usbPath: 'custom-usb',
        maxRetries: 5,
        retryDelay: 2000
      };
      
      const manager = new PrinterManager(customOptions);
      expect(manager).toBeInstanceOf(PrinterManager);
    });
  });
  
  describe('isPrinterConnected', () => {
    it('should return true when printer is connected', async () => {
      const result = await printerManager.isPrinterConnected();
      expect(result).toBe(true);
    });
  });
  
  describe('printLines', () => {
    it('should successfully print lines when printer is connected', async () => {
      const result = await printerManager.printLines('Test message');
      expect(result).toBe(true);
    });
  });
});