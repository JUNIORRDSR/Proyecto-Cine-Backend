// Import all models
const Usuario = require('./Usuario');
const Cliente = require('./Cliente');
const Sala = require('./Sala');
const Pelicula = require('./Pelicula');
const Funcion = require('./Funcion');
const Silla = require('./Silla');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');
const LogUsuario = require('./LogUsuario');

// Define associations (relationships)

// Funcion belongs to Pelicula
Funcion.belongsTo(Pelicula, {
  foreignKey: 'id_pelicula',
  as: 'pelicula',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Pelicula.hasMany(Funcion, {
  foreignKey: 'id_pelicula',
  as: 'funciones',
});

// Funcion belongs to Sala
Funcion.belongsTo(Sala, {
  foreignKey: 'id_sala',
  as: 'sala',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Sala.hasMany(Funcion, {
  foreignKey: 'id_sala',
  as: 'funciones',
});

// Silla belongs to Sala
Silla.belongsTo(Sala, {
  foreignKey: 'id_sala',
  as: 'sala',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Sala.hasMany(Silla, {
  foreignKey: 'id_sala',
  as: 'sillas',
});

// Venta belongs to Cliente
Venta.belongsTo(Cliente, {
  foreignKey: 'id_cliente',
  as: 'cliente',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Cliente.hasMany(Venta, {
  foreignKey: 'id_cliente',
  as: 'ventas',
});

// Venta belongs to Usuario (cajero)
Venta.belongsTo(Usuario, {
  foreignKey: 'id_usuario',
  as: 'usuario',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Usuario.hasMany(Venta, {
  foreignKey: 'id_usuario',
  as: 'ventas',
});

// DetalleVenta belongs to Venta
DetalleVenta.belongsTo(Venta, {
  foreignKey: 'id_venta',
  as: 'venta',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Venta.hasMany(DetalleVenta, {
  foreignKey: 'id_venta',
  as: 'detalles',
});

// DetalleVenta belongs to Funcion
DetalleVenta.belongsTo(Funcion, {
  foreignKey: 'id_funcion',
  as: 'funcion',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Funcion.hasMany(DetalleVenta, {
  foreignKey: 'id_funcion',
  as: 'detalles',
});

// DetalleVenta belongs to Silla
DetalleVenta.belongsTo(Silla, {
  foreignKey: 'id_silla',
  as: 'silla',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Silla.hasMany(DetalleVenta, {
  foreignKey: 'id_silla',
  as: 'detalles',
});

// LogUsuario belongs to Usuario
LogUsuario.belongsTo(Usuario, {
  foreignKey: 'id_usuario',
  as: 'usuario',
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
});

Usuario.hasMany(LogUsuario, {
  foreignKey: 'id_usuario',
  as: 'logs',
});

// Export all models
module.exports = {
  Usuario,
  Cliente,
  Sala,
  Pelicula,
  Funcion,
  Silla,
  Venta,
  DetalleVenta,
  LogUsuario,
};
