const { Pelicula, Funcion, Venta, DetalleVenta, Cliente, Sala } = require('../models');
const { Op } = require('sequelize');

/**
 * Servicio de Recomendaciones de Películas
 * Sistema de IA para sugerir películas basado en historial y preferencias
 */

/**
 * Obtener géneros favoritos del cliente basado en historial
 * @param {number} id_cliente - ID del cliente
 * @returns {Promise<Array>} Géneros ordenados por frecuencia
 */
const obtenerGenerosFavoritos = async (id_cliente) => {
  const ventas = await Venta.findAll({
    where: {
      id_cliente,
      estado: 'PAGADA'
    },
    include: [
      {
        model: DetalleVenta,
        as: 'detalles',
        include: [
          {
            model: Funcion,
            as: 'funcion',
            include: [
              {
                model: Pelicula,
                as: 'pelicula',
                attributes: ['genero']
              }
            ]
          }
        ]
      }
    ]
  });

  // Contar frecuencia de géneros
  const generoCount = new Map();
  
  ventas.forEach(venta => {
    venta.detalles.forEach(detalle => {
      if (detalle.funcion && detalle.funcion.pelicula) {
        const genero = detalle.funcion.pelicula.genero;
        generoCount.set(genero, (generoCount.get(genero) || 0) + 1);
      }
    });
  });

  // Convertir a array y ordenar por frecuencia
  const generosOrdenados = Array.from(generoCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genero, count]) => ({ genero, veces: count }));

  return generosOrdenados;
};

/**
 * Recomendar películas basadas en el historial del cliente
 * @param {number} id_cliente - ID del cliente
 * @param {number} limite - Cantidad de recomendaciones
 * @returns {Promise<Object>} Recomendaciones personalizadas
 */
const recomendarPorHistorial = async (id_cliente, limite = 5) => {
  // Obtener géneros favoritos
  const generosFavoritos = await obtenerGenerosFavoritos(id_cliente);
  
  if (generosFavoritos.length === 0) {
    // Si no tiene historial, recomendar películas populares
    return await recomendarPopulares(limite);
  }

  // Obtener películas ya vistas
  const peliculasVistas = await Venta.findAll({
    where: {
      id_cliente,
      estado: 'PAGADA'
    },
    include: [
      {
        model: DetalleVenta,
        as: 'detalles',
        include: [
          {
            model: Funcion,
            as: 'funcion',
            attributes: ['id_pelicula']
          }
        ]
      }
    ]
  });

  const idsVistas = new Set();
  peliculasVistas.forEach(venta => {
    venta.detalles.forEach(detalle => {
      if (detalle.funcion) {
        idsVistas.add(detalle.funcion.id_pelicula);
      }
    });
  });

  // Recomendar películas de géneros favoritos que no haya visto
  const generosTop = generosFavoritos.slice(0, 3).map(g => g.genero);
  
  const recomendaciones = await Pelicula.findAll({
    where: {
      genero: {
        [Op.in]: generosTop
      },
      id: {
        [Op.notIn]: Array.from(idsVistas)
      },
      estado: 'EN_CARTELERA'
    },
    limit: limite,
    order: [['fecha_estreno', 'DESC']]
  });

  // Obtener funciones disponibles para cada recomendación
  const recomendacionesConFunciones = await Promise.all(
    recomendaciones.map(async (pelicula) => {
      const funciones = await Funcion.findAll({
        where: {
          id_pelicula: pelicula.id,
          fecha: {
            [Op.gte]: new Date()
          }
        },
        include: [
          {
            model: Sala,
            as: 'sala',
            attributes: ['nombre', 'tipo']
          }
        ],
        limit: 3,
        order: [['fecha', 'ASC'], ['hora', 'ASC']]
      });

      return {
        ...pelicula.toJSON(),
        funciones_disponibles: funciones.length,
        proximas_funciones: funciones
      };
    })
  );

  return {
    mensaje: 'Recomendaciones basadas en tus géneros favoritos',
    generos_favoritos: generosFavoritos.slice(0, 3),
    peliculas_vistas: idsVistas.size,
    recomendaciones: recomendacionesConFunciones
  };
};

