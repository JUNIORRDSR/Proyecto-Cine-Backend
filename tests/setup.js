// Jest setup file
// Se ejecuta antes de todos los tests

// Timeout global para tests
jest.setTimeout(10000);

// Variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'salas_cine'; // Usando DB principal en Docker (entorno aislado)
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';

// Mock de console para tests más limpios (opcional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
