const { LogUsuario, Usuario } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Obtener logs de usuarios con filtros
 */
const obtenerLogs = async (filtros = {}) => {
  try {
    const { fecha_inicio, fecha_fin, id_usuario, metodo, ruta, limite = 100 } = filtros;

    const whereClause = {};

    if (fecha_inicio && fecha_fin) {
      whereClause.timestamp = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    } else if (fecha_inicio) {
      whereClause.timestamp = { [Op.gte]: new Date(fecha_inicio) };
    } else if (fecha_fin) {
      whereClause.timestamp = { [Op.lte]: new Date(fecha_fin) };
    }

    if (id_usuario) whereClause.id_usuario = id_usuario;
    if (metodo) whereClause.metodo = metodo;
    if (ruta) {
      whereClause.ruta = { [Op.like]: `%${ruta}%` };
    }

    const logs = await LogUsuario.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          attributes: ['usuario', 'nombre', 'rol']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limite)
    });

    return logs;

  } catch (error) {
    logger.error(`Error al obtener logs: ${error.message}`);
    throw error;
  }
};

/**
 * Reporte de actividad de usuarios
 * Muestra qué usuarios son más activos
 */
const reporteActividadUsuarios = async (fecha_inicio, fecha_fin) => {
  try {
    const whereClause = {};

    if (fecha_inicio && fecha_fin) {
      whereClause.timestamp = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const logs = await LogUsuario.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          attributes: ['id_usuario', 'usuario', 'nombre', 'rol']
        }
      ]
    });

    // Agrupar por usuario
    const usuariosMap = new Map();

    logs.forEach(log => {
      if (log.Usuario) {
        const key = log.Usuario.id_usuario;

        if (!usuariosMap.has(key)) {
          usuariosMap.set(key, {
            id_usuario: log.Usuario.id_usuario,
            usuario: log.Usuario.usuario,
            nombre: log.Usuario.nombre,
            rol: log.Usuario.rol,
            total_acciones: 0,
            metodos: {
              GET: 0,
              POST: 0,
              PUT: 0,
              DELETE: 0
            },
            rutas_mas_usadas: {},
            duracion_total: 0,
            errores: 0
          });
        }

        const stats = usuariosMap.get(key);
        stats.total_acciones += 1;

        // Contar métodos
        if (log.metodo) {
          if (stats.metodos[log.metodo] !== undefined) {
            stats.metodos[log.metodo] += 1;
          }
        }

        // Contar rutas
        if (log.ruta) {
          stats.rutas_mas_usadas[log.ruta] = (stats.rutas_mas_usadas[log.ruta] || 0) + 1;
        }

        // Sumar duración
        if (log.duracion_segundos) {
          stats.duracion_total += parseFloat(log.duracion_segundos);
        }

        // Contar errores (status >= 400)
        if (log.status_code && log.status_code >= 400) {
          stats.errores += 1;
        }
      }
    });

    // Convertir a array y calcular promedios
    const reporte = Array.from(usuariosMap.values()).map(stats => {
      // Top 5 rutas más usadas
      const topRutas = Object.entries(stats.rutas_mas_usadas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ruta, count]) => ({ ruta, veces: count }));

      return {
        id_usuario: stats.id_usuario,
        usuario: stats.usuario,
        nombre: stats.nombre,
        rol: stats.rol,
        total_acciones: stats.total_acciones,
        metodos: stats.metodos,
        top_rutas: topRutas,
        duracion_promedio: (stats.duracion_total / stats.total_acciones).toFixed(3),
        total_errores: stats.errores,
        tasa_error: ((stats.errores / stats.total_acciones) * 100).toFixed(2)
      };
    });

    // Ordenar por total de acciones
    reporte.sort((a, b) => b.total_acciones - a.total_acciones);

    return {
      periodo: {
        fecha_inicio: fecha_inicio || 'Inicio',
        fecha_fin: fecha_fin || 'Hoy'
      },
      usuarios: reporte,
      resumen: {
        total_usuarios_activos: reporte.length,
        total_acciones: reporte.reduce((sum, u) => sum + u.total_acciones, 0),
        total_errores: reporte.reduce((sum, u) => sum + u.total_errores, 0),
        usuario_mas_activo: reporte[0] ? reporte[0].usuario : null
      }
    };

  } catch (error) {
    logger.error(`Error en reporteActividadUsuarios: ${error.message}`);
    throw error;
  }
};

