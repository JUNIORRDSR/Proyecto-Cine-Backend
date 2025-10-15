/**
 * Script para resetear contraseña de usuario
 * Ejecutar con: node scripts/reset-password.js <usuario> <nueva-contraseña>
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const Usuario = require('../src/models/Usuario');

async function resetPassword() {
  try {
    // Obtener argumentos
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('\n❌ Error: Debes proporcionar usuario y nueva contraseña\n');
      console.log('📝 Uso correcto:');
      console.log('   node scripts/reset-password.js <usuario> <nueva-contraseña>\n');
      console.log('📝 Ejemplos:');
      console.log('   node scripts/reset-password.js admin admin123');
      console.log('   node scripts/reset-password.js cajero cajero123\n');
      process.exit(1);
    }

    const [username, newPassword] = args;

    console.log('\n🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Buscar usuario
    console.log(`🔍 Buscando usuario: ${username}...`);
    const user = await Usuario.findOne({ where: { usuario: username } });

    if (!user) {
      console.log(`\n❌ Error: Usuario "${username}" no encontrado\n`);
      console.log('💡 Usuarios disponibles:');
      const allUsers = await Usuario.findAll({ attributes: ['usuario', 'nombre', 'rol'] });
      allUsers.forEach(u => {
        console.log(`   - ${u.usuario} (${u.nombre}) - Rol: ${u.rol}`);
      });
      console.log('');
      await sequelize.close();
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.nombre}\n`);

    // Hash nueva contraseña
    console.log('🔒 Hasheando nueva contraseña...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await user.update({ contrasena: hashedPassword });

    console.log('\n✅ ¡Contraseña actualizada exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 NUEVAS CREDENCIALES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Usuario:     ${username}`);
    console.log(`   Contraseña:  ${newPassword}`);
    console.log(`   Rol:         ${user.rol}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🚀 Prueba el login en Postman:\n');
    console.log('POST http://localhost:3000/api/auth/login');
    console.log('Body:');
    console.log(JSON.stringify({
      usuario: username,
      contrasena: newPassword
    }, null, 2));
    console.log('');

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

resetPassword();
