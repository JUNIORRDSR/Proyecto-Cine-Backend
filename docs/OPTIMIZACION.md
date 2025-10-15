# Guía de Optimización y Performance

## 📊 Optimizaciones Implementadas

### 1. **Caching con Redis**

#### Configuración
El sistema utiliza Redis para cachear respuestas de API frecuentes, reduciendo la carga en la base de datos.

```javascript
// Configuración en .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

#### Middlewares de Cache Disponibles

```javascript
const {
  cachePeliculas,      // TTL: 10 minutos
  cacheFunciones,      // TTL: 5 minutos
  cacheSalas,          // TTL: 30 minutos
  cacheReportes,       // TTL: 2 minutos
  cacheRecomendaciones // TTL: 15 minutos
} = require('./middlewares/cacheMiddleware');

// Uso en rutas
router.get('/peliculas', cachePeliculas, peliculaController.listar);
```

#### Invalidación de Cache

El cache se invalida automáticamente después de operaciones de escritura:

```javascript
const { invalidatePeliculasCache } = require('./middlewares/cacheMiddleware');

// POST, PUT, DELETE - invalida cache automáticamente
router.post('/peliculas', invalidatePeliculasCache, peliculaController.crear);
```

#### Gestión Manual del Cache

```javascript
const cache = require('./config/redis');

// Obtener
const data = await cache.get('mi-clave');

// Guardar (TTL en segundos)
await cache.set('mi-clave', { data: 'valor' }, 300);

// Eliminar
await cache.del('mi-clave');

// Eliminar por patrón
await cache.delPattern('peliculas:*');

// Limpiar todo
await cache.flush();

// Estadísticas
const stats = await cache.getStats();
```

---

### 2. **Compresión HTTP**

Las respuestas HTTP se comprimen automáticamente con gzip/deflate:

```javascript
const compression = require('compression');
app.use(compression());
```

**Beneficios:**
- Reduce el tamaño de respuestas en ~70%
- Mejora velocidad de transferencia
- Menor uso de ancho de banda

---

### 3. **Índices de Base de Datos**

Se agregaron índices compuestos para queries frecuentes:

#### Tabla Funciones
```javascript
indexes: [
  { fields: ['fecha', 'hora'] },           // Búsquedas por horario
  { fields: ['id_pelicula'] },             // JOIN con películas
  { fields: ['id_sala'] },                 // JOIN con salas
  { fields: ['id_sala', 'fecha'] }         // Disponibilidad de sala
]
```

#### Tabla Ventas
```javascript
indexes: [
  { fields: ['id_cliente'] },              // Historial por cliente
  { fields: ['id_usuario'] },              // Ventas por usuario
  { fields: ['fecha_venta'] },             // Reportes por fecha
  { fields: ['estado'] },                  // Filtros por estado
  { fields: ['fecha_venta', 'estado'] },   // Reportes filtrados
  { fields: ['fecha_expiracion_reserva'] } // Limpieza de reservas
]
```

**Impacto:**
- Queries hasta 100x más rápidas
- Menor carga en CPU de DB
- Mejor performance en JOINs

---

### 4. **Optimización de Queries**

Se implementó un servicio de queries optimizadas:

```javascript
const queryOptimizer = require('./utils/queryOptimizer');

// Includes optimizados
const funciones = await Funcion.findAll({
  include: queryOptimizer.funcionOptimizedInclude,
  attributes: queryOptimizer.funcionListAttributes
});

// Paginación
const options = queryOptimizer.buildPaginatedOptions(page, limit, {
  where: { estado: 'EN_CARTELERA' }
});

// Metadata de paginación
const meta = queryOptimizer.buildPaginationMeta(count, page, limit);

// Queries predefinidas
const cartelera = await queryOptimizer.getCarteleraConFunciones(7);
const stats = await queryOptimizer.getEstadisticasRapidas();
```

**Mejores Prácticas:**

1. **Seleccionar solo campos necesarios:**
```javascript
// ❌ Malo
const peliculas = await Pelicula.findAll();

// ✅ Bueno
const peliculas = await Pelicula.findAll({
  attributes: ['id', 'titulo', 'genero', 'duracion']
});
```

2. **Eager Loading vs N+1:**
```javascript
// ❌ Malo (N+1 queries)
const funciones = await Funcion.findAll();
for (const f of funciones) {
  const pelicula = await Pelicula.findByPk(f.id_pelicula);
}

