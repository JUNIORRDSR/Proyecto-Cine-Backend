const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Funcion = sequelize.define('Funciones', {
  id_funcion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pelicula: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Peliculas',
      key: 'id_pelicula',
    },
  },
  id_sala: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Salas',
      key: 'id_sala',
    },
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La fecha es requerida',
      },
      isDate: {
        msg: 'La fecha debe ser una fecha válida',
      },
    },
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La hora es requerida',
      },
    },
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'El precio debe ser mayor o igual a 0',
      },
    },
  },
}, {
  tableName: 'Funciones',
  timestamps: false,
});

module.exports = Funcion;
