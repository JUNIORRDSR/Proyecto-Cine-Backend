# 👥 Cómo Registrar Usuarios - Cinema Backend

## 🎯 Información Importante

### ⚠️ El registro de usuarios REQUIERE autenticación de ADMIN

**Endpoint de Registro**: `POST /api/auth/register`
**Acceso**: Solo usuarios con rol ADMIN
**Autenticación**: Token JWT requerido

---

## 📋 Proceso Completo en Postman

### PASO 1️⃣: Login como Admin

**Endpoint**: `POST http://localhost:3000/api/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body (raw JSON)**:
```json
{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

**Click en "Send"**

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwi...",
    "usuario": {
      "id_usuario": 1,
      "nombre": "Administrador del Sistema",
      "usuario": "admin",
      "rol": "ADMIN"
    }
  },
  "message": "Login exitoso"
}
```

**⚠️ IMPORTANTE**: Copia el valor del campo `"token"`

---

### PASO 2️⃣: Registrar Nuevo Usuario

**Endpoint**: `POST http://localhost:3000/api/auth/register`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <PEGA-AQUI-EL-TOKEN-DEL-PASO-1>
```

#### Ejemplo 1: Registrar un CAJERO

**Body (raw JSON)**:
```json
{
  "nombre": "Juan Pérez",
  "usuario": "cajero1",
  "contrasena": "cajero123",
  "rol": "CAJERO"
}
```

#### Ejemplo 2: Registrar otro ADMIN

**Body (raw JSON)**:
```json
{
  "nombre": "María García",
  "usuario": "admin2",
  "contrasena": "admin456",
  "rol": "ADMIN"
}
```

**Click en "Send"**

**Respuesta Exitosa**:
```json
{
  "success": true,
  "data": {
    "id_usuario": 2,
    "nombre": "Juan Pérez",
    "usuario": "cajero1",
    "rol": "CAJERO",
    "fecha_creacion": "2025-10-15T06:35:00.000Z"
  },
  "message": "Usuario registrado exitosamente"
}
```

---

### PASO 3️⃣: Probar Login con el Nuevo Usuario

**Endpoint**: `POST http://localhost:3000/api/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body (raw JSON)**:
```json
{
  "usuario": "cajero1",
  "contrasena": "cajero123"
}
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id_usuario": 2,
      "nombre": "Juan Pérez",
      "usuario": "cajero1",
      "rol": "CAJERO"
    }
  },
  "message": "Login exitoso"
}
```

---

## 🔐 Campos Requeridos para Registro

| Campo | Tipo | Requerido | Descripción | Validaciones |
|-------|------|-----------|-------------|--------------|
| `nombre` | String | ✅ Sí | Nombre completo del usuario | Máx 100 caracteres |
| `usuario` | String | ✅ Sí | Username único | Máx 50 caracteres, único en DB |
| `contrasena` | String | ✅ Sí | Contraseña | Mín 6 caracteres (será hasheada) |
| `rol` | String | ✅ Sí | Rol del usuario | Solo: 'ADMIN' o 'CAJERO' |

---

## ⚠️ Errores Comunes

### 1. Error 401 - Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "Token no proporcionado"
  }
}
```

**Causa**: No incluiste el token en el header Authorization

**Solución**: 
1. Haz login como admin
2. Copia el token
3. Agrégalo en Headers: `Authorization: Bearer <tu-token>`

---

### 2. Error 403 - Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Acceso denegado. Se requiere rol de administrador"
  }
}
```

**Causa**: Estás usando un token de un usuario CAJERO

**Solución**: Debes hacer login con un usuario ADMIN

---

### 3. Error 400 - Usuario ya existe

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "El usuario ya existe"
  }
}
```

**Causa**: Ya existe un usuario con ese username

**Solución**: Usa un username diferente

---

### 4. Error 400 - Rol inválido

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El rol debe ser ADMIN o CAJERO"
  }
}
```

**Causa**: Enviaste un rol que no es 'ADMIN' o 'CAJERO'

