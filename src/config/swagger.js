const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cinema Management API',
      version: '1.0.0',
      description: 'Sistema de gestión de salas de cine - API RESTful para administración de películas, salas, funciones, reservas y boletos',
      contact: {
        name: 'Cinema Backend Team',
        email: 'soporte@cinema.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api-cinema.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido del endpoint /api/auth/login',
        },
      },
      schemas: {
        // Schema: Usuario
        Usuario: {
          type: 'object',
          properties: {
            id_usuario: {
              type: 'integer',
              description: 'ID único del usuario',
              example: 1,
            },
            nombre: {
              type: 'string',
              description: 'Nombre completo del usuario',
              example: 'Juan Pérez',
            },
            usuario: {
              type: 'string',
              description: 'Nombre de usuario (username)',
              example: 'juan.perez',
            },
            rol: {
              type: 'string',
              enum: ['ADMIN', 'CAJERO'],
              description: 'Rol del usuario en el sistema',
              example: 'CAJERO',
            },
            fecha_creacion: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del usuario',
              example: '2024-01-15T10:30:00.000Z',
            },
          },
        },
        
        // Schema: Película
        Pelicula: {
          type: 'object',
          properties: {
            id_pelicula: {
              type: 'integer',
              description: 'ID único de la película',
              example: 1,
            },
            titulo: {
              type: 'string',
              description: 'Título de la película',
              example: 'Avatar: El Camino del Agua',
            },
            director: {
              type: 'string',
              description: 'Director de la película',
              example: 'James Cameron',
            },
            duracion: {
              type: 'integer',
              description: 'Duración en minutos',
              example: 192,
            },
            genero: {
              type: 'string',
              description: 'Género de la película',
              example: 'Ciencia Ficción',
            },
            clasificacion: {
              type: 'string',
              description: 'Clasificación por edad',
              example: 'PG-13',
            },
            sinopsis: {
              type: 'string',
              description: 'Resumen de la película',
              example: 'Jake Sully vive con su nueva familia formada en el planeta de Pandora...',
            },
            fecha_estreno: {
              type: 'string',
              format: 'date',
              description: 'Fecha de estreno',
              example: '2022-12-16',
            },
            estado: {
              type: 'string',
              enum: ['ACTIVA', 'INACTIVA'],
              description: 'Estado de la película',
              example: 'ACTIVA',
            },
          },
        },
        
        // Schema: Sala
        Sala: {
          type: 'object',
          properties: {
            id_sala: {
              type: 'integer',
              description: 'ID único de la sala',
              example: 1,
            },
            nombre: {
              type: 'string',
              description: 'Nombre de la sala',
              example: 'Sala VIP 1',
            },
            capacidad: {
              type: 'integer',
              description: 'Capacidad total de asientos',
              example: 100,
            },
            tipo: {
              type: 'string',
              enum: ['REGULAR', 'VIP', 'IMAX', '3D'],
              description: 'Tipo de sala',
              example: 'VIP',
            },
            estado: {
              type: 'string',
              enum: ['ACTIVA', 'INACTIVA', 'MANTENIMIENTO'],
              description: 'Estado de la sala',
              example: 'ACTIVA',
            },
          },
        },
        
        // Schema: Función
        Funcion: {
          type: 'object',
          properties: {
            id_funcion: {
              type: 'integer',
              description: 'ID único de la función',
              example: 1,
            },
            id_pelicula: {
              type: 'integer',
              description: 'ID de la película',
              example: 1,
            },
            id_sala: {
              type: 'integer',
              description: 'ID de la sala',
              example: 1,
            },
            fecha: {
              type: 'string',
              format: 'date',
              description: 'Fecha de la función',
              example: '2024-01-20',
            },
            hora_inicio: {
              type: 'string',
              format: 'time',
              description: 'Hora de inicio',
              example: '18:30:00',
            },
            hora_fin: {
              type: 'string',
              format: 'time',
              description: 'Hora de fin',
              example: '21:02:00',
            },
            precio_base: {
              type: 'number',
              format: 'decimal',
              description: 'Precio base del boleto',
              example: 8.50,
            },
            estado: {
              type: 'string',
              enum: ['PROGRAMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA'],
              description: 'Estado de la función',
              example: 'PROGRAMADA',
            },
          },
        },
        
        // Schema: Asiento
        Asiento: {
          type: 'object',
          properties: {
            id_asiento: {
              type: 'integer',
              description: 'ID único del asiento',
              example: 1,
            },
            id_sala: {
              type: 'integer',
              description: 'ID de la sala',
              example: 1,
            },
            fila: {
              type: 'string',
              description: 'Fila del asiento',
              example: 'A',
            },
            numero: {
              type: 'integer',
              description: 'Número del asiento',
              example: 5,
            },
            tipo: {
              type: 'string',
              enum: ['REGULAR', 'VIP', 'PREFERENCIAL'],
              description: 'Tipo de asiento',
              example: 'VIP',
            },
            estado: {
              type: 'string',
              enum: ['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO'],
              description: 'Estado del asiento',
              example: 'DISPONIBLE',
            },
          },
        },
        
        // Schema: Reserva
        Reserva: {
          type: 'object',
          properties: {
            id_reserva: {
              type: 'integer',
              description: 'ID único de la reserva',
              example: 1,
            },
            id_funcion: {
              type: 'integer',
              description: 'ID de la función',
              example: 1,
            },
            nombre_cliente: {
              type: 'string',
              description: 'Nombre del cliente',
              example: 'María González',
            },
            email_cliente: {
              type: 'string',
              format: 'email',
              description: 'Email del cliente',
              example: 'maria@example.com',
            },
            telefono_cliente: {
              type: 'string',
              description: 'Teléfono del cliente',
              example: '555-0123',
            },
            cantidad_boletos: {
              type: 'integer',
              description: 'Cantidad de boletos reservados',
              example: 2,
            },
            total: {
              type: 'number',
              format: 'decimal',
              description: 'Total a pagar',
              example: 17.00,
            },
            estado: {
              type: 'string',
              enum: ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA'],
              description: 'Estado de la reserva',
              example: 'PENDIENTE',
            },
            fecha_creacion: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
              example: '2024-01-15T10:30:00.000Z',
            },
            fecha_expiracion: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de expiración',
              example: '2024-01-15T10:45:00.000Z',
            },
          },
        },
        
        // Schema: Boleto
        Boleto: {
          type: 'object',
          properties: {
            id_boleto: {
              type: 'integer',
              description: 'ID único del boleto',
              example: 1,
            },
            id_reserva: {
              type: 'integer',
              description: 'ID de la reserva',
              example: 1,
            },
            id_asiento: {
              type: 'integer',
              description: 'ID del asiento',
              example: 15,
            },
            codigo_boleto: {
              type: 'string',
              description: 'Código único del boleto',
              example: 'BOL-2024-001-A5',
            },
            precio: {
              type: 'number',
              format: 'decimal',
              description: 'Precio del boleto',
              example: 8.50,
            },
            tipo_cliente: {
              type: 'string',
              enum: ['ADULTO', 'NINO', 'ESTUDIANTE', 'TERCERA_EDAD'],
              description: 'Tipo de cliente',
              example: 'ADULTO',
            },
            fecha_emision: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de emisión',
              example: '2024-01-15T10:35:00.000Z',
            },
          },
        },
        
        // Schema: Error Response
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Los datos proporcionados no son válidos',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        
        // Schema: Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Datos de la respuesta',
            },
            message: {
              type: 'string',
              description: 'Mensaje opcional',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Autenticación',
        description: 'Endpoints para autenticación y autorización',
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema',
      },
      {
        name: 'Películas',
        description: 'Gestión de películas en cartelera',
      },
      {
        name: 'Salas',
        description: 'Gestión de salas de cine',
      },
      {
        name: 'Funciones',
        description: 'Gestión de funciones y horarios',
      },
      {
        name: 'Asientos',
        description: 'Gestión de asientos por sala',
      },
      {
        name: 'Reservas',
        description: 'Gestión de reservas de boletos',
      },
      {
        name: 'Boletos',
        description: 'Gestión y generación de boletos',
      },
      {
        name: 'Reportes',
        description: 'Reportes y estadísticas del sistema',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Archivos que contienen las anotaciones de Swagger
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
