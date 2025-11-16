const natural = require('natural');
const compromise = require('compromise');
const { Pelicula, Funcion, Sala, Silla, Venta, DetalleVenta, Cliente } = require('../models');
const { Op } = require('sequelize');
const recomendacionService = require('./recomendacionService');
const reservaService = require('./reservaService');

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

  // Intención: COMPRAR_BOLETOS
  classifier.addDocument('quiero comprar boletos', 'COMPRAR_BOLETOS');
  classifier.addDocument('quiero entradas', 'COMPRAR_BOLETOS');
  classifier.addDocument('comprar boletos para', 'COMPRAR_BOLETOS');
  classifier.addDocument('quiero dos entradas', 'COMPRAR_BOLETOS');
  classifier.addDocument('necesito boletos', 'COMPRAR_BOLETOS');
  classifier.addDocument('ayúdame a comprar', 'COMPRAR_BOLETOS');

  // Intención: SELECCIONAR_SILLAS
  classifier.addDocument('qué sillas hay disponibles', 'SELECCIONAR_SILLAS');
  classifier.addDocument('mostrar sillas', 'SELECCIONAR_SILLAS');
  classifier.addDocument('ver asientos', 'SELECCIONAR_SILLAS');
  classifier.addDocument('disponibilidad de sillas', 'SELECCIONAR_SILLAS');
  classifier.addDocument('qué asientos están libres', 'SELECCIONAR_SILLAS');

  // Intención: RECOMENDACION_CON_FECHA
  classifier.addDocument('qué me recomiendas para este viernes', 'RECOMENDACION_CON_FECHA');
  classifier.addDocument('recomiéndame algo para el sábado', 'RECOMENDACION_CON_FECHA');
  classifier.addDocument('qué hay para mañana', 'RECOMENDACION_CON_FECHA');
  classifier.addDocument('películas para el fin de semana', 'RECOMENDACION_CON_FECHA');
  classifier.addDocument('qué ver este viernes en la noche', 'RECOMENDACION_CON_FECHA');

  classifier.train();
};

// Entrenar al iniciar
entrenarClasificador();

/**
 * Extraer entidades del texto (películas, géneros, fechas)
 * @param {string} texto - Texto de entrada
 * @returns {Promise<Object>} Entidades extraídas
 */
