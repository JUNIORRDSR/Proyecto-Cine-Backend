/**
 * Script de diagnóstico para verificar el login
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const Usuario = require('../src/models/Usuario');

async function diagnosticarLogin() {
  try {
    console.log('🔍 DIAGNÓSTICO DE LOGIN\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Conectar a la base de datos
    console.log('1️⃣ Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('   ✅ Conexión exitosa\n');

    // Buscar usuario admin
    console.log('2️⃣ Buscando usuario "admin"...');
    const user = await Usuario.findOne({ where: { usuario: 'admin' } });
    
    if (!user) {
      console.log('   ❌ Usuario "admin" NO encontrado\n');
      await sequelize.close();
      return;
    }
    
    console.log('   ✅ Usuario encontrado:');
    console.log(`      - ID: ${user.id_usuario}`);
    console.log(`      - Nombre: ${user.nombre}`);
    console.log(`      - Usuario: ${user.usuario}`);
    console.log(`      - Rol: ${user.rol}`);
    console.log(`      - Hash preview: ${user.contrasena.substring(0, 30)}...`);
    console.log(`      - Hash length: ${user.contrasena.length}\n`);

    // Verificar que el método validarContrasena existe
    console.log('3️⃣ Verificando método validarContrasena...');
    if (typeof user.validarContrasena === 'function') {
      console.log('   ✅ Método validarContrasena existe\n');
    } else {
      console.log('   ❌ Método validarContrasena NO existe\n');
      console.log('   💡 Esto es el problema!\n');
      await sequelize.close();
      return;
    }

    // Probar validación con contraseña correcta
    console.log('4️⃣ Probando validación con "admin123"...');
    const passwordToTest = 'admin123';
    
    try {
      const isValid = await user.validarContrasena(passwordToTest);
      console.log(`   Resultado: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}\n`);
      
      if (!isValid) {
        console.log('   ⚠️  La contraseña NO coincide!\n');
        console.log('   🔧 Probando comparación directa con bcrypt...');
        const directCompare = await bcrypt.compare(passwordToTest, user.contrasena);
        console.log(`   Comparación directa: ${directCompare ? '✅ VÁLIDA' : '❌ INVÁLIDA'}\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error al validar: ${error.message}\n`);
    }

    // Probar con contraseña incorrecta
    console.log('5️⃣ Probando validación con contraseña INCORRECTA "wrong123"...');
    const wrongPassword = 'wrong123';
    const isWrongValid = await user.validarContrasena(wrongPassword);
    console.log(`   Resultado: ${isWrongValid ? '❌ ERROR! (debería ser inválida)' : '✅ CORRECTAMENTE INVÁLIDA'}\n`);

    // Verificar formato del hash
    console.log('6️⃣ Verificando formato del hash...');
    const hashPattern = /^\$2[aby]\$\d{2}\$/;
    const isValidHash = hashPattern.test(user.contrasena);
    console.log(`   Formato bcrypt: ${isValidHash ? '✅ CORRECTO' : '❌ INCORRECTO'}\n`);
    
    if (!isValidHash) {
      console.log('   ⚠️  El hash NO tiene formato bcrypt válido!');
      console.log(`   Hash actual: ${user.contrasena}\n`);
    }

    // Resumen
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 RESUMEN:\n');
    console.log(`Usuario encontrado:          ✅`);
    console.log(`Método validarContrasena:    ${typeof user.validarContrasena === 'function' ? '✅' : '❌'}`);
    console.log(`Hash formato válido:         ${isValidHash ? '✅' : '❌'}`);
    
    const testResult = await user.validarContrasena('admin123');
    console.log(`Login con "admin123":        ${testResult ? '✅' : '❌'}\n`);

    if (testResult) {
      console.log('🎉 ¡TODO ESTÁ BIEN! El login debería funcionar.\n');
      console.log('💡 Si aún falla, el problema puede ser:');
      console.log('   1. Rate limiting bloqueando requests');
      console.log('   2. Error en el controlador');
      console.log('   3. Middleware interceptando la petición\n');
    } else {
      console.log('⚠️  PROBLEMA DETECTADO: La validación de contraseña falla.\n');
      console.log('🔧 SOLUCIÓN: Ejecuta esto para resetear la contraseña:');
      console.log('   node scripts/reset-password.js admin admin123\n');
    }

    await sequelize.close();
    console.log('✅ Conexión cerrada\n');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    await sequelize.close();
    process.exit(1);
  }
}

diagnosticarLogin();
