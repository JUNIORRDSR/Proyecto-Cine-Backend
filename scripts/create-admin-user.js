/**
 * Script para crear usuario administrador
 * Ejecutar con: node scripts/create-admin-user.js
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const Usuario = require('../src/models/Usuario');

async function createAdminUser() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Verificar si ya existe el usuario admin
    const existingAdmin = await Usuario.findOne({ where: { usuario: 'admin' } });
    
    if (existingAdmin) {
      console.log('⚠️  El usuario "admin" ya existe\n');
      console.log('📋 Datos del usuario existente:');
      console.log(`   - ID: ${existingAdmin.id_usuario}`);
      console.log(`   - Nombre: ${existingAdmin.nombre}`);
      console.log(`   - Usuario: ${existingAdmin.usuario}`);
      console.log(`   - Rol: ${existingAdmin.rol}`);
      console.log(`   - Fecha: ${existingAdmin.fecha_creacion}\n`);
      
      console.log('💡 Si olvidaste la contraseña, puedes usar:');
      console.log('   node scripts/reset-password.js admin nueva-contraseña\n');
      
      await sequelize.close();
      return;
    }

    console.log('👤 Creando usuario administrador...\n');

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear usuario admin
    const adminUser = await Usuario.create({
      nombre: 'Administrador del Sistema',
      usuario: 'admin',
      contrasena: hashedPassword,
      rol: 'ADMIN',
      fecha_creacion: new Date()
    });

    console.log('✅ ¡Usuario administrador creado exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Usuario:     admin`);
    console.log(`   Contraseña:  admin123`);
    console.log(`   Rol:         ADMIN`);
    console.log(`   ID:          ${adminUser.id_usuario}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🚀 Ahora puedes hacer login con estas credenciales:\n');
    console.log('POST http://localhost:3000/api/auth/login');
    console.log('Body:');
    console.log(JSON.stringify({
      usuario: 'admin',
      contrasena: 'admin123'
    }, null, 2));
    console.log('');

    await sequelize.close();
    console.log('✅ Conexión cerrada');

  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
    console.error('\n💡 Asegúrate de que:');
    console.error('   1. MySQL esté corriendo');
    console.error('   2. La base de datos "salas_cine" exista');
    console.error('   3. Las credenciales en .env sean correctas\n');
    
    await sequelize.close();
    process.exit(1);
  }
}

// Ejecutar
createAdminUser();
