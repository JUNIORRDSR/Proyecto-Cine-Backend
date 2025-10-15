const cache = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Middleware de caching con Redis
 * Cachea respuestas de API para reducir carga en BD
 */

/**
 * Generar clave de cache basada en URL y query params
 * @param {Object} req - Request de Express
 * @returns {string} Clave única
 */
const generateCacheKey = (req) => {
  const baseKey = req.originalUrl || req.url;
  const userId = req.usuario?.id || 'anonymous';
  return `cache:${userId}:${baseKey}`;
};

/**
 * Middleware de cache general
 * @param {number} ttl - Tiempo de vida en segundos (default: 300 = 5 min)
 * @returns {Function} Middleware de Express
 */
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Si Redis no está conectado, continuar sin cache
    if (!cache.isConnected()) {
      return next();
    }

    const key = generateCacheKey(req);

    try {
      // Intentar obtener del cache
      const cachedData = await cache.get(key);

      if (cachedData) {
        logger.debug(`Cache HIT: ${key}`);
        return res.json({
          ...cachedData,
          _cached: true,
          _cachedAt: new Date().toISOString()
        });
      }

      logger.debug(`Cache MISS: ${key}`);

      // Interceptar res.json para guardar en cache
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        // Solo cachear respuestas exitosas
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, data, ttl).catch(err => {
            logger.error('Error saving to cache:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Middleware para invalidar cache después de operaciones de escritura
 * @param {string|Array<string>} patterns - Patrones de claves a invalidar
 * @returns {Function} Middleware de Express
 */
const invalidateCacheMiddleware = (patterns) => {
  return async (req, res, next) => {
    // Ejecutar después de la respuesta
    res.on('finish', async () => {
      // Solo invalidar en operaciones exitosas
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (!cache.isConnected()) {
          return;
        }

        try {
          const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
          
          for (const pattern of patternsArray) {
            const deleted = await cache.delPattern(pattern);
            if (deleted > 0) {
              logger.info(`Cache invalidated: ${pattern} (${deleted} keys)`);
            }
          }
        } catch (error) {
          logger.error('Error invalidating cache:', error);
        }
      }
    });

    next();
  };
};

/**
 * Middleware específico para cache de películas
 * TTL: 10 minutos (las películas no cambian frecuentemente)
 */
const cachePeliculas = cacheMiddleware(600);

/**
 * Middleware específico para cache de funciones
 * TTL: 5 minutos (las funciones pueden actualizarse)
 */
const cacheFunciones = cacheMiddleware(300);

/**
 * Middleware específico para cache de salas
 * TTL: 30 minutos (las salas raramente cambian)
 */
const cacheSalas = cacheMiddleware(1800);

/**
 * Middleware específico para cache de reportes
 * TTL: 2 minutos (datos cambian frecuentemente)
 */
const cacheReportes = cacheMiddleware(120);

/**
 * Middleware específico para cache de recomendaciones
 * TTL: 15 minutos (recomendaciones pueden ser estables)
 */
const cacheRecomendaciones = cacheMiddleware(900);

/**
 * Invalidar cache de películas
 */
const invalidatePeliculasCache = invalidateCacheMiddleware('cache:*:/api/peliculas*');

/**
 * Invalidar cache de funciones
 */
const invalidateFuncionesCache = invalidateCacheMiddleware([
  'cache:*:/api/funciones*',
  'cache:*:/api/chatbot/estrenos*'
]);

/**
 * Invalidar cache de ventas (afecta reportes y estadísticas)
 */
const invalidateVentasCache = invalidateCacheMiddleware([
  'cache:*:/api/ventas*',
  'cache:*:/api/reportes*',
  'cache:*:/api/chatbot/populares*',
  'cache:*:/api/chatbot/recomendaciones*'
]);

/**
 * Invalidar cache de reservas
 */
const invalidateReservasCache = invalidateCacheMiddleware([
  'cache:*:/api/reservas*',
  'cache:*:/api/funciones/*/disponibilidad*'
]);

/**
 * Middleware para limpiar todo el cache (solo Admin)
 */
const clearAllCache = async (req, res, next) => {
  try {
    if (!cache.isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Redis cache not available'
      });
    }

    await cache.flush();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener estadísticas del cache (solo Admin)
 */
const getCacheStats = async (req, res, next) => {
  try {
    const stats = await cache.getStats();
    
    res.json({
      success: true,
      message: 'Cache statistics retrieved',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware,
  cachePeliculas,
  cacheFunciones,
  cacheSalas,
  cacheReportes,
  cacheRecomendaciones,
  invalidatePeliculasCache,
  invalidateFuncionesCache,
  invalidateVentasCache,
  invalidateReservasCache,
  clearAllCache,
  getCacheStats
};
