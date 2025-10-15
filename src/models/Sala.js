const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ROOM_STATES, ROOM_TYPES } = require('../utils/constants');

const Sala = sequelize.define('Salas', {
  id_sala: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: 'El nombre de la sala ya existe',
    },
    validate: {
      notEmpty: {
        msg: 'El nombre es requerido',
      },
    },
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 260,
    validate: {
      min: {
        args: [1],
        msg: 'La capacidad debe ser al menos 1',
      },
    },
  },
  tipo: {
    type: DataTypes.ENUM(ROOM_TYPES.DOS_D, ROOM_TYPES.TRES_D, ROOM_TYPES.IMAX, ROOM_TYPES.VIP),
    allowNull: false,
    defaultValue: ROOM_TYPES.DOS_D,
    validate: {
      isIn: {
        args: [[ROOM_TYPES.DOS_D, ROOM_TYPES.TRES_D, ROOM_TYPES.IMAX, ROOM_TYPES.VIP]],
        msg: 'El tipo debe ser 2D, 3D, IMAX o VIP',
      },
    },
  },
  estado: {
    type: DataTypes.ENUM(ROOM_STATES.ACTIVA, ROOM_STATES.INACTIVA, ROOM_STATES.MANTENIMIENTO),
    allowNull: false,
    defaultValue: ROOM_STATES.ACTIVA,
    validate: {
      isIn: {
        args: [[ROOM_STATES.ACTIVA, ROOM_STATES.INACTIVA, ROOM_STATES.MANTENIMIENTO]],
        msg: 'El estado debe ser ACTIVA, INACTIVA o MANTENIMIENTO',
      },
    },
  },
}, {
  tableName: 'Salas',
  timestamps: false,
});

module.exports = Sala;
