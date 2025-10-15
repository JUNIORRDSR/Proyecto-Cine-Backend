const { Venta, DetalleVenta, Pelicula, Funcion, Sala, Cliente, Usuario } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const logger = require('../utils/logger');
const { SALE_STATES, CLIENT_TYPES } = require('../utils/constants');

/**
 * Reporte de ventas por película
 * Muestra qué películas generan más ingresos
 */
const reporteVentasPorPelicula = async (fecha_inicio, fecha_fin) => {
  try {
    const whereClause = {
      estado: SALE_STATES.PAGADA
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    // Query con agregaciones
    const ventas = await Venta.findAll({
      where: whereClause,
      include: [
        {
          model: DetalleVenta,
          include: [
            {
              model: Funcion,
              include: [
                {
                  model: Pelicula,
                  attributes: ['id_pelicula', 'titulo', 'genero', 'clasificacion']
                }
              ]
            }
          ]
        }
      ]
    });

    // Agrupar por película
    const peliculasMap = new Map();

    ventas.forEach(venta => {
      venta.Detalle_Venta.forEach(detalle => {
        if (detalle.Funcion && detalle.Funcion.Pelicula) {
          const pelicula = detalle.Funcion.Pelicula;
          const key = pelicula.id_pelicula;

          if (!peliculasMap.has(key)) {
            peliculasMap.set(key, {
              id_pelicula: pelicula.id_pelicula,
              titulo: pelicula.titulo,
              genero: pelicula.genero,
              clasificacion: pelicula.clasificacion,
              total_boletos: 0,
              total_ingresos: 0,
              numero_funciones: new Set(),
              numero_ventas: new Set()
            });
          }

          const stats = peliculasMap.get(key);
          stats.total_boletos += 1;
          stats.total_ingresos += parseFloat(detalle.subtotal);
          stats.numero_funciones.add(detalle.id_funcion);
          stats.numero_ventas.add(venta.id_venta);
        }
      });
    });

    // Convertir a array y calcular promedios
    const reporte = Array.from(peliculasMap.values()).map(stats => ({
      ...stats,
      numero_funciones: stats.numero_funciones.size,
      numero_ventas: stats.numero_ventas.size,
      promedio_boletos_por_funcion: (stats.total_boletos / stats.numero_funciones.size).toFixed(2),
      promedio_ingresos_por_funcion: (stats.total_ingresos / stats.numero_funciones.size).toFixed(2),
      total_ingresos: stats.total_ingresos.toFixed(2)
    }));

    // Ordenar por ingresos (descendente)
    reporte.sort((a, b) => parseFloat(b.total_ingresos) - parseFloat(a.total_ingresos));

    return {
      periodo: {
        fecha_inicio: fecha_inicio || 'Inicio',
        fecha_fin: fecha_fin || 'Hoy'
      },
      total_peliculas: reporte.length,
      peliculas: reporte,
      resumen: {
        total_boletos: reporte.reduce((sum, p) => sum + p.total_boletos, 0),
        total_ingresos: reporte.reduce((sum, p) => sum + parseFloat(p.total_ingresos), 0).toFixed(2)
      }
    };

  } catch (error) {
    logger.error(`Error en reporteVentasPorPelicula: ${error.message}`);
    throw error;
  }
};

/**
 * Reporte de ventas por fecha
 * Análisis temporal de ventas
 */
const reporteVentasPorFecha = async (fecha_inicio, fecha_fin) => {
  try {
    const whereClause = {
      estado: SALE_STATES.PAGADA
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const ventas = await Venta.findAll({
      where: whereClause,
      include: [
        { model: DetalleVenta },
        { model: Cliente, attributes: ['tipo_cliente'] }
      ],
      order: [['fecha_venta', 'ASC']]
    });

    // Agrupar por fecha
    const fechasMap = new Map();

    ventas.forEach(venta => {
      const fecha = venta.fecha_venta.toISOString().split('T')[0];

      if (!fechasMap.has(fecha)) {
        fechasMap.set(fecha, {
          fecha,
          total_ventas: 0,
          total_boletos: 0,
          total_ingresos: 0,
          ventas_vip: 0,
          ventas_normal: 0
        });
      }

      const stats = fechasMap.get(fecha);
      stats.total_ventas += 1;
      stats.total_boletos += venta.Detalle_Venta.length;
      stats.total_ingresos += parseFloat(venta.total);

      if (venta.Cliente) {
        if (venta.Cliente.tipo_cliente === CLIENT_TYPES.VIP) {
          stats.ventas_vip += 1;
        } else {
          stats.ventas_normal += 1;
        }
      }
    });

    // Convertir a array
    const reporte = Array.from(fechasMap.values()).map(stats => ({
      ...stats,
      promedio_por_venta: (stats.total_ingresos / stats.total_ventas).toFixed(2),
      promedio_boletos_por_venta: (stats.total_boletos / stats.total_ventas).toFixed(2),
      total_ingresos: stats.total_ingresos.toFixed(2)
    }));

    return {
      periodo: {
        fecha_inicio: fecha_inicio || 'Inicio',
        fecha_fin: fecha_fin || 'Hoy'
      },
      total_dias: reporte.length,
      ventas_por_dia: reporte,
      resumen: {
        total_ventas: reporte.reduce((sum, d) => sum + d.total_ventas, 0),
        total_boletos: reporte.reduce((sum, d) => sum + d.total_boletos, 0),
        total_ingresos: reporte.reduce((sum, d) => sum + parseFloat(d.total_ingresos), 0).toFixed(2),
        promedio_diario: (reporte.reduce((sum, d) => sum + parseFloat(d.total_ingresos), 0) / reporte.length).toFixed(2)
      }
    };

  } catch (error) {
    logger.error(`Error en reporteVentasPorFecha: ${error.message}`);
    throw error;
  }
};

/**
 * Reporte de clientes VIP
 * Top clientes y análisis de comportamiento
 */
const reporteClientesVIP = async (fecha_inicio, fecha_fin, limite = 20) => {
  try {
    const whereClause = {
      estado: SALE_STATES.PAGADA
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const ventas = await Venta.findAll({
      where: whereClause,
      include: [
        {
          model: Cliente,
          attributes: ['id_cliente', 'nombre', 'email', 'tipo_cliente', 'telefono']
        },
        { model: DetalleVenta }
      ]
    });

    // Agrupar por cliente
    const clientesMap = new Map();

    ventas.forEach(venta => {
      if (venta.Cliente) {
        const key = venta.Cliente.id_cliente;

        if (!clientesMap.has(key)) {
          clientesMap.set(key, {
            id_cliente: venta.Cliente.id_cliente,
            nombre: venta.Cliente.nombre,
            email: venta.Cliente.email,
            telefono: venta.Cliente.telefono,
            tipo_cliente: venta.Cliente.tipo_cliente,
            total_compras: 0,
            total_boletos: 0,
            total_gastado: 0
          });
        }

        const stats = clientesMap.get(key);
        stats.total_compras += 1;
        stats.total_boletos += venta.Detalle_Venta.length;
        stats.total_gastado += parseFloat(venta.total);
      }
    });

    // Convertir a array y calcular promedios
    const clientes = Array.from(clientesMap.values()).map(stats => ({
      ...stats,
      promedio_por_compra: (stats.total_gastado / stats.total_compras).toFixed(2),
      promedio_boletos_por_compra: (stats.total_boletos / stats.total_compras).toFixed(2),
      total_gastado: stats.total_gastado.toFixed(2)
    }));

    // Separar VIP y NORMAL
    const clientesVIP = clientes.filter(c => c.tipo_cliente === CLIENT_TYPES.VIP)
      .sort((a, b) => parseFloat(b.total_gastado) - parseFloat(a.total_gastado))
      .slice(0, limite);

    const clientesNormal = clientes.filter(c => c.tipo_cliente === CLIENT_TYPES.NORMAL)
      .sort((a, b) => parseFloat(b.total_gastado) - parseFloat(a.total_gastado))
      .slice(0, limite);

    return {
      periodo: {
        fecha_inicio: fecha_inicio || 'Inicio',
        fecha_fin: fecha_fin || 'Hoy'
      },
      top_clientes_vip: clientesVIP,
      top_clientes_normal: clientesNormal,
      estadisticas: {
        total_clientes_vip: clientes.filter(c => c.tipo_cliente === CLIENT_TYPES.VIP).length,
        total_clientes_normal: clientes.filter(c => c.tipo_cliente === CLIENT_TYPES.NORMAL).length,
        ingresos_vip: clientes
          .filter(c => c.tipo_cliente === CLIENT_TYPES.VIP)
          .reduce((sum, c) => sum + parseFloat(c.total_gastado), 0)
          .toFixed(2),
        ingresos_normal: clientes
          .filter(c => c.tipo_cliente === CLIENT_TYPES.NORMAL)
          .reduce((sum, c) => sum + parseFloat(c.total_gastado), 0)
          .toFixed(2),
        promedio_gasto_vip: clientesVIP.length > 0
          ? (clientesVIP.reduce((sum, c) => sum + parseFloat(c.total_gastado), 0) / clientesVIP.length).toFixed(2)
          : '0.00',
        promedio_gasto_normal: clientesNormal.length > 0
          ? (clientesNormal.reduce((sum, c) => sum + parseFloat(c.total_gastado), 0) / clientesNormal.length).toFixed(2)
          : '0.00'
      }
    };

  } catch (error) {
    logger.error(`Error en reporteClientesVIP: ${error.message}`);
    throw error;
  }
};

/**
 * Reporte de ocupación de salas
 * Análisis de uso de salas y funciones
 */
const reporteOcupacionSalas = async (fecha_inicio, fecha_fin) => {
  try {
    const whereClauseFuncion = {};
    
    if (fecha_inicio && fecha_fin) {
      whereClauseFuncion.fecha = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    const funciones = await Funcion.findAll({
      where: whereClauseFuncion,
      include: [
        {
          model: Sala,
          attributes: ['id_sala', 'nombre', 'capacidad', 'tipo']
        },
        {
          model: Pelicula,
          attributes: ['titulo']
        },
        {
          model: DetalleVenta,
          include: [{
            model: Venta,
            where: { estado: SALE_STATES.PAGADA },
            required: false
          }]
        }
      ]
    });

    // Agrupar por sala
    const salasMap = new Map();

    funciones.forEach(funcion => {
      if (funcion.Sala) {
        const key = funcion.Sala.id_sala;

        if (!salasMap.has(key)) {
          salasMap.set(key, {
            id_sala: funcion.Sala.id_sala,
            nombre: funcion.Sala.nombre,
            tipo: funcion.Sala.tipo,
            capacidad: funcion.Sala.capacidad,
            total_funciones: 0,
            total_boletos_vendidos: 0,
            capacidad_total: 0
          });
        }

        const stats = salasMap.get(key);
        stats.total_funciones += 1;
        stats.capacidad_total += funcion.Sala.capacidad;
        
        // Contar boletos vendidos para esta función
        const boletosVendidos = funcion.Detalle_Venta.filter(
          dv => dv.Venta && dv.Venta.estado === SALE_STATES.PAGADA
        ).length;
        stats.total_boletos_vendidos += boletosVendidos;
      }
    });

    // Calcular porcentajes
    const reporte = Array.from(salasMap.values()).map(stats => ({
      ...stats,
      porcentaje_ocupacion: ((stats.total_boletos_vendidos / stats.capacidad_total) * 100).toFixed(2),
      promedio_boletos_por_funcion: (stats.total_boletos_vendidos / stats.total_funciones).toFixed(2)
    }));

    // Ordenar por ocupación
    reporte.sort((a, b) => parseFloat(b.porcentaje_ocupacion) - parseFloat(a.porcentaje_ocupacion));

    return {
      periodo: {
        fecha_inicio: fecha_inicio || 'Inicio',
        fecha_fin: fecha_fin || 'Hoy'
      },
      salas: reporte,
      resumen: {
        total_salas: reporte.length,
        ocupacion_promedio: (reporte.reduce((sum, s) => sum + parseFloat(s.porcentaje_ocupacion), 0) / reporte.length).toFixed(2),
        total_funciones: reporte.reduce((sum, s) => sum + s.total_funciones, 0),
        total_boletos_vendidos: reporte.reduce((sum, s) => sum + s.total_boletos_vendidos, 0)
      }
    };

  } catch (error) {
    logger.error(`Error en reporteOcupacionSalas: ${error.message}`);
    throw error;
  }
};

module.exports = {
  reporteVentasPorPelicula,
  reporteVentasPorFecha,
  reporteClientesVIP,
  reporteOcupacionSalas
};
