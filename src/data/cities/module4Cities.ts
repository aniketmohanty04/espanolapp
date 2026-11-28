import { City } from '../../types';

export const MODULE4_CITIES: City[] = [
  {
    id: 'valencia',
    number: 10,
    name: 'Valencia',
    region: 'Comunidad Valenciana',
    landmark: 'Ciudad de las Artes y las Ciencias & Antiguo Cauce del Turia',
    description: 'The avant-garde Mediterranean city of the Turia (el Turia). Here you will master everyday activities, daily routines (rutinas diarias), and the reflexive verbs and pronouns essential for narrating your daily life.',
    moduleIndex: 4,
    moduleName: 'Module 4: Daily Routines, Reflexive Verbs and Pronouns (Rutinas y Verbos Reflexivos)',
    coordinates: { x: 68, y: 55 },
    accentColor: '#10B981',
    levels: [
      {
        id: 'valencia-1',
        cityId: 'valencia',
        levelNumber: 1,
        title: 'Morning Routine at the Turia (Rutina Matutina)',
        subtitle: 'Waking up and getting up (despertarse, levantarse) with reflexive pronouns',
        tier: 'easy',
        syllabusTopic: 'M4.Routines (Rutinas)',
        description: 'At dawn beside the Turia Gardens, you review how you start your day (tu jornada).',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-1',
            type: 'multiple-choice',
            prompt: '¿Cómo se dice en español "I wake up at seven in the morning"?',
            englishPrompt: 'How do you say in Spanish "I wake up at seven in the morning"?',
            audioText: 'Me despierto a las siete de la mañana',
            options: [
              'Yo despierto a las siete de la mañana',
              'Me levanto a las siete de la noche',
              'Despiértome en siete de la mañana',
              'Me despierto a las siete de la mañana'
            ],
            correctAnswer: 'Me despierto a las siete de la mañana',
            explanation: 'Despertarse es un verbo reflexivo (despertar-se) con cambio e -> ie en presente: Yo me despierto.',
            hints: ['Lleva pronombre reflexivo "me" y cambio vocálico ie.'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'easy'
          },
          {
            id: 'm4-val-2',
            type: 'fill-blank',
            prompt: 'El pronombre reflexivo correspondiente a "tú" es: "Tú ______ levantas temprano."',
            englishPrompt: 'The reflexive pronoun for "tú" is: "Tú te levantas temprano."',
            audioText: 'te',
            options: ['te', 'se', 'me', 'nos'],
            correctAnswer: 'te',
            explanation: 'Serie de pronombres reflexivos: me (yo), te (tú), se (él/ella/usted), nos (nosotros), os (vosotros), se (ellos/ustedes).',
            hints: ['Pronombre de segunda persona singular: t-e.'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'valencia-2',
        cityId: 'valencia',
        levelNumber: 2,
        title: 'Personal Hygiene: Showering & Dressing (Ducharse y Vestirse)',
        subtitle: 'Reflexive verbs for hygiene and personal care (aseo personal)',
        tier: 'easy',
        syllabusTopic: 'M4.Routines (Rutinas)',
        description: 'You learn the vocabulary to get ready (prepararse) before heading out into the city.',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-3',
            type: 'multiple-choice',
            prompt: '¿Cuál es la forma correcta para "She takes a shower every morning"?',
            englishPrompt: 'What is the correct form for "She takes a shower every morning"?',
            audioText: 'Ella se ducha todas las mañanas',
            options: [
              'Ella ducha todas las mañanas',
              'Ella se ducha todas las mañanas',
              'Ella te ducha todas las mañanas',
              'Ella le ducha todas las mañanas'
            ],
            correctAnswer: 'Ella se ducha todas las mañanas',
            explanation: 'Ducharse es reflexivo porque la acción recae sobre la misma persona: Ella se ducha.',
            hints: ['Tercera persona singular usa el pronombre "se".'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'easy'
          },
          {
            id: 'm4-val-4',
            type: 'fill-blank',
            prompt: 'Vestirse tiene cambio de vocal e -> i: "Yo me ______ con ropa cómoda."',
            englishPrompt: 'Vestirse has an e -> i vowel change: "Yo me visto con ropa cómoda."',
            audioText: 'visto',
            options: ['vesto', 'vistas', 'visto', 'visten'],
            correctAnswer: 'visto',
            explanation: 'Vestirse es irregular de cambio e -> i: me visto, te vistes, se viste, nos vestimos, os vestís, se visten.',
            hints: ['Primera persona con cambio a i: v-i-s-t-o.'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'valencia-3',
        cityId: 'valencia',
        levelNumber: 3,
        title: 'Plural Reflexive Verbs (Verbos Reflexivos Plurales)',
        subtitle: 'We get up (nos levantamos), you all go to bed (os acostáis)',
        tier: 'medium',
        syllabusTopic: 'M4.Reflexive Verbs (Verbos Reflexivos)',
        description: 'You describe shared routines (rutinas compartidas) with your flatmates.',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-5',
            type: 'multiple-choice',
            prompt: '¿Cómo se dice en España "You all go to bed late" informalmente?',
            englishPrompt: 'How do you say in Spain "You all go to bed late" informally?',
            audioText: 'Vosotros os acostáis tarde',
            options: [
              'Vosotros se acuestan tarde',
              'Vosotros nos acostamos tarde',
              'Vosotros acostáis tarde',
              'Vosotros os acostáis tarde'
            ],
            correctAnswer: 'Vosotros os acostáis tarde',
            explanation: 'Con vosotros el pronombre reflexivo es "os" y acostarse diptonga o -> ue salvo en nosotros y vosotros: vosotros os acostáis.',
            hints: ['Vosotros lleva el pronombre reflexivo "os".'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'medium'
          },
          {
            id: 'm4-val-6',
            type: 'fill-blank',
            prompt: 'Completa para primera persona plural: "Nosotros ______ cepillamos los dientes después de comer."',
            englishPrompt: 'Complete for first person plural: "Nosotros nos cepillamos los dientes después de comer."',
            audioText: 'nos',
            options: ['nos', 'os', 'se', 'los'],
            correctAnswer: 'nos',
            explanation: 'Nosotros concuerda con el pronombre reflexivo "nos": nos cepillamos.',
            hints: ['Pronombre de nosotros.'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'valencia-4',
        cityId: 'valencia',
        levelNumber: 4,
        title: 'Breakfast and Daily Meals (Desayuno y Alimentación)',
        subtitle: 'Having breakfast (desayunar), lunch (comer), snack (merendar), dinner (cenar)',
        tier: 'medium',
        syllabusTopic: 'M4.Routines (Rutinas)',
        description: 'You try tiger nut horchata with fartons in the Central Market square (Mercado Central).',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-7',
            type: 'multiple-choice',
            prompt: '¿Cuál es el orden cronológico habitual de las comidas del día en España?',
            englishPrompt: 'What is the usual chronological order of meals in Spain?',
            audioText: 'desayuno, comida / almuerzo, merienda, cena',
            options: [
              'almuerzo, desayuno, cena, merienda',
              'desayuno, comida / almuerzo, merienda, cena',
              'cena, desayuno, merienda, comida',
              'desayuno, cena, almuerzo, merienda'
            ],
            correctAnswer: 'desayuno, comida / almuerzo, merienda, cena',
            explanation: 'En España se desayuna por la mañana (8:00), se come a mediodía (14:00-15:00), se merienda por la tarde (18:00) y se cena tarde por la noche (21:00-22:00).',
            hints: ['Desayuno es la primera y cena la última.'],
            syllabusRef: 'M4-RUTINAS',
            difficulty: 'medium'
          },
          {
            id: 'm4-val-8',
            type: 'fill-blank',
            prompt: 'Completa: "Por la mañana yo ______ café con leche y tostadas con tomate."',
            englishPrompt: 'Complete: "In the morning I have coffee with milk and toast with tomato for breakfast."',
            audioText: 'desayuno',
            options: ['ceno', 'meriendo', 'desayuno', 'duermo'],
            correctAnswer: 'desayuno',
            explanation: 'Desayunar es la primera comida de la mañana: "yo desayuno".',
            hints: ['Primera persona singular de desayunar.'],
            syllabusRef: 'M4-RUTINAS',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'valencia-5',
        cityId: 'valencia',
        levelNumber: 5,
        title: 'The City and Metro Transport (Ciudad y Transporte)',
        subtitle: 'Taking the metro (coger el metro), going by bus (ir en autobús), cycling (en bicicleta)',
        tier: 'tough',
        syllabusTopic: 'M4.Transport (Transporte)',
        description: 'You travel from the North Station (Estación del Norte) to the City of Arts.',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-9',
            type: 'multiple-choice',
            prompt: '¿Qué preposición se usa en español para indicar el medio de transporte (autobús, metro, tren)?',
            englishPrompt: 'Which preposition is used in Spanish to indicate the means of transport (bus, metro, train)?',
            audioText: 'en (ir en metro, viajar en tren)',
            options: ['por', 'con', 'a', 'en'],
            correctAnswer: 'en',
            explanation: 'Para medios de transporte mecánicos usamos "en": en metro, en autobús, en tren, en coche, en avión. Solo decimos "a pie" o "a caballo".',
            hints: ['Preposición "en".'],
            syllabusRef: 'M4-CIUDAD',
            difficulty: 'tough'
          },
          {
            id: 'm4-val-10',
            type: 'fill-blank',
            prompt: 'Para caminar sin vehículo decimos: "Voy a la universidad ______ pie."',
            englishPrompt: 'To walk without a vehicle: "Voy a la universidad a pie."',
            audioText: 'a',
            options: ['a', 'en', 'por', 'con'],
            correctAnswer: 'a',
            explanation: 'La excepción fija es "a pie" (on foot).',
            hints: ['Preposición "a".'],
            syllabusRef: 'M4-CIUDAD',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'valencia-6',
        cityId: 'valencia',
        levelNumber: 6,
        title: 'Reflexives: Pronoun Position (Posición del Pronombre)',
        subtitle: 'Pronoun before the conjugated verb or attached to the infinitive (infinitivo)',
        tier: 'tough',
        syllabusTopic: 'M4.Reflexive Grammar (Gramática Reflexiva)',
        description: 'The teacher explains where the pronoun goes in verbal periphrases (perífrasis verbales).',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-11',
            type: 'multiple-choice',
            prompt: '¿Cuáles dos construcciones son gramaticalmente correctas para "I have to wake up early"?',
            englishPrompt: 'Which two constructions are grammatically correct for "I have to wake up early"?',
            audioText: 'Me tengo que despertar temprano / Tengo que despertarme temprano',
            options: [
              'Tengo me que despertar temprano / Me tengo despertarme',
              'Me tengo que despertar temprano / Tengo que despertarme temprano',
              'Tengo que me despertar temprano / Despertarme tengo',
              'Tengo que despierto temprano / Me despierto tengo'
            ],
            correctAnswer: 'Me tengo que despertar temprano / Tengo que despertarme temprano',
            explanation: 'Con infinitivo, el pronombre reflexivo puede ir antes del verbo conjugado ("Me tengo que despertar") o enclítico unido al infinitivo ("Tengo que despertarme").',
            hints: ['O antes del verbo conjugado o pegado al final del infinitivo.'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'valencia-7',
        cityId: 'valencia',
        levelNumber: 7,
        title: 'Ordering a Complete Daily Routine (Rutina Diaria)',
        subtitle: 'Time connectors: first (primero), then (luego), after (después), finally (finalmente)',
        tier: 'hard',
        syllabusTopic: 'M4.Syntax (Sintaxis)',
        description: 'You build the narrative sequence of a productive day in Ruzafa.',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-12',
            type: 'word-order',
            prompt: 'Ordena la rutina: "Primero me ducho, después desayuno y luego salgo"',
            englishPrompt: 'Order the routine: "First I shower, then I eat breakfast and then I go out"',
            audioText: 'Primero me ducho, después desayuno y luego salgo',
            sentencePieces: ['salgo', 'después', 'me', 'y', 'Primero', 'luego', 'ducho,', 'desayuno'],
            correctAnswer: 'Primero me ducho, después desayuno y luego salgo',
            explanation: 'Conector 1 (Primero) + acción 1 (me ducho) + conector 2 (después) + acción 2 (desayuno) + conector 3 (y luego) + acción 3 (salgo).',
            hints: ['Comienza por el conector temporal "Primero me ducho".'],
            syllabusRef: 'M4-RUTINAS',
            difficulty: 'hard'
          }
        ]
      },
      {
        id: 'valencia-8',
        cityId: 'valencia',
        levelNumber: 8,
        title: 'Dialogue with Pau at the Hemisfèric (Diálogo con Pau)',
        subtitle: 'Conversation about healthy habits (hábitos) and study schedules (horarios)',
        tier: 'hard',
        syllabusTopic: 'M4.Communication (Comunicación)',
        description: 'Pau explains to you how he organizes his lab and sports hours (horas).',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-13',
            type: 'dialogue',
            prompt: 'Conversación junto al estanque del Hemisfèric:',
            englishPrompt: 'Conversation next to the Hemisfèric pool:',
            audioText: '¡Hola! Suelo correr por el río Turia a las siete de la mañana. ¿A qué hora te levantas tú normalmente?',
            correctAnswer: 'Normalmente me levanto a las siete y media, me ducho y voy a clase.',
            explanation: 'Respuesta comunicativa y natural con verbos reflexivos de rutina diaria.',
            hints: ['Indica a qué hora te levantas y qué haces a continuación.'],
            syllabusRef: 'M4-RUTINAS',
            difficulty: 'hard',
            dialogue: {
              npcName: 'Pau',
              npcRole: 'Estudiante de Biotecnología en Valencia',
              prompt: '¡Hola! Suelo correr por el río Turia a las siete de la mañana. ¿A qué hora te levantas tú normalmente?',
              englishPrompt: 'Hello! I usually run in the Turia park at 7 AM. What time do you normally get up?',
              choices: [
                {
                  id: 'c2',
                  text: 'En Valencia hace mucho calor en verano.',
                  englishHint: 'In Valencia it is very hot in summer.',
                  isCorrect: false,
                  npcResponse: 'Sí que hace calor, ¡pero te preguntaba por tu hora de levantarte!',
                  explanation: 'Fuera de contexto.'
                },
                {
                  id: 'c1',
                  text: 'Normalmente me levanto a las siete y media, me ducho y voy a clase.',
                  englishHint: 'Normally I get up at 7:30, shower and go to class.',
                  isCorrect: true,
                  npcResponse: '¡Qué buen horario! La mañana cunde muchísimo cuando madrugas.',
                  explanation: 'Excelente narración con verbos reflexivos concordantes.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'valencia-9',
        cityId: 'valencia',
        levelNumber: 9,
        title: 'Nighttime Routine and Going to Bed (Rutina Nocturna)',
        subtitle: 'Going to bed (acostarse o -> ue) and falling asleep (dormirse)',
        tier: 'hot',
        syllabusTopic: 'M4.Routines (Rutinas)',
        description: 'You wrap up the day after watching the sunset (el atardecer) at Malvarrosa Beach.',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-14',
            type: 'fill-blank',
            prompt: 'Acostarse diptonga: "Por la noche yo leo un libro y me ______ a las once (acostarse)."',
            englishPrompt: 'Acostarse changes vowel: "At night I read a book and go to bed at eleven."',
            audioText: 'acuesto',
            options: ['acosto', 'acuestas', 'acuesto', 'acuestan'],
            correctAnswer: 'acuesto',
            explanation: 'Acostarse: yo me acuesto, tú te acuestas, él se acuesta, nosotros nos acostamos, vosotros os acostáis, ellos se acuestan.',
            hints: ['Primera persona con diptongo ue: a-c-u-e-s-t-o.'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'hot'
          }
        ]
      },
      {
        id: 'valencia-10',
        cityId: 'valencia',
        levelNumber: 10,
        title: 'Valencian Routines Challenge (Reto de Rutinas)',
        subtitle: 'Quick assessment of full reflexive conjugation (conjugación reflexiva)',
        tier: 'hot',
        syllabusTopic: 'M4.Synthesis (Síntesis)',
        description: 'The final training session before the Valencia Morning Marathon (Maratón Matutino).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm4-val-15',
            type: 'multiple-choice',
            prompt: '¿Cuál de las siguientes frases NO contiene ningún error gramatical?',
            englishPrompt: 'Which of the following sentences contains NO grammatical error?',
            audioText: 'Mis hermanos se despiertan temprano y se preparan el desayuno',
            options: [
              'Mis hermanos nos despiertan temprano y se prepara el desayuno',
              'Mis hermanos despiertan se temprano y preparan se el desayuno',
              'Mis hermanos se despiertan temprano y te preparan su desayuno',
              'Mis hermanos se despiertan temprano y se preparan el desayuno'
            ],
            correctAnswer: 'Mis hermanos se despiertan temprano y se preparan el desayuno',
            explanation: 'Sujeto 3.ª persona plural (mis hermanos) concuerda con pronombre reflexivo "se" en ambos verbos (se despiertan, se preparan).',
            hints: ['Concordancia perfecta con el pronombre "se".'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'hot'
          }
        ]
      }
    ],
    bossMission: {
      id: 'boss-valencia',
      cityId: 'valencia',
      title: 'El Maratón Matutino de Valencia',
      characterName: 'Entrenador Pau de Ruzafa',
      characterRole: 'Coordinador Deportivo y Embajador Urbano del Turia',
      scenario: 'Pau coordina la apertura del circuito atlético del antiguo cauce del río Turia. Para registrar tu ficha oficial de atleta y desbloquear el viaje a Barcelona, debes demostrar dominio impecable de los verbos reflexivos, la secuencia de hábitos y el transporte.',
      objectives: [
        { id: 'val-obj1', description: 'Conjugar verbos reflexivos con cambio vocálico sin fallos', syllabusTopic: 'M4.Rutinas' },
        { id: 'val-obj2', description: 'Dominar la concordancia de pronombres reflexivos me/te/se/nos/os/se', syllabusTopic: 'M4.VerbosReflexivos' },
        { id: 'val-obj3', description: 'Estructurar cronogramas diarios con conectores lógicos', syllabusTopic: 'M4.Transporte' }
      ],
      requiredScorePercent: 80,
      xpReward: 350,
      coinReward: 500,
      badgeName: 'La Medalla del Murciélago de Valencia',
      badgeIcon: '🦇',
      questions: [
        {
          id: 'b-val-1',
          type: 'multiple-choice',
          prompt: 'Pau: "Para el plan de entrenamiento matinal, ¿cuál es la descripción de hábitos perfectamente redactada?"',
          englishPrompt: 'Pau: "For morning workout plan, which is the perfectly worded habits description?"',
          audioText: 'Nosotros nos levantamos a las seis, nos hidratamos y salimos a correr.',
          options: [
              'Nosotros nos levantamos a las seis, nos hidratamos y salimos a correr.',
              'Nosotros se levantamos a las seis, os hidratamos y salimos correr.',
              'Nosotros levantamos a las seis, hidratamos nos y vamos a correr.',
              'Nosotros nos levantan a las seis, nos hidrata y salen a correr.'
            ],
          correctAnswer: 'Nosotros nos levantamos a las seis, nos hidratamos y salimos a correr.',
          explanation: 'Primera persona plural con pronombre reflexivo "nos" en todos los verbos reflexivos.',
          hints: ['Nosotros concuerda con "nos levantamos" y "nos hidratamos".'],
          syllabusRef: 'M4-REFLEX',
          difficulty: 'hard'
        },
        {
          id: 'b-val-2',
          type: 'fill-blank',
          prompt: 'Pau: "Después del entrenamiento los atletas ______ duchan con agua templada y ______ visten (ducharse / vestirse)."',
          englishPrompt: 'Pau: "After training the athletes shower with lukewarm water and get dressed."',
          audioText: 'se / se',
          options: ['nos / nos', 'se / se', 'os / os', 'te / te'],
          correctAnswer: 'se / se',
          explanation: 'Sujeto en tercera persona plural ("los atletas") requiere el pronombre reflexivo "se" en ambas oraciones.',
          hints: ['Pronombre de tercera persona plural: se.'],
          syllabusRef: 'M4-REFLEX',
          difficulty: 'hard'
        },
        {
          id: 'b-val-3',
          type: 'word-order',
          prompt: 'Ordena la máxima deportiva: "Una rutina saludable mejora el cuerpo y la mente"',
          englishPrompt: 'Order the sports maxim: "A healthy routine improves the body and mind"',
          audioText: 'Una rutina saludable mejora el cuerpo y la mente',
          sentencePieces: ['mente', 'mejora', 'el', 'Una', 'cuerpo', 'rutina', 'saludable', 'la', 'y'],
          correctAnswer: 'Una rutina saludable mejora el cuerpo y la mente',
          explanation: 'Sujeto (Una rutina saludable) + verbo transitivo (mejora) + objetos directos coordinados (el cuerpo y la mente).',
          hints: ['Comienza por "Una rutina saludable".'],
          syllabusRef: 'M4-Sintaxis',
          difficulty: 'hot'
        }
      ]
    }
  },
  {
    id: 'barcelona',
    number: 11,
    name: 'Barcelona',
    region: 'Cataluña',
    landmark: 'Sagrada Família & Barrio Gótico',
    description: 'The modernist metropolis of Gaudí (la metrópoli). In the classrooms of the University of Barcelona and its iconic neighborhoods (barrios), you will master study schedules (horarios), campus life, and urban descriptions.',
    moduleIndex: 4,
    moduleName: 'Module 4: Schedules, University, Urban Life and City (Horarios, Universidad y Ciudad)',
    coordinates: { x: 82.0, y: 36.0 },
    accentColor: '#3B82F6',
    levels: [
      {
        id: 'barcelona-1',
        cityId: 'barcelona',
        levelNumber: 1,
        title: 'University Schedule on the Diagonal (Horario Universitario)',
        subtitle: 'Time slots (franjas horarias) and school days (días lectivos) on campus',
        tier: 'easy',
        syllabusTopic: 'M4.Schedules (Horarios)',
        description: 'You plan your course enrollment (tu matrícula) on the University of Barcelona campus.',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-1',
            type: 'multiple-choice',
            prompt: '¿Cómo expresamos un intervalo horario: "From 9:00 to 11:00"?',
            englishPrompt: 'How do we express a time range: "From 9:00 to 11:00"?',
            audioText: 'De nueve a once / Desde las nueve hasta las once',
            options: [
              'En nueve para once',
              'Por nueve a once',
              'De nueve a once / Desde las nueve hasta las once',
              'Entre nueve con once'
            ],
            correctAnswer: 'De nueve a once / Desde las nueve hasta las once',
            explanation: 'Las dos estructuras normativas de intervalo temporal son: "De... a..." o "Desde las... hasta las...". Nunca mezclar "de... hasta..." ni "desde... a...".',
            hints: ['O usas "De... a..." o "Desde las... hasta las...".'],
            syllabusRef: 'M4-HORARIOS',
            difficulty: 'easy'
          },
          {
            id: 'm4-bar-2',
            type: 'fill-blank',
            prompt: 'Para las asignaturas de tarde decimos: "Tengo clases ______ la tarde."',
            englishPrompt: 'For afternoon subjects we say: "Tengo clases por la tarde."',
            audioText: 'por',
            options: ['en', 'a', 'sobre', 'por'],
            correctAnswer: 'por',
            explanation: 'Para partes del día en sentido general usamos "por": por la mañana, por la tarde, por la noche.',
            hints: ['Preposición "por".'],
            syllabusRef: 'M4-HORARIOS',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'barcelona-2',
        cityId: 'barcelona',
        levelNumber: 2,
        title: 'Life in the Library and on Campus (Biblioteca y Campus)',
        subtitle: 'Subjects (asignaturas), exams (exámenes), and study spaces',
        tier: 'easy',
        syllabusTopic: 'M4.University (Universidad)',
        description: 'You do research in the library (la biblioteca) of the historic Plaza de la Universidad building.',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-3',
            type: 'multiple-choice',
            prompt: '¿Cómo se llama la prueba académica para evaluar lo aprendido al final de un cuatrimestre?',
            englishPrompt: 'What is the academic test at the end of a semester called?',
            audioText: 'el examen',
            options: ['el examen', 'la lección', 'el libro', 'la pizarra'],
            correctAnswer: 'el examen',
            explanation: '"El examen" (plural: los exámenes) es la prueba de evaluación académica.',
            hints: ['Palabra que empieza por e-x-a...'],
            syllabusRef: 'M4-UNIVERSIDAD',
            difficulty: 'easy'
          },
          {
            id: 'm4-bar-4',
            type: 'fill-blank',
            prompt: 'Para decir "I study Hispanic Literature": "Yo ______ Literatura Hispánica."',
            englishPrompt: 'To say "I study Hispanic Literature": "Yo estudio Literatura Hispánica."',
            audioText: 'estudio',
            options: ['estudias', 'estudio', 'estudia', 'estudian'],
            correctAnswer: 'estudio',
            explanation: 'Primera persona singular del verbo regular estudiar: yo estudio.',
            hints: ['Termina en -o para yo.'],
            syllabusRef: 'M4-UNIVERSIDAD',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'barcelona-3',
        cityId: 'barcelona',
        levelNumber: 3,
        title: 'Describing the Gothic Quarter (Barrio Gótico)',
        subtitle: 'Urban adjectives: noisy (ruidoso), quiet (tranquilo), historic (histórico), modern (moderno)',
        tier: 'medium',
        syllabusTopic: 'M4.City (Ciudad)',
        description: 'You wander through the medieval streets (calles medievales) between the cathedral and Plaza del Rey.',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-5',
            type: 'multiple-choice',
            prompt: '¿Cuál es el adjetivo opuesto de "ruidoso" para describir una calle o barrio?',
            englishPrompt: 'What is the opposite adjective of "ruidoso" to describe a street or neighborhood?',
            audioText: 'tranquilo o silencioso',
            options: ['antiguo', 'estrecho', 'tranquilo', 'luminoso'],
            correctAnswer: 'tranquilo',
            explanation: '"Tranquilo" o "silencioso" es el antónimo directo de "ruidoso" (noisy).',
            hints: ['Significa con paz y sin ruidos.'],
            syllabusRef: 'M4-CIUDAD',
            difficulty: 'medium'
          },
          {
            id: 'm4-bar-6',
            type: 'fill-blank',
            prompt: 'Completa con concordancia: "Las calles del Barrio Gótico son estrechas y ______ (antiguo)."',
            englishPrompt: 'Complete with agreement: "The streets of the Gothic Quarter are narrow and ancient."',
            audioText: 'antiguas',
            options: ['antiguo', 'antigua', 'antiguos', 'antiguas'],
            correctAnswer: 'antiguas',
            explanation: '"Calles" es femenino plural, por tanto el adjetivo debe ser "antiguas".',
            hints: ['Femenino plural concuerda con calles.'],
            syllabusRef: 'M4-CIUDAD',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'barcelona-4',
        cityId: 'barcelona',
        levelNumber: 4,
        title: 'The Metro and Bus Network (Metro y Autobuses)',
        subtitle: 'Lines (líneas), transfers (transbordos), and public transit stops (paradas)',
        tier: 'medium',
        syllabusTopic: 'M4.City (Ciudad)',
        description: 'You take Line 3 (green / verde) to go from Passeig de Gràcia to Lesseps.',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-7',
            type: 'multiple-choice',
            prompt: 'Para cambiar de una línea de metro a otra en una estación decimos:',
            englishPrompt: 'To switch from one metro line to another at a station we say:',
            audioText: 'hacer transbordo',
            options: ['hacer transbordo', 'hacer equipaje', 'hacer turismo', 'hacer compras'],
            correctAnswer: 'hacer transbordo',
            explanation: '"Hacer transbordo" (o transbordar) es cambiar de línea de metro o transporte en una estación de enlace.',
            hints: ['Empieza por trans...'],
            syllabusRef: 'M4-CIUDAD',
            difficulty: 'medium'
          },
          {
            id: 'm4-bar-8',
            type: 'fill-blank',
            prompt: 'Para saber en qué parada bajarse: "¿Cuál es la ______ de la Sagrada Família?"',
            englishPrompt: 'To know at which stop to get off: "¿Cuál es la parada de la Sagrada Família?"',
            audioText: 'parada',
            options: ['calle', 'parada', 'hora', 'puerta'],
            correctAnswer: 'parada',
            explanation: '"La parada" (de metro o autobús) es el punto reglamentario donde se detiene el transporte.',
            hints: ['Lugar donde se para el transporte.'],
            syllabusRef: 'M4-CIUDAD',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'barcelona-5',
        cityId: 'barcelona',
        levelNumber: 5,
        title: 'International Student Routine (Rutina del Estudiante)',
        subtitle: 'Combining reflexives (reflexivos) and specific schedules (horarios)',
        tier: 'tough',
        syllabusTopic: 'M4.Routines (Rutinas)',
        description: 'You describe your weekly schedule (horario semanal) at the Sarrià student residence.',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-9',
            type: 'multiple-choice',
            prompt: 'Selecciona la opción gramaticalmente perfecta para un cronograma estudiantil:',
            englishPrompt: 'Select the grammatically perfect option for a student schedule:',
            audioText: 'Me levanto a las ocho, voy a la facultad en metro y como con mis amigos',
            options: [
              'Yo levanto a las ocho, voy en la facultad por metro y como mis amigos',
              'Me despierto en las ocho, viajo en metro para facultad y ceno con amigos',
              'Me levanto a las ocho, voy a la facultad en metro y como con mis amigos',
              'Se levanto a las ocho, va a facultad con metro y comemos amigos'
            ],
            correctAnswer: 'Me levanto a las ocho, voy a la facultad en metro y como con mis amigos',
            explanation: 'Reflexivo correcto (me levanto), hora con preposición (a las ocho), desplazamiento (voy a... en metro) y acción social (como con mis amigos).',
            hints: ['Preposiciones impecables y reflexivo correcto.'],
            syllabusRef: 'M4-HORARIOS',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'barcelona-6',
        cityId: 'barcelona',
        levelNumber: 6,
        title: 'Comparing Barcelona Neighborhoods (Comparar Barrios)',
        subtitle: 'More... than (más... que), less... than (menos... que), as... as (tan... como)',
        tier: 'tough',
        syllabusTopic: 'M4.City (Ciudad)',
        description: 'You compare the atmosphere (el ambiente) of modernist Eixample with seaside Barceloneta.',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-10',
            type: 'multiple-choice',
            prompt: '¿Cómo decimos en español "The Eixample is calmer than the Gothic Quarter"?',
            englishPrompt: 'How do we say in Spanish "The Eixample is calmer than the Gothic Quarter"?',
            audioText: 'El Eixample es más tranquilo que el Barrio Gótico',
            options: [
              'El Eixample es más tranquilo de el Barrio Gótico',
              'El Eixample es muy tranquilo que el Barrio Gótico',
              'El Eixample es tan tranquilo que el Barrio Gótico',
              'El Eixample es más tranquilo que el Barrio Gótico'
            ],
            correctAnswer: 'El Eixample es más tranquilo que el Barrio Gótico',
            explanation: 'La estructura comparativa de superioridad es: más + adjetivo + que.',
            hints: ['Estructura: más + adjetivo + QUE.'],
            syllabusRef: 'M4-CIUDAD',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'barcelona-7',
        cityId: 'barcelona',
        levelNumber: 7,
        title: 'Planning the University Week (Semana Universitaria)',
        subtitle: 'Sentence syntax (sintaxis) with time markers (marcadores temporales)',
        tier: 'hard',
        syllabusTopic: 'M4.Syntax (Sintaxis)',
        description: 'You put together your weekly schedule with classes (asignaturas) and lab sessions.',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-11',
            type: 'word-order',
            prompt: 'Ordena la frase: "Los viernes por la tarde estudio en la biblioteca central"',
            englishPrompt: 'Order the sentence: "On Friday afternoons I study in the central library"',
            audioText: 'Los viernes por la tarde estudio en la biblioteca central',
            sentencePieces: ['tarde', 'biblioteca', 'Los', 'estudio', 'por', 'viernes', 'en', 'central', 'la', 'la'],
            correctAnswer: 'Los viernes por la tarde estudio en la biblioteca central',
            explanation: 'Tiempo (Los viernes por la tarde) + verbo conjugado (estudio) + complemento locativo (en la biblioteca central).',
            hints: ['Comienza por "Los viernes por la tarde".'],
            syllabusRef: 'M4-HORARIOS',
            difficulty: 'hard'
          }
        ]
      },
      {
        id: 'barcelona-8',
        cityId: 'barcelona',
        levelNumber: 8,
        title: 'Dialogue with Marc at Plaza de Catalunya (Diálogo con Marc)',
        subtitle: 'Conversation about student life (vida estudiantil) and transport (transporte)',
        tier: 'hard',
        syllabusTopic: 'M4.Communication (Comunicación)',
        description: 'Marc helps you buy the monthly youth transit pass (tarjeta de transporte joven).',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-12',
            type: 'dialogue',
            prompt: 'En el vestíbulo de la estación de metro:',
            englishPrompt: 'In the metro station concourse:',
            audioText: '¡Hola! Para moverte por Barcelona todos los días te recomiendo el abono mensual T-Jove. ¿Cuántos viajes sueles hacer a la semana?',
            correctAnswer: 'Suelo hacer diez viajes a la semana para ir y volver de la universidad.',
            explanation: 'Respuesta comunicativa excelente indicando frecuencia y propósito del transporte.',
            hints: ['Indica cuántos viajes realizas para tus estudios.'],
            syllabusRef: 'M4-CIUDAD',
            difficulty: 'hard',
            dialogue: {
              npcName: 'Marc',
              npcRole: 'Estudiante de Arquitectura en la UPC',
              prompt: '¡Hola! Para moverte por Barcelona todos los días te recomiendo el abono mensual T-Jove. ¿Cuántos viajes sueles hacer a la semana?',
              englishPrompt: 'Hello! To get around Barcelona every day I recommend the monthly T-Jove pass. How many trips do you usually make a week?',
              choices: [
                {
                  id: 'c1',
                  text: 'Suelo hacer diez viajes a la semana para ir y volver de la universidad.',
                  englishHint: 'I usually make 10 trips a week to go and return from university.',
                  isCorrect: true,
                  npcResponse: '¡Pues te sale a cuenta sin duda! Con ese título viajas de forma ilimitada.',
                  explanation: 'Respuesta bien construida con soltura y exactitud.'
                },
                {
                  id: 'c2',
                  text: 'Mi abuela vive en Sevilla y baila flamenco.',
                  englishHint: 'My grandma lives in Seville and dances flamenco.',
                  isCorrect: false,
                  npcResponse: '¡Muy bien por tu abuela! Pero estábamos hablando de tu bono de transporte.',
                  explanation: 'Fuera de contexto.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'barcelona-9',
        cityId: 'barcelona',
        levelNumber: 9,
        title: 'Meeting at the Sagrada Família (Cita en la Sagrada Família)',
        subtitle: 'Setting a meeting time (hora de encuentro) in front of the Nativity facade',
        tier: 'hot',
        syllabusTopic: 'M4.Communication (Comunicación)',
        description: 'You coordinate the visit to the expiatory temple with your classmates (compañeros de clase).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-13',
            type: 'fill-blank',
            prompt: 'Completa: "Las puertas del templo abren ______ las nueve de la mañana en punto."',
            englishPrompt: 'Complete: "The temple doors open at nine in the morning sharp."',
            audioText: 'a',
            options: ['a', 'en', 'de', 'por'],
            correctAnswer: 'a',
            explanation: 'Para la hora precisa de apertura de un monumento usamos la preposición "a": "a las nueve".',
            hints: ['Preposición "a".'],
            syllabusRef: 'M4-HORARIOS',
            difficulty: 'hot'
          }
        ]
      },
      {
        id: 'barcelona-10',
        cityId: 'barcelona',
        levelNumber: 10,
        title: 'Student Management Challenge (Reto Estudiantil)',
        subtitle: 'Synthesis of schedules (horarios), transport, and university life',
        tier: 'hot',
        syllabusTopic: 'M4.Synthesis (Síntesis)',
        description: 'The final preparation before the decisive University of Barcelona test (la prueba).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm4-bar-14',
            type: 'multiple-choice',
            prompt: '¿Cómo se dice en español "The university campus has a large library and many classrooms"?',
            englishPrompt: 'How do you say in Spanish "The university campus has a large library and many classrooms"?',
            audioText: 'El campus universitario tiene una biblioteca grande y muchas aulas',
            options: [
              'El campus universitario es una biblioteca grande y mucho aulas',
              'El campus universitario tiene una biblioteca grande y muchas aulas',
              'El campus universitario está una biblioteca grande y muchas aulas',
              'El campus universitario hay una biblioteca grande y muy aulas'
            ],
            correctAnswer: 'El campus universitario tiene una biblioteca grande y muchas aulas',
            explanation: 'Sujeto específico tiene posesión de instalaciones (tiene). "Aulas" es femenino ("muchas aulas", aunque en singular lleve "el aula" por la a tónica inicial).',
            hints: ['Verbo tener para posesión de instalaciones; muchas aulas.'],
            syllabusRef: 'M4-UNIVERSIDAD',
            difficulty: 'hot'
          }
        ]
      }
    ],
    bossMission: {
      id: 'boss-barcelona',
      cityId: 'barcelona',
      title: 'La Jornada del Estudiante de la UB',
      characterName: 'Coordinador Académico Marc de Gaudí',
      characterRole: 'Tutor de Relaciones Internacionales de la UB',
      scenario: 'Para convalidar tu expediente del cuatrimestre y obtener el salvoconducto hacia Zaragoza, Marc te somete a una simulación completa de gestión académica: horarios, transporte metropolitano y descripción de proyectos universitarios.',
      objectives: [
        { id: 'bar-obj1', description: 'Formular horarios complejos con de/a y desde/hasta sin confusión', syllabusTopic: 'M4.Horarios' },
        { id: 'bar-obj2', description: 'Expresar medios de transporte y rutas urbanas en metro', syllabusTopic: 'M4.Ciudad' },
        { id: 'bar-obj3', description: 'Describir la vida universitaria con vocabulario técnico A1', syllabusTopic: 'M4.Universidad' }
      ],
      requiredScorePercent: 80,
      xpReward: 350,
      coinReward: 500,
      badgeName: 'La Baldosa de Gaudí de Barcelona',
      badgeIcon: '🏛️',
      questions: [
        {
          id: 'b-bar-1',
          type: 'multiple-choice',
          prompt: 'Marc: "Indique la opción que expresa con absoluta corrección normativa el horario de conferencias:"',
          englishPrompt: 'Marc: "Indicate the option that expresses with absolute correctness the lecture schedule:"',
          audioText: 'El seminario tiene lugar desde las diez hasta las doce de la mañana.',
          options: [
              'El seminario tiene lugar de las diez hasta las doce de la mañana.',
              'El seminario tiene lugar desde diez a doce de la mañana.',
              'El seminario tiene lugar desde las diez hasta las doce de la mañana.',
              'El seminario tiene lugar en diez hasta doce de la mañana.'
            ],
          correctAnswer: 'El seminario tiene lugar desde las diez hasta las doce de la mañana.',
          explanation: '"Desde las... hasta las..." es la pareja correlativa correcta en español.',
          hints: ['Pareja correlativa: desde las... hasta las...'],
          syllabusRef: 'M4-HORARIOS',
          difficulty: 'hard'
        },
        {
          id: 'b-bar-2',
          type: 'fill-blank',
          prompt: 'Marc: "Para desplazarse al campus de la Diagonal los alumnos viajan ______ metro y bajan en Palau Reial."',
          englishPrompt: 'Marc: "To travel to the Diagonal campus, students travel by metro and get off at Palau Reial."',
          audioText: 'en',
          options: ['a', 'por', 'con', 'en'],
          correctAnswer: 'en',
          explanation: 'Medio de transporte mecánico = preposición "en" (viajar en metro).',
          hints: ['Preposición "en".'],
          syllabusRef: 'M4-CIUDAD',
          difficulty: 'hard'
        },
        {
          id: 'b-bar-3',
          type: 'word-order',
          prompt: 'Ordena la inscripción del claustro histórico: "El conocimiento científico y el arte conviven en nuestra universidad"',
          englishPrompt: 'Order the cloister inscription: "Scientific knowledge and art coexist in our university"',
          audioText: 'El conocimiento científico y el arte conviven en nuestra universidad',
          sentencePieces: ['conviven', 'científico', 'arte', 'universidad', 'nuestra', 'El', 'el', 'en', 'conocimiento', 'y'],
          correctAnswer: 'El conocimiento científico y el arte conviven en nuestra universidad',
          explanation: 'Sujeto compuesto (El conocimiento científico y el arte) + verbo intransitivo (conviven) + locución de lugar (en nuestra universidad).',
          hints: ['Comienza por "El conocimiento científico y el arte".'],
          syllabusRef: 'M4-Sintaxis',
          difficulty: 'hot'
        }
      ]
    }
  },
  {
    id: 'zaragoza',
    number: 12,
    name: 'Zaragoza',
    region: 'Aragón',
    landmark: 'Basílica del Pilar & Puente de Piedra',
    description: 'The historic capital on the Ebro (el Ebro) with its glorious Basilica del Pilar. Here you will complete Module 4 by learning to portray people, physical and character traits (rasgos físicos y de carácter), and express skills and abilities (habilidades) with SABER + infinitive.',
    moduleIndex: 4,
    moduleName: 'Module 4: Describing People, Qualities and SABER + Infinitive (Describir Personas y Cualidades)',
    coordinates: { x: 65.0, y: 35.0 },
    accentColor: '#EF4444',
    levels: [
      {
        id: 'zaragoza-1',
        cityId: 'zaragoza',
        levelNumber: 1,
        title: 'Describing My Best Friend (Mi Mejor Amigo)',
        subtitle: 'Essential physical traits: tall (alto), dark-haired (moreno), beard (barba), eyes (ojos)',
        tier: 'easy',
        syllabusTopic: 'M4.Friends (Amigos)',
        description: 'Along the banks of the Ebro River, you describe your adventure companion (compañero).',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-1',
            type: 'multiple-choice',
            prompt: 'Para describir la complexión general de un amigo decimos:',
            englishPrompt: 'To describe a friend\'s general build we say:',
            audioText: 'Mi amigo es alto y deportista',
            options: ['Mi amigo es alto y deportista', 'Mi amigo tiene alto y deportista', 'Mi amigo está alto y deportista', 'Mi amigo hace alto y deportista'],
            correctAnswer: 'Mi amigo es alto y deportista',
            explanation: 'Las cualidades físicas esenciales de estatura y complexión se expresan con SER: "Es alto", "Es delgado", "Es moreno".',
            hints: ['Cualidad física esencial = verbo SER.'],
            syllabusRef: 'M4-AMIGOS',
            difficulty: 'easy'
          },
          {
            id: 'm4-zar-2',
            type: 'fill-blank',
            prompt: 'Para la barba y el bigote usamos el verbo TENER: "Mi compañero ______ barba y bigote."',
            englishPrompt: 'For beard and mustache we use TENER: "Mi compañero tiene barba y bigote."',
            audioText: 'tiene',
            options: ['es', 'tiene', 'está', 'hace'],
            correctAnswer: 'tiene',
            explanation: 'Rasgos específicos como barba, pelo y ojos se construyen con TENER: "Tiene barba".',
            hints: ['Tercera persona singular de TENER.'],
            syllabusRef: 'M4-AMIGOS',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'zaragoza-2',
        cityId: 'zaragoza',
        levelNumber: 2,
        title: 'Personality and Character Traits (Personalidad y Carácter)',
        subtitle: 'Friendly (simpático), hardworking (trabajador), generous (generoso), fun (divertido), shy (tímido)',
        tier: 'easy',
        syllabusTopic: 'M4.Friends (Amigos)',
        description: 'You analyze the moral and psychological qualities (cualidades) of loved ones.',
        xpReward: 50,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-3',
            type: 'multiple-choice',
            prompt: '¿Cuál es el antónimo (opuesto) de una persona "simpática"?',
            englishPrompt: 'What is the antonym (opposite) of a "simpática" person?',
            audioText: 'antipática',
            options: ['generosa', 'alegre', 'antipática', 'trabajadora'],
            correctAnswer: 'antipática',
            explanation: 'El opuesto de simpático/a es antipático/a (unpleasant/unfriendly).',
            hints: ['Lleva el prefijo anti-.'],
            syllabusRef: 'M4-AMIGOS',
            difficulty: 'easy'
          },
          {
            id: 'm4-zar-4',
            type: 'fill-blank',
            prompt: 'Una persona a la que le gusta mucho bromear y hacer reír es muy: "______" (femenino singular).',
            englishPrompt: 'A person who likes to joke and make people laugh is very: "divertida".',
            audioText: 'divertida',
            options: ['aburrida', 'seria', 'triste', 'divertida'],
            correctAnswer: 'divertida',
            explanation: '"Divertida" (fun/amusing) describe a alguien que entretiene y hace sonreír.',
            hints: ['Opuesto de aburrida.'],
            syllabusRef: 'M4-AMIGOS',
            difficulty: 'easy'
          }
        ]
      },
      {
        id: 'zaragoza-3',
        cityId: 'zaragoza',
        levelNumber: 3,
        title: 'Skills with SABER + Infinitive (Habilidades con SABER)',
        subtitle: 'Expressing skills: I can speak (sé hablar), knows how to cook (sabe cocinar), we know how to play (sabemos tocar)',
        tier: 'medium',
        syllabusTopic: 'M4.Skills (Habilidades)',
        description: 'You discover the artistic talents (talentos) of the musicians in Plaza del Pilar.',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-5',
            type: 'multiple-choice',
            prompt: '¿Cómo se dice en español "I know how to speak Spanish and I can play the guitar"?',
            englishPrompt: 'How do you say in Spanish "I know how to speak Spanish and I can play the guitar"?',
            audioText: 'Sé hablar español y sé tocar la guitarra',
            options: [
              'Sé hablar español y sé tocar la guitarra',
              'Conozco hablar español y conozco tocar guitarra',
              'Sabo hablar español y sabo tocar la guitarra',
              'Soy hablar español y estoy tocar la guitarra'
            ],
            correctAnswer: 'Sé hablar español y sé tocar la guitarra',
            explanation: 'Para habilidades y aptitudes aprendidas se usa el verbo SABER + infinitivo (primera persona irregular: Yo sé). Conocer es solo para lugares o personas.',
            hints: ['SABER + infinitivo (primera persona "Sé" con tilde).'],
            syllabusRef: 'M4-HABILIDADES',
            difficulty: 'medium'
          },
          {
            id: 'm4-zar-6',
            type: 'fill-blank',
            prompt: 'Completa para "Él": "Mi mejor amigo ______ cocinar paella riquísima (saber)."',
            englishPrompt: 'Complete for "Él": "My best friend knows how to cook delicious paella."',
            audioText: 'sabe',
            options: ['sé', 'sabe', 'saben', 'sabemos'],
            correctAnswer: 'sabe',
            explanation: 'Tercera persona singular del verbo saber: él sabe.',
            hints: ['Forma de él para el verbo saber.'],
            syllabusRef: 'M4-HABILIDADES',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'zaragoza-4',
        cityId: 'zaragoza',
        levelNumber: 4,
        title: 'Key Difference: SABER vs CONOCER (SABER vs CONOCER)',
        subtitle: 'Skills and information vs People and places (personas y lugares)',
        tier: 'medium',
        syllabusTopic: 'M4.Skills (Habilidades)',
        description: 'The essential rule so you never confuse knowing facts (saber) with knowing people (conocer).',
        xpReward: 70,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-7',
            type: 'multiple-choice',
            prompt: '¿Cuál es la diferencia fundamental entre SABER y CONOCER?',
            englishPrompt: 'What is the fundamental difference between SABER and CONOCER?',
            audioText: 'SABER para datos y habilidades; CONOCER para estar familiarizado con personas o lugares',
            options: [
              'SABER es formal y CONOCER informal',
              'Son sinónimos idénticos',
              'SABER para datos y habilidades (sé nadar); CONOCER para personas o ciudades (conozco Zaragoza)',
              'CONOCER solo se usa en preguntas y SABER en respuestas'
            ],
            correctAnswer: 'SABER para datos y habilidades (sé nadar); CONOCER para personas o ciudades (conozco Zaragoza)',
            explanation: 'SABER: información, hechos o habilidades prácticas (+ infinitivo). CONOCER: estar familiarizado con alguien (conozco a Pilar) o un lugar (conozco Madrid).',
            hints: ['SABER + infinitivo / datos; CONOCER + personas o ciudades.'],
            syllabusRef: 'M4-HABILIDADES',
            difficulty: 'medium'
          },
          {
            id: 'm4-zar-8',
            type: 'fill-blank',
            prompt: 'Para una persona se usa la "a" personal con conocer: "Yo conozco ______ la profesora de arte."',
            englishPrompt: 'For a person the personal "a" is used with conocer: "Yo conozco a la profesora de arte."',
            audioText: 'a',
            options: ['en', 'de', 'con', 'a'],
            correctAnswer: 'a',
            explanation: 'Cuando el objeto directo es una persona determinada, en español es preceptiva la "a" personal: conocer a alguien.',
            hints: ['La famosa "a" personal del español.'],
            syllabusRef: 'M4-HABILIDADES',
            difficulty: 'medium'
          }
        ]
      },
      {
        id: 'zaragoza-5',
        cityId: 'zaragoza',
        levelNumber: 5,
        title: 'Combining Physical and Moral Description (Descripción Física y Moral)',
        subtitle: 'Complete literary portrait (retrato) of a companion',
        tier: 'tough',
        syllabusTopic: 'M4.Friends (Amigos)',
        description: 'You write a biographical sketch (semblanza) at La Lonja de Zaragoza.',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-9',
            type: 'multiple-choice',
            prompt: 'Selecciona la frase sin ningún fallo de concordancia ni selección de verbo:',
            englishPrompt: 'Select the sentence with no error in agreement or verb selection:',
            audioText: 'Pilar es morena, tiene los ojos castaños y es muy trabajadora',
            options: [
              'Pilar es morena, tiene los ojos castaños y es muy trabajadora',
              'Pilar está morena, es los ojos castaño y tiene muy trabajadora',
              'Pilar es moreno, tiene los ojos castaña y es muy trabajador',
              'Pilar tiene morena, está los ojos castaños y es muy trabajadora'
            ],
            correctAnswer: 'Pilar es morena, tiene los ojos castaños y es muy trabajadora',
            explanation: 'SER para tez esencial (es morena), TENER para rasgos específicos con concordancia (tiene los ojos castaños) y SER para cualidad moral (es muy trabajadora).',
            hints: ['Femenino concuerda con Pilar; ojos castaños en masculino plural.'],
            syllabusRef: 'M4-AMIGOS',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'zaragoza-6',
        cityId: 'zaragoza',
        levelNumber: 6,
        title: 'The Talents of the Group (Talentos de la Pandilla)',
        subtitle: 'Plural conjugation of SABER: sabemos, sabéis, saben',
        tier: 'tough',
        syllabusTopic: 'M4.Skills (Habilidades)',
        description: 'Each friend in the group brings a skill (una destreza) to the trip.',
        xpReward: 90,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-10',
            type: 'fill-blank',
            prompt: 'Completa para primera persona plural: "Nosotros ______ bailar la jota aragonesa (saber)."',
            englishPrompt: 'Complete for first person plural: "Nosotros sabemos bailar la jota aragonesa."',
            audioText: 'sabemos',
            options: ['sabéis', 'sabemos', 'saben', 'sé'],
            correctAnswer: 'sabemos',
            explanation: 'Nosotros concuerda con "sabemos": nosotros sabemos bailar.',
            hints: ['Primera persona plural del verbo saber.'],
            syllabusRef: 'M4-HABILIDADES',
            difficulty: 'tough'
          }
        ]
      },
      {
        id: 'zaragoza-7',
        cityId: 'zaragoza',
        levelNumber: 7,
        title: 'Building Complex Portraits of People (Retratos Complejos)',
        subtitle: 'Descriptive syntax (sintaxis) with addition and contrast connectors (conectores)',
        tier: 'hard',
        syllabusTopic: 'M4.Syntax (Sintaxis)',
        description: 'You write the introduction of your team on the Stone Bridge (Puente de Piedra).',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-11',
            type: 'word-order',
            prompt: 'Ordena la frase: "Mi amigo es inteligente y sabe hablar tres idiomas con fluidez"',
            englishPrompt: 'Order the sentence: "My friend is smart and knows how to speak three languages fluently"',
            audioText: 'Mi amigo es inteligente y sabe hablar tres idiomas con fluidez',
            sentencePieces: ['tres', 'inteligente', 'Mi', 'amigo', 'fluidez', 'sabe', 'hablar', 'y', 'idiomas', 'con', 'es'],
            correctAnswer: 'Mi amigo es inteligente y sabe hablar tres idiomas con fluidez',
            explanation: 'Sujeto y cópula (Mi amigo es inteligente) + nexo coordinante (y) + perífrasis de habilidad (sabe hablar tres idiomas) + modo (con fluidez).',
            hints: ['Comienza por "Mi amigo es inteligente".'],
            syllabusRef: 'M4-HABILIDADES',
            difficulty: 'hard'
          }
        ]
      },
      {
        id: 'zaragoza-8',
        cityId: 'zaragoza',
        levelNumber: 8,
        title: 'Dialogue with Pilar in Plaza del Pilar (Diálogo con Pilar)',
        subtitle: 'Conversation about hobbies (aficiones), character (carácter), and shared talents',
        tier: 'hard',
        syllabusTopic: 'M4.Communication (Comunicación)',
        description: 'Pilar shows you the Mudéjar towers and you chat about your projects (proyectos).',
        xpReward: 110,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-12',
            type: 'dialogue',
            prompt: 'Charla frente a la basílica:',
            englishPrompt: 'Chat in front of the basilica:',
            audioText: '¡Hola viajero! Soy Pilar. En Aragón somos personas muy nobles y trabajadoras. ¿Qué es lo que más valoras tú en un amigo?',
            correctAnswer: 'Valoro mucho la sinceridad, la generosidad y el buen sentido del humor.',
            explanation: 'Respuesta comunicativa madura que enumera cualidades éticas y personales.',
            hints: ['Menciona la sinceridad y las cualidades positivas de la amistad.'],
            syllabusRef: 'M4-AMIGOS',
            difficulty: 'hard',
            dialogue: {
              npcName: 'Pilar del Ebro',
              npcRole: 'Historiadora del Arte Aragonés',
              prompt: '¡Hola viajero! Soy Pilar. En Aragón somos personas muy nobles y trabajadoras. ¿Qué es lo que más valoras tú en un amigo?',
              englishPrompt: 'Hello traveler! I am Pilar. In Aragon we are noble and hard-working people. What do you value most in a friend?',
              choices: [
                {
                  id: 'c2',
                  text: 'Son las dos y cuarto de la tarde en mi reloj.',
                  englishHint: 'It is a quarter past two in the afternoon on my watch.',
                  isCorrect: false,
                  npcResponse: 'La hora es exacta, pero te preguntaba por lo que valoras en un amigo.',
                  explanation: 'Fuera de contexto.'
                },
                {
                  id: 'c1',
                  text: 'Valoro mucho la sinceridad, la generosidad y el buen sentido del humor.',
                  englishHint: 'I value honesty, generosity and a good sense of humor very much.',
                  isCorrect: true,
                  npcResponse: '¡Qué gran respuesta! Esas virtudes crean amistades para toda la vida.',
                  explanation: 'Expresión comunicativa admirable y rica en valores.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'zaragoza-9',
        cityId: 'zaragoza',
        levelNumber: 9,
        title: 'Culinary and Musical Talents (Talentos Gastronómicos y Musicales)',
        subtitle: 'Contrast between knowing how to do something (saber) and liking something (gustar)',
        tier: 'hot',
        syllabusTopic: 'M4.Skills (Habilidades)',
        description: 'Pilar knows how to play the guitar (tocar la guitarra) and you like singing jotas (cantar jotas).',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-13',
            type: 'multiple-choice',
            prompt: '¿Cómo decimos "She knows how to dance and she loves dancing"?',
            englishPrompt: 'How do we say "She knows how to dance and she loves dancing"?',
            audioText: 'Ella sabe bailar y le encanta bailar',
            options: [
              'Ella conoce bailar y le gusta baile',
              'Ella es bailar y tiene encanto',
              'Ella sabe bailar y le encanta bailar',
              'Ella sabo bailar y se encanta'
            ],
            correctAnswer: 'Ella sabe bailar y le encanta bailar',
            explanation: 'Saber + infinitivo para la habilidad (sabe bailar) + pronombre de OI con encantar (le encanta bailar).',
            hints: ['Sabe bailar + le encanta bailar.'],
            syllabusRef: 'M4-HABILIDADES',
            difficulty: 'hot'
          }
        ]
      },
      {
        id: 'zaragoza-10',
        cityId: 'zaragoza',
        levelNumber: 10,
        title: 'Module 4 Culmination (Culminación del Módulo 4)',
        subtitle: 'Grand synthesis of routines (rutinas), reflexives, university, city, and friends (amigos)',
        tier: 'hot',
        syllabusTopic: 'M4.Synthesis (Síntesis)',
        description: 'The master test (la prueba maestra) crowning all of Module 4 before the Pilar challenge.',
        xpReward: 130,
        coinReward: 100,
        questions: [
          {
            id: 'm4-zar-14',
            type: 'fill-blank',
            prompt: 'Completa: "Mi mejor amiga ______ levanta a las siete y ______ hablar español con mucha soltura."',
            englishPrompt: 'Complete: "My best friend gets up at seven and knows how to speak Spanish with great fluency."',
            audioText: 'se / sabe',
            options: ['me / sé', 'te / sabes', 'se / conoce', 'se / sabe'],
            correctAnswer: 'se / sabe',
            explanation: 'Tercera persona singular: pronombre reflexivo "se" (se levanta) + habilidad aprendida con saber "sabe" (sabe hablar).',
            hints: ['Pronombre "se" para levantarse y verbo "sabe" para la habilidad.'],
            syllabusRef: 'M4-REFLEX',
            difficulty: 'hot'
          }
        ]
      }
    ],
    bossMission: {
      id: 'boss-zaragoza',
      cityId: 'zaragoza',
      title: 'El Encuentro en la Plaza del Pilar',
      characterName: 'Doña Pilar del Ebro',
      characterRole: 'Custodia del Patrimonio del Reino de Aragón',
      scenario: 'Bajo las cúpulas pintadas por Goya en la Basílica del Pilar, Doña Pilar evalúa tu informe completo sobre rutinas urbanas, perfiles de personajes y talentos del Módulo 4. Si demuestras maestría superior al 80%, desbloquearás el Módulo 5 y la ruta hacia Bilbao.',
      objectives: [
        { id: 'zar-obj1', description: 'Elaborar descripciones físicas y morales sin errores de concordancia', syllabusTopic: 'M4.Amigos' },
        { id: 'zar-obj2', description: 'Dominar la distinción absoluta entre SABER y CONOCER', syllabusTopic: 'M4.Habilidades' },
        { id: 'zar-obj3', description: 'Integrar rutinas cotidianas reflexivas con solvencia comunicativa', syllabusTopic: 'M4.Rutinas' }
      ],
      requiredScorePercent: 80,
      xpReward: 400,
      coinReward: 500,
      badgeName: 'La Cinta de la Virgen del Pilar',
      badgeIcon: '🕊️',
      questions: [
        {
          id: 'b-zar-1',
          type: 'multiple-choice',
          prompt: 'Doña Pilar: "Describa con precisión a nuestro guía voluntario: es amable, tiene ojos verdes y posee la destreza de orientar a los turistas. ¿Cuál es la formulación impecable?"',
          englishPrompt: 'Doña Pilar: "Describe our volunteer guide accurately. Which is the impeccable phrasing?"',
          audioText: 'El guía es muy amable, tiene los ojos verdes y sabe orientar a los visitantes.',
          options: [
              'El guía es muy amable, tiene los ojos verdes y sabe orientar a los visitantes.',
              'El guía está muy amable, es los ojos verdes y conoce orientar a los visitantes.',
              'El guía tiene muy amable, hace los ojos verdes y puede orientar a los visitantes.',
              'El guía es muy amable, tiene los ojos verdes y sabo orientar los visitantes.'
            ],
          correctAnswer: 'El guía es muy amable, tiene los ojos verdes y sabe orientar a los visitantes.',
          explanation: 'SER para carácter (es amable), TENER para rasgos anatómicos (tiene los ojos verdes) y SABER + infinitivo para competencia técnica (sabe orientar a...).',
          hints: ['SER amable, TENER ojos verdes, SABER orientar.'],
          syllabusRef: 'M4-AMIGOS',
          difficulty: 'hard'
        },
        {
          id: 'b-zar-2',
          type: 'fill-blank',
          prompt: 'Doña Pilar: "Nosotros ______ Zaragoza muy bien y ______ preparar la tradicional borraja aragonesa (conocer / saber)."',
          englishPrompt: 'Doña Pilar: "We know Zaragoza very well and know how to prepare traditional borage."',
          audioText: 'conocemos / sabemos',
          options: ['sabemos / conocemos', 'conocemos / sabemos', 'conocemos / conocemos', 'sabemos / sabemos'],
          correctAnswer: 'conocemos / sabemos',
          explanation: 'Para la ciudad se usa CONOCER ("conocemos Zaragoza") y para la técnica culinaria se usa SABER + infinitivo ("sabemos preparar").',
          hints: ['CONOCER para la ciudad, SABER para la receta.'],
          syllabusRef: 'M4-HABILIDADES',
          difficulty: 'hard'
        },
        {
          id: 'b-zar-3',
          type: 'word-order',
          prompt: 'Ordena el juramento aragonés: "La lealtad entre amigos resiste el paso de los siglos"',
          englishPrompt: 'Order the Aragonese pledge: "Loyalty among friends withstands the passage of centuries"',
          audioText: 'La lealtad entre amigos resiste el paso de los siglos',
          sentencePieces: ['amigos', 'siglos', 'entre', 'paso', 'La', 'resiste', 'de', 'lealtad', 'el', 'los'],
          correctAnswer: 'La lealtad entre amigos resiste el paso de los siglos',
          explanation: 'Sintagma sujeto (La lealtad entre amigos) + verbo transitivo (resiste) + sintagma objeto (el paso de los siglos).',
          hints: ['Comienza por "La lealtad entre amigos".'],
          syllabusRef: 'M4-Sintaxis',
          difficulty: 'hot'
        }
      ]
    }
  }
];
