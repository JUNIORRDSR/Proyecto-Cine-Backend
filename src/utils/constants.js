// Constants used throughout the application

// User roles
const ROLES = {
  ADMIN: 'ADMIN',
  CAJERO: 'CAJERO',
};

// Client types
const CLIENT_TYPES = {
  NORMAL: 'NORMAL',
  VIP: 'VIP',
};

// Movie states
const MOVIE_STATES = {
  EN_CARTELERA: 'EN_CARTELERA',
  RETIRADA: 'RETIRADA',
};

// Room states
const ROOM_STATES = {
  ACTIVA: 'ACTIVA',
  INACTIVA: 'INACTIVA',
  MANTENIMIENTO: 'MANTENIMIENTO',
};

// Room types
const ROOM_TYPES = {
  DOS_D: '2D',
  TRES_D: '3D',
  IMAX: 'IMAX',
  VIP: 'VIP',
};

// Seat blocks
const SEAT_BLOCKS = {
  B1: 'B1',
  B2: 'B2',
};

// Seat rows
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

// Seat types
const SEAT_TYPES = {
  NORMAL: 'NORMAL',
  VIP: 'VIP',
  DISCAPACITADO: 'DISCAPACITADO',
};

// Seat states in detail_venta
const SEAT_STATES = {
  LIBRE: 'LIBRE',
  OCUPADA: 'OCUPADA',
  RESERVADA: 'RESERVADA',
};

// Sale states
const SALE_STATES = {
  PAGADA: 'PAGADA',
  RESERVADA: 'RESERVADA',
  CANCELADA: 'CANCELADA',
};

// Reservation time limit in milliseconds (15 minutes)
const RESERVATION_TIME_LIMIT = parseInt(process.env.RESERVATION_TIME_LIMIT_MINUTES || 15) * 60 * 1000;

// Discount percentages
const DISCOUNTS = {
  VIP: 20, // 20%
  MATINEE: 15, // 15% before 3 PM
  WEEKDAY: 10, // 10% Tuesday/Wednesday
  STUDENT: 10, // 10%
  MAX_TOTAL: 40, // Maximum 40% total discount
};

// Seats per room structure
const SEATS_PER_ROOM = {
  BLOCKS: 2,
  ROWS: 13,
  SEATS_PER_ROW: 10,
  TOTAL: 260, // 2 * 13 * 10
};

// Movie classifications
const MOVIE_CLASSIFICATIONS = {
  G: 'G', // General Audiences
  PG: 'PG', // Parental Guidance
  PG13: 'PG-13',
  R: 'R', // Restricted
  NC17: 'NC-17',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
  ROLES,
  CLIENT_TYPES,
  MOVIE_STATES,
  ROOM_STATES,
  ROOM_TYPES,
  SEAT_BLOCKS,
  SEAT_ROWS,
  SEAT_TYPES,
  SEAT_STATES,
  SALE_STATES,
  RESERVATION_TIME_LIMIT,
  DISCOUNTS,
  SEATS_PER_ROOM,
  MOVIE_CLASSIFICATIONS,
  HTTP_STATUS,
};
