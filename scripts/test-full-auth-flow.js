/**
 * Script para simular el flujo completo de login y registro
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testFullFlow() {
  console.log('\n🧪 TEST COMPLETO DE LOGIN Y REGISTRO\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // PASO 1: Login
    console.log('1️⃣ Realizando login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      usuario: 'admin',
      contrasena: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login fallido');
      console.log(loginResponse.data);
      return;
    }

    console.log('✅ Login exitoso');
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log(`   Usuario: ${user.usuario}`);
    console.log(`   Rol: ${user.rol}`);
    console.log(`   Token: ${token.substring(0, 50)}...\n`);

    // PASO 2: Verificar token
    console.log('2️⃣ Verificando token en /api/auth/me...');
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (meResponse.data.success) {
      console.log('✅ Token válido');
      console.log(`   Datos recibidos: ${JSON.stringify(meResponse.data.data, null, 2)}\n`);
    } else {
      console.log('❌ Token inválido');
      console.log(meResponse.data);
      return;
    }

    // PASO 3: Intentar registrar un nuevo usuario
    console.log('3️⃣ Intentando registrar nuevo usuario...');
    const newUser = {
      nombre: 'Cajero de Prueba',
      usuario: 'cajero-test-' + Date.now(),
      contrasena: 'test123',
      rol: 'CAJERO'
    };

    console.log(`   Datos: ${JSON.stringify(newUser, null, 2)}`);
    console.log(`   Token enviado: ${token.substring(0, 30)}...`);
    console.log(`   Header: Authorization: Bearer ${token.substring(0, 30)}...\n`);

    try {
      const registerResponse = await axios.post(
        `${BASE_URL}/api/auth/register`,
        newUser,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Registro exitoso');
      console.log(`   Respuesta: ${JSON.stringify(registerResponse.data, null, 2)}\n`);

    } catch (registerError) {
      console.log('❌ Error en registro');
      if (registerError.response) {
        console.log(`   Status: ${registerError.response.status}`);
        console.log(`   Respuesta: ${JSON.stringify(registerError.response.data, null, 2)}\n`);
      } else {
        console.log(`   Error: ${registerError.message}\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNÓSTICO COMPLETO\n');

  } catch (error) {
    console.error('❌ Error en el flujo:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Respuesta:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Ejecutar
console.log('⚠️  Asegúrate de que el servidor esté corriendo en http://localhost:3000\n');
testFullFlow()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });
