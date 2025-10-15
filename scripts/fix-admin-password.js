/**
 * Script para actualizar la contraseña del admin directamente en la BD
 * Sin pasar por los hooks de Sequelize que re-hashean
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'salas_cine'
};

async function fixAdminPassword() {
  let connection;
  
  try {
    console.log('\n🔧 Actualizando contraseña del admin...\n');
    
    // Crear conexión directa a MySQL
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL establecida\n');
    
    // Generar hash de "admin123"
    const password = 'admin123';
    console.log('🔒 Hasheando contraseña "admin123"...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(`✅ Hash generado: ${hashedPassword.substring(0, 20)}...\n`);
    
    // Actualizar directamente con SQL
    console.log('💾 Actualizando en base de datos...');
    const [result] = await connection.execute(
      'UPDATE Usuarios SET contrasena = ? WHERE usuario = ?',
      [hashedPassword, 'admin']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Contraseña actualizada exitosamente!\n');
      
      // Verificar inmediatamente
      console.log('🔍 Verificando...');
      const [rows] = await connection.execute(
        'SELECT usuario, contrasena FROM Usuarios WHERE usuario = ?',
        ['admin']
      );
      
      if (rows.length > 0) {
        const storedHash = rows[0].contrasena;
        console.log(`   Hash en BD: ${storedHash.substring(0, 20)}...`);
        console.log(`   Longitud: ${storedHash.length} caracteres`);
        
        // Probar validación
        const isValid = await bcrypt.compare(password, storedHash);
        console.log(`   Validación: ${isValid ? '✅ EXITOSA' : '❌ FALLIDA'}\n`);
        
        if (isValid) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ TODO LISTO! Credenciales:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('   Usuario:     admin');
          console.log('   Contraseña:  admin123');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('🚀 Prueba en Postman:');
          console.log('   POST http://localhost:3000/api/auth/login');
          console.log('   Body: { "usuario": "admin", "contrasena": "admin123" }\n');
        } else {
          console.log('❌ ERROR: La validación aún falla!\n');
        }
      }
    } else {
      console.log('⚠️  No se encontró el usuario "admin"\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// Ejecutar
fixAdminPassword()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