/**
 * Reporte de errores del sistema
 * Análisis de errores HTTP
 */
const reporteErrores = async (fecha_inicio, fecha_fin) => {
  try {
    const whereClause = {
      status_code: { [Op.gte]: 400 }
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.timestamp = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const logs = await LogUsuario.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          attributes: ['usuario', 'rol']
        }
      ],
      order: [['timestamp', 'DESC']]
    });

    // Agrupar por código de error
    const erroresPorCodigo = {};
    const erroresPorRuta = {};

    logs.forEach(log => {
      // Por código
      const codigo = log.status_code;
      if (!erroresPorCodigo[codigo]) {
        erroresPorCodigo[codigo] = {
          codigo,
          cantidad: 0,
          rutas: []
        };
      }
      erroresPorCodigo[codigo].cantidad += 1;
      if (log.ruta) erroresPorCodigo[codigo].rutas.push(log.ruta);

      // Por ruta
      if (log.ruta) {
        if (!erroresPorRuta[log.ruta]) {
          erroresPorRuta[log.ruta] = 0;
        }
        erroresPorRuta[log.ruta] += 1;
      }
    });

    // Convertir a arrays
    const codigosArray = Object.values(erroresPorCodigo).map(err => ({
      codigo: err.codigo,
      cantidad: err.cantidad,
      rutas_afectadas: [...new Set(err.rutas)].length
    })).sort((a, b) => b.cantidad - a.cantidad);

    const rutasArray = Object.entries(erroresPorRuta)
      .map(([ruta, cantidad]) => ({ ruta, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    return {
      periodo: {
        fecha_inicio: fecha_inicio || 'Inicio',
        fecha_fin: fecha_fin || 'Hoy'
      },
      total_errores: logs.length,
      errores_por_codigo: codigosArray,
      top_rutas_con_errores: rutasArray,
      ultimos_errores: logs.slice(0, 20).map(log => ({
        timestamp: log.timestamp,
        usuario: log.Usuario ? log.Usuario.usuario : 'Desconocido',
        metodo: log.metodo,
        ruta: log.ruta,
        status: log.status_code,
        query: log.query
      }))
    };

  } catch (error) {
    logger.error(`Error en reporteErrores: ${error.message}`);
    throw error;
  }
};

/**
 * Estadísticas generales del sistema
 */
const reporteEstadisticasGenerales = async () => {
  try {
    const { Venta, Cliente, Pelicula, Funcion, Sala, Silla } = require('../models');

    // Total de registros
    const totalVentas = await Venta.count({ where: { estado: 'PAGADA' } });
    const totalReservas = await Venta.count({ where: { estado: 'RESERVADA' } });
    const totalClientes = await Cliente.count();
    const totalPeliculas = await Pelicula.count();
    const totalFunciones = await Funcion.count();
    const totalSalas = await Sala.count();
    const totalSillas = await Silla.count();
    const totalUsuarios = await Usuario.count();

    // Logs de las últimas 24 horas
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const accionesUltimas24h = await LogUsuario.count({
      where: { timestamp: { [Op.gte]: hace24h } }
    });

    // Ingresos totales
    const ventasPagadas = await Venta.findAll({
      where: { estado: 'PAGADA' },
      attributes: ['total']
    });
    const ingresosTotales = ventasPagadas.reduce((sum, v) => sum + parseFloat(v.total), 0);

    return {
      ventas: {
        total_pagadas: totalVentas,
        total_reservadas: totalReservas,
        ingresos_totales: ingresosTotales.toFixed(2)
      },
      catalogos: {
        total_clientes: totalClientes,
        total_peliculas: totalPeliculas,
        total_funciones: totalFunciones,
        total_salas: totalSalas,
        total_sillas: totalSillas
      },
      usuarios: {
        total_usuarios: totalUsuarios,
        acciones_ultimas_24h: accionesUltimas24h
      },
      timestamp: new Date()
    };

  } catch (error) {
    logger.error(`Error en reporteEstadisticasGenerales: ${error.message}`);
    throw error;
  }
};

module.exports = {
  obtenerLogs,
  reporteActividadUsuarios,
  reporteErrores,
  reporteEstadisticasGenerales
};
