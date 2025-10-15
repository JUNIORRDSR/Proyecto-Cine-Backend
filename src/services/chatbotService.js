const natural = require('natural');
const compromise = require('compromise');
const { Pelicula, Funcion, Sala } = require('../models');
const { Op } = require('sequelize');
const recomendacionService = require('./recomendacionService');

/**
 * Servicio de Chatbot con NLP
 * Procesa consultas en lenguaje natural y genera respuestas automáticas
 */

// Configurar tokenizador en español
const tokenizer = new natural.WordTokenizer();

// Clasificador de intenciones
const classifier = new natural.BayesClassifier();

// Entrenar clasificador con patrones comunes
const entrenarClasificador = () => {
  // Intención: CONSULTAR_CARTELERA
  classifier.addDocument('qué películas hay', 'CONSULTAR_CARTELERA');
  classifier.addDocument('cuáles películas están en cartelera', 'CONSULTAR_CARTELERA');
  classifier.addDocument('qué hay en cine', 'CONSULTAR_CARTELERA');
  classifier.addDocument('qué puedo ver', 'CONSULTAR_CARTELERA');
  classifier.addDocument('películas disponibles', 'CONSULTAR_CARTELERA');
  classifier.addDocument('mostrar cartelera', 'CONSULTAR_CARTELERA');
  classifier.addDocument('ver películas', 'CONSULTAR_CARTELERA');

  // Intención: CONSULTAR_HORARIOS
  classifier.addDocument('qué horarios hay', 'CONSULTAR_HORARIOS');
  classifier.addDocument('a qué hora dan', 'CONSULTAR_HORARIOS');
  classifier.addDocument('cuándo puedo ver', 'CONSULTAR_HORARIOS');
  classifier.addDocument('horarios disponibles', 'CONSULTAR_HORARIOS');
  classifier.addDocument('funciones disponibles', 'CONSULTAR_HORARIOS');
  classifier.addDocument('mostrar horarios', 'CONSULTAR_HORARIOS');

  // Intención: PEDIR_RECOMENDACION
  classifier.addDocument('qué me recomiendas', 'PEDIR_RECOMENDACION');
  classifier.addDocument('recomiéndame una película', 'PEDIR_RECOMENDACION');
  classifier.addDocument('qué película debería ver', 'PEDIR_RECOMENDACION');
  classifier.addDocument('sugiéreme algo', 'PEDIR_RECOMENDACION');
  classifier.addDocument('ayúdame a elegir', 'PEDIR_RECOMENDACION');
  classifier.addDocument('no sé qué ver', 'PEDIR_RECOMENDACION');

  // Intención: CONSULTAR_PRECIOS
  classifier.addDocument('cuánto cuesta', 'CONSULTAR_PRECIOS');
  classifier.addDocument('qué precio tiene', 'CONSULTAR_PRECIOS');
  classifier.addDocument('cuál es el precio', 'CONSULTAR_PRECIOS');
  classifier.addDocument('precios de entradas', 'CONSULTAR_PRECIOS');
  classifier.addDocument('valor de boletos', 'CONSULTAR_PRECIOS');

  // Intención: CONSULTAR_GENERO
  classifier.addDocument('películas de acción', 'CONSULTAR_GENERO');
  classifier.addDocument('hay comedias', 'CONSULTAR_GENERO');
  classifier.addDocument('terror disponible', 'CONSULTAR_GENERO');
  classifier.addDocument('drama en cartelera', 'CONSULTAR_GENERO');
  classifier.addDocument('ciencia ficción', 'CONSULTAR_GENERO');

  // Intención: SALUDO
  classifier.addDocument('hola', 'SALUDO');
  classifier.addDocument('buenos días', 'SALUDO');
  classifier.addDocument('buenas tardes', 'SALUDO');
  classifier.addDocument('buenas noches', 'SALUDO');
  classifier.addDocument('hey', 'SALUDO');

  // Intención: DESPEDIDA
  classifier.addDocument('adiós', 'DESPEDIDA');
  classifier.addDocument('hasta luego', 'DESPEDIDA');
  classifier.addDocument('gracias', 'DESPEDIDA');
  classifier.addDocument('chao', 'DESPEDIDA');

  classifier.train();
};

// Entrenar al iniciar
entrenarClasificador();

/**
 * Extraer entidades del texto (películas, géneros, fechas)
 * @param {string} texto - Texto de entrada
 * @returns {Object} Entidades extraídas
 */
