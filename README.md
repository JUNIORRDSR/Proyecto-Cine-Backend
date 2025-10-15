# Sistema de Salas de Cine - Backend

## 📋 Descripción

API REST para gestión de taquillas en salas de cine, soportando modalidades presencial (cajero) y online (cliente directo).

## 🚀 Tecnologías

- **Node.js** 18+
- **Express.js** 4.x
- **MySQL** 8.0
- **Sequelize** ORM
- **JWT** Authentication
- **Jest** + Supertest (Testing)
- **Winston** (Logging)
- **Swagger** (Documentación API)

## 📦 Requisitos Previos

- Node.js 18 o superior
- Docker (para MySQL)
- npm o yarn

## 🔧 Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/JUNIORRDSR/Proyecto-Cine-Backend.git
cd Proyecto-Cine-Backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 4. Iniciar base de datos MySQL (Docker)

```bash
docker run -d \
  --name mysql-cine \
  -e MYSQL_ROOT_PASSWORD=12345 \
  -e MYSQL_DATABASE=salas_cine \
  -p 3306:3306 \
  mysql:8.0
```

### 5. Ejecutar seeders (datos iniciales)

```bash
npm run seed
```

### 6. Iniciar servidor

```bash
npm run dev  # Desarrollo con hot reload
npm start    # Producción
```

El servidor estará disponible en `http://localhost:3000`

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia servidor en producción |
| `npm run dev` | Inicia con nodemon (hot reload) |
| `npm test` | Ejecuta suite completa de tests |
| `npm run test:unit` | Solo tests unitarios |
| `npm run test:integration` | Solo tests de integración |
| `npm run test:e2e` | Solo tests end-to-end |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Ejecuta ESLint y corrige automáticamente |
| `npm run seed` | Ejecuta seeders de datos iniciales |

## 📁 Estructura del Proyecto

```
cinema-backend/
├── src/
│   ├── config/          # Configuraciones (DB, server, JWT)
│   ├── models/          # Modelos Sequelize
│   ├── controllers/     # Controladores de rutas
│   ├── services/        # Lógica de negocio
│   ├── middlewares/     # Middlewares (auth, validación, logs)
│   ├── routes/          # Definición de rutas
│   ├── validators/      # Esquemas de validación (Joi)
│   ├── utils/           # Utilidades (logger, helpers)
│   └── app.js           # Punto de entrada
├── tests/
│   ├── unit/            # Tests unitarios
│   ├── integration/     # Tests de integración
│   └── e2e/             # Tests end-to-end
├── scripts/             # Scripts de utilidad
├── public/              # Archivos estáticos (tickets PDF)
└── logs/                # Archivos de log
```

## 🔐 Roles y Permisos

### ADMIN
- ✅ Todas las operaciones del sistema
- ✅ CRUD de películas, cajeros, funciones
- ✅ Acceso a reportes completos
- ✅ Gestión de usuarios

### CAJERO
- ✅ Consultar cartelera
- ✅ Realizar ventas presenciales
- ✅ Gestionar reservas
- ✅ CRUD de clientes

### CLIENTE (vía app)
- ✅ Ver cartelera
- ✅ Reservar/comprar boletas
- ✅ Consultar historial
- ✅ Interactuar con chatbot

## 📚 Documentación API

Una vez iniciado el servidor, accede a la documentación interactiva Swagger en:

```
http://localhost:3000/api-docs
```

### 🔑 Autenticación

#### POST `/api/auth/login`
Login de usuario (Admin/Cajero)

**Body:**
```json
{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id_usuario": 1,
      "usuario": "admin",
      "nombre": "Administrador",
      "rol": "ADMIN"
    }
  }
}
```

#### POST `/api/auth/register` (Solo Admin)
Registrar nuevo usuario (Admin/Cajero)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "usuario": "cajero3",
  "contrasena": "password123",
  "nombre": "Cajero Tres",
  "email": "cajero3@cine.com",
  "rol": "CAJERO"
}
```

#### GET `/api/auth/me`
Obtener datos del usuario actual

**Headers:**
```
Authorization: Bearer {token}
```

---

### 🎬 Películas

#### POST `/api/peliculas` (Solo Admin)
Crear nueva película

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "titulo": "Avatar: El camino del agua",
  "descripcion": "Secuela de Avatar",
  "duracion_minutos": 192,
  "genero": "Ciencia Ficción",
  "clasificacion": "PG-13",
  "idioma": "Español",
  "director": "James Cameron",
  "reparto": "Sam Worthington, Zoe Saldana",
  "fecha_estreno": "2022-12-16"
}
```

#### GET `/api/peliculas`
Listar películas (con filtro opcional)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params:**
- `estado` (opcional): `EN_CARTELERA` | `RETIRADA`

**Ejemplos:**
```bash
GET /api/peliculas
GET /api/peliculas?estado=EN_CARTELERA
GET /api/peliculas?estado=RETIRADA
```

#### GET `/api/peliculas/:id`
Obtener una película por ID

**Headers:**
```
Authorization: Bearer {token}
```

#### PUT `/api/peliculas/:id` (Solo Admin)
Actualizar película

**Headers:**
```
Authorization: Bearer {token}
```

**Body (todos los campos opcionales):**
```json
{
  "titulo": "Título actualizado",
  "descripcion": "Nueva descripción",
  "duracion_minutos": 140,
  "estado": "RETIRADA"
}
```

#### DELETE `/api/peliculas/:id` (Solo Admin)
Eliminar película (soft delete - cambia estado a RETIRADA)

**Headers:**
```
Authorization: Bearer {token}
```

---

### 📊 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos o faltantes |
| 401 | Unauthorized - No autenticado (token faltante/inválido) |
| 403 | Forbidden - No autorizado (permisos insuficientes) |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

## 🧪 Testing

### Ejecutar todos los tests

```bash
npm test
```

### Ver cobertura de código

```bash
npm run test:coverage
```

**Cobertura actual**: >80% (objetivo del proyecto)

## 🚀 Despliegue

Ver guía completa de despliegue en [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

### Opción 1: Railway (Recomendado)

1. Conectar repositorio GitHub a Railway
2. Configurar variables de entorno
3. Deploy automático

### Opción 2: Render/Heroku

Ver instrucciones en [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 🐛 Troubleshooting

### Error de conexión a MySQL

```bash
# Verificar que Docker container esté corriendo
docker ps

# Ver logs del container
docker logs mysql-cine

# Verificar credenciales en .env
```

### Tests fallan

```bash
# Limpiar y reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Verificar base de datos de test
npm run reset-db
```

## 📄 Licencia

Este proyecto es parte de un trabajo académico.

## 👤 Autor

**JUNIORRDSR**

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub
