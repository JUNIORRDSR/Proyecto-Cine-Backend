# 👤 Guía de Gestión de Usuarios - Cinema Backend

## 🎯 Credenciales Actuales

### Usuario Administrador
```
Usuario:     admin
Contraseña:  admin123
Rol:         ADMIN
```

---

## 🚀 Probar Login en Postman

### Paso 1: Hacer Login

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

**Respuesta Esperada**:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id_usuario": 1,
      "nombre": "Administrador del Sistema",
      "usuario": "admin",
      "rol": "ADMIN"
    }
  }
}
```

⚠️ **IMPORTANTE**: Copia el `token` y úsalo en los siguientes requests

---

## 🔧 Scripts Disponibles

### 1. Crear Usuario Admin

Si necesitas crear el usuario admin desde cero:

```bash
node scripts/create-admin-user.js
```

**Qué hace**:
- Verifica si el usuario "admin" ya existe
- Si no existe, lo crea con contraseña "admin123"
- Si ya existe, muestra sus datos

---

### 2. Resetear Contraseña

Si olvidaste la contraseña de cualquier usuario:

```bash
node scripts/reset-password.js <usuario> <nueva-contraseña>
```

**Ejemplos**:
```bash
# Resetear contraseña de admin
node scripts/reset-password.js admin admin123

# Resetear contraseña de cajero
node scripts/reset-password.js cajero cajero123
```

---

## 👥 Crear Más Usuarios

### Opción 1: Desde Postman (Requiere estar autenticado como ADMIN)

**Endpoint**: `POST http://localhost:3000/api/auth/register`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <token-de-admin>
```

**Body para crear un CAJERO**:
```json
{
  "nombre": "Juan Pérez",
  "usuario": "cajero1",
  "contrasena": "cajero123",
  "rol": "CAJERO"
}
```

**Body para crear otro ADMIN**:
```json
{
  "nombre": "María García",
  "usuario": "admin2",
  "contrasena": "admin456",
  "rol": "ADMIN"
}
```

---

### Opción 2: Directamente en MySQL

```sql
-- Conectar a MySQL
mysql -u root -p

-- Usar la base de datos
USE salas_cine;

-- Ver usuarios existentes
SELECT id_usuario, nombre, usuario, rol, fecha_creacion FROM Usuarios;

-- Crear un cajero (la contraseña debe estar hasheada)
-- NO RECOMENDADO - mejor usar los scripts
```

---

## 🔍 Ver Usuarios Existentes

### Desde MySQL:

```bash
mysql -u root -p -e "USE salas_cine; SELECT id_usuario, nombre, usuario, rol, fecha_creacion FROM Usuarios;"
```

---

## ❓ Problemas Comunes

### 1. "Credenciales inválidas"

**Causas**:
- Contraseña incorrecta
- Usuario no existe
- Hash de contraseña corrupto

**Solución**:
```bash
# Resetear la contraseña
node scripts/reset-password.js admin admin123
```

---

### 2. "Usuario no existe"

**Solución**:
```bash
# Crear el usuario admin
node scripts/create-admin-user.js
```

---

### 3. No puedo crear usuarios (403 Forbidden)

**Causa**: No estás autenticado como ADMIN

**Solución**:
1. Haz login como admin
2. Copia el token
3. Úsalo en el header Authorization

---

## 📋 Diferencias entre Roles

| Permiso | ADMIN | CAJERO |
|---------|-------|--------|
| Login | ✅ | ✅ |
| Ver películas | ✅ | ✅ |
| Crear películas | ✅ | ❌ |
| Editar películas | ✅ | ❌ |
| Eliminar películas | ✅ | ❌ |
| Ver salas | ✅ | ✅ |
| Gestionar salas | ✅ | ❌ |
| Crear funciones | ✅ | ❌ |
| Vender boletos | ✅ | ✅ |
| Ver reportes | ✅ | ❌ |
| Registrar usuarios | ✅ | ❌ |

---

## 🎬 Flujo Completo en Postman

### 1. Login como Admin
```
POST http://localhost:3000/api/auth/login
Body: { "usuario": "admin", "contrasena": "admin123" }
```

### 2. Copiar el Token
```
Respuesta → data → token → Copiar
```

### 3. Ver mi Perfil
```
GET http://localhost:3000/api/auth/me
Header: Authorization: Bearer <token>
```

### 4. Crear un Cajero
```
POST http://localhost:3000/api/auth/register
Header: Authorization: Bearer <token>
Body: {
  "nombre": "Carlos López",
  "usuario": "cajero1",
  "contrasena": "cajero123",
  "rol": "CAJERO"
}
```

### 5. Logout (Manual)
```
Solo deja de usar el token.
Los tokens expiran en 8 horas automáticamente.
```

---

## 📝 Notas Importantes

1. **Seguridad**: Las contraseñas se hashean con bcrypt (10 rounds)
2. **Tokens**: Expiran en 8 horas (configurado en src/config/jwt.js)
3. **Roles**: Solo hay 2 roles: ADMIN y CAJERO
4. **Único Admin**: Solo un admin puede crear otros usuarios

---

## 🆘 Ayuda Rápida

```bash
# ¿Olvidaste la contraseña?
node scripts/reset-password.js admin admin123

# ¿No existe el usuario admin?
node scripts/create-admin-user.js

# ¿Ver todos los usuarios?
mysql -u root -p -e "USE salas_cine; SELECT * FROM Usuarios;"
```

---

**Última actualización**: 2025-10-15  
**Versión**: 1.0
