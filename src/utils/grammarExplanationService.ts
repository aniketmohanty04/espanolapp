import { Question } from '../types';

/**
 * Curated grammatical rules in English for curriculum syllabus topics
 */
const SYLLABUS_GRAMMAR_RULES: Record<string, string> = {
  'M1-PROF': 'Grammar Rule: In Spanish, professions following the verb SER do not use an indefinite article ("un/una"), e.g., "Soy profesor" (I am a teacher) or "Es arquitecto" (He is an architect). To form the feminine form of professions ending in a consonant, add "-a" (profesor ➔ profesora, doctor ➔ doctora).',
  'M1-ART': 'Grammar Rule: Spanish articles must agree with the noun in both gender (masculine/feminine) and number (singular/plural). Indefinite articles: un (masculine singular), una (feminine singular), unos (masculine plural, "some"), unas (feminine plural, "some").',
  'M1-SER': 'Grammar Rule: The verb SER (to be) expresses identity, professions, nationality, and permanent characteristics. Conjugation: yo soy, tú eres, él/ella/usted es, nosotros somos, vosotros sois, ellos/ustedes son.',
  'M1-ESTAR': 'Grammar Rule: The verb ESTAR (to be) expresses temporary states, emotions, locations, and ongoing actions: yo estoy, tú estás, él/ella está, nosotros estamos, vosotros estáis, ellos están.',
  'M1-NUM1': 'Grammar Rule: Cardinal numbers in Spanish: 100 standing alone is strictly "cien". When followed by additional numbers (101-199), it expands to "ciento" (ciento uno, ciento cincuenta).',
  'M1-NUM2': 'Grammar Rule: Numbers from 16 to 29 are written as a single word (dieciséis, veintidós, veinticinco). From 31 upwards, use "y" (treinta y uno, cuarenta y dos).',
  'M1-SALUDOS': 'Grammar Rule: Spanish greetings use plural expressions: "¡Buenos días!" (Good morning - masculine), "¡Buenas tardes!" (Good afternoon - feminine), "¡Buenas noches!" (Good evening/night - feminine). Note inverted punctuation (¡!).',
  'M1-ALPHABET': 'Grammar Rule: In Spanish, the letter "h" is completely silent. The letter "c" sounds like "th" (in Spain) or "s" (in Latin America) before "e" or "i", and like "k" before "a", "o", or "u".',
  'M2-SER-ESTAR': 'Grammar Rule: SER defines identity or essential traits (who/what someone is). ESTAR describes states, conditions, or physical location (how or where someone is: "estar bien", "estar en Toledo").',
  'M2-PRETERITE': 'Grammar Rule: The Spanish preterite tense indicates actions completed at a specific point in the past with defined beginnings or ends (e.g. hablé, comí, viví).'
};

/**
 * Question-specific precise English rules and explanations
 */
const QUESTION_SPECIFIC_RULES: Record<string, string> = {
  'm1-tol-5': 'Grammar Rule: In Spanish, masculine professions ending in a consonant form the feminine by adding "-a" (profesor ➔ profesora, doctor ➔ doctora). Also, with the verb SER, Spanish does NOT use an article for basic professions: "María es profesora" (María is a teacher).',
  'm1-tol-6': 'Grammar Rule: When expressing a profession or occupation with the verb SER in Spanish, indefinite articles ("un" / "una") are omitted: say "Él es arquitecto" (He is an architect) or "Soy profesor" (I am a teacher). Do NOT say "Él es un arquitecto" unless modifying it with an adjective.',
  'm1-tol-7': 'Grammar Rule: "Unos" is the masculine plural indefinite article, equivalent to English "some". Use "unos" before masculine plural nouns: "unos libros" (some books). Its feminine counterpart is "unas" ("unas mesas").',
  'm1-tol-8': 'Grammar Rule: Standard Spanish word order in affirmative statements: Subject ("El maestro") + Conjugated Verb ("forja") + Direct Object ("una espada") + Prepositional Modifier ("de acero").',
  'm1-tol-9': 'Grammar Rule: In Spain (Castilian Spanish), the informal second-person plural pronoun "vosotros" conjugates with the verb SER as "sois" ("Vosotros sois artesanos" = You all are craftsmen).',
  'm1-tol-1': 'Grammar Rule: The Spanish alphabet contains 27 letters, including the distinct letter "ñ" with the tilde, which represents a separate phoneme /ɲ/.',
  'm1-tol-2': 'Grammar Rule: In Spanish phonetics, the letter "h" is always silent at the beginning of words (e.g. "hola", "hora", "hotel").',
  'm1-tol-3': 'Grammar Rule: Spanish numbers 11 through 15 are irregular single words ending in "-ce": once (11), doce (12), trece (13), catorce (14), quince (15).',
  'm1-tol-4': 'Grammar Rule: The number 100 standing by itself is shortened (apocopated) to "cien". It only becomes "ciento" when followed by another number (e.g. "ciento uno").',
  'm1-mad-1': 'Grammar Rule: In Spanish, "Buenos días" (Good morning) uses the masculine plural adjective "buenos" to match the masculine noun "días".',
  'm1-mad-2': 'Grammar Rule: "Buenas tardes" and "Buenas noches" take the feminine plural adjective "buenas" to agree with the feminine nouns "tardes" and "noches".',
  'm1-mad-3': 'Grammar Rule: Subject pronouns in Spanish are often omitted because verb endings already clearly indicate the subject: "Soy de Madrid" clearly means "I am from Madrid".',
  'm1-mad-4': 'Grammar Rule: To ask "Where are you from?" informally, use: "¿De dónde eres?". The preposition "de" (from) always precedes the interrogative pronoun "dónde".',
  'm1-mad-5': 'Grammar Rule: Use "estar" for location: "¿Dónde está la estación de tren?" (Where is the train station?). Locations always require ESTAR, never SER.'
};

