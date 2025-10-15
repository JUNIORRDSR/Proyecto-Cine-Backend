# 📚 Documentación Swagger - Endpoints Documentados

## ✅ Estado de la Documentación API

### Endpoints Documentados Completamente:

#### 🔐 Autenticación (`/api/auth`)
- ✅ `POST /api/auth/login` - Iniciar sesión
- ✅ `POST /api/auth/register` - Registrar usuario (Admin)
- ✅ `GET /api/auth/me` - Obtener información del usuario actual

#### 🎬 Películas (`/api/peliculas`)
- ✅ `GET /api/peliculas` - Listar películas
- ✅ `GET /api/peliculas/:id` - Obtener película por ID
- ✅ `POST /api/peliculas` - Crear película (Admin)
- ✅ `PUT /api/peliculas/:id` - Actualizar película (Admin)
- ✅ `DELETE /api/peliculas/:id` - Eliminar película (Admin)

---

## 📋 Endpoints Pendientes de Documentación

Los siguientes módulos tienen la estructura de rutas definida pero necesitan las anotaciones Swagger completas:

### 🎭 Funciones (`/api/funciones`)
- `GET /api/funciones` - Listar funciones (con filtros)
- `GET /api/funciones/:id` - Obtener función
- `POST /api/funciones` - Crear función (Admin)
- `PUT /api/funciones/:id` - Actualizar función (Admin)
- `DELETE /api/funciones/:id` - Eliminar función (Admin)

### 🎟️ Reservas (`/api/reservas`)
- `GET /api/reservas` - Listar reservas
- `GET /api/reservas/:id` - Obtener reserva
- `POST /api/reservas` - Crear reserva
- `PUT /api/reservas/:id/confirmar` - Confirmar reserva
- `PUT /api/reservas/:id/cancelar` - Cancelar reserva

### 💰 Ventas (`/api/ventas`)
- `GET /api/ventas` - Listar ventas
- `GET /api/ventas/:id` - Obtener venta
- `POST /api/ventas` - Registrar venta
- `GET /api/ventas/:id/boleto` - Generar boleto PDF

### 👥 Usuarios (`/api/usuarios`)
- `GET /api/usuarios` - Listar usuarios (Admin)
- `GET /api/usuarios/:id` - Obtener usuario (Admin)
- `PUT /api/usuarios/:id` - Actualizar usuario (Admin)
- `DELETE /api/usuarios/:id` - Eliminar usuario (Admin)

### 📊 Reportes (`/api/reportes`)
- `GET /api/reportes/ventas` - Reporte de ventas
- `GET /api/reportes/peliculas-populares` - Películas más populares
- `GET /api/reportes/ocupacion-salas` - Ocupación de salas
- `GET /api/reportes/ingresos` - Reporte de ingresos

### 👤 Clientes (`/api/clientes`)
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Obtener cliente
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente

### 🤖 Chatbot (`/api/chatbot`)
- `POST /api/chatbot/query` - Consultar al chatbot

---

## 🎯 Cómo Usar la Documentación Swagger

### Acceder a Swagger UI

1. Inicia el servidor:
   ```bash
   npm start
   ```

2. Abre en tu navegador:
   ```
   http://localhost:3000/api-docs
   ```

### Autenticación en Swagger

1. Haz login usando el endpoint `POST /api/auth/login`
2. Copia el token de la respuesta
3. Haz clic en el botón **"Authorize" 🔓** en la parte superior
4. Ingresa: `Bearer <tu_token>`
5. Haz clic en **"Authorize"**
6. Ahora puedes probar todos los endpoints protegidos

### Probar Endpoints

1. Expande el endpoint que quieres probar
2. Haz clic en **"Try it out"**
3. Completa los parámetros requeridos
4. Haz clic en **"Execute"**
5. Ve la respuesta en tiempo real

---

## 📦 Esquemas Definidos

Los siguientes esquemas están disponibles para reutilización:

- `Usuario` - Información de usuario del sistema
- `Pelicula` - Datos de películas
- `Sala` - Información de salas
- `Funcion` - Datos de funciones/horarios
- `Asiento` - Información de asientos
- `Reserva` - Datos de reservas
- `Boleto` - Información de boletos
- `Error` - Formato estándar de errores
- `SuccessResponse` - Formato estándar de respuestas exitosas

---

## 🔍 Características de la Documentación

### ✅ Implementado:
- Especificación OpenAPI 3.0
- Interfaz Swagger UI personalizada
- Autenticación JWT (Bearer Token)
- Esquemas reutilizables para modelos
- Tags para organización de endpoints
- Ejemplos de request/response
- Descripción de códigos de estado HTTP
- Servidor de desarrollo y producción configurados

### 📝 Beneficios:
- Documentación interactiva y auto-actualizable
- Prueba de endpoints sin Postman
- Visualización clara de esquemas de datos
- Generación automática a partir del código
- Estandarización OpenAPI para integración con otras herramientas

---

## 🚀 Próximos Pasos

Para completar la documentación al 100%:

1. ✅ Autenticación - **COMPLETADO**
2. ✅ Películas - **COMPLETADO**
3. ⏳ Funciones - Agregar anotaciones @swagger
4. ⏳ Reservas - Agregar anotaciones @swagger
5. ⏳ Ventas - Agregar anotaciones @swagger
6. ⏳ Reportes - Agregar anotaciones @swagger
7. ⏳ Usuarios - Agregar anotaciones @swagger
8. ⏳ Clientes - Agregar anotaciones @swagger
9. ⏳ Chatbot - Agregar anotaciones @swagger

---

## 💡 Notas de Desarrollo

### Estructura de Anotaciones:

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   method:
 *     summary: Resumen breve
 *     description: Descripción detallada
 *     tags: [Tag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path/query
 *         name: param_name
 *         required: true/false
 *         schema:
 *           type: string/integer
 *         description: Descripción del parámetro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchemaName'
 *     responses:
 *       200:
 *         description: Descripción de la respuesta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaName'
 */
```

### Reutilización de Esquemas:

```javascript
$ref: '#/components/schemas/Pelicula'
```

### Seguridad JWT:

```javascript
security:
  - bearerAuth: []
```

---

## 📖 Recursos Adicionales

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JSDoc to Swagger](https://github.com/Surnet/swagger-jsdoc)

---

**Última actualización**: Octubre 15, 2025
**Versión de la API**: 1.0.0
**Estado**: En desarrollo - 22% documentado (2/9 módulos completos)