**Solución**: Usa solo 'ADMIN' o 'CAJERO' (en mayúsculas)

---

## 📝 Ejemplo Completo en Postman

### Colección de Requests

```
1. Login Admin
   POST http://localhost:3000/api/auth/login
   Body: {"usuario": "admin", "contrasena": "admin123"}
   
2. Registrar Cajero 1
   POST http://localhost:3000/api/auth/register
   Headers: Authorization: Bearer <token-de-admin>
   Body: {"nombre": "Juan Pérez", "usuario": "cajero1", "contrasena": "cajero123", "rol": "CAJERO"}
   
3. Registrar Cajero 2
   POST http://localhost:3000/api/auth/register
   Headers: Authorization: Bearer <token-de-admin>
   Body: {"nombre": "Ana López", "usuario": "cajero2", "contrasena": "cajero456", "rol": "CAJERO"}
   
4. Registrar Admin 2
   POST http://localhost:3000/api/auth/register
   Headers: Authorization: Bearer <token-de-admin>
   Body: {"nombre": "Carlos Ruiz", "usuario": "admin2", "contrasena": "admin789", "rol": "ADMIN"}
```

---

## 🔄 Flujo Visual

```
┌─────────────────────────────────────────┐
│  1. POST /api/auth/login                │
│     Body: {usuario, contrasena}         │
│     Response: {token, usuario}          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Copiar TOKEN   │
         └────────┬───────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. POST /api/auth/register             │
│     Headers:                            │
│       Authorization: Bearer <TOKEN>     │
│     Body: {nombre, usuario,             │
│            contrasena, rol}             │
│     Response: {usuario creado}          │
└─────────────────────────────────────────┘
```

---

## 🎭 Diferencias entre ADMIN y CAJERO

### ADMIN puede:
- ✅ Registrar nuevos usuarios
- ✅ Crear/editar/eliminar películas
- ✅ Gestionar salas
- ✅ Crear funciones
- ✅ Ver reportes
- ✅ Vender boletos

### CAJERO puede:
- ✅ Vender boletos
- ✅ Ver películas
- ✅ Ver funciones
- ❌ NO puede registrar usuarios
- ❌ NO puede gestionar contenido
- ❌ NO puede ver reportes

---

## 🛠️ Scripts Alternativos

Si no quieres usar Postman, puedes usar los scripts:

### Crear Admin Inicial
```bash
node scripts/create-admin-user.js
```

### Crear Usuario desde Script
Crea un archivo `scripts/create-user.js`:

```javascript
const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const Usuario = require('../src/models/Usuario');

async function createUser() {
  await sequelize.authenticate();
  
  const hashedPassword = await bcrypt.hash('mi-contraseña', 10);
  
  const user = await Usuario.create({
    nombre: 'Nuevo Usuario',
    usuario: 'nuevo_user',
    contrasena: hashedPassword,
    rol: 'CAJERO',
    fecha_creacion: new Date()
  });
  
  console.log('Usuario creado:', user.toJSON());
  await sequelize.close();
}

createUser();
```

Ejecutar:
```bash
node scripts/create-user.js
```

---

## 📊 Ver Todos los Usuarios

### Desde MySQL:
```bash
mysql -u root -p -e "USE salas_cine; SELECT id_usuario, nombre, usuario, rol, fecha_creacion FROM Usuarios;"
```

### Desde API (si creas el endpoint):
```
GET /api/usuarios
Headers: Authorization: Bearer <admin-token>
```

---

## 🆘 Ayuda Rápida

**¿No puedo registrar usuarios?**
- Verifica que estés autenticado como ADMIN
- Verifica que el token esté en el header Authorization
- Verifica que el token no haya expirado (expiran en 8 horas)

**¿Cómo sé si soy admin?**
```
GET /api/auth/me
Headers: Authorization: Bearer <tu-token>
```
Verifica que `rol: "ADMIN"` en la respuesta

**¿El username ya existe?**
- Usa un username diferente
- Los usernames son únicos en la base de datos

---

**Última actualización**: 2025-10-15  
**Servidor**: http://localhost:3000
