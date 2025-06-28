import request from 'supertest';
import express from 'express';
import app from '../src/app';

jest.mock('../src/controllers/PrinterController', () => {
    return {
        PrinterController: jest.fn().mockImplementation(() => ({
            printText: jest.fn((req, res) => res.json({ success: true })),
            getOptions: jest.fn((req, res) => res.json({ options: [] })),
            getStatus: jest.fn((req, res) => res.json({ status: 'ok' })),
            testPrint: jest.fn((req, res) => res.json({ test: 'printed' }))
        }))
    };
});

jest.mock('../src/config', () => ({
    getServerConfig: () => ({ port: 3000 }),
    getPrinterConfig: () => ({ brand: 'epson' })
}));

jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

describe('API Routes', () => {
    it('GET /api/config returns server and printer config', async () => {
        const res = await request(app).get('/api/config');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            server: { port: 3000 },
            printer: { brand: 'epson' }
        });
    });

    it('GET /api/options calls controller', async () => {
        const res = await request(app).get('/api/options');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('options');
    });

    it('POST /api/print with valid body returns success', async () => {
        const res = await request(app)
            .post('/api/print')
            .send({ text: 'Hello' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
    });

    it('GET /api/status returns status', async () => {
        const res = await request(app).get('/api/status?type=epson&interfaceType=tcp&ipAddress=192.168.1.2');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

    it('GET /api/test-print returns test print', async () => {
        const res = await request(app).get('/api/test-print?type=epson&interfaceType=tcp&ipAddress=192.168.1.2');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('test', 'printed');
    });

    it('returns 404 for unknown route', async () => {
        const res = await request(app).get('/unknown-route');
        expect(res.status).toBe(404);
    });
});
