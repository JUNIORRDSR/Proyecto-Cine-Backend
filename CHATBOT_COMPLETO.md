# 🤖 Chatbot con IA - Sistema Completo

## 📋 Funcionalidades Implementadas

### ✅ A) Recomendar películas según gustos previos

El chatbot analiza el historial de compras del cliente y recomienda películas basándose en:

- **Géneros favoritos**: Analiza qué géneros ha visto más frecuentemente
- **Directores favoritos**: Identifica directores preferidos
- **Horarios preferidos**: Detecta si prefiere mañana, tarde o noche
- **Días de asistencia**: Analiza qué días de la semana suele asistir
- **Adaptación a preferencias actuales**: Filtra recomendaciones por día y horario específicos

**Ejemplo de uso:**
```
Cliente: "¿Qué me recomiendas para este viernes en la noche?"
Chatbot: "Te puede gustar Misión Imposible 8, ya que viste películas de acción los últimos viernes. Está disponible a las 7:00 y 9:30 PM."
```

### ✅ B) Ayudar en la compra de boletos

El chatbot guía paso a paso el proceso de compra:

1. **Selección de película**: Identifica la película mencionada
2. **Cantidad de boletos**: Extrae la cantidad solicitada
3. **Filtrado por fecha/horario**: Filtra funciones según preferencias
4. **Mostrar opciones**: Presenta funciones disponibles con sala, horario y precio
5. **Siguiente paso**: Indica cómo continuar

**Ejemplo de uso:**
```
Cliente: "Quiero dos entradas para Intensamente 2 a las 6"
Chatbot: "Perfecto. Hay sillas disponibles en la Fila D, ¿prefieres centro o costado?"
```

### ✅ C) Asistir en selección de sillas y horarios

El chatbot muestra disponibilidad en tiempo real:

- **Disponibilidad por bloque y fila**: Organiza sillas por Bloque 1 y Bloque 2
- **Mensaje descriptivo**: Genera mensajes amigables con rangos de sillas disponibles
- **Validación antes de reservar**: Verifica disponibilidad antes de confirmar
- **Diagrama básico**: Organiza información por bloques y filas

**Ejemplo de uso:**
```
Cliente: "¿Qué sillas hay disponibles para la función 5?"
Chatbot: "En la Sala 2 quedan disponibles:
• Bloque B1, Fila F: Sillas 2-9 (8 disponibles)
• Bloque B1, Fila G: Sillas 1-10 (10 disponibles)
• Bloque B2, Fila D: Sillas 3-8 (6 disponibles)"
```

---

## 🔌 Endpoints Disponibles

### 1. Procesar Mensaje del Chatbot
**POST** `/api/chatbot/mensaje`

Procesa mensajes en lenguaje natural y devuelve respuestas inteligentes.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "mensaje": "¿Qué me recomiendas para este viernes en la noche?",
  "id_cliente": 1
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Mensaje procesado exitosamente",
  "data": {
    "intencion": "RECOMENDACION_CON_FECHA",
    "entidades": {
      "dia": { "nombre": "viernes", "valor": 5 },
      "horario": { "hora": 20, "minutos": 0 }
    },
    "respuesta": {
      "tipo": "RECOMENDACION_CON_FECHA",
      "mensaje": "¡Te tengo recomendaciones para el viernes! 🎬",
      "preferencias_analizadas": {
        "generos_favoritos": ["Acción", "Aventura"],
        "dias_preferidos": [{ "dia": 5, "count": 8 }],
        "horarios_preferidos": [["noche", 12]]
      },
      "recomendaciones": [...]
    }
  }
}
```

### 2. Obtener Disponibilidad de Sillas
**GET** `/api/chatbot/sillas/:id_funcion`

Obtiene disponibilidad de sillas organizada por bloques y filas.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "mensaje": "En la Sala 2 quedan disponibles:\n\n• Bloque B1, Fila F: Sillas 2-9 (8 disponibles)\n...",
    "funcion": {
      "id_funcion": 5,
      "fecha": "2025-11-22",
      "hora": "19:00:00"
    },
    "sala": {
      "nombre": "Sala 2",
      "capacidad": 260
    },
    "resumen": {
      "disponibles": 180,
      "ocupadas": 80,
      "total": 260
    },
    "sillas_por_bloque": {
      "B1": {
        "F": [...],
        "G": [...]
      },
      "B2": {...}
    },
    "filas_disponibles": [...]
  }
}
```

