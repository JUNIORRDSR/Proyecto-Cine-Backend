const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const Usuario = sequelize.define('Usuarios', {
  id_usuario: {
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
  usuario: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: 'El nombre de usuario ya existe',
    },
    validate: {
      notEmpty: {
        msg: 'El nombre de usuario es requerido',
      },
      len: {
        args: [3, 50],
        msg: 'El usuario debe tener entre 3 y 50 caracteres',
      },
    },
  },
  contrasena: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La contraseña es requerida',
      },
      len: {
        args: [6, 100],
        msg: 'La contraseña debe tener al menos 6 caracteres',
      },
    },
  },
  rol: {
    type: DataTypes.ENUM(ROLES.ADMIN, ROLES.CAJERO),
    allowNull: false,
    defaultValue: ROLES.CAJERO,
    validate: {
      isIn: {
        args: [[ROLES.ADMIN, ROLES.CAJERO]],
        msg: 'El rol debe ser ADMIN o CAJERO',
      },
    },
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Usuarios',
  timestamps: false,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.contrasena) {
        const salt = await bcrypt.genSalt(10);
        usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('contrasena')) {
        const salt = await bcrypt.genSalt(10);
        usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
      }
    },
  },
});

// Instance method to validate password
Usuario.prototype.validarContrasena = async function(contrasena) {
  return await bcrypt.compare(contrasena, this.contrasena);
};

module.exports = Usuario;
