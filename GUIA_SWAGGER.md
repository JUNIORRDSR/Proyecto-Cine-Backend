# 🎯 Guía Completa de la API - Cinema Management System

## 📚 Documentación Interactiva con Swagger

### ¿Qué es Swagger?

Swagger es una herramienta que proporciona documentación interactiva de tu API. Puedes:
- Ver todos los endpoints disponibles
- Probar las peticiones directamente desde el navegador
- Ver ejemplos de request y response
- Entender la estructura de datos sin necesidad de Postman

---

## 🚀 Acceder a la Documentación

### 1. Iniciar el Servidor

```bash
npm start
```

El servidor iniciará en `http://localhost:3000`

### 2. Abrir Swagger UI

Abre tu navegador y ve a:

```
http://localhost:3000/api-docs
```

Verás la interfaz de Swagger UI con todos los endpoints documentados.

---

## 🔐 Autenticación en Swagger

Para probar los endpoints protegidos, necesitas autenticarte:

### Paso 1: Login

1. En Swagger UI, busca la sección **"Autenticación"**
2. Expande el endpoint `POST /api/auth/login`
3. Haz clic en **"Try it out"**
4. Completa el body:
   ```json
   {
     "usuario": "admin",
     "contrasena": "admin123"
   }
   ```
5. Haz clic en **"Execute"**
6. En la respuesta, **copia el token** (el string largo que empieza con `eyJ...`)

### Paso 2: Autorizar

1. En la parte superior de Swagger UI, haz clic en el botón **"Authorize" 🔓**
2. En el campo "Value", ingresa:
   ```
   Bearer <pega_tu_token_aquí>
   ```
   Ejemplo:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwid...
   ```
3. Haz clic en **"Authorize"**
4. Cierra el diálogo
5. ¡Ahora estás autenticado! El candado 🔒 debería aparecer cerrado

### Paso 3: Probar Endpoints

Ahora puedes probar cualquier endpoint protegido. Swagger automáticamente incluirá tu token en todas las peticiones.

---

## 📋 Estructura de la Documentación

### Tags (Categorías)

Los endpoints están organizados por categorías:

| Tag | Descripción | Endpoints |
|-----|-------------|-----------|
| 🔐 **Autenticación** | Login y registro de usuarios | 3 endpoints |
| 🎬 **Películas** | Gestión de películas | 5 endpoints |
| 🎭 **Funciones** | Horarios y funciones | 5 endpoints |
| 🎟️ **Reservas** | Reservas de boletos | 5 endpoints |
| 💰 **Ventas** | Procesamiento de ventas | 4 endpoints |
| 👥 **Usuarios** | Gestión de usuarios | 4 endpoints |
| 📊 **Reportes** | Estadísticas y reportes | 4 endpoints |

### Códigos de Colores

Swagger usa códigos de colores para los métodos HTTP:

- 🟢 **GET** (Verde) - Obtener datos
- 🟡 **POST** (Amarillo) - Crear recursos
- 🔵 **PUT** (Azul) - Actualizar recursos
- 🔴 **DELETE** (Rojo) - Eliminar recursos

---

## 🎬 Ejemplos de Uso

### Ejemplo 1: Listar Películas

1. Busca el endpoint `GET /api/peliculas`
2. Expándelo
3. Haz clic en **"Try it out"**
4. (Opcional) Agrega filtros en los parámetros de query:
   - `estado`: `ACTIVA` o `INACTIVA`
5. Haz clic en **"Execute"**
6. Ve la respuesta con la lista de películas

### Ejemplo 2: Crear una Película (Admin)

1. Asegúrate de estar autenticado como ADMIN
2. Busca el endpoint `POST /api/peliculas`
3. Expándelo
4. Haz clic en **"Try it out"**
5. Completa el body:
   ```json
   {
     "titulo": "Oppenheimer",
     "director": "Christopher Nolan",
     "duracion": 180,
     "genero": "Drama Histórico",
     "clasificacion": "R",
     "sinopsis": "La historia de J. Robert Oppenheimer...",
     "fecha_estreno": "2023-07-21",
     "estado": "ACTIVA"
   }
   ```
6. Haz clic en **"Execute"**
7. Ve la película creada en la respuesta

### Ejemplo 3: Crear una Reserva

1. Busca el endpoint `POST /api/reservas`
2. Expándelo
3. Haz clic en **"Try it out"**
4. Completa el body:
   ```json
   {
     "id_funcion": 1,
     "nombre_cliente": "Juan Pérez",
     "email_cliente": "juan@example.com",
     "telefono_cliente": "555-0123",
     "asientos": [1, 2, 3]
   }
   ```
5. Haz clic en **"Execute"**
6. Recibirás la reserva con su ID y fecha de expiración

### Ejemplo 4: Ver Reportes de Ventas

1. Busca el endpoint `GET /api/reportes/ventas`
2. Expándelo
3. Haz clic en **"Try it out"**
4. Agrega parámetros opcionales:
   - `fecha_inicio`: `2024-01-01`
   - `fecha_fin`: `2024-12-31`
5. Haz clic en **"Execute"**
6. Ve las estadísticas de ventas

---

## 📊 Entendiendo las Respuestas

### Respuesta Exitosa

Todas las respuestas exitosas tienen este formato:

```json
{
  "success": true,
  "data": {
    // Datos de la respuesta
  },
  "message": "Mensaje opcional"
}
```

### Respuesta de Error

Todas las respuestas de error tienen este formato:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": []
  }
}
```

