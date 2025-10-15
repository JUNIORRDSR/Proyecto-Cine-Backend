const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { CLIENT_TYPES } = require('../utils/constants');

const Cliente = sequelize.define('Clientes', {
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es requerido',
      },
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres',
      },
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: {
      msg: 'El email ya está registrado',
    },
    validate: {
      isEmail: {
        msg: 'El formato del email no es válido',
      },
    },
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: {
        args: [7, 20],
        msg: 'El teléfono debe tener entre 7 y 20 caracteres',
      },
    },
  },
  tipo: {
    type: DataTypes.ENUM(CLIENT_TYPES.NORMAL, CLIENT_TYPES.VIP),
    allowNull: false,
    defaultValue: CLIENT_TYPES.NORMAL,
    validate: {
      isIn: {
        args: [[CLIENT_TYPES.NORMAL, CLIENT_TYPES.VIP]],
        msg: 'El tipo debe ser NORMAL o VIP',
      },
    },
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Clientes',
  timestamps: false,
});

module.exports = Cliente;
