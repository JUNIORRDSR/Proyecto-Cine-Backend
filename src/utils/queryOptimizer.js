/**
 * Servicio de Optimización de Queries
 * Proporciona queries optimizadas con includes precargados y selects específicos
 */

const { Pelicula, Funcion, Sala, Cliente, Usuario, Venta, DetalleVenta } = require('../models');

/**
 * Configuraciones de includes optimizados para diferentes casos de uso
 */

// Include básico de película (solo campos necesarios)
const peliculaBasicInclude = {
  model: Pelicula,
  as: 'pelicula',
  attributes: ['id', 'titulo', 'genero', 'duracion', 'calificacion', 'estado']
};

// Include completo de película
const peliculaFullInclude = {
  model: Pelicula,
  as: 'pelicula',
  attributes: { exclude: ['createdAt', 'updatedAt'] }
};

// Include básico de sala
const salaBasicInclude = {
  model: Sala,
  as: 'sala',
  attributes: ['id', 'nombre', 'tipo', 'capacidad']
};

// Include básico de cliente
const clienteBasicInclude = {
  model: Cliente,
  as: 'cliente',
  attributes: ['id', 'nombre', 'email', 'tipo']
};

// Include básico de usuario
const usuarioBasicInclude = {
  model: Usuario,
  as: 'usuario',
  attributes: ['id', 'nombre', 'usuario', 'rol']
};

// Include optimizado para funciones con película y sala
const funcionOptimizedInclude = [
  peliculaBasicInclude,
  salaBasicInclude
];

// Include optimizado para ventas
const ventaOptimizedInclude = [
  clienteBasicInclude,
  usuarioBasicInclude,
  {
    model: DetalleVenta,
    as: 'detalles',
    include: [
      {
        model: Funcion,
        as: 'funcion',
        include: funcionOptimizedInclude
      }
    ]
  }
];

/**
 * Attributes optimizados para diferentes modelos
 */

// Atributos básicos de película (para listados)
const peliculaListAttributes = [
  'id', 'titulo', 'genero', 'duracion', 'calificacion', 'estado', 'fecha_estreno', 'director'
];

// Atributos básicos de función
const funcionListAttributes = [
  'id', 'id_pelicula', 'id_sala', 'fecha', 'hora', 'hora_fin', 'precio'
];

// Atributos básicos de venta
const ventaListAttributes = [
  'id', 'id_cliente', 'id_usuario', 'fecha', 'total', 'estado'
];

/**
 * Options predefinidos para queries comunes
 */

// Opciones para listar películas en cartelera
const peliculasCarteleraOptions = {
  where: { estado: 'EN_CARTELERA' },
  attributes: peliculaListAttributes,
  order: [['fecha_estreno', 'DESC']]
};

// Opciones para listar funciones disponibles
const funcionesDisponiblesOptions = (fecha) => ({
  where: {
    fecha: fecha || new Date()
  },
  include: funcionOptimizedInclude,
  attributes: funcionListAttributes,
  order: [['fecha', 'ASC'], ['hora', 'ASC']]
});

// Opciones para historial de ventas con paginación
const ventasHistorialOptions = (page = 1, limit = 20) => ({
  include: ventaOptimizedInclude,
  attributes: ventaListAttributes,
  order: [['fecha', 'DESC']],
  limit: parseInt(limit),
  offset: (parseInt(page) - 1) * parseInt(limit)
});

/**
 * Funciones helper para optimización de queries
 */

/**
 * Construir options con paginación
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @param {Object} baseOptions - Opciones base
 * @returns {Object} Options con paginación
 */
const buildPaginatedOptions = (page = 1, limit = 20, baseOptions = {}) => {
  return {
    ...baseOptions,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };
};

/**
 * Construir options con ordenamiento
 * @param {string} field - Campo de ordenamiento
 * @param {string} direction - Dirección (ASC/DESC)
 * @param {Object} baseOptions - Opciones base
 * @returns {Object} Options con ordenamiento
 */
