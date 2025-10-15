const request = require('supertest');
const app = require('../../src/app');
const { sequelize, Pelicula, Usuario } = require('../../src/models');
const { MOVIE_STATES } = require('../../src/utils/constants');

describe('Películas API', () => {
  let adminToken;
  let cajeroToken;

  beforeAll(async () => {
    // Sincronizar base de datos
    await sequelize.sync({ force: true });

    // Crear usuarios de prueba
    await Usuario.create({
      usuario: 'admin',
      contrasena: 'admin123',
      nombre: 'Administrador',
      email: 'admin@cine.com',
      rol: 'ADMIN'
    });

    await Usuario.create({
      usuario: 'cajero1',
      contrasena: 'cajero123',
      nombre: 'Cajero Test',
      email: 'cajero1@cine.com',
      rol: 'CAJERO'
    });

    // Obtener tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', contrasena: 'admin123' });
    adminToken = adminLogin.body.data.token;

    const cajeroLogin = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'cajero1', contrasena: 'cajero123' });
    cajeroToken = cajeroLogin.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/peliculas - Crear película', () => {
    test('debe crear una película exitosamente con admin', async () => {
      const response = await request(app)
        .post('/api/peliculas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Avatar: El camino del agua',
          descripcion: 'Secuela de Avatar',
          duracion_minutos: 192,
          genero: 'Ciencia Ficción',
          clasificacion: 'PG-13',
          idioma: 'Español',
          director: 'James Cameron',
          reparto: 'Sam Worthington, Zoe Saldana',
          fecha_estreno: '2022-12-16'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id_pelicula');
      expect(response.body.data.titulo).toBe('Avatar: El camino del agua');
      expect(response.body.data.estado).toBe(MOVIE_STATES.EN_CARTELERA);
    });

    test('debe rechazar creación sin token', async () => {
      const response = await request(app)
        .post('/api/peliculas')
        .send({
          titulo: 'Test',
          duracion_minutos: 120,
          genero: 'Acción',
          clasificacion: 'PG-13'
        });

      expect(response.status).toBe(401);
    });

    test('debe rechazar creación con cajero', async () => {
      const response = await request(app)
        .post('/api/peliculas')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          titulo: 'Test',
          duracion_minutos: 120,
          genero: 'Acción',
          clasificacion: 'PG-13'
        });

      expect(response.status).toBe(403);
    });

    test('debe validar campos requeridos', async () => {
      const response = await request(app)
        .post('/api/peliculas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Test sin genero'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('debe validar duración mínima', async () => {
      const response = await request(app)
        .post('/api/peliculas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Test',
          duracion_minutos: 0,
          genero: 'Acción',
          clasificacion: 'PG-13'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('duración');
    });

    test('debe validar duración máxima', async () => {
      const response = await request(app)
        .post('/api/peliculas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Test',
          duracion_minutos: 600,
          genero: 'Acción',
          clasificacion: 'PG-13'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('duración');
    });
  });

  describe('GET /api/peliculas - Listar películas', () => {
    beforeAll(async () => {
      // Crear películas de prueba
      await Pelicula.create({
        titulo: 'Película en cartelera 1',
        duracion_minutos: 120,
        genero: 'Acción',
        clasificacion: 'PG-13',
        estado: MOVIE_STATES.EN_CARTELERA
      });

      await Pelicula.create({
        titulo: 'Película en cartelera 2',
        duracion_minutos: 110,
        genero: 'Comedia',
        clasificacion: 'PG',
        estado: MOVIE_STATES.EN_CARTELERA
      });

      await Pelicula.create({
        titulo: 'Película retirada',
        duracion_minutos: 105,
        genero: 'Drama',
        clasificacion: 'R',
        estado: MOVIE_STATES.RETIRADA
      });
    });

    test('debe listar todas las películas autenticado', async () => {
      const response = await request(app)
        .get('/api/peliculas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('debe listar solo películas en cartelera', async () => {
      const response = await request(app)
        .get('/api/peliculas?estado=EN_CARTELERA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.estado === MOVIE_STATES.EN_CARTELERA)).toBe(true);
    });

    test('debe listar solo películas retiradas', async () => {
      const response = await request(app)
        .get('/api/peliculas?estado=RETIRADA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.estado === MOVIE_STATES.RETIRADA)).toBe(true);
    });

    test('debe rechazar estado inválido', async () => {
      const response = await request(app)
        .get('/api/peliculas?estado=INVALIDO')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    test('debe rechazar petición sin token', async () => {
      const response = await request(app)
        .get('/api/peliculas');

      expect(response.status).toBe(401);
    });

    test('cajero debe poder listar películas', async () => {
      const response = await request(app)
        .get('/api/peliculas')
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/peliculas/:id - Obtener película', () => {
    let peliculaId;

    beforeAll(async () => {
      const pelicula = await Pelicula.create({
        titulo: 'Película para obtener',
        duracion_minutos: 130,
        genero: 'Thriller',
        clasificacion: 'R',
        estado: MOVIE_STATES.EN_CARTELERA
      });
      peliculaId = pelicula.id_pelicula;
    });

    test('debe obtener una película por ID', async () => {
      const response = await request(app)
        .get(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_pelicula).toBe(peliculaId);
      expect(response.body.data.titulo).toBe('Película para obtener');
    });

    test('debe retornar 404 para película inexistente', async () => {
      const response = await request(app)
        .get('/api/peliculas/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    test('debe rechazar petición sin token', async () => {
      const response = await request(app)
        .get(`/api/peliculas/${peliculaId}`);

      expect(response.status).toBe(401);
    });

    test('cajero debe poder obtener película', async () => {
      const response = await request(app)
        .get(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/peliculas/:id - Actualizar película', () => {
    let peliculaId;

    beforeEach(async () => {
      const pelicula = await Pelicula.create({
        titulo: 'Película para actualizar',
        duracion_minutos: 120,
        genero: 'Acción',
        clasificacion: 'PG-13',
        estado: MOVIE_STATES.EN_CARTELERA
      });
      peliculaId = pelicula.id_pelicula;
    });

    test('admin debe poder actualizar película', async () => {
      const response = await request(app)
        .put(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Título actualizado',
          duracion_minutos: 140
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.titulo).toBe('Título actualizado');
      expect(response.body.data.duracion_minutos).toBe(140);
    });

    test('debe actualizar solo estado', async () => {
      const response = await request(app)
        .put(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          estado: MOVIE_STATES.RETIRADA
        });

      expect(response.status).toBe(200);
      expect(response.body.data.estado).toBe(MOVIE_STATES.RETIRADA);
      expect(response.body.data.titulo).toBe('Película para actualizar');
    });

    test('debe rechazar cajero intentando actualizar', async () => {
      const response = await request(app)
        .put(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          titulo: 'Intento de actualización'
        });

      expect(response.status).toBe(403);
    });

    test('debe validar duración en actualización', async () => {
      const response = await request(app)
        .put(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          duracion_minutos: -10
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('duración');
    });

    test('debe validar estado en actualización', async () => {
      const response = await request(app)
        .put(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          estado: 'ESTADO_INVALIDO'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Estado inválido');
    });

    test('debe retornar 404 para película inexistente', async () => {
      const response = await request(app)
        .put('/api/peliculas/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Test'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/peliculas/:id - Eliminar película (soft delete)', () => {
    let peliculaId;

    beforeEach(async () => {
      const pelicula = await Pelicula.create({
        titulo: 'Película para eliminar',
        duracion_minutos: 115,
        genero: 'Horror',
        clasificacion: 'R',
        estado: MOVIE_STATES.EN_CARTELERA
      });
      peliculaId = pelicula.id_pelicula;
    });

    test('admin debe poder eliminar película (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe(MOVIE_STATES.RETIRADA);

      // Verificar que la película aún existe en BD
      const pelicula = await Pelicula.findByPk(peliculaId);
      expect(pelicula).not.toBeNull();
      expect(pelicula.estado).toBe(MOVIE_STATES.RETIRADA);
    });

    test('debe rechazar cajero intentando eliminar', async () => {
      const response = await request(app)
        .delete(`/api/peliculas/${peliculaId}`)
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(response.status).toBe(403);
    });

    test('debe retornar 404 para película inexistente', async () => {
      const response = await request(app)
        .delete('/api/peliculas/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    test('debe rechazar petición sin token', async () => {
      const response = await request(app)
        .delete(`/api/peliculas/${peliculaId}`);

      expect(response.status).toBe(401);
    });
  });
});
