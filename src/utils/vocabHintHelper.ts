import { Question, VocabularyHint } from '../types';

// Curated comprehensive dictionary of Spanish syllabus vocabulary and keywords
const SPANISH_KEYWORD_DICT: Record<string, string> = {
  // Instructions and Language terms
  'saludas': 'you greet',
  'saludar': 'to greet',
  'saludo': 'greeting',
  'saludos': 'greetings',
  'despedida': 'farewell',
  'despedirse': 'to say goodbye',
  'bienvenida': 'welcome',
  'bienvenido': 'welcome',
  'bienvenidos': 'welcome (plural)',
  'conversacion': 'conversation',
  'conversación': 'conversation',
  'dialogo': 'dialogue',
  'diálogo': 'dialogue',
  'formal': 'formal',
  'informal': 'informal',
  'respeto': 'respect',
  'cortesia': 'courtesy',
  'cortesía': 'courtesy',
  'letra': 'letter (alphabet)',
  'letras': 'letters',
  'alfabeto': 'alphabet',
  'abecedario': 'alphabet',
  'sonido': 'sound',
  'vocal': 'vowel',
  'vocales': 'vowels',
  'consonante': 'consonant',
  'deletrear': 'to spell',
  'deletrea': 'spells',
  'escribe': 'writes',
  'escribir': 'to write',
  'palabra': 'word',
  'palabras': 'words',
  'frase': 'sentence',
  'oracion': 'sentence',
  'oración': 'sentence',
  'significa': 'means',
  'significado': 'meaning',
  'pregunta': 'question',
  'respuesta': 'answer',
  'completa': 'complete',
  'completar': 'to complete',
  'elige': 'choose',
  'elegir': 'to choose',
  'selecciona': 'select',
  'ordena': 'arrange',
  'ordenar': 'to arrange',
  'correcto': 'correct',
  'correcta': 'correct (fem.)',
  'adecuado': 'appropriate',
  'adecuada': 'appropriate (fem.)',
  'opuesto': 'opposite',
  'contrario': 'opposite',
  'diferencia': 'difference',
  'ejemplo': 'example',

  // Grammar elements
  'pronombre': 'pronoun',
  'pronombres': 'pronouns',
  'sujeto': 'subject',
  'verbo': 'verb',
  'sustantivo': 'noun',
  'adjetivo': 'adjective',
  'adjetivos': 'adjectives',
  'articulo': 'article',
  'artículo': 'article',
  'articulos': 'articles',
  'artículos': 'articles',
  'definido': 'definite',
  'indefinido': 'indefinite',
  'genero': 'gender',
  'género': 'gender',
  'masculino': 'masculine',
  'femenino': 'feminine',
  'singular': 'singular',
  'plural': 'plural',
  'concordancia': 'agreement',
  'presente': 'present tense',
  'pasado': 'past tense',
  'futuro': 'future tense',

  // Core Interrogatives
  'donde': 'where',
  'dónde': 'where',
  'como': 'how',
  'cómo': 'how',
  'que': 'what',
  'qué': 'what',
  'quien': 'who',
  'quién': 'who',
  'cual': 'which',
  'cuál': 'which',
  'cuales': 'which (plural)',
  'cuáles': 'which (plural)',
  'cuanto': 'how much',
  'cuánto': 'how much',
  'cuanta': 'how much (fem.)',
  'cuánta': 'how much (fem.)',
  'cuantos': 'how many',
  'cuántos': 'how many',
  'cuantas': 'how many (fem.)',
  'cuántas': 'how many (fem.)',
  'cuando': 'when',
  'cuándo': 'when',
  'porque': 'because',
  'por qué': 'why',

  // Verbs
  'comprar': 'to buy',
  'comer': 'to eat',
  'beber': 'to drink',
  'tomar': 'to drink',
  'vivir': 'to live',
  'vivo': 'I live',
  'vives': 'you live',
  'hablar': 'to speak',
  'habla': 'speaks',
  'hablas': 'you speak',
  'estudiar': 'to study',
  'estudio': 'I study',
  'estudias': 'you study',
  'trabajar': 'to work',
  'trabajo': 'work',
  'trabajadora': 'hardworking (fem.)',
  'viajar': 'to travel',
  'viaje': 'trip',
  'viajero': 'traveler',
  'viajeros': 'travelers',
  'llegar': 'to arrive',
  'salir': 'to leave',
  'pedir': 'to request',
  'querer': 'to want',
  'quiero': 'I want',
  'quiere': 'wants',
  'queremos': 'we want',
  'poder': 'can',
  'puedo': 'I can',
  'puede': 'can',
  'tener': 'to have',
  'tengo': 'I have',
  'tienes': 'you have',
  'tiene': 'has',
  'tenemos': 'we have',
  'hacer': 'to make',
  'hace': 'makes',
  'decir': 'to say',
  'dice': 'says',
  'llamarse': 'to be named',
  'llamo': 'I am called',
  'llamas': 'you are called',
  'llama': 'is called',
  'conocer': 'to know',
  'saber': 'to know (facts)',
  'buscar': 'to look for',
  'encontrar': 'to find',
  'entender': 'to understand',
  'aprender': 'to learn',
  'abrir': 'to open',
  'abre': 'opens',
  'cerrar': 'to close',
  'cierra': 'closes',
  'gustar': 'to like',
  'gusta': 'likes',
  'encantar': 'to delight',
  'preferir': 'to prefer',
  'preferido': 'favorite',
  'costar': 'to cost',
  'cuesta': 'costs',
  'cuestan': 'cost (plural)',

  // Identity, Personal info, Professions
  'nombre': 'name',
  'apellido': 'surname',
  'edad': 'age',
  'años': 'years (of age)',
  'pais': 'country',
  'país': 'country',
  'nacionalidad': 'nationality',
  'procedencia': 'origin',
  'origen': 'origin',
  'profesion': 'profession',
  'profesión': 'profession',
  'profesor': 'teacher',
  'profesora': 'teacher (fem.)',
  'profesores': 'teachers',
  'estudiante': 'student',
  'estudiantes': 'students',
  'medico': 'doctor',
  'médico': 'doctor',
  'doctor': 'doctor',
  'doctora': 'doctor (fem.)',
  'enfermero': 'nurse',
  'camarero': 'waiter',
  'camarera': 'waitress',
  'artesano': 'artisan',
  'artesana': 'artisan (fem.)',
  'pintor': 'painter',
  'arquitecto': 'architect',
  'guia': 'guide',
  'guía': 'guide',
  'amigo': 'friend',
  'amiga': 'friend (fem.)',
  'amigos': 'friends',
  'familia': 'family',
  'padre': 'father',
  'madre': 'mother',
  'hijo': 'son',
  'hija': 'daughter',
  'hermano': 'brother',
  'hermana': 'sister',

  // Everyday life & Food
  'hambre': 'hunger',
  'sed': 'thirst',
  'pan': 'bread',
  'fresco': 'fresh',
  'agua': 'water',
  'vino': 'wine',
  'cerveza': 'beer',
  'cafe': 'coffee',
  'café': 'coffee',
  'leche': 'milk',
  'chocolate': 'chocolate',
  'churros': 'churros',
  'tapas': 'tapas',
  'tapa': 'tapa',
  'tortilla': 'omelette',
  'jamon': 'ham',
  'jamón': 'ham',
  'queso': 'cheese',
  'pescado': 'fish',
  'carne': 'meat',
  'pollo': 'chicken',
  'ensalada': 'salad',
  'arroz': 'rice',
  'paella': 'paella',
  'fruta': 'fruit',
  'manzana': 'apple',
  'naranja': 'orange',
  'cuenta': 'bill',
  'propina': 'tip',
  'precio': 'price',
  'bar': 'bar',
  'restaurante': 'restaurant',
  'cafeteria': 'cafe',
  'cafetería': 'cafe',

  // City, Travel, Locations & Directions
  'estacion': 'station',
  'estación': 'station',
  'tren': 'train',
  'metro': 'metro',
  'autobus': 'bus',
  'autobús': 'bus',
  'aeropuerto': 'airport',
  'hotel': 'hotel',
  'hostal': 'hostel',
  'ciudad': 'city',
  'ciudades': 'cities',
  'calle': 'street',
  'plaza': 'town square',
  'parque': 'park',
  'mercado': 'market',
  'tienda': 'shop',
  'museo': 'museum',
  'palacio': 'palace',
  'alcazar': 'fortress',
  'alcázar': 'fortress',
  'castillo': 'castle',
  'catedral': 'cathedral',
  'iglesia': 'church',
  'puente': 'bridge',
  'centro': 'center',
  'derecha': 'right',
  'izquierda': 'left',
  'recto': 'straight ahead',
  'cerca': 'near',
  'lejos': 'far',
  'billete': 'ticket',
  'viajes': 'trips',
  'equipaje': 'luggage',
  'maleta': 'suitcase',
  'pasaporte': 'passport',

  // House & Objects
  'casa': 'house',
  'habitacion': 'room',
  'habitación': 'room',
  'dormitorio': 'bedroom',
  'cama': 'bed',
  'mesa': 'table',
  'silla': 'chair',
  'armario': 'wardrobe',
  'ventana': 'window',
  'puerta': 'door',
  'suelo': 'floor',
  'techo': 'ceiling',
  'pared': 'wall',
  'bano': 'bathroom',
  'baño': 'bathroom',
  'cocina': 'kitchen',
  'libro': 'book',
  'cuaderno': 'notebook',
  'boligrafo': 'pen',
  'bolígrafo': 'pen',
  'lapiz': 'pencil',
  'lápiz': 'pencil',
  'pizarra': 'blackboard',
  'pupitre': 'desk',
  'mapa': 'map',
  'idioma': 'language',
  'lengua': 'language',
  'sistema': 'system',
  'problema': 'problem',
  'dia': 'day',
  'día': 'day',

  // Time, Calendar & Numbers
  'tiempo': 'time',
  'hora': 'hour',
  'minuto': 'minute',
  'hoy': 'today',
  'ayer': 'yesterday',
  'manana': 'tomorrow',
  'mañana': 'tomorrow',
  'tarde': 'afternoon',
  'noche': 'night',
  'semana': 'week',
  'mes': 'month',
  'ano': 'year',
  'año': 'year',
  'lunes': 'Monday',
  'martes': 'Tuesday',
  'miercoles': 'Wednesday',
  'miércoles': 'Wednesday',
  'jueves': 'Thursday',
  'viernes': 'Friday',
  'sabado': 'Saturday',
  'sábado': 'Saturday',
  'domingo': 'Sunday',
  'uno': 'one',
  'dos': 'two',
  'tres': 'three',
  'cuatro': 'four',
  'cinco': 'five',
  'seis': 'six',
  'siete': 'seven',
  'ocho': 'eight',
  'nueve': 'nine',
  'diez': 'ten',
  'quince': 'fifteen',
  'veinte': 'twenty',
  'treinta': 'thirty',
  'cuarenta': 'forty',
  'cincuenta': 'fifty',
  'sesenta': 'sixty',
  'setenta': 'seventy',
  'ochenta': 'eighty',
  'noventa': 'ninety',
  'cien': 'one hundred',
  'ciento': 'hundred',
  'mil': 'one thousand',
  'miles': 'thousands',

  // Adjectives
  'grande': 'big',
  'pequeno': 'small',
  'pequeño': 'small',
  'alto': 'tall',
  'alta': 'tall (fem.)',
  'bajo': 'short',
  'baja': 'short (fem.)',
  'bueno': 'good',
  'buena': 'good (fem.)',
  'malo': 'bad',
  'facil': 'easy',
  'fácil': 'easy',
  'dificil': 'difficult',
  'difícil': 'difficult',
  'nuevo': 'new',
  'nueva': 'new (fem.)',
  'viejo': 'old',
  'antiguo': 'ancient',
  'antigua': 'ancient (fem.)',
  'antiguas': 'ancient (fem. pl.)',
  'bonito': 'pretty',
  'hermoso': 'beautiful',
  'caliente': 'hot',
  'frio': 'cold',
  'frío': 'cold',
  'caro': 'expensive',
  'barato': 'cheap',
  'interesante': 'interesting',
  'inteligente': 'intelligent',
  'inteligentes': 'intelligent (plural)',
  'simpatico': 'friendly',
  'simpático': 'friendly',
  'amable': 'kind',
  'amables': 'kind (plural)',
  'famoso': 'famous',
  'tradicional': 'traditional',
  'exclusiva': 'exclusive',
  'representativa': 'representative',
  'espanol': 'Spanish',
  'español': 'Spanish',
  'espanola': 'Spanish (fem.)',
  'española': 'Spanish (fem.)',
  'espanoles': 'Spanish (plural)',
  'españoles': 'Spanish (plural)',
  'ingles': 'English',
  'inglés': 'English'
};

