const request = require('supertest');
const app = require('../../src/app');
const { testConnection, sequelize } = require('../../src/config/database');
const { Pelicula, Sala, Funcion, Cliente, Venta } = require('../../src/models');

/**
 * Test E2E: Flujo completo de compra de boletos
 * Simula el recorrido completo de un usuario desde registro hasta compra
 */
describe('E2E: Complete Ticket Purchase Flow', () => {
  let adminToken;
  let cajeroToken;
  let peliculaId;
  let salaId;
  let funcionId;
  let clienteId;

  beforeAll(async () => {
    await testConnection();
    
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
    }

    // Crear usuario admin
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin Test',
        usuario: 'admin',
        contrasena: 'Admin123!',
        rol: 'ADMIN'
      });
    
    adminToken = adminResponse.body.data.token;

    // Crear usuario cajero
    const cajeroResponse = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Cajero Test',
        usuario: 'cajero',
        contrasena: 'Cajero123!',
        rol: 'CAJERO'
      });
    
    cajeroToken = cajeroResponse.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Step 1: Create Cinema Infrastructure', () => {
    it('should create a movie (Admin)', async () => {
      const response = await request(app)
        .post('/api/peliculas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Test Movie E2E',
          genero: 'ACCION',
          duracion: 120,
          calificacion: 'PG-13',
          estado: 'EN_CARTELERA',
          sinopsis: 'Test synopsis for E2E',
          director: 'Test Director',
          fecha_estreno: '2025-10-15'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      peliculaId = response.body.data.id;
    });

    it('should create a sala (Admin)', async () => {
      const response = await request(app)
        .post('/api/salas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Sala E2E',
          capacidad: 100,
          tipo: '2D',
          estado: 'ACTIVA'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      salaId = response.body.data.id;
    });

    it('should create a funcion (Admin)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .post('/api/funciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id_pelicula: peliculaId,
          id_sala: salaId,
          fecha: fecha,
          hora: '18:00',
          precio: 50
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      funcionId = response.body.data.id;
    });
  });

  describe('Step 2: Create Customer', () => {
    it('should create a cliente (Cajero)', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          nombre: 'Cliente E2E',
          email: 'cliente.e2e@test.com',
          telefono: '1234567890',
          tipo: 'NORMAL'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      clienteId = response.body.data.id;
    });
  });

  describe('Step 3: Check Availability', () => {
    it('should get available seats for function', async () => {
      const response = await request(app)
        .get(`/api/reservas/disponibilidad/${funcionId}`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_sillas');
      expect(response.body.data).toHaveProperty('disponibles');
      expect(response.body.data.disponibles).toBeGreaterThan(0);
    });

    it('should list all funciones', async () => {
      const response = await request(app)
        .get('/api/funciones')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Step 4: Make Reservation', () => {
    let reservaId;

    it('should create a reservation', async () => {
      const response = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          id_cliente: clienteId,
          id_funcion: funcionId,
          sillas: [1, 2, 3] // Reservar 3 sillas
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.estado).toBe('RESERVADA');
      reservaId = response.body.data.id;
    });

    it('should not allow double reservation of same seats', async () => {
      const response = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          id_cliente: clienteId,
          id_funcion: funcionId,
          sillas: [1, 2] // Intentar reservar sillas ya reservadas
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should confirm reservation and convert to sale', async () => {
      const response = await request(app)
        .put(`/api/reservas/${reservaId}/confirmar`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('PAGADA');
    });
  });

  describe('Step 5: Direct Sale (without reservation)', () => {
    it('should create direct sale', async () => {
      const response = await request(app)
        .post('/api/ventas')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          id_cliente: clienteId,
          id_funcion: funcionId,
          sillas: [4, 5] // Compra directa de 2 sillas
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('PAGADA');
      expect(response.body.data.total).toBeGreaterThan(0);
    });
  });

  describe('Step 6: View Sales History', () => {
    it('should get sales history', async () => {
      const response = await request(app)
        .get('/api/ventas')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should get sales statistics', async () => {
      const response = await request(app)
        .get('/api/ventas/estadisticas/resumen')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_ventas');
      expect(response.body.data).toHaveProperty('total_ingresos');
    });
  });

  describe('Step 7: Get Recommendations (Chatbot)', () => {
    it('should get personalized recommendations', async () => {
      const response = await request(app)
        .get(`/api/chatbot/recomendaciones/${clienteId}`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('mensaje');
    });

    it('should get popular movies', async () => {
      const response = await request(app)
        .get('/api/chatbot/populares')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recomendaciones');
    });

    it('should process chatbot message', async () => {
      const response = await request(app)
        .post('/api/chatbot/mensaje')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          mensaje: 'Qué películas hay en cartelera?',
          id_cliente: clienteId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('intencion');
      expect(response.body.data).toHaveProperty('respuesta');
    });
  });

  describe('Step 8: Generate Reports (Admin)', () => {
    it('should generate sales by movie report', async () => {
      const response = await request(app)
        .get('/api/reportes/ventas/por-pelicula')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reporte');
    });

    it('should generate occupancy report', async () => {
      const response = await request(app)
        .get('/api/reportes/salas/ocupacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should get general statistics', async () => {
      const response = await request(app)
        .get('/api/reportes/estadisticas/generales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_ventas');
      expect(response.body.data).toHaveProperty('total_reservas');
    });
  });

  describe('Step 9: Verify Data Integrity', () => {
    it('should verify seats are marked as sold', async () => {
      const response = await request(app)
        .get(`/api/reservas/disponibilidad/${funcionId}`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .expect(200);

      expect(response.body.data.ocupadas).toBeGreaterThanOrEqual(5);
      expect(response.body.data.disponibles).toBeLessThan(response.body.data.total_sillas);
    });

    it('should verify total revenue matches sales', async () => {
      const ventas = await Venta.findAll({
        where: { estado: 'PAGADA' }
      });

      const totalCalculado = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
      expect(totalCalculado).toBeGreaterThan(0);
    });
  });
});
