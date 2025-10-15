const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { SALE_STATES } = require('../utils/constants');

const Venta = sequelize.define('Ventas', {
  id_venta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Clientes',
      key: 'id_cliente',
    },
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuarios',
      key: 'id_usuario',
    },
  },
  fecha_venta: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'El total debe ser mayor o igual a 0',
      },
    },
  },
  estado: {
    type: DataTypes.ENUM(SALE_STATES.PAGADA, SALE_STATES.RESERVADA, SALE_STATES.CANCELADA),
    allowNull: false,
    defaultValue: SALE_STATES.RESERVADA,
    validate: {
      isIn: {
        args: [[SALE_STATES.PAGADA, SALE_STATES.RESERVADA, SALE_STATES.CANCELADA]],
        msg: 'El estado debe ser PAGADA, RESERVADA o CANCELADA',
      },
    },
  },
  fecha_expiracion_reserva: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Ventas',
  timestamps: false,
});

module.exports = Venta;
