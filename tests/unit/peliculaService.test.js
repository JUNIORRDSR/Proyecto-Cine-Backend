const peliculaService = require('../../src/services/peliculaService');
const { Pelicula } = require('../../src/models');

// Mock del modelo Pelicula
jest.mock('../../src/models', () => ({
  Pelicula: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Funcion: {},
  Sala: {}
}));

describe('PeliculaService Unit Tests', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('listarPeliculas', () => {
    it('should return all movies when no filters', async () => {
      const mockPeliculas = [
        { id: 1, titulo: 'Pelicula 1', genero: 'ACCION', estado: 'EN_CARTELERA' },
        { id: 2, titulo: 'Pelicula 2', genero: 'COMEDIA', estado: 'EN_CARTELERA' }
      ];

      Pelicula.findAll.mockResolvedValue(mockPeliculas);

      const result = await peliculaService.listarPeliculas({});

      expect(Pelicula.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['fecha_estreno', 'DESC']]
      });
      expect(result).toEqual(mockPeliculas);
      expect(result).toHaveLength(2);
    });

    it('should filter by estado', async () => {
      const mockPeliculas = [
        { id: 1, titulo: 'Pelicula 1', estado: 'EN_CARTELERA' }
      ];

      Pelicula.findAll.mockResolvedValue(mockPeliculas);

      await peliculaService.listarPeliculas({ estado: 'EN_CARTELERA' });

      expect(Pelicula.findAll).toHaveBeenCalledWith({
        where: { estado: 'EN_CARTELERA' },
        order: [['fecha_estreno', 'DESC']]
      });
    });

    it('should filter by genero', async () => {
      const mockPeliculas = [
        { id: 1, titulo: 'Pelicula 1', genero: 'ACCION' }
      ];

      Pelicula.findAll.mockResolvedValue(mockPeliculas);

      await peliculaService.listarPeliculas({ genero: 'ACCION' });

      expect(Pelicula.findAll).toHaveBeenCalledWith({
        where: { genero: 'ACCION' },
        order: [['fecha_estreno', 'DESC']]
      });
    });
  });

  describe('obtenerPelicula', () => {
    it('should return movie when found', async () => {
      const mockPelicula = {
        id: 1,
        titulo: 'Test Movie',
        genero: 'ACCION',
        duracion: 120,
        estado: 'EN_CARTELERA'
      };

      Pelicula.findByPk.mockResolvedValue(mockPelicula);

      const result = await peliculaService.obtenerPelicula(1);

      expect(Pelicula.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(mockPelicula);
    });

    it('should throw error when movie not found', async () => {
      Pelicula.findByPk.mockResolvedValue(null);

      await expect(peliculaService.obtenerPelicula(999))
        .rejects
        .toThrow('Película no encontrada');
    });
  });

  describe('crearPelicula', () => {
    it('should create movie successfully', async () => {
      const mockPeliculaData = {
        titulo: 'Nueva Pelicula',
        genero: 'ACCION',
        duracion: 120,
        calificacion: 'PG-13',
        estado: 'EN_CARTELERA',
        sinopsis: 'Test synopsis',
        director: 'Test Director',
        fecha_estreno: '2025-10-15'
      };

      const mockCreatedPelicula = {
        id: 1,
        ...mockPeliculaData
      };

      Pelicula.create.mockResolvedValue(mockCreatedPelicula);

      const result = await peliculaService.crearPelicula(mockPeliculaData);

      expect(Pelicula.create).toHaveBeenCalledWith(mockPeliculaData);
      expect(result).toEqual(mockCreatedPelicula);
      expect(result.id).toBe(1);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        titulo: '', // Título vacío
        genero: 'INVALID_GENRE',
        duracion: -10 // Duración negativa
      };

      Pelicula.create.mockRejectedValue(new Error('Validation error'));

      await expect(peliculaService.crearPelicula(invalidData))
        .rejects
        .toThrow('Validation error');
    });
  });

  describe('actualizarPelicula', () => {
    it('should update movie successfully', async () => {
      const mockPelicula = {
        id: 1,
        titulo: 'Original Title',
        update: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };

      const updateData = {
        titulo: 'Updated Title',
        genero: 'DRAMA'
      };

      Pelicula.findByPk.mockResolvedValue(mockPelicula);

      await peliculaService.actualizarPelicula(1, updateData);

      expect(Pelicula.findByPk).toHaveBeenCalledWith(1);
      expect(mockPelicula.titulo).toBe('Updated Title');
      expect(mockPelicula.genero).toBe('DRAMA');
    });

    it('should throw error when movie not found', async () => {
      Pelicula.findByPk.mockResolvedValue(null);

      await expect(peliculaService.actualizarPelicula(999, { titulo: 'Test' }))
        .rejects
        .toThrow('Película no encontrada');
    });
  });

  describe('eliminarPelicula', () => {
    it('should delete movie successfully', async () => {
      const mockPelicula = {
        id: 1,
        titulo: 'To Delete',
        destroy: jest.fn().mockResolvedValue(true)
      };

      Pelicula.findByPk.mockResolvedValue(mockPelicula);

      await peliculaService.eliminarPelicula(1);

      expect(Pelicula.findByPk).toHaveBeenCalledWith(1);
      expect(mockPelicula.destroy).toHaveBeenCalled();
    });

    it('should throw error when movie not found', async () => {
      Pelicula.findByPk.mockResolvedValue(null);

      await expect(peliculaService.eliminarPelicula(999))
        .rejects
        .toThrow('Película no encontrada');
    });
  });
});
