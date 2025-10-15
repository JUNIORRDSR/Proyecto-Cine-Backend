# 🔐 GUÍA DE REGISTRO DE USUARIOS CON TOKEN JWT

## 📋 Diagnóstico del Sistema de Tokens

### ✅ Verificaciones Realizadas

1. **JWT_SECRET configurado**: ✅ (66 caracteres)
2. **JWT_EXPIRATION**: ✅ (8 horas)
3. **Token se genera correctamente**: ✅
4. **Token se verifica correctamente**: ✅
5. **authMiddleware funciona**: ✅
6. **isAdmin middleware funciona**: ✅

---

## 🚀 CÓMO REGISTRAR UN NUEVO USUARIO

### PASO 1: Login como Admin

**Endpoint:**
```
POST http://localhost:3000/api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id_usuario": 1,
      "nombre": "Administrador del Sistema",
      "usuario": "admin",
      "rol": "ADMIN"
    }
  }
}
```

**⚠️ COPIA EL TOKEN** de la respuesta. Lo necesitarás para el siguiente paso.

---

### PASO 2: Registrar Nuevo Usuario

**Endpoint:**
```
POST http://localhost:3000/api/auth/register
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TU_TOKEN_AQUÍ>
```

**⚠️ IMPORTANTE:** Reemplaza `<TU_TOKEN_AQUÍ>` con el token que copiaste del login.

**Ejemplo de header Authorization:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwid...
```

**Body (raw JSON):**
```json
{
  "nombre": "Juan Pérez",
  "usuario": "cajero1",
  "contrasena": "cajero123",
  "rol": "CAJERO"
}
```

**Respuesta esperada (éxito):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id_usuario": 2,
      "nombre": "Juan Pérez",
      "usuario": "cajero1",
      "rol": "CAJERO"
    }
  },
  "message": "Usuario registrado exitosamente"
}
```

---

## 🛠️ CONFIGURACIÓN EN POSTMAN

### Opción 1: Usando el Tab "Authorization"

1. Haz login y copia el token
2. En la petición de registro, ve al tab **"Authorization"**
3. **Type**: Selecciona **"Bearer Token"**
4. **Token**: Pega el token (SIN la palabra "Bearer")
5. Envía la petición

### Opción 2: Usando Headers Manualmente

1. Haz login y copia el token
2. En la petición de registro, ve al tab **"Headers"**
3. Agrega un nuevo header:
   - **Key**: `Authorization`
   - **Value**: `Bearer <tu_token_aquí>`
4. Envía la petición

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### Error 401: "No se proporcionó token de autenticación"

**Causa:**
- No se envió el header Authorization
- El header no tiene el formato correcto

**Solución:**
```
✅ CORRECTO: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
❌ INCORRECTO: Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
❌ INCORRECTO: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Error 403: "Token inválido o expirado"

**Causas posibles:**
1. El token expiró (duración: 8 horas)
2. El token está mal copiado (falta alguna parte)
3. El JWT_SECRET cambió en el servidor

**Solución:**
1. Haz login nuevamente para obtener un token fresco
2. Asegúrate de copiar el token completo (sin espacios ni saltos de línea)
3. Verifica que el servidor siga corriendo

---

### Error 403: "Acceso denegado. Se requiere rol de Administrador"

**Causas:**
1. El usuario que hizo login NO es ADMIN
2. El token tiene un rol diferente

**Solución:**
1. Asegúrate de hacer login con el usuario `admin`
2. Verifica en la respuesta del login que `rol: "ADMIN"`

**Verificar tu token actual:**
```
GET http://localhost:3000/api/auth/me
Headers:
  Authorization: Bearer <tu_token>
```

Esto te dirá qué usuario y rol tienes actualmente.

---

### Error 400: "El usuario ya existe"

**Causa:**
Ya existe un usuario con ese nombre de usuario.

**Solución:**
Cambia el campo `usuario` por uno diferente.

---

## 🔍 VERIFICAR QUE EL TOKEN FUNCIONA

Antes de registrar un usuario, verifica que tu token sea válido:

**Endpoint:**
```
GET http://localhost:3000/api/auth/me
```

**Headers:**
```
Authorization: Bearer <tu_token>
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id_usuario": 1,
    "nombre": "Administrador del Sistema",
    "usuario": "admin",
    "rol": "ADMIN"
  }
}
```

Si esto falla, tu token no es válido. Haz login nuevamente.

---

## 📊 ESTRUCTURA DEL TOKEN JWT

Un token JWT tiene 3 partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  <-- HEADER
.
eyJpZCI6MSwid...                       <-- PAYLOAD (datos del usuario)
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  <-- FIRMA
```

**Datos en el PAYLOAD:**
```json
{
  "id": 1,
  "usuario": "admin",
  "rol": "ADMIN",
  "iat": 1760564646,    // Fecha de emisión
  "exp": 1760593446     // Fecha de expiración
}
```

---

## 🎯 CHECKLIST DE DEBUGGING

Si tienes problemas con el registro, verifica:

- [ ] El servidor está corriendo en `http://localhost:3000`
- [ ] Hiciste login exitosamente
- [ ] Copiaste el token completo de la respuesta
- [ ] El header Authorization tiene el formato: `Bearer <token>`
- [ ] El token incluye las 3 partes (separadas por puntos)
- [ ] El usuario del login es ADMIN (no CAJERO)
- [ ] El token no expiró (no pasaron más de 8 horas)
- [ ] El Content-Type es `application/json`
- [ ] El Body es JSON válido

---

## 📝 EJEMPLO COMPLETO EN POSTMAN

### Request 1: LOGIN
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwid...",
    "user": {
      "id_usuario": 1,
      "nombre": "Administrador del Sistema",
      "usuario": "admin",
      "rol": "ADMIN"
    }
  }
}
```

### Request 2: REGISTER
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwid...

{
  "nombre": "María González",
  "usuario": "maria.gonzalez",
  "contrasena": "maria123",
  "rol": "CAJERO"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id_usuario": 2,
      "nombre": "María González",
      "usuario": "maria.gonzalez",
      "rol": "CAJERO"
    }
  },
  "message": "Usuario registrado exitosamente"
}
```

---

## 🔧 SI TODO FALLA

Ejecuta estos comandos para verificar el sistema:

```bash
# 1. Verificar que el servidor está corriendo
curl http://localhost:3000/api/health

# 2. Hacer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","contrasena":"admin123"}'

# 3. Verificar token (reemplaza <TOKEN> con el token del paso 2)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 💡 DATOS IMPORTANTES

- **Credenciales Admin:** `admin` / `admin123`
- **Roles disponibles:** `ADMIN`, `CAJERO`
- **Duración del token:** 8 horas
- **Puerto del servidor:** 3000
- **JWT_SECRET:** Configurado (66 caracteres)

---

## ❓ ¿EXACTAMENTE QUÉ ERROR TE APARECE?

Por favor, comparte:

1. El **código de status** (401, 403, 400, etc.)
2. El **mensaje de error** completo
3. Una captura de pantalla de:
   - Los headers que estás enviando
   - El body de la petición
   - La respuesta del servidor

Con esa información podremos identificar el problema exacto.