// ✅ Bueno (1 query)
const funciones = await Funcion.findAll({
  include: [{ model: Pelicula, as: 'pelicula' }]
});
```

3. **Paginación:**
```javascript
// ✅ Siempre paginar resultados grandes
const { rows, count } = await Venta.findAndCountAll({
  limit: 20,
  offset: (page - 1) * 20,
  order: [['fecha', 'DESC']]
});
```

---

### 5. **Rate Limiting Mejorado**

Configuración por endpoint:

```javascript
// General: 100 req/15min
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Login: 5 req/15min
router.post('/login', rateLimit({ max: 5 }), authController.login);

// Reportes: 20 req/15min
router.get('/reportes/*', rateLimit({ max: 20 }), ...);
```

---

## 📈 Métricas de Performance

### Tiempos de Respuesta Objetivo

| Endpoint | Sin Cache | Con Cache | Objetivo |
|----------|-----------|-----------|----------|
| GET /peliculas | 150ms | 5ms | < 200ms |
| GET /funciones | 200ms | 8ms | < 300ms |
| GET /reportes/* | 800ms | 50ms | < 1000ms |
| POST /ventas | 350ms | N/A | < 500ms |

### Reducción de Carga en BD

- **Cache Hit Rate objetivo:** > 70%
- **Reducción de queries:** ~60-80% en endpoints GET
- **Queries simultáneas:** Reducción de picos en 50%

---

## 🔧 Monitoreo y Debugging

### Endpoints de Administración

```bash
# Ver estadísticas de cache (Admin only)
GET /api/admin/cache/stats

# Limpiar cache (Admin only)
DELETE /api/admin/cache/clear
```

### Logs de Cache

Los logs muestran Cache HIT/MISS:

```
[DEBUG] Cache HIT: cache:1:/api/peliculas
[DEBUG] Cache MISS: cache:1:/api/funciones?fecha=2025-10-15
[INFO] Cache invalidated: cache:*:/api/peliculas* (15 keys)
```

### Verificar Índices en MySQL

```sql
-- Ver índices de una tabla
SHOW INDEX FROM Funciones;

-- Analizar uso de índices
EXPLAIN SELECT * FROM Funciones WHERE fecha = '2025-10-15' AND id_sala = 1;
```

---

## 🚀 Recomendaciones de Despliegue

### Redis en Producción

1. **Railway/Render:**
   - Usar addon de Redis incluido
   - Configurar `REDIS_HOST` y `REDIS_PASSWORD`

2. **Redis Cloud (gratuito hasta 30MB):**
   ```
   REDIS_HOST=redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com
   REDIS_PORT=12345
   REDIS_PASSWORD=your-password
   ```

3. **Upstash (serverless):**
   - Mejor para deployments serverless
   - Pago por uso

### MySQL Optimizations

```sql
-- Aumentar pool de conexiones en producción
DB_POOL_MAX=20
DB_POOL_MIN=5

-- Query cache (si está disponible)
SET GLOBAL query_cache_size = 67108864; -- 64MB
SET GLOBAL query_cache_type = 1;
```

### Node.js en Producción

```bash
# Usar PM2 para clustering
npm install -g pm2
pm2 start src/app.js -i max  # Usa todos los CPUs

# Variables de entorno
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"
```

---

## 📝 Checklist de Optimización

- [x] Redis implementado y configurado
- [x] Middlewares de cache en rutas GET
- [x] Invalidación automática de cache
- [x] Compresión HTTP activada
- [x] Índices en tablas críticas
- [x] Queries optimizadas con includes
- [x] Paginación en listados
- [x] Rate limiting configurado
- [ ] Connection pooling optimizado
- [ ] Monitoring con APM (New Relic/DataDog)
- [ ] Load balancing (Nginx/HAProxy)
- [ ] CDN para assets estáticos

---

## 🎯 Próximas Mejoras

1. **Connection Pooling Avanzado:**
   - Pool por tipo de query (read/write)
   - Réplicas de lectura

2. **Cache de Segundo Nivel:**
   - Cache local en memoria (node-cache)
   - Cache distribuido (Redis)
   - Cache en CDN (Cloudflare)

3. **Optimización de IA/NLP:**
   - Pre-entrenamiento de modelos
   - Cache de clasificaciones comunes
   - Workers para procesamiento pesado

4. **Database Sharding:**
   - Particionar tablas grandes (Ventas, Logs)
   - Archivado de datos históricos

---

**Última actualización:** Octubre 2025
**Versión:** 1.0.0