const extraerEntidades = (texto) => {
  const doc = compromise(texto);
  
  // Extraer géneros mencionados
  const generos = {
    'acción': ['accion', 'acción', 'action'],
    'comedia': ['comedia', 'comedy', 'cómica', 'cómicas'],
    'drama': ['drama', 'dramática', 'dramáticas'],
    'terror': ['terror', 'horror', 'miedo'],
    'ciencia ficción': ['ciencia ficción', 'sci-fi', 'scifi', 'ficción'],
    'romance': ['romance', 'romántica', 'románticas', 'amor'],
    'aventura': ['aventura', 'aventuras'],
    'animación': ['animación', 'animada', 'animadas', 'dibujos']
  };

  let generoEncontrado = null;
  const textoLower = texto.toLowerCase();

  for (const [genero, variantes] of Object.entries(generos)) {
    if (variantes.some(v => textoLower.includes(v))) {
      generoEncontrado = genero;
      break;
    }
  }

  // Extraer fechas
  const fechas = doc.dates().out('array');
  
  // Extraer números (para horarios, precios)
  const numeros = doc.numbers().out('array');

  return {
    genero: generoEncontrado,
    fechas,
    numeros
  };
};

/**
 * Procesar mensaje del usuario y generar respuesta
 * @param {string} mensaje - Mensaje del usuario
 * @param {number|null} id_cliente - ID del cliente (opcional)
 * @returns {Promise<Object>} Respuesta del chatbot
 */
const procesarMensaje = async (mensaje, id_cliente = null) => {
  const mensajeLimpio = mensaje.toLowerCase().trim();
  
  // Clasificar intención
  const intencion = classifier.classify(mensajeLimpio);
  
  // Extraer entidades
  const entidades = extraerEntidades(mensajeLimpio);

  let respuesta = {};

  switch (intencion) {
    case 'SALUDO':
      respuesta = {
        tipo: 'SALUDO',
        mensaje: '¡Hola! 👋 Soy tu asistente virtual del cine. ¿En qué puedo ayudarte hoy?',
        opciones: [
          'Ver cartelera',
          'Consultar horarios',
          'Pedir recomendación',
          'Ver precios'
        ]
      };
      break;

    case 'DESPEDIDA':
      respuesta = {
        tipo: 'DESPEDIDA',
        mensaje: '¡Gracias por tu visita! 🎬 Que disfrutes tu película. ¡Hasta pronto!',
      };
      break;

    case 'CONSULTAR_CARTELERA':
      const peliculasCartelera = await Pelicula.findAll({
        where: { estado: 'EN_CARTELERA' },
        order: [['fecha_estreno', 'DESC']],
        limit: 10
      });

      respuesta = {
        tipo: 'CARTELERA',
        mensaje: `Tenemos ${peliculasCartelera.length} películas en cartelera:`,
        peliculas: peliculasCartelera.map(p => ({
          id: p.id,
          titulo: p.titulo,
          genero: p.genero,
          duracion: p.duracion,
          calificacion: p.calificacion
        })),
        sugerencia: 'Puedes preguntarme por horarios de alguna película específica'
      };
      break;

    case 'CONSULTAR_HORARIOS':
      const hoy = new Date();
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 3);

      const funcionesProximas = await Funcion.findAll({
        where: {
          fecha: {
            [Op.between]: [hoy, manana]
          }
        },
        include: [
          {
            model: Pelicula,
            as: 'pelicula',
            where: { estado: 'EN_CARTELERA' }
          },
          {
            model: Sala,
            as: 'sala'
          }
        ],
        order: [['fecha', 'ASC'], ['hora', 'ASC']],
        limit: 15
      });

      // Agrupar por película
      const funcionesPorPelicula = funcionesProximas.reduce((acc, funcion) => {
        const titulo = funcion.pelicula.titulo;
        if (!acc[titulo]) {
          acc[titulo] = [];
        }
        acc[titulo].push({
          fecha: funcion.fecha,
          hora: funcion.hora,
          sala: funcion.sala.nombre,
          tipo_sala: funcion.sala.tipo,
          precio: funcion.precio
        });
        return acc;
      }, {});

      respuesta = {
        tipo: 'HORARIOS',
        mensaje: 'Horarios disponibles para los próximos 3 días:',
        funciones: funcionesPorPelicula,
        sugerencia: 'Menciona una película para ver sus horarios específicos'
      };
      break;

    case 'PEDIR_RECOMENDACION':
      if (id_cliente) {
        // Recomendación personalizada
        const recomendacion = await recomendacionService.recomendarPorHistorial(id_cliente, 3);
        respuesta = {
          tipo: 'RECOMENDACION_PERSONALIZADA',
          mensaje: '¡Te tengo recomendaciones basadas en tus gustos! 🎯',
          ...recomendacion
        };
      } else {
        // Recomendación general (populares)
        const recomendacion = await recomendacionService.recomendarPopulares(3);
        respuesta = {
          tipo: 'RECOMENDACION_GENERAL',
          mensaje: 'Estas son las películas más populares del momento 🌟',
          ...recomendacion
        };
      }
      break;

    case 'CONSULTAR_GENERO':
      if (entidades.genero) {
        const recomendacion = await recomendacionService.recomendarPorGenero(
          entidades.genero,
          5,
          id_cliente
        );
        respuesta = {
          tipo: 'BUSQUEDA_GENERO',
          ...recomendacion
        };
      } else {
        respuesta = {
          tipo: 'ACLARACION',
          mensaje: 'No pude identificar el género. ¿Qué género te interesa?',
          generos_disponibles: [
            'Acción', 'Comedia', 'Drama', 'Terror',
            'Ciencia Ficción', 'Romance', 'Aventura', 'Animación'
          ]
        };
      }
      break;

    case 'CONSULTAR_PRECIOS':
      const funcionesConPrecios = await Funcion.findAll({
        where: {
          fecha: {
            [Op.gte]: new Date()
          }
        },
        include: [
          {
            model: Sala,
            as: 'sala'
          }
        ],
        attributes: ['precio'],
        group: ['precio', 'sala.tipo'],
        raw: true
      });

      // Calcular rangos de precios
      const precios = await Funcion.findAll({
        where: {
          fecha: { [Op.gte]: new Date() }
        },
        attributes: [
          [Funcion.sequelize.fn('MIN', Funcion.sequelize.col('precio')), 'minimo'],
          [Funcion.sequelize.fn('MAX', Funcion.sequelize.col('precio')), 'maximo'],
          [Funcion.sequelize.fn('AVG', Funcion.sequelize.col('precio')), 'promedio']
        ],
        raw: true
      });

      respuesta = {
        tipo: 'PRECIOS',
        mensaje: 'Información de precios 💰',
        rango: {
          minimo: parseFloat(precios[0].minimo),
          maximo: parseFloat(precios[0].maximo),
          promedio: parseFloat(precios[0].promedio).toFixed(2)
        },
        nota: 'Los precios varían según la sala (2D, 3D, IMAX, VIP) y la función',
        descuento_vip: '10% de descuento para clientes VIP'
      };
      break;

    default:
      // Respuesta por defecto si no se identifica la intención
      respuesta = {
        tipo: 'NO_ENTENDIDO',
        mensaje: 'No estoy seguro de entender tu pregunta. 🤔',
        sugerencias: [
          '¿Qué películas hay en cartelera?',
          '¿Qué horarios están disponibles?',
          '¿Me recomiendas una película?',
          '¿Cuánto cuestan las entradas?'
        ]
      };
  }

  return {
    intencion,
    entidades,
    respuesta,
    timestamp: new Date()
  };
};

