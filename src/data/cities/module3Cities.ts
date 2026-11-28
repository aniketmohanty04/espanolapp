import { City } from '../../types';

export const MODULE3_CITIES: City[] = [
  {
    id: 'cordoba',
    number: 7,
    name: 'Córdoba',
    region: 'Andalucía',
    landmark: 'La Mezquita-Catedral & Puente Romano',
    description: 'The legendary capital of the Umayyad Caliphate. Among the forest of two-colored columns, you will learn to tell time (la hora), the months of the year (los meses), and how to form historical dates (las fechas).',
    moduleIndex: 3,
    moduleName: 'Module 3: Telling Time (La Hora), Dates (Las Fechas) & Months of the Year (Los Meses)',
    coordinates: { x: 41.5, y: 69.0 },
    accentColor: '#9333EA',
    levels: [
      {
        id: 'cordoba-1',
        cityId: 'cordoba',
        levelNumber: 1,
        title: 'What Time Is It? at the Bell Tower (¿Qué Hora Es?)',
        subtitle: 'On-the-hour time (en punto) and the difference between la una and other hours',
        tier: 'easy',
        syllabusTopic: 'M3.Time (La Hora)',
        description: 'You look up at the Mosque-Cathedral tower clock to check the time (la hora).',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-1',
            type: 'multiple-choice',
            prompt: '¿Cómo se dice en español "It is one o\'clock"?',
            englishPrompt: 'How do you say in Spanish "It is one o\'clock"?',
            audioText: 'Es la una en punto',
            options: ['Son las una en punto', 'Son la una en punto', 'Es las una en punto', 'Es la una en punto'],
            correctAnswer: 'Es la una en punto',
            explanation: 'Para la 1:00 se usa el singular: "Es la una". Para todas las demás horas (2:00 a 12:00) se usa el plural: "Son las dos", "Son las tres", etc.',
            hints: ['La una es singular, por tanto lleva "Es la una".'],
            syllabusRef: 'M3-HORA',
            difficulty: 'easy'
          },
          {
            id: 'm3-cor-2',
            type: 'fill-blank',
            prompt: 'Para las 4:00 decimos: "______ las cuatro en punto."',
            englishPrompt: 'For 4:00 we say: "Son las cuatro en punto."',
            audioText: 'Son',
            options: ['Son', 'Es', 'Está', 'Hay'],
            correctAnswer: 'Son',
            explanation: 'A partir de las dos se utiliza el verbo SER en plural: "Son las cuatro".',
            hints: ['Forma plural del verbo SER.'],
            syllabusRef: 'M3-HORA',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'cordoba-2',
        cityId: 'cordoba',
        levelNumber: 2,
        title: 'Fractions of the Hour (Las Fracciones de Hora)',
        subtitle: 'Quarter past (y cuarto), half past (y media), and quarter to (menos cuarto)',
        tier: 'easy',
        syllabusTopic: 'M3.Time (La Hora)',
        description: 'You adjust your schedule for the guided tour of the mihrab (el horario).',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-3',
            type: 'multiple-choice',
            prompt: '¿Cómo se dice en español "It is 2:30"?',
            englishPrompt: 'How do you say in Spanish "It is 2:30"?',
            audioText: 'Son las dos y media',
            options: ['Son las dos y treinta minutos', 'Son las dos y media', 'Es las dos y media', 'Son dos con treinta'],
            correctAnswer: 'Son las dos y media',
            explanation: 'La media hora (30 min) se expresa con la fórmula tradicional "y media": Son las dos y media.',
            hints: ['La mitad de la hora es "media".'],
            syllabusRef: 'M3-HORA',
            difficulty: 'easy'
          },
          {
            id: 'm3-cor-4',
            type: 'fill-blank',
            prompt: 'Las 6:45 se expresan como un cuarto para las siete: "Son las siete ______ cuarto."',
            englishPrompt: '6:45 is expressed as a quarter to seven: "Son las siete menos cuarto."',
            audioText: 'menos',
            options: ['y', 'para', 'menos', 'sin'],
            correctAnswer: 'menos',
            explanation: 'En los últimos 30 minutos de la hora se suele restar del siguiente número: "Son las siete menos cuarto" (6:45) o "menos diez" (6:50).',
            hints: ['La palabra para restar: m-e-n-o-s.'],
            syllabusRef: 'M3-HORA',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'cordoba-3',
        cityId: 'cordoba',
        levelNumber: 3,
        title: 'The Twelve Months of the Year (Los Meses del Año)',
        subtitle: 'Vocabulary for the seasons (las estaciones) and months (los meses)',
        tier: 'medium',
        syllabusTopic: 'M3.Months (Los Meses)',
        description: 'Strolling through the courtyards of Córdoba, you learn the blooming calendar (el calendario).',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-5',
            type: 'multiple-choice',
            prompt: 'El famoso Festival de los Patios de Córdoba se celebra en el quinto mes del año. ¿Qué mes es?',
            englishPrompt: 'The famous Cordoba Courtyard Festival is celebrated in the fifth month. Which month is it?',
            audioText: 'mayo',
            options: ['marzo', 'abril', 'junio', 'mayo'],
            correctAnswer: 'mayo',
            explanation: 'El quinto mes es mayo: enero, febrero, marzo, abril, mayo, junio...',
            hints: ['Mes de las flores y la primavera cordobesa.'],
            syllabusRef: 'M3-FECHAS',
            difficulty: 'medium'
          },
          {
            id: 'm3-cor-6',
            type: 'fill-blank',
            prompt: 'El último mes del año en español es: "______".',
            englishPrompt: 'The last month of the year in Spanish is: "diciembre".',
            audioText: 'diciembre',
            options: ['diciembre', 'noviembre', 'enero', 'octubre'],
            correctAnswer: 'diciembre',
            explanation: 'Diciembre es el duodécimo y último mes del calendario gregoriano.',
            hints: ['Mes de la Navidad.'],
            syllabusRef: 'M3-FECHAS',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'cordoba-4',
        cityId: 'cordoba',
        levelNumber: 4,
        title: 'Expressing Dates & Birthdays (Las Fechas y Cumpleaños)',
        subtitle: 'Structure: el + number + de + month (el + número + de + mes)',
        tier: 'medium',
        syllabusTopic: 'M3.Dates (Las Fechas)',
        description: 'You learn how to say when you were born and name national holidays (las fechas).',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-7',
            type: 'multiple-choice',
            prompt: '¿Cómo se expresa correctamente la fecha del 12 de octubre en español?',
            englishPrompt: 'How is the date October 12 correctly stated in Spanish?',
            audioText: 'El doce de octubre',
            options: ['En octubre doce', 'El doce de octubre', 'El doce en octubre', 'Octubre el doce'],
            correctAnswer: 'El doce de octubre',
            explanation: 'La estructura obligatoria en español es: Artículo "El" + día en número cardinal + preposición "de" + mes: "El doce de octubre". (Solo el primer día del mes puede decirse "el primero de...").',
            hints: ['El + número + de + mes.'],
            syllabusRef: 'M3-FECHAS',
            difficulty: 'medium'
          },
          {
            id: 'm3-cor-8',
            type: 'fill-blank',
            prompt: 'Para preguntar el cumpleaños a alguien decimos: "¿Cuándo es tu ______?"',
            englishPrompt: 'To ask someone their birthday: "¿Cuándo es tu cumpleaños?"',
            audioText: 'cumpleaños',
            options: ['reloj', 'fecha', 'cumpleaños', 'hora'],
            correctAnswer: 'cumpleaños',
            explanation: '"El cumpleaños" es la fecha de aniversario de nacimiento.',
            hints: ['Palabra compuesta: cumple + años.'],
            syllabusRef: 'M3-FECHAS',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'cordoba-5',
        cityId: 'cordoba',
        levelNumber: 5,
        title: 'Opening Hours & "At What Time?" (¿A Qué Hora?)',
        subtitle: 'Difference between "¿Qué hora es?" (What time is it?) and "¿A qué hora abre?" (At what time does it open?)',
        tier: 'tough',
        syllabusTopic: 'M3.Time (La Hora)',
        description: 'You check the Archaeological Museum sign in Plaza de Jerónimo Páez (el horario).',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-9',
            type: 'multiple-choice',
            prompt: '¿Cuál es la diferencia entre "¿Qué hora es?" y "¿A qué hora abre el museo?"?',
            englishPrompt: 'What is the difference between "¿Qué hora es?" and "¿A qué hora abre el museo?"?',
            audioText: 'La primera pregunta por la hora actual; la segunda por el momento de un acontecimiento',
            options: [
              'Son exactamente idénticas',
              'La primera es formal y la segunda informal',
              'La primera es para la tarde y la segunda para la mañana',
              'La primera pregunta por la hora actual; la segunda por el momento de un evento'
            ],
            correctAnswer: 'La primera pregunta por la hora actual; la segunda por el momento de un evento',
            explanation: '"¿Qué hora es?" inquiere por la hora actual. "¿A qué hora...?" pregunta por el horario en que ocurre una acción ("A las diez de la mañana").',
            hints: ['La preposición "A" indica hora fijada de un evento.'],
            syllabusRef: 'M3-HORA',
            difficulty: 'tough'
          },
          {
            id: 'm3-cor-10',
            type: 'fill-blank',
            prompt: 'Completa: "El concierto en el Alcázar empieza ______ las nueve de la noche."',
            englishPrompt: 'Complete: "The concert at the Alcázar begins at nine at night."',
            audioText: 'a',
            options: ['a', 'en', 'de', 'por'],
            correctAnswer: 'a',
            explanation: 'Para indicar a qué hora tiene lugar una actividad usamos la preposición "a": "a las nueve", "a la una". Nunca "en las nueve".',
            hints: ['Preposición "a".'],
            syllabusRef: 'M3-HORA',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'cordoba-6',
        cityId: 'cordoba',
        levelNumber: 6,
        title: 'Using HAY for the Existence of Places (Hay)',
        subtitle: 'Impersonal HAY (there is / there are) with indefinite nouns',
        tier: 'tough',
        syllabusTopic: 'M3.There Is/Are (HAY)',
        description: 'You discover Arab baths and historic synagogues using HAY (there is / there are).',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-11',
            type: 'multiple-choice',
            prompt: '¿Por qué decimos "En Córdoba HAY muchos monumentos" pero "La Mezquita ESTÁ en el centro"?',
            englishPrompt: 'Why do we say "En Córdoba HAY muchos monumentos" but "La Mezquita ESTÁ en el centro"?',
            audioText: 'HAY para existencia indeterminada; ESTAR para ubicación determinada',
            options: [
              'HAY es solo singular y ESTAR es solo plural',
              'HAY para existencia indeterminada; ESTAR para ubicación determinada',
              'Son intercambiables sin diferencia de sentido',
              'HAY se usa solo para personas y ESTAR para edificios'
            ],
            correctAnswer: 'HAY para existencia indeterminada; ESTAR para ubicación determinada',
            explanation: 'HAY señala existencia de algo indeterminado o cuantitativo (un, una, muchos, tres...). ESTAR ubica un elemento concreto y determinado (con artículo el/la).',
            hints: ['Existencia indeterminada vs ubicación de algo conocido.'],
            syllabusRef: 'M3-HAY',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'cordoba-7',
        cityId: 'cordoba',
        levelNumber: 7,
        title: 'Ordering Time & Historical Sentences (Frases Temporales)',
        subtitle: 'Syntax of complete chronological sentences (sintaxis)',
        tier: 'hard',
        syllabusTopic: 'M3.Syntax (Sintaxis)',
        description: 'You write the historical visitor card on the Roman Bridge (la ficha).',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-12',
            type: 'word-order',
            prompt: 'Ordena la frase: "La visita guiada comienza a las diez y media de la mañana"',
            englishPrompt: 'Order the sentence: "The guided tour begins at ten thirty in the morning"',
            audioText: 'La visita guiada comienza a las diez y media de la mañana',
            sentencePieces: ['a', 'media', 'mañana', 'visita', 'las', 'La', 'guiada', 'comienza', 'diez', 'de', 'y', 'la'],
            correctAnswer: 'La visita guiada comienza a las diez y media de la mañana',
            explanation: 'Sujeto (La visita guiada) + verbo (comienza) + locución de tiempo (a las diez y media) + franja del día (de la mañana).',
            hints: ['Empieza por "La visita guiada comienza".'],
            syllabusRef: 'M3-HORA',
            difficulty: 'hard'
          }
        ]
      },
      {
        id: 'cordoba-8',
        cityId: 'cordoba',
        levelNumber: 8,
        title: 'Conversation at the Mosque Ticket Office (La Taquilla)',
        subtitle: 'Interactive ticket-buying dialogue with schedules (horarios)',
        tier: 'hard',
        syllabusTopic: 'M3.Communication (Comunicación)',
        description: 'You buy tickets (entradas) for the evening light and sound session.',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-13',
            type: 'dialogue',
            prompt: 'En la taquilla del Patio de los Naranjos:',
            englishPrompt: 'At the ticket counter in the Orange Tree Courtyard:',
            audioText: 'Buenas tardes. Tenemos pases a las ocho y a las nueve y cuarto. ¿Cuál prefiere?',
            correctAnswer: 'Buenas tardes. Dos entradas para el pase de las nueve y cuarto, por favor.',
            explanation: 'Respuesta comunicativa precisa que indica cantidad y el horario elegido.',
            hints: ['Pide dos entradas para uno de los dos horarios propuestos.'],
            syllabusRef: 'M3-HORA',
            difficulty: 'hard',
            dialogue: {
              npcName: 'Rafael',
              npcRole: 'Taquillero de la Mezquita de Córdoba',
              prompt: 'Buenas tardes. Tenemos pases a las ocho y a las nueve y cuarto. ¿Cuál prefiere?',
              englishPrompt: 'Good afternoon. We have time slots at eight and at quarter past nine. Which do you prefer?',
              choices: [
                {
                  id: 'c1',
                  text: 'Buenas tardes. Dos entradas para el pase de las nueve y cuarto, por favor.',
                  englishHint: 'Good afternoon. Two tickets for the quarter past nine slot, please.',
                  isCorrect: true,
                  npcResponse: 'Excelente. Aquí tiene sus dos entradas para las nueve y cuarto.',
                  explanation: 'Elección clara y educada.'
                },
                {
                  id: 'c2',
                  text: 'Mi perro tiene cinco meses.',
                  englishHint: 'My dog is five months old.',
                  isCorrect: false,
                  npcResponse: '¡Qué tierno! Pero necesito saber qué horario de visita desea.',
                  explanation: 'No responde a la elección de pases.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cordoba-9',
        cityId: 'cordoba',
        levelNumber: 9,
        title: 'Meeting on the Street of Flowers (Cita en la Calle de las Flores)',
        subtitle: 'Setting a date (fecha) and time (hora) for a meetup',
        tier: 'hot',
        syllabusTopic: 'M3.Communication (Comunicación)',
        description: 'You arrange to meet (quedar) a group of guitar students by the iconic alley.',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-14',
            type: 'fill-blank',
            prompt: 'Para proponer quedar a una hora decimos: "¿______ a las siete en la plaza?" (quedar).',
            englishPrompt: 'To propose meeting at a time: "¿Quedamos a las siete en la plaza?"',
            audioText: 'Quedamos',
            options: ['Somos', 'Hacemos', 'Quedamos', 'Estamos'],
            correctAnswer: 'Quedamos',
            explanation: 'El verbo "quedar" en primera persona plural (¿Quedamos?) es la fórmula conversacional por excelencia para proponer una cita.',
            hints: ['Verbo quedar en primera persona plural.'],
            syllabusRef: 'M3-HORA',
            difficulty: 'hot'
          }
        ]
      },
      {
        id: 'cordoba-10',
        cityId: 'cordoba',
        levelNumber: 10,
        title: 'Córdoba Time Mastery (Maestría Cronológica)',
        subtitle: 'Timed speed challenge before the astrological clock trial (el reloj)',
        tier: 'hot',
        syllabusTopic: 'M3.Synthesis (Síntesis)',
        description: 'The final test on hours (horas), dates (fechas), and the calendar (el calendario).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cor-15',
            type: 'multiple-choice',
            prompt: 'Si son las 13:15 en formato 24 horas, ¿cómo se dice en la conversación cotidiana española?',
            englishPrompt: 'If it is 13:15 in 24h format, how is it spoken in daily Spanish conversation?',
            audioText: 'Es la una y cuarto de la tarde',
            options: [
              'Son las trece y quince minutos',
              'Son la una y cuarto',
              'Es las una y quince',
              'Es la una y cuarto de la tarde'
            ],
            correctAnswer: 'Es la una y cuarto de la tarde',
            explanation: 'En lenguaje coloquial se usa formato de 12 horas con especificación de la tarde: "Es la una y cuarto de la tarde". Recuerda que la 1 siempre va en singular ("Es la...").',
            hints: ['Formato 12h: es la una y cuarto de la tarde.'],
            syllabusRef: 'M3-HORA',
            difficulty: 'hot'
          }
        ]
      }
    ],
    bossMission: {
      id: 'boss-cordoba',
      cityId: 'cordoba',
      title: 'El Reloj Astrológico de la Mezquita',
      characterName: 'Maestro Astrónomo Rafael de Córdoba',
      characterRole: 'Guardián del Tiempo Califal y las Efemérides',
      scenario: 'El antiguo reloj astrológico del minarete necesita ajuste. Para restablecer las campanas y recibir el mapa hacia la Costa del Sol en Málaga, debes sincronizar las horas, los meses y las fechas de fiesta sin margen de error.',
      objectives: [
        { id: 'cor-obj1', description: 'Expresar horas exactas en singular y plural con fracciones', syllabusTopic: 'M3.Hora' },
        { id: 'cor-obj2', description: 'Formular fechas completas con preposiciones obligatorias', syllabusTopic: 'M3.Fechas' },
        { id: 'cor-obj3', description: 'Distinguir el uso de HAY para servicios frente a ESTAR', syllabusTopic: 'M3.HAY' }
      ],
      requiredScorePercent: 80,
      xpReward: 350,
      coinReward: 500,
      badgeName: 'El Reloj de Sol de Córdoba',
      badgeIcon: '⌛',
      questions: [
        {
          id: 'b-cor-1',
          type: 'multiple-choice',
          prompt: 'Rafael: "Sincronice el toque mayor: son exactamente las 08:45 de la mañana. ¿Cómo debe anunciarlo?"',
          englishPrompt: 'Rafael: "Sync the main chime: it is exactly 8:45 AM. How must it be announced?"',
          audioText: 'Son las nueve menos cuarto de la mañana',
          options: [
              'Son las nueve menos cuarto de la mañana',
              'Es las ocho y cuarenta y cinco',
              'Son las ocho menos cuarto',
              'Es la nueve menos cuarto'
            ],
          correctAnswer: 'Son las nueve menos cuarto de la mañana',
          explanation: '8:45 se expresa en relación a la hora siguiente: "Son las nueve menos cuarto de la mañana".',
          hints: ['Nueve menos cuarto.'],
          syllabusRef: 'M3-HORA',
          difficulty: 'hard'
        },
        {
          id: 'b-cor-2',
          type: 'fill-blank',
          prompt: 'Rafael: "La gran fiesta histórica de Córdoba es el dieciséis ______ enero en la mezquita."',
          englishPrompt: 'Rafael: "The great historical festival of Córdoba is on the sixteenth of January in the mosque."',
          audioText: 'de',
          options: ['en', 'de', 'a', 'por'],
          correctAnswer: 'de',
          explanation: 'En las fechas en español es obligatoria la preposición "de" entre el día y el mes: el 16 de enero.',
          hints: ['Preposición "de".'],
          syllabusRef: 'M3-FECHAS',
          difficulty: 'hard'
        },
        {
          id: 'b-cor-3',
          type: 'word-order',
          prompt: 'Ordena la inscripción del reloj: "El tiempo pasa pero el arte permanece para siempre"',
          englishPrompt: 'Order the clock inscription: "Time passes but art remains forever"',
          audioText: 'El tiempo pasa pero el arte permanece para siempre',
          sentencePieces: ['para', 'permanece', 'El', 'pasa', 'arte', 'tiempo', 'pero', 'el', 'siempre'],
          correctAnswer: 'El tiempo pasa pero el arte permanece para siempre',
          explanation: 'Oración compuesta: Proposición 1 (El tiempo pasa) + conjunción adversativa (pero) + Proposición 2 (el arte permanece para siempre).',
          hints: ['Comienza por "El tiempo pasa".'],
          syllabusRef: 'M3-Sintaxis',
          difficulty: 'hot'
        }
      ]
    }
  },
  {
    id: 'malaga',
    number: 8,
    name: 'Málaga',
    region: 'Andalucía',
    landmark: 'Playa de la Malagueta & Castillo de Gibralfaro',
    description: 'The capital of the Costa del Sol, bathed by the Mediterranean Sea. Here you will master weather expressions (el clima), the weather uses of the verb HACER, and atmospheric phenomena.',
    moduleIndex: 3,
    moduleName: 'Module 3: The Weather (El Tiempo) & the Verb HACER',
    coordinates: { x: 43.0, y: 86.5 },
    accentColor: '#0EA5E9',
    levels: [
      {
        id: 'malaga-1',
        cityId: 'malaga',
        levelNumber: 1,
        title: 'The Weather at La Malagueta (El Tiempo)',
        subtitle: 'Expressions with HACER: hace sol (sunny), hace calor (hot), hace buen tiempo (nice weather)',
        tier: 'easy',
        syllabusTopic: 'M3.Weather (El Clima)',
        description: 'Under the radiant coastal sky, you learn to describe the weather conditions of the day (el tiempo).',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-1',
            type: 'multiple-choice',
            prompt: '¿Cómo decimos en español "It is sunny and hot today"?',
            englishPrompt: 'How do we say in Spanish "It is sunny and hot today"?',
            audioText: 'Hoy hace sol y hace calor',
            options: ['Hoy está sol y está calor', 'Hoy es sol y es caliente', 'Hoy hace sol y hace calor', 'Hoy tiene sol y tiene calor'],
            correctAnswer: 'Hoy hace sol y hace calor',
            explanation: 'En español los fenómenos atmosféricos de temperatura y sol se construyen obligatoriamente con el verbo HACER impersonal: "Hace sol", "Hace calor", "Hace frío", "Hace viento".',
            hints: ['En español el clima "hace", no "está".'],
            syllabusRef: 'M3-HACER',
            difficulty: 'easy'
          },
          {
            id: 'm3-mal-2',
            type: 'fill-blank',
            prompt: 'Para decir que el clima es agradable decimos: "Hoy hace ______ tiempo."',
            englishPrompt: 'To say the weather is pleasant we say: "Hoy hace buen tiempo."',
            audioText: 'buen',
            options: ['bien', 'bueno', 'bonito', 'buen'],
            correctAnswer: 'buen',
            explanation: '"Buen tiempo" (bueno se apocopa a "buen" antes de un sustantivo masculino singular como tiempo).',
            hints: ['Forma apocopada de bueno: b-u-e-n.'],
            syllabusRef: 'M3-HACER',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'malaga-2',
        cityId: 'malaga',
        levelNumber: 2,
        title: 'Weather Phenomena: Rain, Snow & Clouds (Llueve, Nieva, Nublado)',
        subtitle: 'Impersonal weather verbs (llover, nevar) and ESTAR',
        tier: 'easy',
        syllabusTopic: 'M3.Weather (El Clima)',
        description: 'You spot the clouds (las nubes) over Sierra Nevada from the Port of Málaga.',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-3',
            type: 'multiple-choice',
            prompt: '¿Cómo se dice "It is raining" en español?',
            englishPrompt: 'How do you say "It is raining" in Spanish?',
            audioText: 'Llueve o está lloviendo',
            options: ['Llueve', 'Hace lluvia', 'Es lloviendo', 'Tiene lluvia'],
            correctAnswer: 'Llueve',
            explanation: 'Llover es un verbo impersonal con cambio vocálico o -> ue: "Llueve" (o en perífrasis "está lloviendo"). No se dice "hace lluvia".',
            hints: ['Forma del verbo llover en presente.'],
            syllabusRef: 'M3-CLIMA',
            difficulty: 'easy'
          },
          {
            id: 'm3-mal-4',
            type: 'fill-blank',
            prompt: 'Cuando el cielo está cubierto de nubes decimos: "El cielo ______ nublado."',
            englishPrompt: 'When the sky is covered with clouds we say: "El cielo está nublado."',
            audioText: 'está',
            options: ['hace', 'está', 'es', 'tiene'],
            correctAnswer: 'está',
            explanation: 'Estar nublado / despejado se construye con ESTAR porque describe el estado transitorio del cielo.',
            hints: ['Estado temporal del cielo = verbo ESTAR.'],
            syllabusRef: 'M3-CLIMA',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'malaga-3',
        cityId: 'malaga',
        levelNumber: 3,
        title: 'The Verb HACER in Present Tense (El Verbo HACER)',
        subtitle: 'Full conjugation of HACER (to do/make): hago, haces, hace, hacemos, hacéis, hacen',
        tier: 'medium',
        syllabusTopic: 'M3.Verb HACER (Verbo HACER)',
        description: 'At the Palmeral de las Sorpresas, you review the personal conjugation of HACER.',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-5',
            type: 'multiple-choice',
            prompt: '¿Cuál es la primera persona singular (yo) del verbo HACER?',
            englishPrompt: 'What is the first person singular (yo) of the verb HACER?',
            audioText: 'yo hago',
            options: ['haco', 'haces', 'hago', 'haze'],
            correctAnswer: 'hago',
            explanation: 'HACER tiene una primera persona singular irregular en -go: Yo hago.',
            hints: ['Termina en -go.'],
            syllabusRef: 'M3-HACER',
            difficulty: 'medium'
          },
          {
            id: 'm3-mal-6',
            type: 'fill-blank',
            prompt: 'Completa: "¿Qué ______ vosotros los fines de semana en Málaga?"',
            englishPrompt: 'Complete: "What do you all do on weekends in Malaga?"',
            audioText: 'hacéis',
            options: ['hacemos', 'hacen', 'hago', 'hacéis'],
            correctAnswer: 'hacéis',
            explanation: 'La forma de vosotros para HACER es "hacéis" con tilde en la e.',
            hints: ['Forma de vosotros del verbo hacer.'],
            syllabusRef: 'M3-HACER',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'malaga-4',
        cityId: 'malaga',
        levelNumber: 4,
        title: 'The Four Seasons of the Year (Las Cuatro Estaciones)',
        subtitle: 'Spring (primavera), summer (verano), autumn (otoño), winter (invierno) & temperatures',
        tier: 'medium',
        syllabusTopic: 'M3.Weather (El Clima)',
        description: 'You compare the seasons of the year (las estaciones) and their average temperatures.',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-7',
            type: 'multiple-choice',
            prompt: '¿En qué estación del año hace más calor y la gente va a la playa?',
            englishPrompt: 'In which season of the year is it hottest and people go to the beach?',
            audioText: 'En verano',
            options: ['En verano', 'En invierno', 'En otoño', 'En primavera'],
            correctAnswer: 'En verano',
            explanation: 'El verano es la estación más calurosa (junio, julio, agosto). El invierno es la más fría.',
            hints: ['Estación de las vacaciones estivales.'],
            syllabusRef: 'M3-CLIMA',
            difficulty: 'medium'
          },
          {
            id: 'm3-mal-8',
            type: 'fill-blank',
            prompt: 'En Sierra Nevada durante el invierno ______ (snows) con frecuencia.',
            englishPrompt: 'In Sierra Nevada during the winter it snows frequently.',
            audioText: 'nieva',
            options: ['llueve', 'nieva', 'hace sol', 'está caliente'],
            correctAnswer: 'nieva',
            explanation: 'Nevar es verbo impersonal con diptongo e -> ie: "nieva".',
            hints: ['Del verbo nevar: n-i-e-v-a.'],
            syllabusRef: 'M3-CLIMA',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'malaga-5',
        cityId: 'malaga',
        levelNumber: 5,
        title: 'The Levante Wind at the Port (El Viento en el Puerto)',
        subtitle: 'Expressions: hace mucho viento (very windy), hay niebla (it is foggy)',
        tier: 'tough',
        syllabusTopic: 'M3.Weather (El Clima)',
        description: 'The fishermen tie down their boats because of the strong Levante wind (el viento).',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-9',
            type: 'multiple-choice',
            prompt: 'Para advertir que sopla mucho viento en el muelle decimos:',
            englishPrompt: 'To warn that a lot of wind is blowing on the pier we say:',
            audioText: 'Hoy hace mucho viento en el puerto',
            options: [
              'Hoy es mucho viento en el puerto',
              'Hoy está muy viento en el puerto',
              'Hoy hace mucho viento en el puerto',
              'Hoy tiene mucho viento en el puerto'
            ],
            correctAnswer: 'Hoy hace mucho viento en el puerto',
            explanation: 'Se utiliza "HACER + mucho + sustantivo": "Hace mucho viento", "Hace mucho frío", "Hace mucho calor". Nunca "muy viento".',
            hints: ['Hacer + mucho + viento.'],
            syllabusRef: 'M3-MUY-MUCHO',
            difficulty: 'tough'
          },
          {
            id: 'm3-mal-10',
            type: 'fill-blank',
            prompt: 'Para indicar presencia de niebla que dificulta la visibilidad: "En el mar ______ mucha niebla."',
            englishPrompt: 'To indicate fog hindering visibility: "In the sea there is a lot of fog."',
            audioText: 'hay',
            options: ['hace', 'es', 'está', 'hay'],
            correctAnswer: 'hay',
            explanation: 'Para la niebla, tormentas o nubes se emplea comúnmente el verbo impersonal "HAY": "Hay niebla", "Hay tormenta".',
            hints: ['Forma impersonal del verbo haber: h-a-y.'],
            syllabusRef: 'M3-HAY',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'malaga-6',
        cityId: 'malaga',
        levelNumber: 6,
        title: 'Weather Forecast at the Lighthouse (Previsión del Tiempo)',
        subtitle: 'Understanding weather bulletins and forecasts (pronósticos del tiempo)',
        tier: 'tough',
        syllabusTopic: 'M3.Weather (El Clima)',
        description: 'You listen to the marine radio next to La Farola lighthouse in Málaga (el faro).',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-11',
            type: 'multiple-choice',
            prompt: 'El locutor dice: "Mañana bajan las temperaturas y estará nublado con posibilidad de chubascos". ¿Qué debes llevar?',
            englishPrompt: 'The announcer says: "Tomorrow temperatures drop and it will be cloudy with possible showers". What should you bring?',
            audioText: 'Un paraguas y una chaqueta',
            options: ['Un paraguas y una chaqueta', 'Bañador y crema solar', 'Gafas de sol y chanclas', 'Un sombrero de paja'],
            correctAnswer: 'Un paraguas y una chaqueta',
            explanation: 'Si bajan las temperaturas hace más frío (chaqueta) y si hay chubascos llueve (paraguas).',
            hints: ['Comprensión lógica de lluvia y frío.'],
            syllabusRef: 'M3-CLIMA',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'malaga-7',
        cityId: 'malaga',
        levelNumber: 7,
        title: 'Building Weather Forecasts (Pronósticos del Tiempo)',
        subtitle: 'Syntax combining weather (tiempo), place (lugar), and degrees Celsius',
        tier: 'hard',
        syllabusTopic: 'M3.Syntax (Sintaxis)',
        description: 'You write the weather report (el informe del tiempo) for visitors at Gibralfaro Castle.',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-12',
            type: 'word-order',
            prompt: 'Ordena la frase: "En la costa mediterránea hace sol y veinticinco grados"',
            englishPrompt: 'Order the sentence: "On the Mediterranean coast it is sunny and 25 degrees"',
            audioText: 'En la costa mediterránea hace sol y veinticinco grados',
            sentencePieces: ['mediterránea', 'sol', 'la', 'veinticinco', 'hace', 'grados', 'costa', 'En', 'y'],
            correctAnswer: 'En la costa mediterránea hace sol y veinticinco grados',
            explanation: 'Locución de lugar (En la costa mediterránea) + verbo meteorológico HACER (hace sol) + conjunción y temperatura (y veinticinco grados).',
            hints: ['Comienza por "En la costa mediterránea".'],
            syllabusRef: 'M3-HACER',
            difficulty: 'hard'
          }
        ]
      },
      {
        id: 'malaga-8',
        cityId: 'malaga',
        levelNumber: 8,
        title: 'Dialogue with Sailor Manuel (Diálogo en el Puerto)',
        subtitle: 'Casual conversation about sea conditions (el mar) and the wind (el viento)',
        tier: 'hard',
        syllabusTopic: 'M3.Communication (Comunicación)',
        description: 'Manuel prepares his nets and shares the maritime weather report (el parte marítimo).',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-13',
            type: 'dialogue',
            prompt: 'Charla en el puerto pesquero:',
            englishPrompt: 'Chat at the fishing port:',
            audioText: '¡Buenos días! Parece que hoy el viento amaina. ¿Vas a subir al mirador de Gibralfaro?',
            correctAnswer: 'Buenos días, Manuel. Sí, hoy hace un día estupendo y hace sol.',
            explanation: 'Respuesta comunicativa óptima utilizando expresiones idiomáticas de clima con HACER.',
            hints: ['Saluda e indica que hace un día estupendo de sol.'],
            syllabusRef: 'M3-HACER',
            difficulty: 'hard',
            dialogue: {
              npcName: 'Manuel',
              npcRole: 'Patrón de Barco Malagueño',
              prompt: '¡Buenos días! Parece que hoy el viento amaina. ¿Vas a subir al mirador de Gibralfaro?',
              englishPrompt: 'Good morning! Seems like wind is calming today. Are you going up to Gibralfaro viewpoint?',
              choices: [
                {
                  id: 'c2',
                  text: 'Mi primo tiene veintidós años y vive en Londres.',
                  englishHint: 'My cousin is 22 years old and lives in London.',
                  isCorrect: false,
                  npcResponse: 'Me parece estupendo, pero te preguntaba por tu excursión de hoy.',
                  explanation: 'Fuera de contexto.'
                },
                {
                  id: 'c1',
                  text: 'Buenos días, Manuel. Sí, hoy hace un día estupendo y hace sol.',
                  englishHint: 'Good morning, Manuel. Yes, today is a great day and it is sunny.',
                  isCorrect: true,
                  npcResponse: '¡Maravilloso! Desde arriba verás toda la bahía y hasta la costa africana.',
                  explanation: 'Excelente uso del verbo HACER para clima agradable.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'malaga-9',
        cityId: 'malaga',
        levelNumber: 9,
        title: 'Breezy Walk up Gibralfaro (Tener Calor / Frío)',
        subtitle: 'Distinguishing physical temperature sensations with TENER (tener calor / tener frío)',
        tier: 'hot',
        syllabusTopic: 'M3.Sensations with TENER (Tener Sensaciones)',
        description: 'After climbing the steep hill, you feel the midday heat (tener calor).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-14',
            type: 'multiple-choice',
            prompt: 'Para decir "I am cold / I am hot" refiriéndose a una persona en español decimos:',
            englishPrompt: 'To say "I am cold / I am hot" referring to a person in Spanish we say:',
            audioText: 'Tengo frío / Tengo calor',
            options: ['Soy frío / Soy caliente', 'Tengo frío / Tengo calor', 'Estoy frío / Estoy calor', 'Hago frío / Hago calor'],
            correctAnswer: 'Tengo frío / Tengo calor',
            explanation: 'Las sensaciones térmicas personales se expresan con TENER: "Tengo frío", "Tengo calor". El clima ambiental se expresa con HACER: "Hace frío", "Hace calor". ¡Nunca "Soy caliente"!',
            hints: ['Una persona TIENE frío o calor; el ambiente HACE frío o calor.'],
            syllabusRef: 'M3-CLIMA',
            difficulty: 'hot'
          }
        ]
      },
      {
        id: 'malaga-10',
        cityId: 'malaga',
        levelNumber: 10,
        title: 'Mediterranean Weather Challenge (Reto Climatológico)',
        subtitle: 'Combining weather verbs (HACER) and physical sensations (TENER)',
        tier: 'hot',
        syllabusTopic: 'M3.Synthesis (Síntesis)',
        description: 'A quick review before the Port Captain exam (el examen).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm3-mal-15',
            type: 'fill-blank',
            prompt: 'Completa: "En la playa ______ mucho calor y los bañistas ______ sed."',
            englishPrompt: 'Complete: "On the beach it is very hot and swimmers are thirsty."',
            audioText: 'hace / tienen',
            options: ['está / son', 'es / están', 'hace / tienen', 'tiene / hacen'],
            correctAnswer: 'hace / tienen',
            explanation: 'El clima atmosférico lleva HACER (hace mucho calor) y la sensación fisiológica de sed lleva TENER (tienen sed).',
            hints: ['Hacer para el clima y TENER para la sed.'],
            syllabusRef: 'M3-HACER',
            difficulty: 'hot'
          }
        ]
      }
    ],
    bossMission: {
      id: 'boss-malaga',
      cityId: 'malaga',
      title: 'El Capitán del Puerto de Málaga',
      characterName: 'Capitán Manuel del Mar',
      characterRole: 'Jefe de Capitanía Marítima y Meteorología Costera',
      scenario: 'Una regata de veleros históricos zarpará hacia la bahía de Cádiz. Para que el Capitán Manuel autorice tu salida por mar, debes descifrar sin equivocarte el mapa isobárico, la temperatura, el viento y las expresiones del clima.',
      objectives: [
        { id: 'mal-obj1', description: 'Dominar la distinción entre HACER (clima) y TENER (sensaciones corporales)', syllabusTopic: 'M3.Clima' },
        { id: 'mal-obj2', description: 'Reconocer verbos de precipitación y estados del cielo con ESTAR', syllabusTopic: 'M3.VerboHACER' },
        { id: 'mal-obj3', description: 'Formular boletines de navegación precisos', syllabusTopic: 'M3.Comunicacion' }
      ],
      requiredScorePercent: 80,
      xpReward: 350,
      coinReward: 500,
      badgeName: 'La Rosa de los Vientos de Málaga',
      badgeIcon: '🧭',
      questions: [
        {
          id: 'b-mal-1',
          type: 'multiple-choice',
          prompt: 'Capitán Manuel: "Describa las condiciones para la tripulación: el cielo no tiene nubes y el aire está caliente. ¿Cuál es la formulación náutica idónea?"',
          englishPrompt: 'Capitán Manuel: "Describe conditions: cloudless sky and hot air. Which is the correct nautical phrasing?"',
          audioText: 'El cielo está despejado y hace mucho calor en la bahía.',
          options: [
              'El cielo es despejado y está mucho calor en la bahía.',
              'El cielo tiene despejado y es mucho calor en la bahía.',
              'El cielo hace despejado y tiene mucho calor en la bahía.',
              'El cielo está despejado y hace mucho calor en la bahía.'
            ],
          correctAnswer: 'El cielo está despejado y hace mucho calor en la bahía.',
          explanation: 'ESTAR despejado (estado del cielo) + HACER mucho calor (clima ambiental).',
          hints: ['ESTAR para despejado y HACER para calor.'],
          syllabusRef: 'M3-CLIMA',
          difficulty: 'hard'
        },
        {
          id: 'b-mal-2',
          type: 'fill-blank',
          prompt: 'Capitán Manuel: "Los marineros ______ frío por la noche y por eso se abrigan bien (tener)."',
          englishPrompt: 'Capitán Manuel: "Sailors are cold at night and therefore bundle up well (tener)."',
          audioText: 'tienen',
          options: ['tienen', 'hacen', 'son', 'están'],
          correctAnswer: 'tienen',
          explanation: 'Sensación fisiológica personal = verbo TENER (ellos tienen frío).',
          hints: ['Tercera persona plural de TENER.'],
          syllabusRef: 'M3-CLIMA',
          difficulty: 'hard'
        },
        {
          id: 'b-mal-3',
          type: 'word-order',
          prompt: 'Ordena el parte de salida: "Zarpamos con viento favorable hacia el estrecho de Gibraltar"',
          englishPrompt: 'Order departure log: "We set sail with favorable wind towards the Strait of Gibraltar"',
          audioText: 'Zarpamos con viento favorable hacia el estrecho de Gibraltar',
          sentencePieces: ['favorable', 'Zarpamos', 'Gibraltar', 'hacia', 'el', 'viento', 'de', 'con', 'estrecho'],
          correctAnswer: 'Zarpamos con viento favorable hacia el estrecho de Gibraltar',
          explanation: 'Verbo de navegación (Zarpamos) + complemento instrumental (con viento favorable) + complemento de destino (hacia el estrecho de Gibraltar).',
          hints: ['Comienza por "Zarpamos con viento favorable".'],
          syllabusRef: 'M3-Sintaxis',
          difficulty: 'hot'
        }
      ]
    }
  },
  {
    id: 'cadiz',
    number: 9,
    name: 'Cádiz',
    region: 'Andalucía',
    landmark: 'Playa de La Caleta & Torre Tavira',
    description: 'The 3,000-year-old city known as "La Tacita de Plata". Here you will wrap up Module 3 by mastering the verb GUSTAR (to like), possessive adjectives (posesivos), HAY, and the vital difference between MUY and MUCHO.',
    moduleIndex: 3,
    moduleName: 'Module 3: Likes (GUSTAR), Possessives (Posesivos), HAY & MUY vs MUCHO',
    coordinates: { x: 30.0, y: 87.0 },
    accentColor: '#D97706',
    levels: [
      {
        id: 'cadiz-1',
        cityId: 'cadiz',
        levelNumber: 1,
        title: 'Me Gusta & Me Encanta at La Caleta (Gustos)',
        subtitle: 'How singular (gusta) and plural (gustan) forms of GUSTAR work',
        tier: 'easy',
        syllabusTopic: 'M3.Likes (Gustos)',
        description: 'Facing San Sebastián Castle, you express your preferences and passions (me gusta / me encanta).',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-1',
            type: 'multiple-choice',
            prompt: '¿Por qué decimos "Me GUSTA la música" pero "Me GUSTAN las canciones"?',
            englishPrompt: 'Why do we say "Me GUSTA la música" but "Me GUSTAN las canciones"?',
            audioText: 'Porque el verbo concuerda con lo que nos gusta (el sujeto gramatical)',
            options: [
              'Porque "música" es femenina y "canciones" es masculino',
              'Porque el verbo concuerda con lo que nos gusta (el sujeto pospuesto)',
              'Porque depende de la edad de la persona que habla',
              'Es una variación opcional sin regla fija'
            ],
            correctAnswer: 'Porque el verbo concuerda con lo que nos gusta (el sujeto pospuesto)',
            explanation: 'En español el verbo GUSTAR funciona como "to please": lo que gusta es el sujeto gramatical. Singular: me gusta la música; Plural: me gustan las canciones.',
            hints: ['El sujeto es la cosa que produce el gusto.'],
            syllabusRef: 'M3-GUSTOS',
            difficulty: 'easy'
          },
          {
            id: 'm3-cad-2',
            type: 'fill-blank',
            prompt: 'Para expresar un entusiasmo aún mayor que gustar usamos encantar: "Me ______ el mar gaditano."',
            englishPrompt: 'To express even greater enthusiasm we use encantar: "Me encanta el mar gaditano."',
            audioText: 'encanta',
            options: ['encantan', 'encanto', 'encanta', 'encante'],
            correctAnswer: 'encanta',
            explanation: '"El mar gaditano" es singular, por tanto se usa "me encanta". Si son "las playas", usamos "me encantan".',
            hints: ['Singular concordante con "el mar".'],
            syllabusRef: 'M3-GUSTOS',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'cadiz-2',
        cityId: 'cadiz',
        levelNumber: 2,
        title: 'Unstressed Possessive Adjectives (Adjetivos Posesivos)',
        subtitle: 'My, your, his/her, our, your (pl.), their: mi, tu, su, nuestro, vuestro, su',
        tier: 'easy',
        syllabusTopic: 'M3.Possessives (Posesivos)',
        description: 'You describe your belongings and those of your travel companions (mi, tu, su).',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-3',
            type: 'multiple-choice',
            prompt: '¿Cómo se dice en español "Our friends" concordando en género y número?',
            englishPrompt: 'How do you say in Spanish "Our friends" agreeing in gender and number?',
            audioText: 'Nuestros amigos',
            options: ['Nuestro amigos', 'Nuestras amigos', 'Mis amigos', 'Nuestros amigos'],
            correctAnswer: 'Nuestros amigos',
            explanation: '"Nuestro" cambia en género y número: nuestro amigo, nuestra amiga, nuestros amigos, nuestras amigas.',
            hints: ['Masculino plural: termina en -os.'],
            syllabusRef: 'M3-POSESIVOS',
            difficulty: 'easy'
          },
          {
            id: 'm3-cad-4',
            type: 'fill-blank',
            prompt: 'Para referirnos al libro que te pertenece a ti (informal singular): "______ libro".',
            englishPrompt: 'To refer to the book belonging to you (informal): "tu libro".',
            audioText: 'tu',
            options: ['tu', 'tú', 'te', 'ti'],
            correctAnswer: 'tu',
            explanation: '"Tu" (sin tilde) es el adjetivo posesivo: "tu libro". "Tú" (con tilde diacrítica) es el pronombre personal de sujeto: "Tú lees".',
            hints: ['Sin tilde diacrítica: t-u.'],
            syllabusRef: 'M3-POSESIVOS',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'cadiz-3',
        cityId: 'cadiz',
        levelNumber: 3,
        title: 'Pronouns with GUSTAR (Me, Te, Le, Nos, Os, Les)',
        subtitle: 'Indirect object pronouns with GUSTAR: me, te, le, nos, os, les gusta/n',
        tier: 'medium',
        syllabusTopic: 'M3.Likes (Gustos)',
        description: 'You ask members of a Cádiz carnival group (comparsa) what hobbies they enjoy.',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-5',
            type: 'multiple-choice',
            prompt: '¿Cómo le preguntas a un amigo qué cosas le gustan en su tiempo libre?',
            englishPrompt: 'How do you ask a friend what things they like in their free time?',
            audioText: '¿Qué te gusta hacer?',
            options: ['¿Qué tú gustas hacer?', '¿Qué te gusta hacer?', '¿Qué me gusta hacer?', '¿Cómo te gustas?'],
            correctAnswer: '¿Qué te gusta hacer?',
            explanation: 'Para la segunda persona informal (tú) se usa el pronombre de objeto indirecto "te": "¿Qué te gusta...?"',
            hints: ['Pronombre "te" para segunda persona.'],
            syllabusRef: 'M3-GUSTOS',
            difficulty: 'medium'
          },
          {
            id: 'm3-cad-6',
            type: 'fill-blank',
            prompt: 'A nosotros nos encanta el Carnaval de Cádiz: "A nosotros ______ gustan las chirigotas."',
            englishPrompt: 'We love Cadiz Carnival: "A nosotros nos gustan las chirigotas."',
            audioText: 'nos',
            options: ['os', 'les', 'nos', 'me'],
            correctAnswer: 'nos',
            explanation: 'Para la primera persona del plural (nosotros) corresponde el pronombre "nos": A nosotros nos gustan...',
            hints: ['Pronombre de objeto para nosotros: n-o-s.'],
            syllabusRef: 'M3-GUSTOS',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'cadiz-4',
        cityId: 'cadiz',
        levelNumber: 4,
        title: 'Plural & Formal Possessives (Posesivos de Cortesía)',
        subtitle: 'Su / sus for usted, él, ella, and ustedes',
        tier: 'medium',
        syllabusTopic: 'M3.Possessives (Posesivos)',
        description: 'You practice polite possessive forms (su / sus) at the Gran Teatro Falla.',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-7',
            type: 'multiple-choice',
            prompt: 'Si hablamos con respeto a una señora (usted), ¿cómo decimos "Your tickets, madam"?',
            englishPrompt: 'If addressing a lady with respect (usted), how do we say "Your tickets, madam"?',
            audioText: 'Sus entradas, señora',
            options: ['Tus entradas, señora', 'Vuestras entradas, señora', 'Mis entradas, señora', 'Sus entradas, señora'],
            correctAnswer: 'Sus entradas, señora',
            explanation: 'Para el tratamiento formal de "usted" y "ustedes", el adjetivo posesivo es "su" (singular) o "sus" (plural): sus entradas.',
            hints: ['Posesivo formal de tercera persona.'],
            syllabusRef: 'M3-POSESIVOS',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'cadiz-5',
        cityId: 'cadiz',
        levelNumber: 5,
        title: 'The Vital Difference: MUY vs MUCHO',
        subtitle: 'Muy + adjective/adverb vs Mucho/a/os/as + noun or verb + mucho',
        tier: 'tough',
        syllabusTopic: 'M3.MUY vs MUCHO',
        description: 'The essential rule to sound natural and avoid the most common beginner mistake (muy vs mucho).',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-8',
            type: 'multiple-choice',
            prompt: '¿Por qué decimos "Cádiz es MUY bonita" pero "En Cádiz hay MUCHAS flores"?',
            englishPrompt: 'Why do we say "Cádiz es MUY bonita" but "En Cádiz hay MUCHAS flores"?',
            audioText: 'MUY intensifica adjetivos (invariable); MUCHO cuantifica sustantivos (concordante)',
            options: [
              'MUY intensifica adjetivos (invariable); MUCHO cuantifica sustantivos (concordante)',
              'MUY es para el sur de España y MUCHO para el norte',
              'Son sinónimos intercambiables',
              'MUCHO solo se usa en preguntas y MUY en respuestas'
            ],
            correctAnswer: 'MUY intensifica adjetivos (invariable); MUCHO cuantifica sustantivos (concordante)',
            explanation: 'MUY es adverbio invariable y acompaña a adjetivos y adverbios (muy alta, muy bien). MUCHO es adjetivo cuantitativo y concuerda con el sustantivo (mucho dinero, muchas flores) o adverbio tras verbo (trabajo mucho).',
            hints: ['MUY + adjetivo; MUCHO + sustantivo.'],
            syllabusRef: 'M3-MUY-MUCHO',
            difficulty: 'tough'
          },
          {
            id: 'm3-cad-9',
            type: 'fill-blank',
            prompt: 'Completa: "Los gaditanos cantan ______ bien y tienen ______ alegría."',
            englishPrompt: 'Complete: "Gaditanos sing very well and have lots of joy."',
            audioText: 'muy / mucha',
            options: ['mucho / muy', 'muy / mucha', 'muy / muy', 'mucha / mucha'],
            correctAnswer: 'muy / mucha',
            explanation: '"Bien" es adverbio -> "muy bien". "Alegría" es sustantivo femenino -> "mucha alegría".',
            hints: ['Primero MUY ante adverbio, luego MUCHA ante sustantivo femenino.'],
            syllabusRef: 'M3-MUY-MUCHO',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'cadiz-6',
        cityId: 'cadiz',
        levelNumber: 6,
        title: 'HAY vs ESTAR in the Bay of Cádiz',
        subtitle: 'Existence (HAY: there is/are) vs precise location (ESTAR: is located)',
        tier: 'tough',
        syllabusTopic: 'M3.There Is/Are (HAY)',
        description: 'From Torre Tavira through the camera obscura, you observe the entire bay (hay vs está).',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-10',
            type: 'multiple-choice',
            prompt: 'Identifica la frase con el uso correcto de HAY y ESTAR:',
            englishPrompt: 'Identify the sentence with correct use of HAY and ESTAR:',
            audioText: 'En el puerto hay tres barcos y la catedral está a la izquierda.',
            options: [
              'En el puerto están tres barcos y la catedral hay a la izquierda.',
              'En el puerto son tres barcos y la catedral es a la izquierda.',
              'En el puerto hay tres barcos y la catedral está a la izquierda.',
              'En el puerto tiene tres barcos y la catedral está a la izquierda.'
            ],
            correctAnswer: 'En el puerto hay tres barcos y la catedral está a la izquierda.',
            explanation: 'HAY con número cardinal indeterminado (hay tres barcos) y ESTAR con elemento determinado y dirección (la catedral está a la izquierda).',
            hints: ['Hay + cantidad; estar + lugar determinado.'],
            syllabusRef: 'M3-HAY',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'cadiz-7',
        cityId: 'cadiz',
        levelNumber: 7,
        title: 'Expressing Likes & Disagreements (Gustos y Desacuerdos)',
        subtitle: 'Me too (a mí también), me neither (a mí tampoco), I do (a mí sí), I do not (a mí no)',
        tier: 'hard',
        syllabusTopic: 'M3.Likes (Gustos)',
        description: 'You share music and food preferences (gustos) with young locals in Cádiz.',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-11',
            type: 'multiple-choice',
            prompt: 'Si alguien te dice "No me gusta el frío" y tú estás de acuerdo con esa negación, respondes:',
            englishPrompt: 'If someone tells you "I don\'t like the cold" and you agree with that negative statement, you reply:',
            audioText: 'A mí tampoco',
            options: ['A mí también', 'A mí sí', 'Yo también', 'A mí tampoco'],
            correctAnswer: 'A mí tampoco',
            explanation: 'Para coincidir con una frase negativa ("No me gusta...") se utiliza "A mí tampoco". ("A mí también" solo se usa para coincidir con afirmaciones).',
            hints: ['Coincidir con una frase negativa = tampoco.'],
            syllabusRef: 'M3-GUSTOS',
            difficulty: 'hard'
          }
        ]
      },
      {
        id: 'cadiz-8',
        cityId: 'cadiz',
        levelNumber: 8,
        title: 'Dialogue with Lola\'s Chirigota (La Chirigota de Lola)',
        subtitle: 'Conversation about costumes (disfraces), carnival songs (coplas), and popular hobbies',
        tier: 'hard',
        syllabusTopic: 'M3.Communication (Comunicación)',
        description: 'Lola rehearses a verse and asks what kind of music you love (te apasiona).',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-12',
            type: 'dialogue',
            prompt: 'En el local de ensayo de la chirigota:',
            englishPrompt: 'At the chirigota rehearsal hall:',
            audioText: '¡Oye pisha! ¿A ti te gusta cantar o prefieres tocar la guitarra española?',
            correctAnswer: 'Me encanta escuchar las chirigotas y me gusta mucho la guitarra española.',
            explanation: 'Respuesta comunicativa y natural que combina el verbo encantar y gustar con cuantificador.',
            hints: ['Indica tus gustos musicales con encantar y gustar.'],
            syllabusRef: 'M3-GUSTOS',
            difficulty: 'hard',
            dialogue: {
              npcName: 'Lola la del Falla',
              npcRole: 'Directora de Chirigota de Cádiz',
              prompt: '¡Oye pisha! ¿A ti te gusta cantar o prefieres tocar la guitarra española?',
              englishPrompt: 'Hey friend! Do you like to sing or do you prefer playing Spanish guitar?',
              choices: [
                {
                  id: 'c1',
                  text: 'Me encanta escuchar las chirigotas y me gusta mucho la guitarra española.',
                  englishHint: 'I love listening to chirigotas and I like Spanish guitar very much.',
                  isCorrect: true,
                  npcResponse: '¡Ole tu arte! Con esa afición te vienes con nosotros en la carroza.',
                  explanation: 'Respuesta llena de compás comunicativo y gramática impecable.'
                },
                {
                  id: 'c2',
                  text: 'Son las cuatro menos diez de la tarde.',
                  englishHint: 'It is ten to four in the afternoon.',
                  isCorrect: false,
                  npcResponse: '¡Pues no queda tiempo ni ná! Pero te preguntaba por tus gustos.',
                  explanation: 'Fuera de contexto.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cadiz-9',
        cityId: 'cadiz',
        levelNumber: 9,
        title: 'Hobby Debate on the Seafront (El Malecón)',
        subtitle: 'Sentence syntax with gustar + infinitive (gustar + infinitivo)',
        tier: 'hot',
        syllabusTopic: 'M3.Syntax (Sintaxis)',
        description: 'You build sentences expressing hobbies using infinitive verbs (gustar + infinitivo).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-13',
            type: 'word-order',
            prompt: 'Ordena la frase: "A mis amigos les gusta pasear por la playa al atardecer"',
            englishPrompt: 'Order the sentence: "My friends like to walk along the beach at sunset"',
            audioText: 'A mis amigos les gusta pasear por la playa al atardecer',
            sentencePieces: ['gusta', 'atardecer', 'playa', 'amigos', 'A', 'al', 'pasear', 'mis', 'les', 'por', 'la'],
            correctAnswer: 'A mis amigos les gusta pasear por la playa al atardecer',
            explanation: 'Enfático (A mis amigos) + pronombre OI (les) + gusta singular porque el sujeto es un infinitivo (pasear) + complementos de lugar y tiempo.',
            hints: ['Cuando lo que gusta es un infinitivo (pasear), el verbo siempre va en singular: gusta.'],
            syllabusRef: 'M3-GUSTOS',
            difficulty: 'hot'
          }
        ]
      },
      {
        id: 'cadiz-10',
        cityId: 'cadiz',
        levelNumber: 10,
        title: 'Module 3 Finale (Culminación del Módulo 3)',
        subtitle: 'Grand review of time (hora), dates (fechas), weather (clima), likes (gustos), and MUY vs MUCHO',
        tier: 'hot',
        syllabusTopic: 'M3.Synthesis (Síntesis)',
        description: 'The ultimate test before competing in the carnival song contest (concurso de coplas).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm3-cad-14',
            type: 'fill-blank',
            prompt: 'Completa: "El concierto es ______ emocionante y hay ______ personas en el teatro."',
            englishPrompt: 'Complete: "The concert is very exciting and there are many people in the theater."',
            audioText: 'muy / muchas',
            options: ['muy / muchas', 'mucho / muy', 'mucha / muchos', 'muy / muy'],
            correctAnswer: 'muy / muchas',
            explanation: 'Emocionante es adjetivo -> "muy emocionante". Personas es sustantivo femenino plural -> "muchas personas".',
            hints: ['MUY ante adjetivo, MUCHAS ante sustantivo femenino plural.'],
            syllabusRef: 'M3-MUY-MUCHO',
            difficulty: 'hot'
          }
        ]
      }
    ],
    bossMission: {
      id: 'boss-cadiz',
      cityId: 'cadiz',
      title: 'El Concurso de Coplas de Cádiz',
      characterName: 'Lola la del Falla',
      characterRole: 'Presidenta del Jurado del Gran Teatro Falla',
      scenario: 'Sobre las tablas del Gran Teatro Falla, debes componer e interpretar las estrofas oficiales del concurso demostrando maestría en gustos, posesivos, horas y la distinción perfecta entre MUY y MUCHO para desbloquear el Módulo 4 hacia Valencia.',
      objectives: [
        { id: 'cad-obj1', description: 'Dominar la concordancia de GUSTAR singular/plural y pronombres', syllabusTopic: 'M3.Gustos' },
        { id: 'cad-obj2', description: 'Aplicar la regla de oro entre MUY (adjetivos) y MUCHO (sustantivos)', syllabusTopic: 'M3.MuyVsMucho' },
        { id: 'cad-obj3', description: 'Utilizar adjetivos posesivos y expresiones temporales sin fallo', syllabusTopic: 'M3.Posesivos' }
      ],
      requiredScorePercent: 80,
      xpReward: 400,
      coinReward: 500,
      badgeName: 'El Pito de Caña de Oro de Cádiz',
      badgeIcon: '🎭',
      questions: [
        {
          id: 'b-cad-1',
          type: 'multiple-choice',
          prompt: 'Lola: "Para rimar con gracia, complete la copla: \'A mí me ______ las olas del mar y Cádiz es ______ hermosa\'"',
          englishPrompt: 'Lola: "To rhyme with grace, complete the verse: \'I like the sea waves and Cadiz is very beautiful\'"',
          audioText: 'gustan / muy',
          options: ['gusta / mucho', 'gustan / muy', 'gustan / mucho', 'gusta / muy'],
          correctAnswer: 'gustan / muy',
          explanation: '"Las olas del mar" es plural -> gustan. "Hermosa" es adjetivo -> muy hermosa.',
          hints: ['Plural para olas; MUY para adjetivo hermosa.'],
          syllabusRef: 'M3-GUSTOS',
          difficulty: 'hard'
        },
        {
          id: 'b-cad-2',
          type: 'fill-blank',
          prompt: 'Lola: "Los coristas tocan ______ bien sus guitarras y cantan con ______ fuerza (muy / mucho)."',
          englishPrompt: 'Lola: "The choir members play their guitars very well and sing with lots of strength."',
          audioText: 'muy / mucha',
          options: ['mucho / muy', 'mucha / muy', 'muy / mucha', 'muy / mucho'],
          correctAnswer: 'muy / mucha',
          explanation: '"Bien" es adverbio -> muy bien. "Fuerza" es sustantivo femenino singular -> mucha fuerza.',
          hints: ['MUY ante adverbio, MUCHA ante sustantivo femenino.'],
          syllabusRef: 'M3-MUY-MUCHO',
          difficulty: 'hard'
        },
        {
          id: 'b-cad-3',
          type: 'word-order',
          prompt: 'Ordena la letra del estribillo ganador: "Nuestra tierra tiene arte y nos gusta vivir con alegría"',
          englishPrompt: 'Order the winning chorus lyric: "Our land has art and we like to live with joy"',
          audioText: 'Nuestra tierra tiene arte y nos gusta vivir con alegría',
          sentencePieces: ['con', 'alegría', 'Nuestra', 'arte', 'tierra', 'gusta', 'tiene', 'vivir', 'y', 'nos'],
          correctAnswer: 'Nuestra tierra tiene arte y nos gusta vivir con alegría',
          explanation: 'Posesivo y sujeto (Nuestra tierra) + verbo tener (tiene arte) + nexo (y) + estructura con gustar (nos gusta vivir con alegría).',
          hints: ['Comienza por "Nuestra tierra tiene arte".'],
          syllabusRef: 'M3-Sintaxis',
          difficulty: 'hot'
        }
      ]
    }
  }
];