/**
 * Converts or enriches a Spanish explanation into an English explanation with grammar rules.
 */
export function getEnglishGrammarExplanation(question?: Partial<Question> | null): string {
  if (!question) {
    return 'Grammar Rule: Review grammatical agreement, verb conjugation, and sentence structure.';
  }

  // 1. If explicit englishExplanation is provided on the Question object, use it
  if (question.englishExplanation && question.englishExplanation.trim()) {
    return question.englishExplanation.trim();
  }

  // 2. Check question-specific rules
  const qId = question.id?.toLowerCase() || '';
  if (QUESTION_SPECIFIC_RULES[qId]) {
    return QUESTION_SPECIFIC_RULES[qId];
  }

  // 3. Check syllabus topic rules
  const ref = question.syllabusRef?.toUpperCase() || '';
  for (const [key, rule] of Object.entries(SYLLABUS_GRAMMAR_RULES)) {
    if (ref.includes(key) || key.includes(ref)) {
      return rule;
    }
  }

  // 4. Translate or parse common Spanish explanation patterns
  const spanishExp = question.explanation || '';
  if (spanishExp) {
    if (spanishExp.toLowerCase().includes('profesión') || spanishExp.toLowerCase().includes('verbo ser')) {
      return 'Grammar Rule: In Spanish, professions with the verb SER do not take indefinite articles ("un/una") unless modified by an adjective: "Soy profesor" (I am a teacher), "Es arquitecto" (He is an architect). Masculine professions ending in a consonant form the feminine by adding "-a" (profesor ➔ profesora).';
    }
    if (spanishExp.toLowerCase().includes('artículo indefinido') || spanishExp.toLowerCase().includes('artículos')) {
      return 'Grammar Rule: Indefinite articles must agree in gender and number with the noun: un (masc. singular), una (fem. singular), unos (masc. plural / some), unas (fem. plural / some).';
    }
    if (spanishExp.toLowerCase().includes('vosotros')) {
      return 'Grammar Rule: In Spain, "vosotros" is the informal plural "you all". With SER it conjugates as "sois" ("vosotros sois").';
    }
    if (spanishExp.toLowerCase().includes('cien') || spanishExp.toLowerCase().includes('ciento')) {
      return 'Grammar Rule: Exactly 100 is "cien". From 101 to 199, use "ciento" followed by the remainder (e.g. ciento uno, ciento diez).';
    }
    if (spanishExp.toLowerCase().includes('ser') && spanishExp.toLowerCase().includes('estar')) {
      return 'Grammar Rule: Use SER for permanent identity, characteristics, origin, and professions. Use ESTAR for physical locations, conditions, and temporary states.';
    }
  }

  // 5. Default informative explanation
  return `Grammar Rule: ${spanishExp || 'Pay close attention to gender agreement, singular/plural concordance, and verb tense.'}`;
}
