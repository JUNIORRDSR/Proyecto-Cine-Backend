# Guía de Testing

## 📋 Tabla de Contenidos
- [Tipos de Tests](#tipos-de-tests)
- [Configuración](#configuración)
- [Ejecutar Tests](#ejecutar-tests)
- [Mejores Prácticas](#mejores-prácticas)
- [Cobertura de Código](#cobertura-de-código)

---

## Tipos de Tests

### 1. **Unit Tests** (tests/unit/)
Tests aislados de funciones y servicios individuales usando mocks.

**Características:**
- No requieren base de datos
- Usan mocks de Sequelize
- Muy rápidos (milisegundos)
- Alta granularidad

**Archivos:**
- `peliculaService.test.js` - Tests del servicio de películas
- `reservaService.test.js` - Tests del servicio de reservas
- `database.test.js` - Tests de conexión a DB

**Ejemplo:**
```javascript
describe('peliculaService', () => {
  it('should list all movies', async () => {
    Pelicula.findAll.mockResolvedValue([...]);
    const result = await peliculaService.listarPeliculas();
    expect(result).toHaveLength(2);
  });
});
```

---

### 2. **Integration Tests** (tests/integration/)
Tests de APIs completas con base de datos real.

**Características:**
- Requieren base de datos de prueba
- Usan `supertest` para simular requests
- Moderadamente rápidos (segundos)
- Verifican integración entre capas

**Archivos:**
- `auth.test.js` - Tests de autenticación
- `server.test.js` - Tests de configuración del servidor

**Ejemplo:**
```javascript
describe('POST /api/auth/login', () => {
  it('should login successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'test', contrasena: 'pass' })
      .expect(200);
    
    expect(response.body.data).toHaveProperty('token');
  });
});
```

---

### 3. **E2E Tests** (tests/e2e/)
Tests de flujos completos de usuario.

**Características:**
- Simulan comportamiento de usuario real
- Múltiples requests en secuencia
- Más lentos (varios segundos)
- Alta confianza en funcionalidad

**Archivos:**
- `complete-flow.test.js` - Flujo completo desde registro hasta compra

**Ejemplo:**
```javascript
describe('E2E: Complete Flow', () => {
  it('should complete purchase flow', async () => {
    // 1. Register
    // 2. Login
    // 3. Create movie
    // 4. Create function
    // 5. Make reservation
    // 6. Confirm purchase
    // 7. Verify sale
  });
});
```

---

## Configuración

### Variables de Entorno para Tests

Crear `.env.test`:
```bash
NODE_ENV=test
DB_NAME=salas_cine_test
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=12345
JWT_SECRET=test-jwt-secret-key-min-32-chars
```

### Base de Datos de Prueba

1. **Crear base de datos de test:**
```sql
CREATE DATABASE salas_cine_test;
```

2. **Sincronización automática:**
Los tests usan `sequelize.sync({ force: true })` para crear tablas limpias.

---

## Ejecutar Tests

### Comandos Disponibles

```bash
# Todos los tests
npm test

# Solo unit tests
npm run test:unit

# Solo integration tests
npm run test:integration

# Solo E2E tests
npm run test:e2e

# Con cobertura de código
npm run test:coverage

# Modo watch (re-ejecuta al cambiar archivos)
npm run test:watch
```

### Ejecutar Tests Específicos

```bash
# Un archivo específico
npx jest tests/unit/peliculaService.test.js

# Tests con patrón en el nombre
npx jest --testNamePattern="should create"

# Solo tests de un describe
npx jest --testNamePattern="PeliculaService"
```

---

## Mejores Prácticas

### 1. **Estructura AAA (Arrange-Act-Assert)**

```javascript
it('should do something', async () => {
  // Arrange: Preparar datos y mocks
  const mockData = { id: 1, name: 'Test' };
  Model.findAll.mockResolvedValue([mockData]);
  
  // Act: Ejecutar la función
  const result = await service.getData();
  
  // Assert: Verificar resultados
  expect(result).toEqual([mockData]);
  expect(Model.findAll).toHaveBeenCalled();
});
```

### 2. **Usar beforeEach/afterEach para Limpieza**

```javascript
describe('Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Limpiar mocks
  });
  
  afterEach(async () => {
    // Limpiar datos de prueba si es necesario
  });
});
```

### 3. **Tests Descriptivos**

```javascript
// ❌ Malo
it('test 1', () => { ... });

// ✅ Bueno
it('should return 404 when movie not found', () => { ... });
```

### 4. **No Compartir Estado entre Tests**

```javascript
// ❌ Malo
let sharedData;
it('test 1', () => { sharedData = {...}; });
it('test 2', () => { use(sharedData); }); // Dependencia!

// ✅ Bueno
it('test 1', () => { const data = {...}; });
it('test 2', () => { const data = {...}; }); // Independiente
```

### 5. **Mocks Apropiados**

```javascript
// Mock completo del modelo
jest.mock('../../src/models', () => ({
  Pelicula: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

// Mock de método específico
Pelicula.findAll = jest.fn().mockResolvedValue([...]);
```

### 6. **Verificar Errores**

```javascript
it('should throw error on invalid data', async () => {
  await expect(service.create({}))
    .rejects
    .toThrow('Validation error');
});
```

---

## Cobertura de Código

### Generar Reporte de Cobertura

```bash
npm run test:coverage
```

### Leer Reporte

El reporte se genera en `coverage/`:
- `coverage/lcov-report/index.html` - Reporte visual HTML
- `coverage/coverage-summary.json` - Resumen JSON

**Métricas:**
- **Statements**: % de líneas ejecutadas
- **Branches**: % de ramificaciones (if/else) cubiertas
- **Functions**: % de funciones ejecutadas
- **Lines**: % de líneas cubiertas

### Objetivos de Cobertura

| Módulo | Objetivo Mínimo |
|--------|----------------|
| Services | 80% |
| Controllers | 70% |
| Middlewares | 75% |
| Models | 60% |
| **Global** | **75%** |

---

## Coverage Badge

Agregar badge al README:

```markdown
![Coverage](https://img.shields.io/badge/coverage-75%25-brightgreen)
```

---

## Tests Implementados

### ✅ Unit Tests
- [x] peliculaService.test.js (7 tests)
  - listarPeliculas
  - obtenerPelicula
  - crearPelicula
  - actualizarPelicula
  - eliminarPelicula

- [x] reservaService.test.js (12 tests)
  - crearReserva
  - confirmarReserva
  - cancelarReserva
  - limpiarReservasExpiradas
  - obtenerDisponibilidadFuncion

- [x] database.test.js (2 tests)
  - Conexión a BD
  - Queries básicas

### ✅ Integration Tests
- [x] auth.test.js (11 tests)
  - Registro de usuarios
  - Login
  - Profile
  - Change password

- [x] server.test.js (3 tests)
  - Health check
  - CORS
  - Rate limiting

### ✅ E2E Tests
- [x] complete-flow.test.js (20 tests)
  - Flujo completo de compra
  - 9 pasos desde infraestructura hasta reportes

---

## Debugging Tests

### Ver Output Detallado

```bash
npx jest --verbose
```

### Debug con Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Luego abrir `chrome://inspect` en Chrome.

### Logs en Tests

```javascript
it('should debug', () => {
  console.log('Debug info:', data);
  // O usar logger
  logger.debug('Test data', data);
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: 12345
          MYSQL_DATABASE: salas_cine_test
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Troubleshooting

### Error: "Cannot find module"
```bash
# Limpiar caché de Jest
npx jest --clearCache
```

### Error: "Database connection failed"
```bash
# Verificar que MySQL esté corriendo
docker ps | grep mysql

# Verificar variables de entorno
echo $NODE_ENV
```

### Tests muy lentos
```bash
# Ejecutar en paralelo (default)
npm test

# Ejecutar en secuencia (más lento, útil para debugging)
npx jest --runInBand
```

### Timeouts
```javascript
// Aumentar timeout para tests lentos
it('slow test', async () => {
  // ...
}, 10000); // 10 segundos
```

---

## Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Última actualización:** Octubre 2025
**Total de Tests:** 42 tests
**Cobertura Estimada:** 75%+