### Códigos de Estado HTTP

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos inválidos |
| 401 | Unauthorized | No autenticado (falta token) |
| 403 | Forbidden | No autorizado (falta permisos) |
| 404 | Not Found | Recurso no encontrado |
| 429 | Too Many Requests | Demasiados intentos |
| 500 | Internal Server Error | Error del servidor |

---

## 🔍 Esquemas de Datos

Swagger muestra los esquemas (estructuras de datos) de cada endpoint.

### Ver Esquema de un Request

1. Expande un endpoint
2. En "Request body", ve el esquema
3. Los campos marcados con `*` son requeridos
4. Haz clic en "Example Value" para ver un ejemplo completo

### Ver Esquema de una Response

1. Expande un endpoint
2. En "Responses", selecciona un código de estado (ej: 200)
3. Ve el esquema de la respuesta
4. Haz clic en "Example Value" para ver un ejemplo

### Esquemas Reutilizables

En la parte inferior de Swagger UI, encontrarás "Schemas" con todos los modelos:

- **Usuario**: Estructura de un usuario
- **Pelicula**: Estructura de una película
- **Sala**: Estructura de una sala
- **Funcion**: Estructura de una función
- **Reserva**: Estructura de una reserva
- **Boleto**: Estructura de un boleto

---

## 💡 Tips y Trucos

### 1. Curl Commands

Swagger genera automáticamente comandos curl. Útil para:
- Copiar y pegar en la terminal
- Usar en scripts
- Compartir con el equipo

**Cómo verlos:**
1. Ejecuta un endpoint
2. En la respuesta, busca la sección "Curl"
3. Copia el comando completo

### 2. Download OpenAPI Specification

Puedes descargar la especificación OpenAPI en formato JSON:

```
http://localhost:3000/api-docs.json
```

Úsalo para:
- Generar clientes en otros lenguajes
- Importar en otras herramientas
- Control de versiones

### 3. Probar Diferentes Casos

Swagger es ideal para probar:
- ✅ Casos exitosos
- ❌ Casos de error (datos inválidos, sin permisos, etc.)
- 🔄 Diferentes combinaciones de parámetros

### 4. Validación de Datos

Swagger muestra automáticamente:
- Tipos de datos esperados
- Rangos válidos
- Formatos (email, fecha, etc.)
- Enumeraciones (valores permitidos)

---

## 🎯 Flujos Comunes

### Flujo 1: Registrar y Vender Boletos

