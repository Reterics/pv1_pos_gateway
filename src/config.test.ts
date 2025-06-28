import fs from 'fs';
import path from 'path';
import { getServerConfig, getPrinterConfig } from './config';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Config', () => {
  // Save original environment variables
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Reset process.env
    process.env = { ...originalEnv };
    
    // Mock process.cwd()
    jest.spyOn(process, 'cwd').mockReturnValue('/app');
    
    // Mock path.join to return a predictable path
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.existsSync to return true (config file exists)
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock fs.readFileSync to return a valid config
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      server: {
        port: 3000
      },
      printer: {
        ipAddress: '192.168.1.100',
        type: 'epson',
        interfaceType: 'tcp',
        logging: true,
        logFilePath: 'logs/printer.log'
      }
    }));
  });
  
  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });
  
  describe('getServerConfig', () => {
    it('should load server config from file', () => {
      const config = getServerConfig();
      
      // Verify config file was checked
      expect(fs.existsSync).toHaveBeenCalledWith('/app/config/default.json');
      
      // Verify config file was read
      expect(fs.readFileSync).toHaveBeenCalledWith('/app/config/default.json', 'utf-8');
      
      // Verify returned config
      expect(config).toEqual({
        port: 3000
      });
    });
    
    it('should override port from environment variable', () => {
      // Set environment variable
      process.env.PORT = '4000';
      
      const config = getServerConfig();
      
      // Verify returned config uses environment variable
      expect(config).toEqual({
        port: 4000
      });
    });
    
    it('should throw error if config file does not exist', () => {
      // Mock fs.existsSync to return false (config file doesn't exist)
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Verify error is thrown
      expect(() => getServerConfig()).toThrow('Missing config/default.json');
    });
    
    it('should throw error if port is invalid', () => {
      // Mock fs.readFileSync to return config with invalid port
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
        server: {
          port: -1
        },
        printer: {}
      }));
      
      // Verify error is thrown
      expect(() => getServerConfig()).toThrow('Server port must be a number between 1 and 65535');
    });
  });
  
  describe('getPrinterConfig', () => {
    it('should load printer config from file', () => {
      const config = getPrinterConfig();
      
      // Verify config file was checked
      expect(fs.existsSync).toHaveBeenCalledWith('/app/config/default.json');
      
      // Verify config file was read
      expect(fs.readFileSync).toHaveBeenCalledWith('/app/config/default.json', 'utf-8');
      
      // Verify returned config
      expect(config).toEqual({
        ipAddress: '192.168.1.100',
        type: 'epson',
        interfaceType: 'tcp',
        logging: true,
        logFilePath: 'logs/printer.log'
      });
    });
    
    it('should override values from environment variables', () => {
      // Set environment variables
      process.env.PRINTER_IP = '192.168.1.200';
      process.env.PRINTER_TYPE = 'star';
      process.env.PRINTER_INTERFACE = 'usb';
      process.env.PRINTER_LOGGING = 'false';
      process.env.PRINTER_LOG_FILE = 'logs/custom.log';
      
      const config = getPrinterConfig();
      
      // Verify returned config uses environment variables
      expect(config).toEqual({
        ipAddress: '192.168.1.200',
        type: 'star',
        interfaceType: 'usb',
        logging: false,
        logFilePath: 'logs/custom.log'
      });
    });
    
    it('should throw error if printer type is invalid', () => {
      // Set environment variable with invalid printer type
      process.env.PRINTER_TYPE = 'invalid';
      
      // Verify error is thrown
      expect(() => getPrinterConfig()).toThrow('Invalid printer type');
    });
    
    it('should throw error if interface type is invalid', () => {
      // Set environment variable with invalid interface type
      process.env.PRINTER_INTERFACE = 'invalid';
      
      // Verify error is thrown
      expect(() => getPrinterConfig()).toThrow('Invalid interface type');
    });
    
    it('should throw error if IP is missing for TCP interface', () => {
      // Mock fs.readFileSync to return config with TCP interface but no IP
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
        server: {
          port: 3000
        },
        printer: {
          type: 'epson',
          interfaceType: 'tcp',
          logging: true,
          logFilePath: 'logs/printer.log'
        }
      }));
      
      // Verify error is thrown
      expect(() => getPrinterConfig()).toThrow('IP address is required for TCP interface');
    });
    
    it('should throw error if logging is not a boolean', () => {
      // Mock fs.readFileSync to return config with invalid logging value
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
        server: {
          port: 3000
        },
        printer: {
          ipAddress: '192.168.1.100',
          type: 'epson',
          interfaceType: 'tcp',
          logging: 'not-a-boolean',
          logFilePath: 'logs/printer.log'
        }
      }));
      
      // Verify error is thrown
      expect(() => getPrinterConfig()).toThrow('Logging must be a boolean value');
    });
  });
});