<p align="center">
    <a href="https://github.com/Reterics/project_v1">
        <img src="./public/logo.png" alt="Project V1">
    </a>
</p>
<h1 align="center">Project V1 Printer Gateway</h1>

<div align="center">

[![build](https://github.com/Reterics/pv1_printer_gateway/actions/workflows/npm-build-test.yml/badge.svg)](https://github.com/Reterics/pv1_printer_gateway/actions/workflows/npm-build-test.yml) [![codecov](https://codecov.io/github/Reterics/pv1_printer_gateway/graph/badge.svg?token=MZLXTLPJSN)](https://codecov.io/github/Reterics/pv1_printer_gateway) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![maintenance-status](https://img.shields.io/badge/maintenance-actively--developed-brightgreen.svg)

</div>
A Node.js service that provides a gateway between POS (Point of Sale) systems and thermal printers. This application allows you to send print jobs to various thermal printer brands over different interfaces (TCP/IP, USB, Serial, Bluetooth).

## Features

- Web-based interface for printer configuration and testing
- RESTful API for integration with POS systems
- Support for multiple printer brands (Epson, Star, Tanca)
- Multiple connection interfaces (TCP/IP, USB, Serial, Bluetooth)
- Test print functionality
- Printer status monitoring
- Configurable via JSON file or environment variables
- Executable packaging for Windows and Linux

## Installation

### Prerequisites

- Node.js 22.0.0 or higher

### From Source

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure the application by editing `config/default.json` or setting environment variables

### As Executable

Pre-built executables are available for Windows and Linux:

1. Download the appropriate executable for your platform
2. Create a `config` folder in the same directory as the executable
3. Create a `default.json` file in the `config` folder with your configuration

## Configuration

### Configuration File

Create or modify `config/default.json`:

```json
{
  "server": {
    "port": 3000
  },
  "printer": {
    "ipAddress": "192.168.0.100",
    "type": "epson",
    "interfaceType": "tcp",
    "logging": true,
    "logFilePath": "./logs.log"
  }
}
```

### Environment Variables

You can override configuration settings with environment variables:

- `PORT` - Server port
- `PRINTER_IP` - Printer IP address
- `PRINTER_TYPE` - Printer brand (epson, star, tanca)
- `PRINTER_INTERFACE` - Interface type (tcp, usb, serial, bluetooth)
- `PRINTER_LOGGING` - Enable/disable printer logging (true/false)
- `PRINTER_LOG_FILE` - Path to printer log file

## Usage

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Web Interface

Access the web interface at `http://localhost:3000` (or your configured port).

The web interface allows you to:
- View printer status
- Send test prints
- Configure printer settings

### API Endpoints

#### Print Text

```
POST /api/print
```

Request body:
```json
{
  "text": "Text to print",
  "ip": "192.168.0.100",
  "brand": "epson",
  "interface_type": "tcp"
}
```

Note: Only the `text` field is required. The `ip`, `brand`, and `interface_type` fields are optional.

#### Get Printer Options

```
GET /api/options
```

Returns available printer brands, interface types, and default configuration.

#### Get Printer Status

```
GET /api/status
```

Query parameters:
- `ip` (optional) - Printer IP address
- `brand` (optional) - Printer brand
- `interface_type` (optional) - Interface type

#### Send Test Print

```
GET /api/test-print
```

Query parameters:
- `ip` (optional) - Printer IP address
- `brand` (optional) - Printer brand
- `interface_type` (optional) - Interface type

#### Get Configuration

```
GET /api/config
```

Returns the current server and printer configuration.

## Building Executables

```bash
# Build for Windows
npm run pkg:win

# Build for Linux
npm run pkg:linux

# Build for both platforms
npm run pkg:all
```

Executables will be created in the `dist` directory.

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run coverage
```

## License

[MIT](./LICENSE)

## Contribute

There are many ways to [contribute](./CONTRIBUTING.md) to Printer Gateway.
* [Submit bugs](https://github.com/Reterics/pv1_printer_gateway/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/Reterics/pv1_printer_gateway/pulls).
* [Contribute bug fixes](https://github.com/Reterics/pv1_printer_gateway/blob/main/CONTRIBUTING.md).