/**
 * Recomendar películas populares (más vendidas)
 * @param {number} limite - Cantidad de recomendaciones
 * @returns {Promise<Object>} Películas más populares
 */
const recomendarPopulares = async (limite = 5) => {
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - 30); // Últimos 30 días

  const ventas = await Venta.findAll({
    where: {
      estado: 'PAGADA',
      fecha: {
        [Op.gte]: fechaInicio
      }
    },
    include: [
      {
        model: DetalleVenta,
        as: 'detalles',
        include: [
          {
            model: Funcion,
            as: 'funcion',
            include: [
              {
                model: Pelicula,
                as: 'pelicula'
              }
            ]
          }
        ]
      }
    ]
  });

  // Contar boletos vendidos por película
  const ventasPorPelicula = new Map();

  ventas.forEach(venta => {
    venta.detalles.forEach(detalle => {
      if (detalle.funcion && detalle.funcion.pelicula) {
        const pelicula = detalle.funcion.pelicula;
        const key = pelicula.id;
        
        if (!ventasPorPelicula.has(key)) {
          ventasPorPelicula.set(key, {
            pelicula: pelicula.toJSON(),
            boletos_vendidos: 0
          });
        }
        
        ventasPorPelicula.get(key).boletos_vendidos += 1;
      }
    });
  });

  // Ordenar por boletos vendidos
  const populares = Array.from(ventasPorPelicula.values())
    .sort((a, b) => b.boletos_vendidos - a.boletos_vendidos)
    .slice(0, limite);

  // Obtener funciones disponibles
  const popularesConFunciones = await Promise.all(
    populares.map(async (item) => {
      const funciones = await Funcion.findAll({
        where: {
          id_pelicula: item.pelicula.id,
          fecha: {
            [Op.gte]: new Date()
          }
        },
        include: [
          {
            model: Sala,
            as: 'sala',
            attributes: ['nombre', 'tipo']
          }
        ],
        limit: 3,
        order: [['fecha', 'ASC'], ['hora', 'ASC']]
      });

      return {
        ...item.pelicula,
        boletos_vendidos: item.boletos_vendidos,
        funciones_disponibles: funciones.length,
        proximas_funciones: funciones
      };
    })
  );

  return {
    mensaje: 'Películas más populares del último mes',
    periodo: '30 días',
    recomendaciones: popularesConFunciones
  };
};

/**
 * Recomendar películas por género específico
 * @param {string} genero - Género de película
 * @param {number} limite - Cantidad de recomendaciones
 * @param {number|null} id_cliente - ID del cliente (opcional, para excluir vistas)
 * @returns {Promise<Object>} Recomendaciones del género
 */
const recomendarPorGenero = async (genero, limite = 5, id_cliente = null) => {
  let idsVistas = new Set();

  // Si hay cliente, excluir películas ya vistas
  if (id_cliente) {
    const peliculasVistas = await Venta.findAll({
      where: {
        id_cliente,
        estado: 'PAGADA'
      },
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Funcion,
              as: 'funcion',
              attributes: ['id_pelicula']
            }
          ]
        }
      ]
    });

    peliculasVistas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        if (detalle.funcion) {
          idsVistas.add(detalle.funcion.id_pelicula);
        }
      });
    });
  }

  const whereCondition = {
    genero: genero.toUpperCase(),
    estado: 'EN_CARTELERA'
  };

  if (idsVistas.size > 0) {
    whereCondition.id = {
      [Op.notIn]: Array.from(idsVistas)
    };
  }

  const peliculas = await Pelicula.findAll({
    where: whereCondition,
    limit: limite,
    order: [['fecha_estreno', 'DESC']]
  });

  // Obtener funciones disponibles
  const peliculasConFunciones = await Promise.all(
    peliculas.map(async (pelicula) => {
      const funciones = await Funcion.findAll({
        where: {
          id_pelicula: pelicula.id,
          fecha: {
            [Op.gte]: new Date()
          }
        },
        include: [
          {
            model: Sala,
            as: 'sala',
            attributes: ['nombre', 'tipo']
          }
        ],
        limit: 3,
        order: [['fecha', 'ASC'], ['hora', 'ASC']]
      });

      return {
        ...pelicula.toJSON(),
        funciones_disponibles: funciones.length,
        proximas_funciones: funciones
      };
    })
  );

  return {
    mensaje: `Películas de ${genero}`,
    genero,
    recomendaciones: peliculasConFunciones
  };
};