const extraerEntidades = async (texto) => {
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
  
  // Extraer números (para horarios, precios, cantidad de boletos)
  const numeros = doc.numbers().out('array');

  // Extraer días de la semana
  const diasSemana = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
  };
  
  let diaEncontrado = null;
  for (const [dia, valor] of Object.entries(diasSemana)) {
    if (textoLower.includes(dia)) {
      diaEncontrado = { nombre: dia, valor };
      break;
    }
  }

  // Extraer horarios (formato: "6", "6pm", "18:00", "6:00")
  let horarioEncontrado = null;
  const horarioRegex = /(\d{1,2})(?::(\d{2}))?\s*(pm|am|PM|AM)?/;
  const matchHorario = texto.match(horarioRegex);
  if (matchHorario) {
    let hora = parseInt(matchHorario[1]);
    const minutos = matchHorario[2] ? parseInt(matchHorario[2]) : 0;
    const periodo = matchHorario[3] ? matchHorario[3].toLowerCase() : null;
    
    if (periodo === 'pm' && hora < 12) hora += 12;
    if (periodo === 'am' && hora === 12) hora = 0;
    
    horarioEncontrado = { hora, minutos };
  }

  // Extraer títulos de películas (búsqueda aproximada)
  let tituloPelicula = null;
  const peliculasConocidas = await Pelicula.findAll({
    where: { estado: 'EN_CARTELERA' },
    attributes: ['id_pelicula', 'titulo']
  });
  
  for (const pelicula of peliculasConocidas) {
    const palabrasTitulo = pelicula.titulo.toLowerCase().split(' ');
    const palabrasTexto = textoLower.split(' ');
    const coincidencias = palabrasTitulo.filter(palabra => 
      palabrasTexto.some(p => p.includes(palabra) || palabra.includes(p))
    );
    if (coincidencias.length >= 2 || palabrasTitulo.some(p => textoLower.includes(p))) {
      tituloPelicula = { id: pelicula.id_pelicula, titulo: pelicula.titulo };
      break;
    }
  }

  return {
    genero: generoEncontrado,
    fechas,
    numeros,
    dia: diaEncontrado,
    horario: horarioEncontrado,
    pelicula: tituloPelicula
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
  const entidades = await extraerEntidades(mensajeLimpio);

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
        // Recomendación personalizada mejorada
        const recomendacion = await recomendarConPreferencias(id_cliente, null, null);
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

    case 'RECOMENDACION_CON_FECHA':
      if (id_cliente) {
        const dia = entidades.dia;
        const horario = entidades.horario;
        const recomendacion = await recomendarConPreferencias(id_cliente, dia, horario);
        respuesta = {
          tipo: 'RECOMENDACION_CON_FECHA',
          mensaje: dia 
            ? `¡Te tengo recomendaciones para el ${dia.nombre}! 🎬`
            : '¡Te tengo recomendaciones personalizadas! 🎯',
          ...recomendacion
        };
      } else {
        // Si no hay cliente, mostrar películas disponibles para esa fecha
        const dia = entidades.dia;
        const fechaObjetivo = calcularFechaDesdeDia(dia);
        const peliculasDisponibles = await obtenerPeliculasParaFecha(fechaObjetivo);
        respuesta = {
          tipo: 'RECOMENDACION_CON_FECHA',
          mensaje: `Películas disponibles ${dia ? `para el ${dia.nombre}` : 'próximamente'}:`,
          peliculas: peliculasDisponibles
        };
      }
      break;

    case 'COMPRAR_BOLETOS':
      const cantidadBoletos = entidades.numeros && entidades.numeros.length > 0 
        ? entidades.numeros[0] 
        : null;
      const peliculaCompra = entidades.pelicula;
      
      if (peliculaCompra) {
        // Iniciar flujo de compra guiada
        const funcionesDisponibles = await obtenerFuncionesParaPelicula(
          peliculaCompra.id || peliculaCompra.id_pelicula,
          entidades.dia,
          entidades.horario
        );
        
        respuesta = {
          tipo: 'INICIAR_COMPRA',
          mensaje: `Perfecto, veo que te interesa "${peliculaCompra.titulo}". ${cantidadBoletos ? `Necesitas ${cantidadBoletos} ${cantidadBoletos === 1 ? 'entrada' : 'entradas'}.` : ''}`,
          pelicula: peliculaCompra,
          cantidad_boletos: cantidadBoletos,
          funciones_disponibles: funcionesDisponibles,
          siguiente_paso: 'Selecciona un horario de la lista',
          acciones: funcionesDisponibles.map(f => ({
            texto: `${f.fecha} a las ${f.hora} - Sala ${f.sala.nombre} (${f.sala.tipo})`,
            accion: 'seleccionar_funcion',
            id_funcion: f.id_funcion
          }))
        };
      } else {
        respuesta = {
          tipo: 'ACLARACION_COMPRA',
          mensaje: 'Para ayudarte a comprar boletos, necesito saber:',
          preguntas: [
            '¿Qué película te interesa?',
            '¿Cuántas entradas necesitas?',
            '¿Para qué día y hora?'
          ],
          sugerencia: 'Ejemplo: "Quiero 2 entradas para Intensamente 2 a las 6"'
        };
      }
      break;

    case 'SELECCIONAR_SILLAS':
      // Extraer ID de función del mensaje si está presente
      const idFuncionMatch = mensajeLimpio.match(/funci[oó]n\s*(\d+)/);
      const idFuncion = idFuncionMatch ? parseInt(idFuncionMatch[1]) : null;
      
      if (idFuncion) {
        const disponibilidad = await mostrarDisponibilidadSillas(idFuncion);
        respuesta = {
          tipo: 'DISPONIBILIDAD_SILLAS',
          ...disponibilidad
        };
      } else {
        respuesta = {
          tipo: 'ACLARACION_SILLAS',
          mensaje: 'Para mostrarte las sillas disponibles, necesito saber para qué función.',
          sugerencia: 'Primero selecciona una película y horario, luego te mostraré las sillas disponibles.'
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

/**
 * Recomendar películas con análisis de preferencias (horarios, días, género, director)
 * @param {number} id_cliente - ID del cliente
 * @param {Object|null} dia - Día de la semana preferido
 * @param {Object|null} horario - Horario preferido
 * @returns {Promise<Object>} Recomendaciones personalizadas
 */
const recomendarConPreferencias = async (id_cliente, dia = null, horario = null) => {
  // Obtener historial de compras del cliente
  const ventas = await Venta.findAll({
    where: {
      id_cliente,
      estado: 'PAGADA'
    },
    include: [
      {
        model: DetalleVenta,
        as: 'detalles',
        include: [
          {
            model: Funcion,
            as: 'funcion',
            include: [
              {
                model: Pelicula,
                as: 'pelicula'
              }
            ]
          }
        ]
      }
    ],
    order: [['fecha', 'DESC']],
    limit: 50
  });

  // Analizar preferencias
  const preferencias = {
    generos: new Map(),
    directores: new Map(),
    diasSemana: new Map(),
    horarios: new Map(),
    tiposSala: new Map()
  };

  ventas.forEach(venta => {
    venta.detalles.forEach(detalle => {
      if (detalle.funcion && detalle.funcion.pelicula) {
        const pelicula = detalle.funcion.pelicula;
        const funcion = detalle.funcion;
        
        // Contar géneros
        const genero = pelicula.genero;
        preferencias.generos.set(genero, (preferencias.generos.get(genero) || 0) + 1);
        
        // Contar directores
        if (pelicula.director) {
          preferencias.directores.set(pelicula.director, (preferencias.directores.get(pelicula.director) || 0) + 1);
        }
        
        // Analizar día de la semana
        if (funcion.fecha) {
          const fechaFuncion = new Date(funcion.fecha);
          const diaSemana = fechaFuncion.getDay();
          preferencias.diasSemana.set(diaSemana, (preferencias.diasSemana.get(diaSemana) || 0) + 1);
        }
        
        // Analizar horario
        if (funcion.hora) {
          const hora = new Date(`2000-01-01 ${funcion.hora}`).getHours();
          const bloqueHorario = hora < 14 ? 'mañana' : hora < 18 ? 'tarde' : 'noche';
          preferencias.horarios.set(bloqueHorario, (preferencias.horarios.get(bloqueHorario) || 0) + 1);
        }
      }
    });
  });

  // Obtener películas ya vistas
  const idsVistas = new Set();
  ventas.forEach(venta => {
    venta.detalles.forEach(detalle => {
      if (detalle.funcion) {
        idsVistas.add(detalle.funcion.id_pelicula);
      }
    });
  });

  // Construir query de recomendación
  const generosTop = Array.from(preferencias.generos.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genero]) => genero);

  const whereCondition = {
    estado: 'EN_CARTELERA',
    id_pelicula: {
      [Op.notIn]: Array.from(idsVistas)
    }
  };

  if (generosTop.length > 0) {
    whereCondition.genero = { [Op.in]: generosTop };
  }

  // Buscar películas recomendadas
  let recomendaciones = await Pelicula.findAll({
    where: whereCondition,
    limit: 5,
    order: [['fecha_estreno', 'DESC']]
  });

  // Si no hay suficientes, agregar por director
  if (recomendaciones.length < 3 && preferencias.directores.size > 0) {
    const directoresTop = Array.from(preferencias.directores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([director]) => director);

    const adicionales = await Pelicula.findAll({
      where: {
        director: { [Op.in]: directoresTop },
        estado: 'EN_CARTELERA',
        id_pelicula: {
          [Op.notIn]: [...Array.from(idsVistas), ...recomendaciones.map(p => p.id_pelicula)]
        }
      },
      limit: 3 - recomendaciones.length
    });

    recomendaciones = [...recomendaciones, ...adicionales];
  }

  // Filtrar por día y horario si se especificaron
  const fechaObjetivo = calcularFechaDesdeDia(dia);
  const recomendacionesConFunciones = await Promise.all(
    recomendaciones.map(async (pelicula) => {
      let funcionesQuery = {
        id_pelicula: pelicula.id_pelicula,
        fecha: { [Op.gte]: fechaObjetivo || new Date() }
      };

      if (horario) {
        const horaMin = horario.hora * 100 + horario.minutos;
        const horaMax = horaMin + 200; // 2 horas de margen
        funcionesQuery.hora = {
          [Op.between]: [
            `${Math.floor(horaMin / 100).toString().padStart(2, '0')}:${(horaMin % 100).toString().padStart(2, '0')}:00`,
            `${Math.floor(horaMax / 100).toString().padStart(2, '0')}:${(horaMax % 100).toString().padStart(2, '0')}:00`
          ]
        };
      }

      const funciones = await Funcion.findAll({
        where: funcionesQuery,
        include: [
          {
            model: Sala,
            as: 'sala',
            attributes: ['nombre', 'tipo']
          }
        ],
        limit: 3,
        order: [['fecha', 'ASC'], ['hora', 'ASC']]
      });

      return {
        ...pelicula.toJSON(),
        funciones_disponibles: funciones.length,
        proximas_funciones: funciones,
        razon_recomendacion: [
          generosTop.includes(pelicula.genero) ? 'género favorito' : null,
          preferencias.directores.has(pelicula.director) ? 'director favorito' : null
        ].filter(Boolean)
      };
    })
  );

  return {
    mensaje: 'Recomendaciones personalizadas basadas en tus preferencias',
    preferencias_analizadas: {
      generos_favoritos: generosTop,
      dias_preferidos: Array.from(preferencias.diasSemana.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([dia, count]) => ({ dia, count })),
      horarios_preferidos: Array.from(preferencias.horarios.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
    },
    recomendaciones: recomendacionesConFunciones.filter(r => r.funciones_disponibles > 0)
  };
};

/**
 * Calcular fecha desde día de la semana
 * @param {Object|null} dia - Día de la semana
 * @returns {Date} Fecha objetivo
 */
const calcularFechaDesdeDia = (dia) => {
  if (!dia) return new Date();
  
  const hoy = new Date();
  const diaActual = hoy.getDay();
  const diasHasta = (dia.valor - diaActual + 7) % 7;
  const fechaObjetivo = new Date(hoy);
  fechaObjetivo.setDate(hoy.getDate() + (diasHasta === 0 ? 7 : diasHasta));
  fechaObjetivo.setHours(0, 0, 0, 0);
  
  return fechaObjetivo;
};

/**
 * Obtener películas disponibles para una fecha específica
 * @param {Date} fecha - Fecha objetivo
 * @returns {Promise<Array>} Películas con funciones disponibles
 */
const obtenerPeliculasParaFecha = async (fecha) => {
  const funciones = await Funcion.findAll({
    where: {
      fecha: {
        [Op.between]: [
          new Date(fecha.setHours(0, 0, 0, 0)),
          new Date(fecha.setHours(23, 59, 59, 999))
        ]
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
    order: [['hora', 'ASC']]
  });

  // Agrupar por película
  const peliculasMap = new Map();
  funciones.forEach(funcion => {
    const peliculaId = funcion.pelicula.id_pelicula;
    if (!peliculasMap.has(peliculaId)) {
      peliculasMap.set(peliculaId, {
        ...funcion.pelicula.toJSON(),
        funciones: []
      });
    }
    peliculasMap.get(peliculaId).funciones.push({
      id_funcion: funcion.id_funcion,
      hora: funcion.hora,
      sala: funcion.sala.nombre,
      tipo_sala: funcion.sala.tipo,
      precio: funcion.precio
    });
  });

  return Array.from(peliculasMap.values());
};

/**
 * Obtener funciones disponibles para una película con filtros opcionales
 * @param {number} id_pelicula - ID de la película
 * @param {Object|null} dia - Día de la semana
 * @param {Object|null} horario - Horario preferido
 * @returns {Promise<Array>} Funciones disponibles
 */
const obtenerFuncionesParaPelicula = async (id_pelicula, dia = null, horario = null) => {
  const fechaObjetivo = calcularFechaDesdeDia(dia);
  
  let whereCondition = {
    id_pelicula,
    fecha: { [Op.gte]: fechaObjetivo || new Date() }
  };

  if (horario) {
    const horaMin = horario.hora * 100 + horario.minutos;
    const horaMax = horaMin + 200;
    whereCondition.hora = {
      [Op.between]: [
        `${Math.floor(horaMin / 100).toString().padStart(2, '0')}:${(horaMin % 100).toString().padStart(2, '0')}:00`,
        `${Math.floor(horaMax / 100).toString().padStart(2, '0')}:${(horaMax % 100).toString().padStart(2, '0')}:00`
      ]
    };
  }

  const funciones = await Funcion.findAll({
    where: whereCondition,
    include: [
      {
        model: Pelicula,
        as: 'pelicula',
        attributes: ['titulo', 'duracion']
      },
      {
        model: Sala,
        as: 'sala',
        attributes: ['nombre', 'tipo', 'capacidad']
      }
    ],
    order: [['fecha', 'ASC'], ['hora', 'ASC']],
    limit: 10
  });

  return funciones.map(f => ({
    id_funcion: f.id_funcion,
    fecha: f.fecha,
    hora: f.hora,
    precio: f.precio,
    pelicula: f.pelicula.titulo,
    sala: f.sala
  }));
};

/**
 * Mostrar disponibilidad de sillas para una función
 * @param {number} id_funcion - ID de la función
 * @returns {Promise<Object>} Disponibilidad de sillas organizada
 */
const mostrarDisponibilidadSillas = async (id_funcion) => {
  try {
    const disponibilidad = await reservaService.obtenerDisponibilidadFuncion(id_funcion);
    
    // Organizar sillas por bloque y fila
    const sillasPorBloque = {
      B1: {},
      B2: {}
    };

    disponibilidad.sillas.forEach(silla => {
      const bloque = silla.bloque;
      const fila = silla.fila;
      
      if (!sillasPorBloque[bloque][fila]) {
        sillasPorBloque[bloque][fila] = [];
      }
      
      sillasPorBloque[bloque][fila].push({
        numero: silla.numero,
        disponible: silla.disponible,
        tipo: silla.tipo || 'NORMAL'
      });
    });

    // Generar mensaje descriptivo
    const filasDisponibles = [];
    Object.keys(sillasPorBloque).forEach(bloque => {
      Object.keys(sillasPorBloque[bloque]).forEach(fila => {
        const sillasDisponibles = sillasPorBloque[bloque][fila].filter(s => s.disponible);
        if (sillasDisponibles.length > 0) {
          const numeros = sillasDisponibles.map(s => s.numero).sort((a, b) => a - b);
          filasDisponibles.push({
            bloque,
            fila,
            sillas_disponibles: numeros,
            cantidad: sillasDisponibles.length
          });
        }
      });
    });

    // Generar mensaje amigable
    let mensaje = `En la ${disponibilidad.sala.nombre} quedan disponibles:\n\n`;
    filasDisponibles.slice(0, 5).forEach(fila => {
      const rango = fila.sillas_disponibles.length > 3
        ? `${fila.sillas_disponibles[0]}-${fila.sillas_disponibles[fila.sillas_disponibles.length - 1]}`
        : fila.sillas_disponibles.join(', ');
      mensaje += `• Bloque ${fila.bloque}, Fila ${fila.fila}: Sillas ${rango} (${fila.cantidad} disponibles)\n`;
    });

    if (filasDisponibles.length > 5) {
      mensaje += `\nY ${filasDisponibles.length - 5} filas más con disponibilidad.`;
    }

    return {
      mensaje,
      funcion: disponibilidad.funcion,
      sala: disponibilidad.sala,
      resumen: {
        disponibles: disponibilidad.disponibles,
        ocupadas: disponibilidad.ocupadas,
        total: disponibilidad.total
      },
      sillas_por_bloque: sillasPorBloque,
      filas_disponibles: filasDisponibles,
      siguiente_paso: 'Indica qué sillas deseas (ejemplo: "Quiero las sillas D5, D6, D7")'
    };
  } catch (error) {
    throw new Error(`Error al obtener disponibilidad: ${error.message}`);
  }
};

module.exports = {
  procesarMensaje,
  buscarPeliculaPorTitulo,
  obtenerContextoCliente,
  extraerEntidades,
  recomendarConPreferencias,
  obtenerFuncionesParaPelicula,
  mostrarDisponibilidadSillas
};
