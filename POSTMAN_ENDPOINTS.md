# 🚀 Endpoints para Probar con Postman

**Servidor corriendo en**: `http://localhost:3000`

---

## 📍 1. Health Check (GET - Sin autenticación)

**Endpoint más simple para verificar que el servidor funciona**

```
GET http://localhost:3000/health
```

**Headers**: Ninguno requerido

**Respuesta Esperada**:
```json
{
  "status": "ok",
  "message": "Cinema Backend API is running",
  "timestamp": "2025-10-15T01:22:56.000Z"
}
```

---

## 🎬 2. Listar Películas (GET - Requiere autenticación)

**Endpoint**: `GET http://localhost:3000/api/peliculas`

**Headers**:
```
Authorization: Bearer <tu-token-aqui>
```

**Respuesta Esperada**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Avatar",
      "duracion": 162,
      "genero": "Ciencia Ficción",
      "estado": "en_cartelera"
    }
  ]
}
```

---

## 🔐 3. Login (POST - Para obtener el token)

**Primero necesitas hacer login para obtener el token**

**Endpoint**: `POST http://localhost:3000/api/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body (JSON)**:
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
      "id": 1,
      "nombre": "Administrador",
      "usuario": "admin",
      "rol": "admin"
    }
  }
}
```

⚠️ **IMPORTANTE**: Copia el `token` de la respuesta y úsalo en los siguientes requests

---

## 📋 4. Obtener Usuario Actual (GET - Con autenticación)

**Endpoint**: `GET http://localhost:3000/api/auth/me`

**Headers**:
```
Authorization: Bearer <pega-aqui-el-token-del-login>
```

**Respuesta Esperada**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Administrador",
    "usuario": "admin",
    "rol": "admin",
    "createdAt": "2025-01-15T00:00:00.000Z"
  }
}
```

---

## 🎥 5. Obtener Película por ID (GET - Con autenticación)

**Endpoint**: `GET http://localhost:3000/api/peliculas/1`

**Headers**:
```
Authorization: Bearer <tu-token-aqui>
```

**Respuesta Esperada**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "titulo": "Avatar",
    "duracion": 162,
    "duracion_minutos": 162,
    "genero": "Ciencia Ficción",
    "estado": "en_cartelera",
    "sinopsis": "Un marine...",
    "director": "James Cameron",
    "clasificacion": "PG-13"
  }
}
```

---

## 🏢 6. Listar Salas (GET - Con autenticación)

**Endpoint**: `GET http://localhost:3000/api/salas`

**Headers**:
```
Authorization: Bearer <tu-token-aqui>
```

**Respuesta Esperada**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Sala 1",
      "capacidad": 100,
      "tipo": "2D"
    }
  ]
}
```

---

## 🎭 7. Listar Funciones (GET - Con autenticación)

**Endpoint**: `GET http://localhost:3000/api/funciones`

**Headers**:
```
Authorization: Bearer <tu-token-aqui>
```

**Query Parameters** (opcionales):
- `pelicula_id=1` - Filtrar por película
- `fecha=2025-01-15` - Filtrar por fecha

**Ejemplo**:
```
GET http://localhost:3000/api/funciones?pelicula_id=1
```

---

## 📊 8. Estadísticas Generales (GET - Admin)

**Endpoint**: `GET http://localhost:3000/api/reportes/estadisticas`

**Headers**:
```
Authorization: Bearer <token-de-admin>
```

**Respuesta Esperada**:
```json
{
  "success": true,
  "data": {
    "totalVentas": 1500,
    "ventasHoy": 250,
    "peliculasActivas": 5,
    "funcionesHoy": 12
  }
}
```

---

## 🔧 PASOS PARA PROBAR EN POSTMAN

### Paso 1: Health Check
1. Abre Postman
2. Crea un nuevo request
3. Método: `GET`
4. URL: `http://localhost:3000/health`
5. Click en "Send"
6. ✅ Deberías ver `{"status": "ok"}`

### Paso 2: Login
1. Nuevo request
2. Método: `POST`
3. URL: `http://localhost:3000/api/auth/login`
4. Headers → `Content-Type: application/json`
5. Body → raw → JSON:
   ```json
   {
     "usuario": "admin",
     "contrasena": "admin123"
   }
   ```
6. Click "Send"
7. ✅ Copia el `token` de la respuesta

### Paso 3: Usar el Token
1. Nuevo request
2. Método: `GET`
3. URL: `http://localhost:3000/api/peliculas`
4. Headers → `Authorization: Bearer <pega-tu-token-aqui>`
5. Click "Send"
6. ✅ Deberías ver las películas

---

## ⚠️ Notas Importantes

1. **Redis está desactivado** - El servidor funciona sin caché (normal en desarrollo)
2. **Base de datos**: Usa `salas_cine` en MySQL
3. **Usuario de prueba**: 
   - Usuario: `admin`
   - Contraseña: `admin123`
   - Rol: admin

4. **Tokens expiran en 8 horas**

---

## 🐛 Si algo falla:

1. Verifica que el servidor esté corriendo (puerto 3000)
2. Verifica que MySQL esté corriendo
3. Verifica que el token esté bien copiado (sin espacios)
4. Verifica los Headers (especialmente Authorization)

---

**Última actualización**: 2025-10-15 01:23  
**Servidor**: ✅ Corriendo en http://localhost:3000