/**
 * Obtener estrenos recientes
 * @param {number} dias - Días hacia atrás para considerar estreno
 * @param {number} limite - Cantidad de recomendaciones
 * @returns {Promise<Object>} Estrenos recientes
 */
const obtenerEstrenos = async (dias = 30, limite = 5) => {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - dias);

  const estrenos = await Pelicula.findAll({
    where: {
      fecha_estreno: {
        [Op.gte]: fechaLimite
      },
      estado: 'EN_CARTELERA'
    },
    limit: limite,
    order: [['fecha_estreno', 'DESC']]
  });

  const estrenosConFunciones = await Promise.all(
    estrenos.map(async (pelicula) => {
      const funciones = await Funcion.findAll({
        where: {
          id_pelicula: pelicula.id,
          fecha: {
            [Op.gte]: new Date()
          }
        },
        include: [
          {
            model: Sala,
            as: 'sala',
            attributes: ['nombre', 'tipo']
          }
        ],
        limit: 3,
        order: [['fecha', 'ASC'], ['hora', 'ASC']]
      });

      // Calcular días desde estreno
      const diasDesdeEstreno = Math.floor(
        (new Date() - new Date(pelicula.fecha_estreno)) / (1000 * 60 * 60 * 24)
      );

      return {
        ...pelicula.toJSON(),
        dias_desde_estreno: diasDesdeEstreno,
        funciones_disponibles: funciones.length,
        proximas_funciones: funciones
      };
    })
  );

  return {
    mensaje: `Estrenos de los últimos ${dias} días`,
    periodo_dias: dias,
    recomendaciones: estrenosConFunciones
  };
};

/**
 * Buscar películas similares por género y director
 * @param {number} id_pelicula - ID de la película de referencia
 * @param {number} limite - Cantidad de recomendaciones
 * @returns {Promise<Object>} Películas similares
 */
const buscarSimilares = async (id_pelicula, limite = 5) => {
  const peliculaRef = await Pelicula.findByPk(id_pelicula);
  
  if (!peliculaRef) {
    throw new Error('Película no encontrada');
  }

  // Buscar por mismo género o director
  const similares = await Pelicula.findAll({
    where: {
      [Op.or]: [
        { genero: peliculaRef.genero },
        { director: peliculaRef.director }
      ],
      id: {
        [Op.ne]: id_pelicula
      },
      estado: 'EN_CARTELERA'
    },
    limit: limite,
    order: [['fecha_estreno', 'DESC']]
  });

  const similaresConFunciones = await Promise.all(
    similares.map(async (pelicula) => {
      const funciones = await Funcion.findAll({
        where: {
          id_pelicula: pelicula.id,
          fecha: {
            [Op.gte]: new Date()
          }
        },
        include: [
          {
            model: Sala,
            as: 'sala',
            attributes: ['nombre', 'tipo']
          }
        ],
        limit: 3,
        order: [['fecha', 'ASC'], ['hora', 'ASC']]
      });

      // Determinar criterio de similitud
      let criterio = [];
      if (pelicula.genero === peliculaRef.genero) criterio.push('género');
      if (pelicula.director === peliculaRef.director) criterio.push('director');

      return {
        ...pelicula.toJSON(),
        similar_por: criterio,
        funciones_disponibles: funciones.length,
        proximas_funciones: funciones
      };
    })
  );

  return {
    mensaje: 'Películas similares',
    pelicula_referencia: {
      titulo: peliculaRef.titulo,
      genero: peliculaRef.genero,
      director: peliculaRef.director
    },
    recomendaciones: similaresConFunciones
  };
};

module.exports = {
  obtenerGenerosFavoritos,
  recomendarPorHistorial,
  recomendarPopulares,
  recomendarPorGenero,
  obtenerEstrenos,
  buscarSimilares
};
