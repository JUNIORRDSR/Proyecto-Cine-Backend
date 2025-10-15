/**
 * Script para probar la generación y validación de tokens JWT
 */

require('dotenv').config();
const { generateToken, verifyToken } = require('../src/config/jwt');
const jwt = require('jsonwebtoken');

console.log('\n🔐 DIAGNÓSTICO DE TOKENS JWT\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Verificar configuración
console.log('1️⃣ Configuración JWT:');
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`   Longitud: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0} caracteres`);
console.log(`   JWT_EXPIRATION: ${process.env.JWT_EXPIRATION || '8h'}\n`);

// Simular payload del login
const payload = {
  id: 1,
  usuario: 'admin',
  rol: 'ADMIN'
};

console.log('2️⃣ Generando token con payload:');
console.log(`   ${JSON.stringify(payload, null, 2)}\n`);

try {
  // Generar token
  const token = generateToken(payload);
  console.log('✅ Token generado exitosamente');
  console.log(`   Token: ${token.substring(0, 50)}...\n`);

  // Decodificar sin verificar (para ver el contenido)
  console.log('3️⃣ Contenido del token (sin verificar):');
  const decoded = jwt.decode(token);
  console.log(`   ${JSON.stringify(decoded, null, 2)}\n`);

  // Verificar token
  console.log('4️⃣ Verificando token...');
  const verified = verifyToken(token);
  console.log('✅ Token verificado exitosamente');
  console.log(`   Datos verificados: ${JSON.stringify(verified, null, 2)}\n`);

  // Simular header de autorización
  console.log('5️⃣ Simulando request con header Authorization:');
  const authHeader = `Bearer ${token}`;
  console.log(`   Authorization: ${authHeader.substring(0, 60)}...\n`);

  // Extraer token del header
  const extractedToken = authHeader.substring(7);
  console.log('6️⃣ Extrayendo token del header...');
  console.log(`   ✅ Token extraído: ${extractedToken.substring(0, 50)}...\n`);

  // Verificar token extraído
  console.log('7️⃣ Verificando token extraído...');
  const verifiedExtracted = verifyToken(extractedToken);
  console.log('✅ Token extraído verificado exitosamente');
  console.log(`   Datos: ${JSON.stringify(verifiedExtracted, null, 2)}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 TODO FUNCIONA CORRECTAMENTE\n');
  console.log('📋 Para usar en Postman:');
  console.log('   1. Haz login en POST /api/auth/login');
  console.log('   2. Copia el token de la respuesta');
  console.log('   3. En el tab "Authorization":');
  console.log('      - Type: Bearer Token');
  console.log('      - Token: <pega el token aquí>');
  console.log('   4. O en Headers:');
  console.log('      - Key: Authorization');
  console.log('      - Value: Bearer <token>\n');

} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
