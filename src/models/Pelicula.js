const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { MOVIE_STATES, MOVIE_CLASSIFICATIONS } = require('../utils/constants');

const Pelicula = sequelize.define('Peliculas', {
  id_pelicula: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El título es requerido',
      },
      len: {
        args: [1, 200],
        msg: 'El título debe tener entre 1 y 200 caracteres',
      },
    },
  },
  genero: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El género es requerido',
      },
    },
  },
  duracion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'La duración debe ser mayor a 0 minutos',
      },
      max: {
        args: [500],
        msg: 'La duración no puede exceder 500 minutos',
      },
    },
  },
  clasificacion: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La clasificación es requerida',
      },
    },
  },
  sinopsis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  director: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM(MOVIE_STATES.EN_CARTELERA, MOVIE_STATES.RETIRADA),
    allowNull: false,
    defaultValue: MOVIE_STATES.EN_CARTELERA,
    validate: {
      isIn: {
        args: [[MOVIE_STATES.EN_CARTELERA, MOVIE_STATES.RETIRADA]],
        msg: 'El estado debe ser EN_CARTELERA o RETIRADA',
      },
    },
  },
  fecha_estreno: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Peliculas',
  timestamps: false,
});

module.exports = Pelicula;
