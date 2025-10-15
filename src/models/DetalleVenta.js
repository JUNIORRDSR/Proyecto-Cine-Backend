const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { SEAT_STATES } = require('../utils/constants');

const DetalleVenta = sequelize.define('Detalle_Venta', {
  id_detalle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Ventas',
      key: 'id_venta',
    },
  },
  id_funcion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Funciones',
      key: 'id_funcion',
    },
  },
  id_silla: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Sillas',
      key: 'id_silla',
    },
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'El precio unitario debe ser mayor o igual a 0',
      },
    },
  },
  estado_silla: {
    type: DataTypes.ENUM(SEAT_STATES.LIBRE, SEAT_STATES.OCUPADA, SEAT_STATES.RESERVADA),
    allowNull: false,
    defaultValue: SEAT_STATES.RESERVADA,
    validate: {
      isIn: {
        args: [[SEAT_STATES.LIBRE, SEAT_STATES.OCUPADA, SEAT_STATES.RESERVADA]],
        msg: 'El estado debe ser LIBRE, OCUPADA o RESERVADA',
      },
    },
  },
}, {
  tableName: 'Detalle_Venta',
  timestamps: false,
});

module.exports = DetalleVenta;
