# 🧪 Guía para Probar Login en Postman

## ⚠️ Problema Común: "Usuario o contraseña incorrectos"

Si recibes este error, verifica lo siguiente:

### 1. Verificar que el Usuario Exista en la Base de Datos

Ejecuta el script para crear el usuario admin:

```bash
cd Proyecto-Cine-Backend
node scripts/create-admin-user.js
```

O ejecuta el seeder completo:

```bash
npm run seed
```

### 2. Credenciales Correctas para Postman

**Endpoint**: `POST http://localhost:3000/api/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body (raw JSON)** - ⚠️ IMPORTANTE: Usa estos nombres de campos exactos:
```json
{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

**❌ NO uses**:
- `email` (debe ser `usuario`)
- `password` (debe ser `contrasena`)

### 3. Usuarios de Prueba Disponibles

Después de ejecutar `npm run seed`, tendrás estos usuarios:

#### Usuario Administrador
```json
{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

#### Usuario Cajero 1
```json
{
  "usuario": "cajero1",
  "contrasena": "cajero123"
}
```

#### Usuario Cajero 2
```json
{
  "usuario": "cajero2",
  "contrasena": "cajero123"
}
```

### 4. Respuesta Exitosa Esperada

Si el login es exitoso, deberías recibir:

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id_usuario": 1,
      "nombre": "Administrador Principal",
      "usuario": "admin",
      "rol": "ADMIN"
    }
  }
}
```

### 5. Si el Usuario No Existe

Si el usuario no existe en la base de datos, crea uno manualmente:

```bash
# Crear usuario admin
node scripts/create-admin-user.js

# O resetear contraseña de un usuario existente
node scripts/reset-password.js admin admin123
```

### 6. Verificar la Base de Datos

Si quieres verificar qué usuarios existen, puedes:

1. Conectarte a MySQL directamente
2. Ejecutar: `SELECT id_usuario, nombre, usuario, rol FROM usuarios;`

### 7. Solución de Problemas

#### Error: "Usuario o contraseña incorrectos"
- ✅ Verifica que el usuario exista: `node scripts/create-admin-user.js`
- ✅ Verifica que estés usando `usuario` y `contrasena` (no `email`/`password`)
- ✅ Verifica que la contraseña sea correcta
- ✅ Verifica que el backend esté corriendo: `http://localhost:3000/health`

#### Error: "Too many requests"
- El rate limiter permite solo 5 intentos cada 15 minutos
- Espera 15 minutos o reinicia el servidor

#### Error de CORS
- El CORS está configurado para permitir `http://localhost:5173`
- Si pruebas desde Postman, CORS no debería ser un problema
- Si pruebas desde el navegador, asegúrate de que el frontend esté en el puerto 5173

### 8. Ejemplo Completo en Postman

1. **Método**: POST
2. **URL**: `http://localhost:3000/api/auth/login`
3. **Headers**:
   - `Content-Type: application/json`
4. **Body** (selecciona "raw" y "JSON"):
   ```json
   {
     "usuario": "admin",
     "contrasena": "admin123"
   }
   ```
5. **Click en "Send"**

### 9. Usar el Token en Otras Peticiones

Una vez que tengas el token de la respuesta:

1. Copia el valor del campo `data.token`
2. En otras peticiones, agrega este header:
   ```
   Authorization: Bearer <pega-el-token-aqui>
   ```

Ejemplo para obtener información del usuario actual:
- **Endpoint**: `GET http://localhost:3000/api/auth/me`
- **Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

---

**¿Aún tienes problemas?** Verifica los logs del backend para ver errores específicos.