```
1. Login como Admin
   POST /api/auth/login

2. Crear una película
   POST /api/peliculas

3. Crear una función para esa película
   POST /api/funciones

4. Crear una reserva
   POST /api/reservas

5. Confirmar la reserva (como Cajero)
   PUT /api/reservas/:id/confirmar

6. Generar boleto PDF
   GET /api/ventas/:id/boleto
```

### Flujo 2: Ver Reportes

```
1. Login como Admin
   POST /api/auth/login

2. Ver ventas del mes
   GET /api/reportes/ventas?fecha_inicio=2024-01-01&fecha_fin=2024-01-31

3. Ver películas más populares
   GET /api/reportes/peliculas-populares

4. Ver ocupación de salas
   GET /api/reportes/ocupacion-salas
```

### Flujo 3: Gestión de Usuarios

```
1. Login como Admin
   POST /api/auth/login

2. Crear un cajero
   POST /api/auth/register

3. Listar usuarios
   GET /api/usuarios

4. Actualizar un usuario
   PUT /api/usuarios/:id
```

---

## 🔧 Solución de Problemas

### Problema: "Failed to fetch"

**Causa**: El servidor no está corriendo

**Solución**:
```bash
npm start
```

### Problema: "Authorization header is missing"

**Causa**: No estás autenticado

**Solución**:
1. Haz login
2. Copia el token
3. Haz clic en "Authorize"
4. Ingresa `Bearer <token>`

### Problema: "403 Forbidden"

**Causa**: Tu usuario no tiene permisos

**Solución**:
- Asegúrate de estar autenticado como ADMIN
- Algunos endpoints solo son para ADMIN
- Verifica el rol en `GET /api/auth/me`

### Problema: "Token expired"

**Causa**: El token expiró (duración: 8 horas)

**Solución**:
1. Haz login nuevamente
2. Obtén un token nuevo
3. Actualiza la autorización

---

## 📱 Uso con Postman

Si prefieres Postman, puedes importar la especificación OpenAPI:

1. En Postman, ve a File > Import
2. Selecciona "Link"
3. Ingresa: `http://localhost:3000/api-docs.json`
4. Haz clic en "Import"
5. ¡Listo! Todos los endpoints están en Postman

---

## 📖 Recursos Adicionales

### Documentación Relacionada

- [POSTMAN_ENDPOINTS.md](./POSTMAN_ENDPOINTS.md) - Lista completa de endpoints
- [GUIA_REGISTRO_TOKEN.md](./GUIA_REGISTRO_TOKEN.md) - Guía de autenticación
- [USUARIOS_GUIA.md](./USUARIOS_GUIA.md) - Gestión de usuarios
- [REGISTRO_USUARIOS.md](./REGISTRO_USUARIOS.md) - Registro de usuarios

### Enlaces Útiles

- [OpenAPI 3.0 Spec](https://swagger.io/specification/)
- [Swagger UI Guide](https://swagger.io/tools/swagger-ui/)
- [REST API Best Practices](https://restfulapi.net/)

---

## 🎓 Preguntas Frecuentes

### ¿Puedo usar Swagger en producción?

Sí, pero se recomienda:
- Proteger `/api-docs` con autenticación
- O deshabilitar en producción si es solo para uso interno

### ¿Se actualiza automáticamente?

Sí, Swagger lee las anotaciones del código. Cuando actualizas el código y reinicias el servidor, la documentación se actualiza automáticamente.

### ¿Puedo personalizar la interfaz?

Sí, en `src/config/swagger.js` puedes:
- Cambiar el título
- Agregar CSS personalizado
- Modificar los colores
- Agregar logo

### ¿Funciona sin conexión a internet?

Sí, Swagger UI se sirve localmente. No necesitas internet para usarlo.

---

**📍 Endpoint de la documentación**: `http://localhost:3000/api-docs`

**🔗 Especificación JSON**: `http://localhost:3000/api-docs.json`

**📧 Soporte**: soporte@cinema.com

---

¡Disfruta explorando la API! 🎬🍿