const buildSortedOptions = (field, direction = 'ASC', baseOptions = {}) => {
  return {
    ...baseOptions,
    order: [[field, direction.toUpperCase()]]
  };
};

/**
 * Construir metadata de paginación
 * @param {number} count - Total de registros
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @returns {Object} Metadata
 */
const buildPaginationMeta = (count, page, limit) => {
  const totalPages = Math.ceil(count / limit);
  return {
    currentPage: parseInt(page),
    perPage: parseInt(limit),
    total: count,
    totalPages,
    hasNextPage: parseInt(page) < totalPages,
    hasPrevPage: parseInt(page) > 1
  };
};

/**
 * Query optimizada para obtener funciones con disponibilidad
 * @param {number} id_funcion - ID de la función
 * @returns {Promise<Object>} Función con información completa
 */
const getFuncionConDisponibilidad = async (id_funcion) => {
  const funcion = await Funcion.findByPk(id_funcion, {
    include: [
      peliculaBasicInclude,
      {
        model: Sala,
        as: 'sala',
        attributes: ['id', 'nombre', 'tipo', 'capacidad'],
        include: [
          {
            model: require('../models').Silla,
            as: 'sillas',
            attributes: ['id', 'bloque', 'fila', 'numero', 'tipo']
          }
        ]
      }
    ]
  });

  return funcion;
};

/**
 * Query optimizada para cartelera con funciones próximas
 * @param {number} dias - Días hacia adelante
 * @returns {Promise<Array>} Películas con funciones
 */
const getCarteleraConFunciones = async (dias = 7) => {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + dias);

  const peliculas = await Pelicula.findAll({
    where: { estado: 'EN_CARTELERA' },
    attributes: peliculaListAttributes,
    include: [
      {
        model: Funcion,
        as: 'funciones',
        where: {
          fecha: {
            [require('sequelize').Op.between]: [new Date(), fechaLimite]
          }
        },
        required: false,
        attributes: funcionListAttributes,
        include: [salaBasicInclude],
        limit: 10,
        order: [['fecha', 'ASC'], ['hora', 'ASC']]
      }
    ],
    order: [['fecha_estreno', 'DESC']]
  });

  return peliculas;
};

/**
 * Query optimizada para estadísticas rápidas
 * @returns {Promise<Object>} Estadísticas
 */
const getEstadisticasRapidas = async () => {
  const { Op } = require('sequelize');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [
    totalPeliculas,
    totalFunciones,
    ventasHoy,
    clientesActivos
  ] = await Promise.all([
    Pelicula.count({ where: { estado: 'EN_CARTELERA' } }),
    Funcion.count({ where: { fecha: { [Op.gte]: hoy } } }),
    Venta.count({ 
      where: { 
        fecha: { [Op.gte]: hoy },
        estado: 'PAGADA'
      } 
    }),
    Cliente.count()
  ]);

  return {
    peliculas_en_cartelera: totalPeliculas,
    funciones_proximas: totalFunciones,
    ventas_hoy: ventasHoy,
    clientes_totales: clientesActivos
  };
};

module.exports = {
  // Includes
  peliculaBasicInclude,
  peliculaFullInclude,
  salaBasicInclude,
  clienteBasicInclude,
  usuarioBasicInclude,
  funcionOptimizedInclude,
  ventaOptimizedInclude,
  
  // Attributes
  peliculaListAttributes,
  funcionListAttributes,
  ventaListAttributes,
  
  // Options predefinidos
  peliculasCarteleraOptions,
  funcionesDisponiblesOptions,
  ventasHistorialOptions,
  
  // Helpers
  buildPaginatedOptions,
  buildSortedOptions,
  buildPaginationMeta,
  
  // Queries optimizadas
  getFuncionConDisponibilidad,
  getCarteleraConFunciones,
  getEstadisticasRapidas
};