### 3. Obtener Funciones para una Película
**GET** `/api/chatbot/funciones/:id_pelicula?dia=viernes&horario={"hora":18,"minutos":0}`

Obtiene funciones disponibles para una película con filtros opcionales.

**Query Parameters:**
- `dia`: Día de la semana (opcional)
- `horario`: JSON con `{hora, minutos}` (opcional)

### 4. Recomendaciones Personalizadas
**GET** `/api/chatbot/recomendaciones-personalizadas/:id_cliente?dia=viernes&horario={"hora":20,"minutos":0}`

Obtiene recomendaciones basadas en historial con filtros de día y horario.

---

## 🎯 Intenciones Reconocidas

El clasificador NLP reconoce las siguientes intenciones:

1. **SALUDO**: "hola", "buenos días", "buenas tardes"
2. **DESPEDIDA**: "adiós", "gracias", "hasta luego"
3. **CONSULTAR_CARTELERA**: "qué películas hay", "mostrar cartelera"
4. **CONSULTAR_HORARIOS**: "qué horarios hay", "a qué hora dan"
5. **PEDIR_RECOMENDACION**: "qué me recomiendas", "sugiéreme algo"
6. **RECOMENDACION_CON_FECHA**: "qué me recomiendas para este viernes"
7. **COMPRAR_BOLETOS**: "quiero comprar boletos", "quiero entradas"
8. **SELECCIONAR_SILLAS**: "qué sillas hay disponibles", "ver asientos"
9. **CONSULTAR_GENERO**: "películas de acción", "hay comedias"
10. **CONSULTAR_PRECIOS**: "cuánto cuesta", "qué precio tiene"

---

## 🔍 Entidades Extraídas

El sistema extrae automáticamente:

- **Géneros**: Acción, Comedia, Drama, Terror, etc.
- **Días de la semana**: lunes, martes, miércoles, etc.
- **Horarios**: "6pm", "18:00", "6:00", etc.
- **Números**: Cantidad de boletos, precios, etc.
- **Títulos de películas**: Búsqueda aproximada por palabras clave
- **Fechas**: Fechas mencionadas en el texto

---

## 📝 Ejemplos de Interacción

### Ejemplo 1: Recomendación con Fecha
```
Usuario: "¿Qué me recomiendas para este viernes en la noche?"

Chatbot: {
  "tipo": "RECOMENDACION_CON_FECHA",
  "mensaje": "¡Te tengo recomendaciones para el viernes! 🎬",
  "preferencias_analizadas": {
    "generos_favoritos": ["Acción", "Aventura"],
    "dias_preferidos": [{"dia": 5, "count": 8}],
    "horarios_preferidos": [["noche", 12]]
  },
  "recomendaciones": [
    {
      "titulo": "Misión Imposible 8",
      "genero": "Acción",
      "funciones_disponibles": 2,
      "proximas_funciones": [
        {
          "fecha": "2025-11-22",
          "hora": "19:00:00",
          "sala": {"nombre": "Sala 1", "tipo": "2D"}
        }
      ],
      "razon_recomendacion": ["género favorito"]
    }
  ]
}
```

### Ejemplo 2: Compra de Boletos
```
Usuario: "Quiero dos entradas para Intensamente 2 a las 6"

Chatbot: {
  "tipo": "INICIAR_COMPRA",
  "mensaje": "Perfecto, veo que te interesa 'Intensamente 2'. Necesitas 2 entradas.",
  "pelicula": {
    "id": 3,
    "titulo": "Intensamente 2"
  },
  "cantidad_boletos": 2,
  "funciones_disponibles": [
    {
      "id_funcion": 12,
      "fecha": "2025-11-20",
      "hora": "18:00:00",
      "precio": 15000,
      "sala": {"nombre": "Sala 2", "tipo": "2D"}
    }
  ],
  "siguiente_paso": "Selecciona un horario de la lista",
  "acciones": [...]
}
```

