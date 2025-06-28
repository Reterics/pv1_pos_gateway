/**
 * @jest-environment node
 */

import { PrinterManager, PrinterManagerOptions } from './PrinterManager';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import * as fs from 'fs';
import logger from '../utils/logger';

// Mocks
jest.mock('node-thermal-printer', () => {
  return {
    printer: jest.fn().mockImplementation(() => ({
      isPrinterConnected: jest.fn(),
      println: jest.fn(),
      cut: jest.fn(),
      execute: jest.fn(),
      clear: jest.fn()
    })),
    types: {
      EPSON: 'epson',
      STAR: 'star',
      TANCA: 'tanca'
    }
  };
});

jest.mock('fs', () => ({
  promises: {
    appendFile: jest.fn()
  }
}));

jest.mock('../utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

describe('PrinterManager', () => {
  const mockAppendFile = fs.promises.appendFile as jest.Mock;
  const mockLogger = logger as jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws error for unsupported interface type', () => {
    expect(() => new PrinterManager({
      interfaceType: 'INVALID' as any
    })).toThrow('Unsupported interface type: INVALID');
  });

  it('throws error for missing TCP IP address', () => {
    expect(() => new PrinterManager({
      interfaceType: 'tcp'
    })).toThrow('TCP interface requires an IP address');
  });

  it('correctly masks IP address in getInterfaceEncoded', () => {
    const mgr = new PrinterManager({ ipAddress: '192.168.1.50' });
    expect(mgr.getInterfaceEncoded()).toBe('x.x.1.50');
  });

  it('returns undefined for missing IP in getInterfaceEncoded', () => {
    const mgr = new PrinterManager({ interfaceType: 'usb' });
    expect(mgr.getInterfaceEncoded()).toBeUndefined();
  });

  it('successfully prints when printer is connected', async () => {
    const mgr = new PrinterManager({
      ipAddress: '192.168.1.100',
      logging: true
    });

    const mockedPrinter = (ThermalPrinter as jest.Mock).mock.results[0].value;
    mockedPrinter.isPrinterConnected.mockResolvedValue(true);
    mockedPrinter.execute.mockResolvedValue(true);

    const result = await mgr.printLines('Hello\nWorld');
    expect(result).toBe(true);

    // Validate expected calls
    expect(mockedPrinter.println).toHaveBeenCalledTimes(2);
    expect(mockedPrinter.cut).toHaveBeenCalled();
    expect(mockedPrinter.execute).toHaveBeenCalled();

    // Validate logs
    expect(mockAppendFile).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Printed message successfully');
  });

  it('returns false if printer connection check fails', async () => {
    const mgr = new PrinterManager({
      maxRetries:1,
      retryDelay:1,
      ipAddress: '192.168.1.100',
      logging: true
    });

    const mockedPrinter = (ThermalPrinter as jest.Mock).mock.results[0].value;
    mockedPrinter.isPrinterConnected.mockRejectedValue(new Error('No response'));

    const result = await mgr.printLines('Test');
    expect(result).toBe(false);

    expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to printer after retries',
        expect.objectContaining({
          error: expect.any(String),
          interfaceType: expect.any(String),
          printerType: expect.any(String)
        })
    );

    expect(mockAppendFile).toHaveBeenCalled();
  });

  it('returns false if execute fails after connection succeeds', async () => {
    const mgr = new PrinterManager({
      maxRetries:1,
      retryDelay:1,
      ipAddress: '192.168.1.100',
      logging: true
    });

    const mockedPrinter = (ThermalPrinter as jest.Mock).mock.results[0].value;
    mockedPrinter.isPrinterConnected.mockResolvedValue(true);
    mockedPrinter.execute.mockRejectedValue(new Error('Printer jam'));

    const result = await mgr.printLines('Line 1\nLine 2');
    expect(result).toBe(false);

    expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Print execution failed:'),
        expect.objectContaining({
          error: 'Printer jam',
          interfaceType: expect.any(String),
          printerType: expect.any(String)
        })
    );

    expect(mockAppendFile).toHaveBeenCalled();
  });

  it('maps printer brands correctly', () => {
    const mgrEpson = new PrinterManager({ type: 'epson', ipAddress: '1.2.3.4' });
    expect((ThermalPrinter as jest.Mock).mock.calls[0][0].type).toBe(PrinterTypes.EPSON);

    const mgrStar = new PrinterManager({ type: 'star', ipAddress: '1.2.3.4' });
    expect((ThermalPrinter as jest.Mock).mock.calls[1][0].type).toBe(PrinterTypes.STAR);

    const mgrTanca = new PrinterManager({ type: 'tanca', ipAddress: '1.2.3.4' });
    expect((ThermalPrinter as jest.Mock).mock.calls[2][0].type).toBe(PrinterTypes.TANCA);
  });
});
