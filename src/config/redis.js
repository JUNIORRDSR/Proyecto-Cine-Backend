const redis = require('redis');
const logger = require('../utils/logger');

/**
 * Configuración de Redis para caching distribuido
 * Mejora el rendimiento almacenando en memoria datos frecuentemente accedidos
 */

let redisClient = null;
let isRedisConnected = false;

/**
 * Crear y conectar cliente Redis
 */
const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Too many Redis reconnection attempts. Giving up.');
            return new Error('Redis connection failed');
          }
          const delay = Math.min(retries * 50, 2000);
          logger.info(`Reconnecting to Redis... Attempt ${retries}, delay: ${delay}ms`);
          return delay;
        }
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: process.env.REDIS_DB || 0
    });

    // Event handlers
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
      isRedisConnected = true;
    });

    redisClient.on('end', () => {
      logger.warn('Redis Client Disconnected');
      isRedisConnected = false;
    });

    // Conectar
    await redisClient.connect();
    
    logger.info('✅ Redis connection established successfully');
    return true;
  } catch (error) {
    logger.warn('⚠️  Redis connection failed. Running without cache:', error.message);
    isRedisConnected = false;
    return false;
  }
};

/**
 * Obtener valor del cache
 * @param {string} key - Clave del cache
 * @returns {Promise<any|null>} Valor o null
 */
const get = async (key) => {
  if (!isRedisConnected || !redisClient) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

/**
 * Guardar valor en cache
 * @param {string} key - Clave del cache
 * @param {any} value - Valor a guardar
 * @param {number} ttl - Tiempo de vida en segundos (default: 300 = 5 minutos)
 * @returns {Promise<boolean>} Éxito
 */
const set = async (key, value, ttl = 300) => {
  if (!isRedisConnected || !redisClient) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    await redisClient.setEx(key, ttl, serialized);
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

/**
 * Eliminar valor del cache
 * @param {string} key - Clave del cache
 * @returns {Promise<boolean>} Éxito
 */
const del = async (key) => {
  if (!isRedisConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
};

/**
 * Eliminar múltiples claves por patrón
 * @param {string} pattern - Patrón de búsqueda (ej: 'peliculas:*')
 * @returns {Promise<number>} Cantidad de claves eliminadas
 */
const delPattern = async (pattern) => {
  if (!isRedisConnected || !redisClient) {
    return 0;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    await redisClient.del(keys);
    return keys.length;
  } catch (error) {
    logger.error(`Redis DEL pattern error for ${pattern}:`, error);
    return 0;
  }
};

/**
 * Verificar existencia de clave
 * @param {string} key - Clave del cache
 * @returns {Promise<boolean>} Existe o no
 */
const exists = async (key) => {
  if (!isRedisConnected || !redisClient) {
    return false;
  }

  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`Redis EXISTS error for key ${key}:`, error);
    return false;
  }
};

/**
 * Limpiar todo el cache
 * @returns {Promise<boolean>} Éxito
 */
const flush = async () => {
  if (!isRedisConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.flushDb();
    logger.info('Redis cache flushed');
    return true;
  } catch (error) {
    logger.error('Redis FLUSH error:', error);
    return false;
  }
};

/**
 * Obtener estadísticas de Redis
 * @returns {Promise<Object>} Estadísticas
 */
const getStats = async () => {
  if (!isRedisConnected || !redisClient) {
    return {
      connected: false,
      message: 'Redis not connected'
    };
  }

  try {
    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbSize();
    
    return {
      connected: true,
      dbSize,
      info
    };
  } catch (error) {
    logger.error('Redis STATS error:', error);
    return {
      connected: false,
      error: error.message
    };
  }
};

/**
 * Cerrar conexión Redis
 */
const disconnect = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
};

/**
 * Verificar si Redis está conectado
 * @returns {boolean} Estado de conexión
 */
const isConnected = () => {
  return isRedisConnected;
};

module.exports = {
  connectRedis,
  get,
  set,
  del,
  delPattern,
  exists,
  flush,
  getStats,
  disconnect,
  isConnected
};
