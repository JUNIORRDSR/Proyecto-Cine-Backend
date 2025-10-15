const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { SEAT_BLOCKS, SEAT_ROWS, SEAT_TYPES } = require('../utils/constants');

const Silla = sequelize.define('Sillas', {
  id_silla: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_sala: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Salas',
      key: 'id_sala',
    },
  },
  bloque: {
    type: DataTypes.ENUM(SEAT_BLOCKS.B1, SEAT_BLOCKS.B2),
    allowNull: false,
    validate: {
      isIn: {
        args: [[SEAT_BLOCKS.B1, SEAT_BLOCKS.B2]],
        msg: 'El bloque debe ser B1 o B2',
      },
    },
  },
  fila: {
    type: DataTypes.ENUM(...SEAT_ROWS),
    allowNull: false,
    validate: {
      isIn: {
        args: [SEAT_ROWS],
        msg: `La fila debe estar entre A y M`,
      },
    },
  },
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'El número debe ser mayor a 0',
      },
      max: {
        args: [10],
        msg: 'El número no puede ser mayor a 10',
      },
    },
  },
  tipo: {
    type: DataTypes.ENUM(SEAT_TYPES.NORMAL, SEAT_TYPES.VIP, SEAT_TYPES.DISCAPACITADO),
    allowNull: false,
    defaultValue: SEAT_TYPES.NORMAL,
    validate: {
      isIn: {
        args: [[SEAT_TYPES.NORMAL, SEAT_TYPES.VIP, SEAT_TYPES.DISCAPACITADO]],
        msg: 'El tipo debe ser NORMAL, VIP o DISCAPACITADO',
      },
    },
  },
}, {
  tableName: 'Sillas',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_sala', 'bloque', 'fila', 'numero'],
      name: 'unique_seat_per_room',
    },
  ],
});

module.exports = Silla;
