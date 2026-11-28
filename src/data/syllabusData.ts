import { SyllabusModule } from '../types';

export const SYLLABUS_MODULES: SyllabusModule[] = [
  {
    moduleNumber: 1,
    title: 'Alphabet, Greetings, Personal Info & Verb SER',
    hours: 3,
    summary: 'The Spanish alphabet (el abecedario), greetings & farewells (saludos), personal info (origin, nationality, numbers 1–100,000, professions, days of the week), articles, subject pronouns, adjectives, and the verb SER.',
    topics: [
      {
        id: 'M1-ALPHA',
        code: '1.1',
        title: 'The Alphabet & Phonetics (El Abecedario)',
        category: 'Vocabulario',
        description: 'Vowels, consonants, digraphs (ch, ll, rr), and key Castilian Spanish pronunciation sounds.',
        coveredInCityIds: ['madrid']
      },
      {
        id: 'M1-SALUDOS',
        code: '1.2',
        title: 'Greetings & Farewells (Saludos y Despedidas)',
        category: 'Comunicación',
        description: 'Formal and informal courtesy expressions: Hola, Buenos días, ¿Qué tal?, Adiós, Hasta luego.',
        coveredInCityIds: ['madrid']
      },
      {
        id: 'M1-DATOS',
        code: '1.3',
        title: 'Personal Info & Introductions (Datos Personales)',
        category: 'Comunicación',
        description: 'Introducing yourself, asking and answering about name (nombre), origin, nationality, and age.',
        coveredInCityIds: ['madrid', 'toledo']
      },
      {
        id: 'M1-NUM1',
        code: '1.4',
        title: 'Cardinal Numbers (Números 1 – 100,000)',
        category: 'Vocabulario',
        description: 'Counting from 0 to 100 and larger numbers for prices (precios) and shopping.',
        coveredInCityIds: ['madrid', 'toledo', 'salamanca']
      },
      {
        id: 'M1-PROF',
        code: '1.5',
        title: 'Professions & Occupations (Profesiones)',
        category: 'Vocabulario',
        description: 'Job titles and masculine/feminine gender agreement (e.g., profesor / profesora).',
        coveredInCityIds: ['toledo', 'salamanca']
      },
      {
        id: 'M1-DIAS',
        code: '1.6',
        title: 'Days of the Week (Los Días de la Semana)',
        category: 'Vocabulario',
        description: 'Monday to Sunday (lunes a domingo) with the masculine definite article (el lunes, los sábados).',
        coveredInCityIds: ['toledo']
      },
      {
        id: 'M1-ART',
        code: '1.7',
        title: 'Definite & Indefinite Articles (Artículos)',
        category: 'Gramática',
        description: 'El, la, los, las and un, una, unos, unas. Noun gender and plural forms.',
        coveredInCityIds: ['salamanca']
      },
      {
        id: 'M1-PRON',
        code: '1.8',
        title: 'Subject Personal Pronouns (Pronombres)',
        category: 'Gramática',
        description: 'Yo, tú, él, ella, usted, nosotros/as, vosotros/as, ellos/as, ustedes.',
        coveredInCityIds: ['madrid', 'salamanca']
      },
      {
        id: 'M1-ADJ',
        code: '1.9',
        title: 'Descriptive Adjectives & Agreement (Adjetivos)',
        category: 'Gramática',
        description: 'Gender rules (alto/alta) and number rules (altos/altas) to match the noun.',
        coveredInCityIds: ['salamanca']
      },
      {
        id: 'M1-SER',
        code: '1.10',
        title: 'The Verb SER (To Be — Permanent)',
        category: 'Gramática',
        description: 'Present-tense conjugation (soy, eres, es...) for identity, origin, profession, and traits.',
        coveredInCityIds: ['madrid', 'toledo', 'salamanca']
      }
    ]
  },
  {
    moduleNumber: 2,
    title: 'Family, Descriptions, Regular Verbs, ESTAR & TENER',
    hours: 3,
    summary: 'Family (la familia), age and possession, rooms in a house, colors (colores), describing places, giving directions, ESTAR & TENER, SER vs ESTAR, regular verbs (-ar, -er, -ir), and prepositions of place.',
    topics: [
      {
        id: 'M2-FAM',
        code: '2.1',
        title: 'Family & Relationships (La Familia)',
        category: 'Vocabulario',
        description: 'Padre, madre, hermanos, abuelos, tíos, primos, and family terms.',
        coveredInCityIds: ['sevilla']
      },
      {
        id: 'M2-TENER',
        code: '2.2',
        title: 'The Verb TENER & Age (Tener y la Edad)',
        category: 'Gramática',
        description: 'Irregular conjugation of TENER (tengo, tienes...) for expressing age (tengo 20 años) and possession.',
        coveredInCityIds: ['sevilla']
      },
      {
        id: 'M2-CASA',
        code: '2.3',
        title: 'My Room & Parts of the House (La Casa)',
        category: 'Vocabulario',
        description: 'Rooms (dormitorio, cocina, salón) and furniture (cama, mesa, silla, armario).',
        coveredInCityIds: ['segovia']
      },
      {
        id: 'M2-COLORES',
        code: '2.4',
        title: 'Colors & Modifiers (Los Colores)',
        category: 'Vocabulario',
        description: 'Rojo, azul, verde, amarillo, blanco, negro, and gender/number agreement.',
        coveredInCityIds: ['segovia']
      },
      {
        id: 'M2-ESTAR',
        code: '2.5',
        title: 'The Verb ESTAR (To Be — Location/State)',
        category: 'Gramática',
        description: 'Conjugation of ESTAR (estoy, estás...) for spatial location and temporary states.',
        coveredInCityIds: ['segovia', 'granada']
      },
      {
        id: 'M2-SER-ESTAR',
        code: '2.6',
        title: 'Core Difference: SER vs ESTAR',
        category: 'Gramática',
        description: 'Essential distinction: SER (identity, essence, origin) vs ESTAR (location, condition, temporary mood).',
        coveredInCityIds: ['segovia', 'sevilla']
      },
      {
        id: 'M2-PREP',
        code: '2.7',
        title: 'Prepositions of Place (Preposiciones)',
        category: 'Gramática',
        description: 'En, al lado de, delante de, detrás de, encima de, debajo de, entre.',
        coveredInCityIds: ['granada']
      },
      {
        id: 'M2-DIR',
        code: '2.8',
        title: 'Asking & Giving Directions (Direcciones)',
        category: 'Comunicación',
        description: 'Girar a la izquierda (turn left), a la derecha (right), seguir todo recto (straight ahead).',
        coveredInCityIds: ['granada']
      },
      {
        id: 'M2-REG-VERBS',
        code: '2.9',
        title: 'Regular Present-Tense Verbs (-AR, -ER, -IR)',
        category: 'Gramática',
        description: 'Present indicative endings using hablar (speak), comer (eat), vivir (live).',
        coveredInCityIds: ['sevilla', 'granada']
      }
    ]
  },
  {
    moduleNumber: 3,
    title: 'Time, Dates, Weather, Likes/Interests, HAY & HACER',
    hours: 3,
    summary: 'Telling time (la hora), dates & months, weather with HACER (el clima), likes & interests (gustar/encantar), possessive adjectives, impersonal HAY, and MUY vs MUCHO.',
    topics: [
      {
        id: 'M3-HORA',
        code: '3.1',
        title: 'Telling Time (Expresar la Hora)',
        category: 'Comunicación',
        description: '¿Qué hora es? Es la una, son las dos y cuarto, las tres y media, menos cuarto.',
        coveredInCityIds: ['cordoba']
      },
      {
        id: 'M3-FECHAS',
        code: '3.2',
        title: 'Dates & Months of the Year (Fechas y Meses)',
        category: 'Vocabulario',
        description: 'The twelve months (enero–diciembre) and date format: el + number + de + month.',
        coveredInCityIds: ['cordoba']
      },
      {
        id: 'M3-CLIMA',
        code: '3.3',
        title: 'Weather & Climate Expressions (El Clima)',
        category: 'Vocabulario',
        description: 'Hace sol, hace calor, hace frío, llueve, está nublado, hay viento.',
        coveredInCityIds: ['malaga']
      },
      {
        id: 'M3-HACER',
        code: '3.4',
        title: 'The Verb HACER for Weather (Hace...)',
        category: 'Gramática',
        description: 'Using impersonal hacer to describe weather conditions.',
        coveredInCityIds: ['malaga']
      },
      {
        id: 'M3-GUSTOS',
        code: '3.5',
        title: 'Likes & Interests (Gustar & Encantar)',
        category: 'Gramática',
        description: 'Indirect object structure: me gusta / me gustan, te gusta, le gusta.',
        coveredInCityIds: ['cadiz']
      },
      {
        id: 'M3-POSESIVOS',
        code: '3.6',
        title: 'Possessive Adjectives (Posesivos)',
        category: 'Gramática',
        description: 'Mi/mis, tu/tus, su/sus, nuestro/nuestra/nuestros/nuestras, vuestro/a, su/sus.',
        coveredInCityIds: ['cadiz']
      },
      {
        id: 'M3-HAY',
        code: '3.7',
        title: 'Using HAY (There is / There are)',
        category: 'Gramática',
        description: 'HAY for existence of non-specific items vs ESTAR for specific locations.',
        coveredInCityIds: ['cadiz', 'cordoba']
      },
      {
        id: 'M3-MUY-MUCHO',
        code: '3.8',
        title: 'Difference: MUY vs MUCHO',
        category: 'Gramática',
        description: 'Muy + adjective/adverb (very) vs mucho/a/os/as + noun or verb + mucho (a lot).',
        coveredInCityIds: ['cadiz']
      }
    ]
  },
  {
    moduleNumber: 4,
    title: 'Daily Routines, Reflexive Verbs, Schedules & City Life',
    hours: 3,
    summary: 'Daily activities & routines (rutinas diarias), reflexive verbs & pronouns, class schedules & university life, describing your city, and describing close friends.',
    topics: [
      {
        id: 'M4-RUTINAS',
        code: '4.1',
        title: 'Daily Activities (Actividades Cotidianas)',
        category: 'Vocabulario',
        description: 'Despertarse (wake up), desayunar, ir a clase, estudiar, cenar, acostarse (go to bed).',
        coveredInCityIds: ['valencia']
      },
      {
        id: 'M4-REFLEX',
        code: '4.2',
        title: 'Reflexive Verbs & Pronouns (Verbos Reflexivos)',
        category: 'Gramática',
        description: 'Reflexive pronouns (me, te, se, nos, os, se) with llamarse, levantarse, ducharse.',
        coveredInCityIds: ['valencia', 'barcelona']
      },
      {
        id: 'M4-HORARIOS',
        code: '4.3',
        title: 'Schedules & Planning (El Horario)',
        category: 'Comunicación',
        description: 'Describing daily schedules: por la mañana, por la tarde, a mediodía, por la noche.',
        coveredInCityIds: ['barcelona']
      },
      {
        id: 'M4-UNIVERSIDAD',
        code: '4.4',
        title: 'University & Student Life (La Universidad)',
        category: 'Vocabulario',
        description: 'Campus, biblioteca (library), asignaturas (subjects), profesores, and academic life.',
        coveredInCityIds: ['barcelona']
      },
      {
        id: 'M4-CIUDAD',
        code: '4.5',
        title: 'Describing the City & Transport (La Ciudad)',
        category: 'Comunicación',
        description: 'Metro, autobús, barrio (neighborhood), avenidas, and city services.',
        coveredInCityIds: ['valencia', 'barcelona']
      },
      {
        id: 'M4-AMIGOS',
        code: '4.6',
        title: 'Describing My Best Friend (Mi Mejor Amigo/a)',
        category: 'Comunicación',
        description: 'Describing physical appearance and personality traits of friends.',
        coveredInCityIds: ['zaragoza']
      },
      {
        id: 'M4-HABILIDADES',
        code: '4.7',
        title: 'Skills & Abilities (Saber + Infinitive)',
        category: 'Gramática',
        description: 'Expressing what you know how to do: sé hablar español, sabe tocar la guitarra.',
        coveredInCityIds: ['zaragoza']
      }
    ]
  },
  {
    moduleNumber: 5,
    title: 'Food, Restaurants, City Locations, IR, PODER & QUERER',
    hours: 3,
    summary: 'Spanish cuisine (gastronomía), food & drinks, ordering at a café or restaurant, giving food opinions, locating places in the city, and modal/irregular verbs IR, PODER, and QUERER.',
    topics: [
      {
        id: 'M5-COMIDA',
        code: '5.1',
        title: 'Food, Tapas & Typical Dishes (Alimentos)',
        category: 'Vocabulario',
        description: 'Tortilla de patatas, paella, jamón ibérico, gazpacho, seafood, fruits, and vegetables.',
        coveredInCityIds: ['bilbao']
      },
      {
        id: 'M5-BEBIDAS',
        code: '5.2',
        title: 'Drinks & Beverages (Las Bebidas)',
        category: 'Vocabulario',
        description: 'Agua con o sin gas, café con leche, té, fresh juices (zumos), and wine.',
        coveredInCityIds: ['bilbao']
      },
      {
        id: 'M5-OPINIONES',
        code: '5.3',
        title: 'Giving Opinions on Food (Opiniones)',
        category: 'Comunicación',
        description: 'Está delicioso, rico, caliente, frío, picante (spicy), dulce (sweet), or salado (salty).',
        coveredInCityIds: ['san-sebastian']
      },
      {
        id: 'M5-RESTAURANTE',
        code: '5.4',
        title: 'At the Café & Restaurant (Restaurante)',
        category: 'Comunicación',
        description: 'Asking for a table, menú del día, la carta, ordering dishes, and asking for the bill (la cuenta).',
        coveredInCityIds: ['san-sebastian']
      },
      {
        id: 'M5-IR',
        code: '5.5',
        title: 'The Verb IR (To Go & Near Future)',
        category: 'Gramática',
        description: 'Irregular conjugation of IR (voy, vas, va...) and IR A + place/infinitive.',
        coveredInCityIds: ['bilbao']
      },
      {
        id: 'M5-PODER',
        code: '5.6',
        title: 'The Verb PODER (Can / To Be Able, o → ue)',
        category: 'Gramática',
        description: 'Stem-changing conjugation (puedo, puedes...) for polite requests and ability.',
        coveredInCityIds: ['santiago']
      },
      {
        id: 'M5-QUERER',
        code: '5.7',
        title: 'The Verb QUERER (To Want, e → ie)',
        category: 'Gramática',
        description: 'Stem-changing conjugation (quiero, quieres...) for expressing wishes and ordering food.',
        coveredInCityIds: ['san-sebastian']
      },
      {
        id: 'M5-SITIOS',
        code: '5.8',
        title: 'City Places & Navigation (Sitios en la Ciudad)',
        category: 'Comunicación',
        description: 'Farmacia, banco, hospital, museo, train station (estación de tren), and tourist office.',
        coveredInCityIds: ['santiago']
      }
    ]
  }
];
