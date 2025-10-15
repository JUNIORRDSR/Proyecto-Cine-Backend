const reservaService = require('../../src/services/reservaService');
const { sequelize } = require('../../src/config/database');
const { Venta, DetalleVenta, Silla, Funcion } = require('../../src/models');

jest.mock('../../src/models');
jest.mock('../../src/config/database');

describe('ReservaService Unit Tests', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de transacción
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    
    sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
  });

  describe('crearReserva', () => {
    it('should create reservation successfully', async () => {
      const mockFuncion = {
        id: 1,
        fecha: '2025-10-20',
        hora: '18:00',
        precio: 50
      };

      const mockSillas = [
        { id: 1, numero: 1, tipo: 'NORMAL' },
        { id: 2, numero: 2, tipo: 'NORMAL' }
      ];

      const mockVenta = {
        id: 1,
        id_cliente: 1,
        total: 100,
        estado: 'RESERVADA',
        fecha_expiracion_reserva: expect.any(Date)
      };

      Funcion.findByPk = jest.fn().mockResolvedValue(mockFuncion);
      Silla.findAll = jest.fn().mockResolvedValue(mockSillas);
      DetalleVenta.findAll = jest.fn().mockResolvedValue([]);
      Venta.create = jest.fn().mockResolvedValue(mockVenta);
      DetalleVenta.bulkCreate = jest.fn().mockResolvedValue([]);

      const result = await reservaService.crearReserva(
        1, // id_cliente
        1, // id_funcion
        [1, 2], // sillasIds
        1 // id_usuario
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Funcion.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(Venta.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if seats are already taken', async () => {
      const mockFuncion = {
        id: 1,
        fecha: '2025-10-20',
        hora: '18:00'
      };

      const mockSillas = [
        { id: 1, numero: 1 }
      ];

      // Simular que la silla ya está ocupada
      const mockDetallesExistentes = [
        { id_silla: 1 }
      ];

      Funcion.findByPk = jest.fn().mockResolvedValue(mockFuncion);
      Silla.findAll = jest.fn().mockResolvedValue(mockSillas);
      DetalleVenta.findAll = jest.fn().mockResolvedValue(mockDetallesExistentes);

      await expect(
        reservaService.crearReserva(1, 1, [1], 1)
      ).rejects.toThrow('ocupadas');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if function not found', async () => {
      Funcion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        reservaService.crearReserva(1, 999, [1], 1)
      ).rejects.toThrow('Función no encontrada');
    });

    it('should calculate total correctly', async () => {
      const mockFuncion = {
        id: 1,
        fecha: '2025-10-20',
        hora: '18:00',
        precio: 50
      };

      const mockSillas = [
        { id: 1, numero: 1, tipo: 'NORMAL' },
        { id: 2, numero: 2, tipo: 'VIP' }
      ];

      const mockVenta = {
        id: 1,
        total: 100
      };

      Funcion.findByPk = jest.fn().mockResolvedValue(mockFuncion);
      Silla.findAll = jest.fn().mockResolvedValue(mockSillas);
      DetalleVenta.findAll = jest.fn().mockResolvedValue([]);
      Venta.create = jest.fn().mockResolvedValue(mockVenta);
      DetalleVenta.bulkCreate = jest.fn().mockResolvedValue([]);

      await reservaService.crearReserva(1, 1, [1, 2], 1);

      // Verificar que se creó la venta con el total correcto
      expect(Venta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          total: expect.any(Number)
        }),
        expect.any(Object)
      );
    });
  });

  describe('confirmarReserva', () => {
    it('should confirm reservation successfully', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 20 * 60000); // 20 minutos en el futuro

      const mockVenta = {
        id: 1,
        estado: 'RESERVADA',
        fecha_expiracion_reserva: futureDate,
        save: jest.fn(),
        detalles: [
          { id_silla: 1, silla: { save: jest.fn() } },
          { id_silla: 2, silla: { save: jest.fn() } }
        ]
      };

      Venta.findByPk = jest.fn().mockResolvedValue(mockVenta);

      await reservaService.confirmarReserva(1, 1);

      expect(mockVenta.estado).toBe('PAGADA');
      expect(mockVenta.save).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if reservation expired', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 20 * 60000); // 20 minutos en el pasado

      const mockVenta = {
        id: 1,
        estado: 'RESERVADA',
        fecha_expiracion_reserva: pastDate
      };

      Venta.findByPk = jest.fn().mockResolvedValue(mockVenta);

      await expect(
        reservaService.confirmarReserva(1, 1)
      ).rejects.toThrow('expirado');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if reservation not found', async () => {
      Venta.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        reservaService.confirmarReserva(999, 1)
      ).rejects.toThrow('no encontrada');
    });

    it('should throw error if not in RESERVADA state', async () => {
      const mockVenta = {
        id: 1,
        estado: 'PAGADA', // Ya pagada
        fecha_expiracion_reserva: new Date()
      };

      Venta.findByPk = jest.fn().mockResolvedValue(mockVenta);

      await expect(
        reservaService.confirmarReserva(1, 1)
      ).rejects.toThrow('estado RESERVADA');
    });
  });

  describe('cancelarReserva', () => {
    it('should cancel reservation successfully', async () => {
      const mockVenta = {
        id: 1,
        estado: 'RESERVADA',
        save: jest.fn(),
        detalles: [
          { id_silla: 1, silla: { estado: 'RESERVADA', save: jest.fn() } }
        ]
      };

      Venta.findByPk = jest.fn().mockResolvedValue(mockVenta);

      await reservaService.cancelarReserva(1, 1);

      expect(mockVenta.estado).toBe('CANCELADA');
      expect(mockVenta.save).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should free seats when canceling', async () => {
      const mockSilla = {
        estado: 'RESERVADA',
        save: jest.fn()
      };

      const mockVenta = {
        id: 1,
        estado: 'RESERVADA',
        save: jest.fn(),
        detalles: [
          { id_silla: 1, silla: mockSilla }
        ]
      };

      Venta.findByPk = jest.fn().mockResolvedValue(mockVenta);

      await reservaService.cancelarReserva(1, 1);

      expect(mockSilla.estado).toBe('DISPONIBLE');
      expect(mockSilla.save).toHaveBeenCalled();
    });
  });

  describe('limpiarReservasExpiradas', () => {
    it('should clean expired reservations', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 20 * 60000);

      const mockReservasExpiradas = [
        {
          id: 1,
          estado: 'RESERVADA',
          fecha_expiracion_reserva: pastDate,
          save: jest.fn(),
          detalles: [
            { id_silla: 1, silla: { estado: 'RESERVADA', save: jest.fn() } }
          ]
        }
      ];

      Venta.findAll = jest.fn().mockResolvedValue(mockReservasExpiradas);

      const result = await reservaService.limpiarReservasExpiradas();

      expect(result.canceladas).toBe(1);
      expect(mockReservasExpiradas[0].estado).toBe('CANCELADA');
    });

    it('should return 0 if no expired reservations', async () => {
      Venta.findAll = jest.fn().mockResolvedValue([]);

      const result = await reservaService.limpiarReservasExpiradas();

      expect(result.canceladas).toBe(0);
    });
  });

  describe('obtenerDisponibilidadFuncion', () => {
    it('should return seat availability', async () => {
      const mockFuncion = {
        id: 1,
        sala: {
          sillas: [
            { id: 1, bloque: 'B1', fila: 'A', numero: 1, tipo: 'NORMAL' },
            { id: 2, bloque: 'B1', fila: 'A', numero: 2, tipo: 'NORMAL' }
          ]
        }
      };

      const mockDetalles = [
        { id_silla: 1 } // Silla 1 ocupada
      ];

      Funcion.findByPk = jest.fn().mockResolvedValue(mockFuncion);
      DetalleVenta.findAll = jest.fn().mockResolvedValue(mockDetalles);

      const result = await reservaService.obtenerDisponibilidadFuncion(1);

      expect(result.total_sillas).toBe(2);
      expect(result.disponibles).toBe(1);
      expect(result.ocupadas).toBe(1);
      expect(result.sillas).toHaveLength(2);
    });
  });
});