/**
 * Buscar película por título (fuzzy search)
 * @param {string} titulo - Título aproximado
 * @returns {Promise<Array>} Películas encontradas
 */
const buscarPeliculaPorTitulo = async (titulo) => {
  const peliculas = await Pelicula.findAll({
    where: {
      titulo: {
        [Op.like]: `%${titulo}%`
      },
      estado: 'EN_CARTELERA'
    }
  });

  if (peliculas.length === 0) {
    // Búsqueda fuzzy más permisiva
    const todasPeliculas = await Pelicula.findAll({
      where: { estado: 'EN_CARTELERA' }
    });

    // Usar distancia de Levenshtein para encontrar coincidencias aproximadas
    const coincidencias = todasPeliculas
      .map(p => ({
        pelicula: p,
        distancia: natural.LevenshteinDistance(titulo.toLowerCase(), p.titulo.toLowerCase())
      }))
      .filter(item => item.distancia <= 5)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 5)
      .map(item => item.pelicula);

    return coincidencias;
  }

  return peliculas;
};

/**
 * Obtener contexto de conversación (para futuras mejoras)
 * @param {number} id_cliente - ID del cliente
 * @returns {Promise<Object>} Contexto del cliente
 */
const obtenerContextoCliente = async (id_cliente) => {
  const generosFavoritos = await recomendacionService.obtenerGenerosFavoritos(id_cliente);
  
  return {
    id_cliente,
    generos_favoritos: generosFavoritos.slice(0, 3),
    tiene_historial: generosFavoritos.length > 0
  };
};

module.exports = {
  procesarMensaje,
  buscarPeliculaPorTitulo,
  obtenerContextoCliente,
  extraerEntidades
};