/**
 * Resolves the single, context-accurate English translation of a Spanish word
 * based on the full sentence context. Irrelevant alternative meanings are never returned.
 * If the word is polysemous and the context is genuinely insufficient, it flags
 * the ambiguity explicitly rather than guessing.
 */
export function resolveContextualMeaning(word: string, fullSentence: string = ''): string {
  const normWord = (word || '').toLowerCase().trim().replace(/[¿?¡!.,:;()"'_/\\-]/g, '');
  const sentence = (fullSentence || '').toLowerCase().trim();
  const tokens = sentence.split(/\s+/).filter(Boolean);
  const hasContext = tokens.length > 1 && sentence !== normWord;

  // 1. MAÑANA / MANANA
  if (normWord === 'mañana' || normWord === 'manana') {
    if (!hasContext) return 'ambiguous: tomorrow or morning depending on context';
    if (
      /\b(por la|la|de la|toda la|esta|las|cada)\s+mañana\b/i.test(sentence) ||
      /\bmañanas\b/i.test(sentence) ||
      sentence.includes('por la mañana') ||
      sentence.includes('de la mañana') ||
      sentence.includes('en la mañana')
    ) {
      return 'morning';
    }
    if (
      /\b(hasta|para|desde|hacer|vas a|iré|iremos|irá|viajo|llegamos|ayer y|pasado)\s+mañana\b/i.test(sentence) ||
      /\bmañana\s+(por la|será|vamos|voy|llega|salgo)\b/i.test(sentence) ||
      sentence.includes('vas a hacer mañana') ||
      sentence.includes('hacer mañana') ||
      sentence.includes('mañana por la') ||
      !/\bla mañana\b/i.test(sentence)
    ) {
      return 'tomorrow';
    }
    return 'ambiguous: tomorrow or morning depending on context';
  }

  // 2. FRÍO / FRIO / FRÍA / FRIA
  if (normWord === 'frío' || normWord === 'frio' || normWord === 'fría' || normWord === 'fria') {
    if (!hasContext) return 'ambiguous: feeling cold or temperature depending on context';
    if (
      sentence.includes('tengo frío') ||
      sentence.includes('tienes frío') ||
      sentence.includes('tiene frío') ||
      sentence.includes('tenemos frío') ||
      sentence.includes('tienen frío') ||
      sentence.includes('sentir frío') ||
      sentence.includes('abrigan') ||
      (/\b(tener|\(tener\)|tenemos|tienen|tienes|tengo)\b.*\bfrío\b/i.test(sentence)) ||
      (/\bfrío\b.*\b(tener|\(tener\)|abrigan)\b/i.test(sentence))
    ) {
      return 'cold (feeling cold)';
    }
    if (
      sentence.includes('comida') ||
      sentence.includes('sopa') ||
      sentence.includes('agua') ||
      sentence.includes('bebida') ||
      sentence.includes('cerveza') ||
      sentence.includes('café') ||
      sentence.includes('plato') ||
      sentence.includes('está fría') ||
      sentence.includes('está frío') ||
      sentence.includes('temperatura')
    ) {
      return "cold (the food's temperature)";
    }
    if (
      sentence.includes('hace frío') ||
      sentence.includes('hacía frío') ||
      sentence.includes('tiempo frío') ||
      sentence.includes('viento') ||
      sentence.includes('clima') ||
      sentence.includes('invierno') ||
      sentence.includes('no me gusta el frío') ||
      sentence.includes('el frío') ||
      (/\bhace\b/i.test(sentence) && /\bfrío\b/i.test(sentence)) ||
      (/\bhacía\b/i.test(sentence) && /\bfrío\b/i.test(sentence))
    ) {
      return 'cold (weather)';
    }
    return 'ambiguous: feeling cold or temperature depending on context';
  }

  // 3. LLEVO / LLEVA / LLEVAS / LLEVAR
  if (normWord === 'llevo' || normWord === 'lleva' || normWord === 'llevas' || normWord === 'llevar') {
    if (!hasContext) return 'ambiguous: wearing, duration, or carrying depending on context';
    if (
      sentence.includes('chaqueta') ||
      sentence.includes('ropa') ||
      sentence.includes('camisa') ||
      sentence.includes('pantalón') ||
      sentence.includes('pantalones') ||
      sentence.includes('vestido') ||
      sentence.includes('gafas') ||
      sentence.includes('sombrero') ||
      sentence.includes('zapatos') ||
      sentence.includes('abrigo') ||
      sentence.includes('falda') ||
      sentence.includes('puesto') ||
      sentence.includes('puesta')
    ) {
      return normWord === 'llevo' ? 'I am wearing' : normWord === 'llevar' ? 'to wear' : 'wearing';
    }
    if (
      sentence.includes('horas') ||
      sentence.includes('días') ||
      sentence.includes('meses') ||
      sentence.includes('años') ||
      sentence.includes('tiempo') ||
      sentence.includes('aquí') ||
      sentence.includes('esperando') ||
      sentence.includes('viviendo') ||
      sentence.includes('dos horas')
    ) {
      return normWord === 'llevo' ? 'I have been' : normWord === 'llevar' ? 'to have been' : 'has been';
    }
    if (sentence.includes('para llevar')) {
      return 'for takeaway';
    }
    if (
      sentence.includes('maleta') ||
      sentence.includes('equipaje') ||
      sentence.includes('bolsa') ||
      sentence.includes('mochila')
    ) {
      return normWord === 'llevo' ? 'I carry' : 'to carry';
    }
    return 'ambiguous: wearing, duration, or carrying depending on context';
  }

  // 4. TIEMPO
  if (normWord === 'tiempo') {
    if (!hasContext) return 'ambiguous: weather or time depending on context';
    if (
      sentence.includes('tiempo libre') ||
      sentence.includes('tienes tiempo') ||
      sentence.includes('tener tiempo') ||
      sentence.includes('a tiempo') ||
      sentence.includes('no tengo tiempo') ||
      sentence.includes('cuánto tiempo') ||
      sentence.includes('mucho tiempo') ||
      sentence.includes('poco tiempo') ||
      sentence.includes('perder el tiempo') ||
      sentence.includes('el paso del tiempo') ||
      sentence.includes('el tiempo pasa')
    ) {
      return 'time';
    }
    if (
      sentence.includes('buen tiempo') ||
      sentence.includes('mal tiempo') ||
      sentence.includes('hace') ||
      sentence.includes('hacía') ||
      sentence.includes('clima') ||
      sentence.includes('meteorológico') ||
      sentence.includes('soleado') ||
      sentence.includes('llueve') ||
      sentence.includes('temperatura') ||
      sentence.includes('qué tiempo')
    ) {
      return 'weather';
    }
    return 'ambiguous: weather or time depending on context';
  }

  // 5. CUENTA
  if (normWord === 'cuenta') {
    if (!hasContext) return 'ambiguous: bill, bank account, or realization depending on context';
    if (
      sentence.includes('doy cuenta') ||
      sentence.includes('da cuenta') ||
      sentence.includes('darse cuenta') ||
      sentence.includes('me di cuenta') ||
      sentence.includes('te das cuenta')
    ) {
      return 'realize';
    }
    if (
      sentence.includes('restaurante') ||
      sentence.includes('camarero') ||
      sentence.includes('café') ||
      sentence.includes('bar') ||
      sentence.includes('por favor') ||
      sentence.includes('pagar') ||
      sentence.includes('mesa') ||
      sentence.includes('la cuenta')
    ) {
      return 'bill';
    }
    if (
      sentence.includes('banco') ||
      sentence.includes('bancaria') ||
      sentence.includes('bancario') ||
      sentence.includes('dinero') ||
      sentence.includes('ahorros') ||
      sentence.includes('ingresar') ||
      sentence.includes('cuenta bancaria')
    ) {
      return 'bank account';
    }
    return 'ambiguous: bill, bank account, or realization depending on context';
  }

  // 6. CARTA
  if (normWord === 'carta') {
    if (!hasContext) return 'ambiguous: menu or letter depending on context';
    if (
      sentence.includes('restaurante') ||
      sentence.includes('camarero') ||
      sentence.includes('menú') ||
      sentence.includes('platos') ||
      sentence.includes('pedir') ||
      sentence.includes('postres') ||
      sentence.includes('la carta')
    ) {
      return 'menu';
    }
    if (
      sentence.includes('escribo') ||
      sentence.includes('escribir') ||
      sentence.includes('amigo') ||
      sentence.includes('correo') ||
      sentence.includes('postal') ||
      sentence.includes('buzón') ||
      sentence.includes('sobre') ||
      sentence.includes('enviar') ||
      sentence.includes('mandar')
    ) {
      return 'letter';
    }
    if (sentence.includes('baraja') || sentence.includes('jugar') || sentence.includes('as')) {
      return 'playing card';
    }
    return 'ambiguous: menu or letter depending on context';
  }

  // 7. BANCO
  if (normWord === 'banco') {
    if (!hasContext) return 'ambiguous: bank or bench depending on context';
    if (
      sentence.includes('plaza') ||
      sentence.includes('parque') ||
      sentence.includes('sentarse') ||
      sentence.includes('sentado') ||
      sentence.includes('madera') ||
      sentence.includes('jardín') ||
      sentence.includes('alameda') ||
      sentence.includes('descansar')
    ) {
      return 'bench';
    }
    if (
      sentence.includes('dinero') ||
      sentence.includes('sacar') ||
      sentence.includes('cajero') ||
      sentence.includes('cuenta') ||
      sentence.includes('ingresar') ||
      sentence.includes('euro') ||
      sentence.includes('euros') ||
      sentence.includes('financiero')
    ) {
      return 'bank';
    }
    return 'ambiguous: bank or bench depending on context';
  }

  // 8. VINO
  if (normWord === 'vino') {
    if (!hasContext) return 'ambiguous: wine or came depending on context';
    if (
      sentence.includes('copa') ||
      sentence.includes('tinto') ||
      sentence.includes('blanco') ||
      sentence.includes('beber') ||
      sentence.includes('botella') ||
      sentence.includes('uva') ||
      sentence.includes('bodega') ||
      sentence.includes('rioja') ||
      sentence.includes('tomar vino')
    ) {
      return 'wine';
    }
    if (
      sentence.includes('ayer') ||
      sentence.includes('tarde') ||
      sentence.includes('temprano') ||
      sentence.includes('a casa') ||
      sentence.includes('aquí') ||
      sentence.includes('él') ||
      sentence.includes('ella') ||
      sentence.includes('usted') ||
      sentence.includes('vino a') ||
      sentence.includes('cuando vino')
    ) {
      return 'came';
    }
    return 'ambiguous: wine or came depending on context';
  }

  // 9. CAMINO
  if (normWord === 'camino') {
    if (!hasContext) return 'ambiguous: path or I walk depending on context';
    if (
      sentence.includes('yo camino') ||
      sentence.includes('camino por') ||
      sentence.includes('camino a') ||
      sentence.includes('camino hacia') ||
      sentence.includes('todos los días camino')
    ) {
      return 'I walk';
    }
    if (
      sentence.includes('el camino') ||
      sentence.includes('este camino') ||
      sentence.includes('buen camino') ||
      sentence.includes('largo') ||
      sentence.includes('camino de santiago') ||
      sentence.includes('sendero')
    ) {
      return 'path';
    }
    return 'ambiguous: path or I walk depending on context';
  }

  // 10. BAJO / BAJA
  if (normWord === 'bajo' || normWord === 'baja') {
    if (!hasContext) return 'ambiguous: under, short, or low depending on context';
    if (
      sentence.includes('bajo la') ||
      sentence.includes('bajo el') ||
      sentence.includes('bajo su') ||
      sentence.includes('bajo un') ||
      sentence.includes('mesa') ||
      sentence.includes('puente') ||
      sentence.includes('árbol') ||
      sentence.includes('cielo') ||
      sentence.includes('techo')
    ) {
      return 'under';
    }
    if (
      sentence.includes('chico') ||
      sentence.includes('chica') ||
      sentence.includes('hombre') ||
      sentence.includes('mujer') ||
      sentence.includes('persona') ||
      sentence.includes('estatura')
    ) {
      return 'short';
    }
    if (sentence.includes('precio') || sentence.includes('coste') || sentence.includes('temperatura')) {
      return 'low';
    }
    return 'ambiguous: under, short, or low depending on context';
  }

  // 11. SOBRE
  if (normWord === 'sobre') {
    if (!hasContext) return 'ambiguous: on top of, about, or envelope depending on context';
    if (
      sentence.includes('sobre la mesa') ||
      sentence.includes('sobre el') ||
      sentence.includes('sobre la cama') ||
      sentence.includes('puesto sobre') ||
      sentence.includes('mesa') ||
      sentence.includes('escritorio')
    ) {
      return 'on top of';
    }
    if (
      sentence.includes('libro sobre') ||
      sentence.includes('hablar sobre') ||
      sentence.includes('película sobre') ||
      sentence.includes('historia sobre') ||
      sentence.includes('discutir sobre') ||
      sentence.includes('sobre españa')
    ) {
      return 'about';
    }
    if (
      sentence.includes('para la carta') ||
      sentence.includes('sello') ||
      sentence.includes('enviar el sobre') ||
      sentence.includes('un sobre') ||
      sentence.includes('abrir el sobre')
    ) {
      return 'envelope';
    }
    return 'ambiguous: on top of, about, or envelope depending on context';
  }

  // 12. PASA / PASAR
  if (normWord === 'pasa' || normWord === 'pasar') {
    if (!hasContext) return 'ambiguous: happens, passes, or pass item depending on context';
    if (sentence.includes('no pasa nada')) {
      return 'happens (nothing is wrong)';
    }
    if (sentence.includes('¿qué pasa?') || sentence.includes('qué te pasa') || sentence.includes('pasa algo')) {
      return 'happens';
    }
    if (
      sentence.includes('tren pasa') ||
      sentence.includes('autobús pasa') ||
      sentence.includes('pasa por') ||
      sentence.includes('pasa cerca')
    ) {
      return 'passes';
    }
    if (sentence.includes('pasa la sal') || sentence.includes('pasa el pan')) {
      return 'pass';
    }
    return 'ambiguous: happens, passes, or pass item depending on context';
  }

  // 13. TOMAR
  if (normWord === 'tomar') {
    if (!hasContext) return 'ambiguous: to drink or to take transport depending on context';
    if (
      sentence.includes('café') ||
      sentence.includes('tinto') ||
      sentence.includes('cerveza') ||
      sentence.includes('vino') ||
      sentence.includes('té') ||
      sentence.includes('agua') ||
      sentence.includes('desayuno') ||
      sentence.includes('tapas') ||
      sentence.includes('chocolatería') ||
      sentence.includes('chocolate') ||
      sentence.includes('churros') ||
      sentence.includes('bar') ||
      sentence.includes('restaurante') ||
      sentence.includes('consumir') ||
      sentence.includes('tomar aquí') ||
      sentence.includes('para tomar') ||
      sentence.includes('de primero') ||
      sentence.includes('de segundo') ||
      sentence.includes('postre') ||
      sentence.includes('comensales')
    ) {
      return 'to drink';
    }
    if (
      sentence.includes('autobús') ||
      sentence.includes('tren') ||
      sentence.includes('metro') ||
      sentence.includes('taxi') ||
      sentence.includes('avión')
    ) {
      return 'to take';
    }
    if (sentence.includes('sol')) {
      return 'to sunbathe';
    }
    return 'ambiguous: to drink or to take transport depending on context';
  }

  // 14. DERECHO / DERECHA
  if (normWord === 'derecho' || normWord === 'derecha') {
    if (!hasContext) return 'ambiguous: right direction, straight ahead, or law depending on context';
    if (
      normWord === 'derecha' ||
      sentence.includes('a la derecha') ||
      sentence.includes('gira a la derecha') ||
      sentence.includes('mano derecha')
    ) {
      return 'right';
    }
    if (
      sentence.includes('sigue derecho') ||
      sentence.includes('todo derecho') ||
      sentence.includes('continúa derecho') ||
      sentence.includes('recto')
    ) {
      return 'straight ahead';
    }
    if (
      sentence.includes('estudio derecho') ||
      sentence.includes('abogado') ||
      sentence.includes('leyes') ||
      sentence.includes('facultad de derecho')
    ) {
      return 'law';
    }
    return 'ambiguous: right direction, straight ahead, or law depending on context';
  }

  // 15. PLANTA
  if (normWord === 'planta') {
    if (!hasContext) return 'ambiguous: floor or plant depending on context';
    if (
      sentence.includes('primera planta') ||
      sentence.includes('segunda planta') ||
      sentence.includes('tercera') ||
      sentence.includes('cuarta') ||
      sentence.includes('quinta') ||
      sentence.includes('piso') ||
      sentence.includes('ascensor') ||
      sentence.includes('hotel') ||
      sentence.includes('edificio')
    ) {
      return 'floor';
    }
    if (
      sentence.includes('verde') ||
      sentence.includes('regar') ||
      sentence.includes('jardín') ||
      sentence.includes('maceta') ||
      sentence.includes('hojas') ||
      sentence.includes('flores')
    ) {
      return 'plant';
    }
    return 'ambiguous: floor or plant depending on context';
  }

  // 16. ORDENAR / ORDENA / ORDENE / ORDENÉ
  const normOrd = normWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normOrd.startsWith('orden')) {
    if (!hasContext) return 'ambiguous: to arrange or to order food depending on context';
    if (
      sentence.includes('menú') ||
      sentence.includes('comida') ||
      sentence.includes('plato') ||
      sentence.includes('paella') ||
      sentence.includes('camarero') ||
      sentence.includes('restaurante') ||
      sentence.includes('pedido') ||
      sentence.includes('comensales') ||
      sentence.includes('para ordenar el menú')
    ) {
      return (normOrd === 'ordene' && (word.includes('é') || sentence.includes('ordené'))) ? 'ordered' : 'to order';
    }
    if (
      sentence.includes('palabra') ||
      sentence.includes('palabras') ||
      sentence.includes('frase') ||
      sentence.includes('frases') ||
      sentence.includes('letras') ||
      sentence.includes('letra') ||
      sentence.includes('elementos') ||
      sentence.includes('alfabético') ||
      sentence.includes('oración') ||
      sentence.includes('pregunta') ||
      sentence.includes('inscripción') ||
      sentence.includes('rutina') ||
      sentence.includes('lema') ||
      sentence.includes('juramento') ||
      sentence.includes('máxima') ||
      sentence.includes('brindis') ||
      sentence.includes('instrucciones') ||
      sentence.includes('conclusión') ||
      sentence.includes('declaración') ||
      sentence.includes('parte') ||
      sentence.includes('estribillo') ||
      normOrd === 'ordena'
    ) {
      return 'arrange';
    }
    if (sentence.includes('habitación') || sentence.includes('casa') || sentence.includes('cuarto')) {
      return 'tidy';
    }
    return 'ambiguous: to arrange or to order food depending on context';
  }

  // 17. NADA
  if (normWord === 'nada') {
    if (!hasContext) return 'ambiguous: nothing, swims, or you are welcome depending on context';
    if (sentence.includes('de nada')) {
      return 'you are welcome';
    }
    if (
      sentence.includes('no hay nada') ||
      sentence.includes('nada más') ||
      sentence.includes('para nada') ||
      sentence.includes('no tengo nada') ||
      sentence.includes('no veo nada')
    ) {
      return 'nothing';
    }
    if (
      sentence.includes('piscina') ||
      sentence.includes('mar') ||
      sentence.includes('playa') ||
      sentence.includes('agua') ||
      sentence.includes('él nada') ||
      sentence.includes('ella nada') ||
      sentence.includes('nada bien')
    ) {
      return 'swims';
    }
    return 'ambiguous: nothing, swims, or you are welcome depending on context';
  }

  // 18. MANZANA
  if (normWord === 'manzana') {
    if (!hasContext) return 'ambiguous: apple or city block depending on context';
    if (
      sentence.includes('comer') ||
      sentence.includes('roja') ||
      sentence.includes('fruta') ||
      sentence.includes('verde') ||
      sentence.includes('rica') ||
      sentence.includes('comprar manzana')
    ) {
      return 'apple';
    }
    if (
      sentence.includes('caminar') ||
      sentence.includes('cruzar') ||
      sentence.includes('dos manzanas') ||
      sentence.includes('tres manzanas') ||
      sentence.includes('calle') ||
      sentence.includes('bloque')
    ) {
      return 'city block';
    }
    return 'ambiguous: apple or city block depending on context';
  }

  // 19. MEDIO / MEDIA
  if (normWord === 'medio' || normWord === 'media') {
    if (!hasContext) return 'ambiguous: half or means depending on context';
    if (
      sentence.includes('y media') ||
      sentence.includes('hora y media') ||
      sentence.includes('las dos y media') ||
      sentence.includes('tres y media')
    ) {
      return 'half past';
    }
    if (
      sentence.includes('media ración') ||
      sentence.includes('media porción') ||
      sentence.includes('medio litro')
    ) {
      return 'half portion';
    }
    if (sentence.includes('medio de transporte') || sentence.includes('por medio de')) {
      return 'means';
    }
    return 'ambiguous: half or means depending on context';
  }

  // 20. HORA
  if (normWord === 'hora') {
    if (!hasContext) return 'hour';
    if (sentence.includes('qué hora es') || sentence.includes('es la una') || sentence.includes('son las')) {
      return 'clock time';
    }
    return 'hour';
  }

  // Fallback to static dictionary, stripping any rogue slash
  const staticMeaning = SPANISH_KEYWORD_DICT[normWord];
  if (staticMeaning) {
    return staticMeaning.includes('/') ? staticMeaning.split('/')[0].trim() : staticMeaning;
  }

  return normWord;
}

/**
 * Ensures a vocabulary hint displayed in the UI has exactly ONE contextual English translation,
 * with ZERO slashes and ZERO ambiguous meta-labels.
 */
function cleanHintTranslation(word: string, translation: string, fullSentence: string): string {
  if (!translation.startsWith('ambiguous:')) {
    return translation.includes('/') ? translation.split('/')[0].trim() : translation;
  }
  const norm = word.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sentence = fullSentence.toLowerCase();
  switch (norm) {
    case 'manana':
      return (sentence.includes('la') || sentence.includes('por la') || sentence.includes('de la')) ? 'morning' : 'tomorrow';
    case 'frio':
    case 'fria':
      return 'cold';
    case 'tiempo':
      return (sentence.includes('libre') || sentence.includes('hora') || sentence.includes('reloj') || sentence.includes('tienes tiempo')) ? 'time' : 'weather';
    case 'cuenta':
      return 'bill';
    case 'carta':
      return sentence.includes('buzon') || sentence.includes('postal') || sentence.includes('escribir') ? 'letter' : 'menu';
    case 'banco':
      return (sentence.includes('plaza') || sentence.includes('parque') || sentence.includes('sentarse')) ? 'bench' : 'bank';
    case 'vino':
      return 'wine';
    case 'camino':
      return 'path';
    case 'bajo':
    case 'baja':
      return 'under';
    case 'sobre':
      return 'on';
    case 'pasa':
      return (sentence.includes('tren') || sentence.includes('autobus') || sentence.includes('metro')) ? 'passes' : 'happens';
    case 'tomar':
      return (sentence.includes('autobus') || sentence.includes('tren') || sentence.includes('metro') || sentence.includes('taxi')) ? 'to take' : 'to drink';
    case 'derecho':
      return 'straight ahead';
    case 'derecha':
      return 'right';
    case 'planta':
      return (sentence.includes('piso') || sentence.includes('hotel') || sentence.includes('primera')) ? 'floor' : 'plant';
    case 'ordena':
    case 'ordenar':
      return (sentence.includes('menu') || sentence.includes('comida') || sentence.includes('paella') || sentence.includes('comensales')) ? 'to order' : 'arrange';
    case 'nada':
      return sentence.includes('de nada') ? 'you are welcome' : (sentence.includes('piscina') || sentence.includes('mar')) ? 'swims' : 'nothing';
    case 'manzana':
      return (sentence.includes('calle') || sentence.includes('bloque') || sentence.includes('cruzar')) ? 'city block' : 'apple';
    case 'medio':
    case 'media':
      return 'half';
    default: {
      const fallback = SPANISH_KEYWORD_DICT[norm] || word;
      return fallback.includes('/') ? fallback.split('/')[0].trim() : fallback;
    }
  }
}

/**
 * Extracts 2 to 4 keywords from a question and its prompt,
 * strictly guaranteeing that the correct answer is NEVER revealed.
 */
export function getQuestionVocabHints(question: Question): VocabularyHint[] {
  const answerStr = (Array.isArray(question.correctAnswer)
    ? question.correctAnswer.join(' ')
    : String(question.correctAnswer)
  ).toLowerCase().trim();

  const fullSentence = `${question.prompt} ${question.dialogue?.prompt || ''}`.trim();

  // 1. If explicit vocabulary hints are authored on the question, sanitize and resolve them
  if (question.vocabularyHints && question.vocabularyHints.length > 0) {
    const valid = question.vocabularyHints
      .filter(h => {
        const w = h.word.toLowerCase().trim();
        return !answerStr.includes(w) && w.length > 1;
      })
      .map(h => ({
        word: h.word,
        translation: cleanHintTranslation(h.word, resolveContextualMeaning(h.word, fullSentence), fullSentence)
      }));
    if (valid.length >= 2) {
      return valid.slice(0, 4);
    }
  }

  // 2. Scan question prompt, NPC dialogue prompt, and options
  const textToScan = fullSentence.replace(/[¿?¡!.,:;()"'_/\\-]/g, ' ');

  const tokens = textToScan.split(/\s+/).filter(w => w.length >= 3);
  const found: VocabularyHint[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const norm = token.toLowerCase();
    if (seen.has(norm)) continue;
    // Strict safeguard: never reveal correct answer
    if (answerStr.includes(norm) || norm === answerStr) continue;

    if (SPANISH_KEYWORD_DICT[norm]) {
      seen.add(norm);
      const contextualTranslation = resolveContextualMeaning(token, fullSentence);
      found.push({ word: token, translation: cleanHintTranslation(token, contextualTranslation, fullSentence) });
      if (found.length >= 4) break;
    }
  }

  // 3. If fewer than 2, scan additional words or provide high-yield prompt context
  if (found.length < 2) {
    const lowerPrompt = question.prompt.toLowerCase();

    const backupPairs: [string, string][] = [
      ['saludas', 'you greet'],
      ['saludos', 'greetings'],
      ['alfabeto', 'alphabet'],
      ['abecedario', 'alphabet'],
      ['deletrear', 'to spell'],
      ['letra', 'letter'],
      ['pronombre', 'pronoun'],
      ['formal', 'formal'],
      ['informal', 'informal'],
      ['respeto', 'respect'],
      ['cortesia', 'courtesy'],
      ['cortesía', 'courtesy'],
      ['frase', 'sentence'],
      ['palabra', 'word'],
      ['pregunta', 'question'],
      ['respuesta', 'answer'],
      ['completa', 'complete'],
      ['elige', 'choose'],
      ['ordena', 'arrange'],
      ['número', 'number'],
      ['precio', 'price'],
      ['cuesta', 'costs'],
      ['está', 'is located'],
      ['dónde', 'where'],
      ['cómo', 'how'],
      ['cuánto', 'how much'],
      ['qué', 'what'],
      ['quién', 'who'],
      ['cuál', 'which'],
      ['tiempo', cleanHintTranslation('tiempo', resolveContextualMeaning('tiempo', fullSentence), fullSentence)],
      ['estudiante', 'student'],
      ['profesor', 'teacher'],
      ['amigo', 'friend'],
      ['ciudad', 'city'],
      ['calle', 'street'],
      ['mercado', 'market'],
      ['tienda', 'shop']
    ];

    for (const [w, tr] of backupPairs) {
      if (!seen.has(w) && !answerStr.includes(w) && lowerPrompt.includes(w)) {
        seen.add(w);
        found.push({ word: w, translation: cleanHintTranslation(w, tr, fullSentence) });
        if (found.length >= 2) break;
      }
    }
  }

  // 4. Guarantee at least 2 foundational Spanish vocabulary words
  if (found.length < 2) {
    const defaultPairs: [string, string][] = [
      ['frase', 'sentence'],
      ['palabra', 'word'],
      ['respuesta', 'answer'],
      ['pregunta', 'question']
    ];
    for (const [w, tr] of defaultPairs) {
      if (!seen.has(w) && !answerStr.includes(w)) {
        seen.add(w);
        found.push({ word: w, translation: cleanHintTranslation(w, tr, fullSentence) });
        if (found.length >= 2) break;
      }
    }
  }

  return found.slice(0, 4);
}
