const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogUsuario = sequelize.define('Log_Usuarios', {
  id_log: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id_usuario',
    },
  },
  accion: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La acción es requerida',
      },
    },
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  duracion_segundos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'La duración debe ser mayor o igual a 0',
      },
    },
  },
  detalles: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'Log_Usuarios',
  timestamps: false,
});

module.exports = LogUsuario;