### Ejemplo 3: Disponibilidad de Sillas
```
Usuario: "¿Qué sillas hay disponibles para la función 12?"

Chatbot: {
  "tipo": "DISPONIBILIDAD_SILLAS",
  "mensaje": "En la Sala 2 quedan disponibles:\n\n• Bloque B1, Fila F: Sillas 2-9 (8 disponibles)\n• Bloque B1, Fila G: Sillas 1-10 (10 disponibles)\n...",
  "resumen": {
    "disponibles": 180,
    "ocupadas": 80,
    "total": 260
  },
  "sillas_por_bloque": {
    "B1": {
      "F": [
        {"numero": 2, "disponible": true},
        {"numero": 3, "disponible": true},
        ...
      ]
    }
  },
  "siguiente_paso": "Indica qué sillas deseas (ejemplo: 'Quiero las sillas D5, D6, D7')"
}
```

---

## 🚀 Cómo Usar

### 1. Iniciar Conversación
```bash
POST /api/chatbot/mensaje
{
  "mensaje": "Hola",
  "id_cliente": 1
}
```

### 2. Pedir Recomendación
```bash
POST /api/chatbot/mensaje
{
  "mensaje": "¿Qué me recomiendas para este viernes en la noche?",
  "id_cliente": 1
}
```

### 3. Comprar Boletos
```bash
POST /api/chatbot/mensaje
{
  "mensaje": "Quiero dos entradas para Intensamente 2 a las 6",
  "id_cliente": 1
}
```

### 4. Ver Sillas Disponibles
```bash
GET /api/chatbot/sillas/12
```

---

## 🧠 Algoritmo de Recomendación

El sistema de recomendación funciona en 3 niveles:

1. **Análisis de Historial**: Analiza las últimas 50 compras del cliente
2. **Extracción de Preferencias**: Identifica géneros, directores, días y horarios preferidos
3. **Filtrado Inteligente**: 
   - Excluye películas ya vistas
   - Prioriza géneros favoritos
   - Considera directores favoritos
   - Filtra por día y horario si se especifican
   - Solo muestra películas con funciones disponibles

---

## 📊 Estructura de Datos

### Preferencias Analizadas
```javascript
{
  generos_favoritos: ["Acción", "Aventura"],
  dias_preferidos: [
    { dia: 5, count: 8 },  // Viernes: 8 veces
    { dia: 6, count: 5 }   // Sábado: 5 veces
  ],
  horarios_preferidos: [
    ["noche", 12],  // Noche: 12 veces
    ["tarde", 5]    // Tarde: 5 veces
  ]
}
```

### Disponibilidad de Sillas
```javascript
{
  sillas_por_bloque: {
    B1: {
      F: [
        { numero: 1, disponible: false },
        { numero: 2, disponible: true },
        ...
      ]
    },
    B2: {...}
  },
  filas_disponibles: [
    {
      bloque: "B1",
      fila: "F",
      sillas_disponibles: [2, 3, 4, 5, 6, 7, 8, 9],
      cantidad: 8
    }
  ]
}
```

---

## 🔧 Configuración

El chatbot utiliza:
- **Natural Language Processing**: Biblioteca `natural` para clasificación
- **Compromise**: Para extracción de entidades en español
- **Bayes Classifier**: Para reconocimiento de intenciones
- **Fuzzy Search**: Para búsqueda aproximada de títulos

---

## 📚 Próximas Mejoras

- [ ] Integración con sistema de carrito automático
- [ ] Recordar contexto de conversación
- [ ] Soporte para múltiples idiomas
- [ ] Integración con APIs de IA (GPT, etc.)
- [ ] Análisis de sentimientos
- [ ] Recomendaciones colaborativas (basadas en usuarios similares)

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Completo y funcional

