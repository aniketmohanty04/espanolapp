# CAMINO – GEMINI-POWERED AI SPANISH LEARNING COMPANION

## 1. Introduction

Camino is the AI-powered personal Spanish tutor integrated into ¡Aventura Española!. It is connected to the Google Gemini API, which provides the language understanding and response-generation capabilities behind the assistant.

The primary objective of Camino is to provide learners with personalised, interactive, and easily accessible assistance while learning Spanish. It acts as a virtual Spanish teacher that can understand natural-language questions, explain grammatical concepts, translate sentences, clarify vocabulary, correct mistakes, and guide learners through basic Spanish conversations.

Unlike a traditional chatbot that simply provides predefined responses, Camino uses the Gemini API to generate contextual responses based on the learner's questions. This makes it possible for users to interact with the assistant naturally rather than being restricted to a fixed set of questions and answers.

Camino is primarily designed to support beginners following the A1 Spanish curriculum. Its teaching approach focuses on simple explanations, practical examples, and beginner-friendly communication.

---

## 2. Integration with Google Gemini API

Camino uses the Google Gemini API as its underlying generative AI service. Gemini enables the assistant to interpret user messages, understand the context of questions, and generate relevant responses.

When a learner enters a question in the Camino chat interface, the application sends the message to the Gemini-powered AI integration via a secure serverless backend proxy (`/api/camino-chat`), ensuring that all API keys remain strictly confidential on the server and are never exposed to client browsers or network inspectors.

The generated response is then displayed within the chatbot interface.

This integration allows Camino to support a wide range of learning-related interactions without requiring every possible question and answer to be manually programmed.

Gemini provides the conversational intelligence, while Camino acts as the application-specific Spanish tutor through its instructions, learning context, and user interface.

The assistant is configured to prioritize:
- Beginner-level Spanish explanations written in English for clarity.
- A1 curriculum-related topics (present tense, ser vs. estar, gender/number agreement, regular and irregular verbs).
- Simple vocabulary and sentence structures.
- Clear examples with English translations.
- Step-by-step grammatical explanations.
- Constructive corrections and interactive learning.

---

## 3. Major Features of Camino

### 3.1 AI-Based Personal Tutoring
Camino provides personalised assistance whenever learners encounter difficulties while studying Spanish.

Users can ask questions naturally, such as:
- *What is the difference between ser and estar?*
- *How do I introduce myself in Spanish?*
- *Why do we use el instead of la?*
- *How do I conjugate tener?*
- *Can you explain Spanish subject pronouns?*

Using the Gemini API, Camino generates explanations relevant to the questions. It can simplify complex concepts, provide examples, and guide learners through the topic.

### 3.2 Grammar Explanation
Camino helps learners understand Spanish grammar through interactive explanations and practical examples.

It assists with subject pronouns, articles, masculine and feminine nouns, singular and plural forms, adjectives, present-tense verb conjugations, and basic sentence structures.

For example, when a learner asks about the verb *hablar*, Camino explains its present-tense conjugation:
- **Yo hablo** – I speak.
- **Tú hablas** – You speak.
- **Él/Ella habla** – He/She speaks.
- **Nosotros hablamos** – We speak.
- **Vosotros habláis** – You all speak.
- **Ellos hablan** – They speak.

Rather than simply displaying these forms, Camino explains the conjugation pattern and provides additional examples.

### 3.3 Vocabulary Assistance
Camino helps learners understand and use new Spanish vocabulary.

When a user enters a Spanish word, it provides its English meaning, pronunciation guidance, example sentences, and common usage.

For example, when asked about *"comer"*, Camino explains that it means *"to eat"* and demonstrates its usage in a simple Spanish sentence.

### 3.4 Translation and Sentence Formation
Learners can use Camino to translate simple sentences between English and Spanish.

The assistant also explains how the translated sentence is constructed, helping learners understand grammar and word order.

**Example**:
> **User**: How do I say "I am a student" in Spanish?  
> **Camino**: "Soy estudiante."  
> *Explanation*: In Spanish, we use the verb *ser* (*soy*) without an indefinite article (*un/una*) when stating a profession or role.

### 3.5 Sentence Correction
Camino actively reviews sentences entered by learners, identifies grammatical errors, and suggests corrections.

**Example**:
> **User**: Yo tener un libro.  
> **Camino**: The correct sentence is *"Yo tengo un libro."*  
> *Explanation*: *Tener* is irregular in the present tense. Its first-person form with the subject *yo* is *tengo*.

This feature allows learners to identify their mistakes and understand how to avoid them.

### 3.6 Interactive Spanish Conversation
Camino acts as a conversation partner and helps learners practise basic Spanish communication.

Learners can explore everyday conversational situations, including introductions, greetings, ordering food, asking for directions, discussing family, and describing daily routines.

The assistant generates suitable conversational responses, encourages learners to reply in Spanish, and provides corrections when necessary, staying strictly within the A1 beginner level.

### 3.7 Context-Aware Learning Assistance
Camino complements the structured learning environment of ¡Aventura Española!.

Its responses are guided by the application's A1 curriculum, the student's current city, and the specific question being reviewed.

When reviewing a submitted quiz answer, Camino provides immediate pedagogical feedback explaining why the answer was correct or incorrect and reinforcing the underlying rule.

### 3.8 Pronunciation Learning Support
Camino provides intuitive textual pronunciation guidance (e.g. `mah-REE-ah ehs proh-feh-SOH-rah`) and native audio playback.

The application also integrates **Azure AI Speech Pronunciation Assessment** as a dedicated acoustic assessment service. Learners can record their speech and obtain acoustic accuracy, fluency, and completeness scores.

Camino and Azure AI Speech serve complementary purposes:
- **Gemini** powers the conversational tutor, grammar explanations, and textual phonetic guides.
- **Azure AI Speech** performs genuine acoustic evaluation of recorded audio.

---

## 4. User Interface and Accessibility

Camino is accessible through a floating chatbot button on the application's learning screens.

Clicking the icon opens a floating picture-in-picture chat window, allowing users to interact with the assistant without leaving their current learning activity:
- **Camino Identity**: Distinct robot mascot icon (🤖) with online status indicator.
- **Conversational Bubbles**: Clean visual separation between learner messages and Camino's structured bilingual responses.
- **Embedded Spanish Cards**: Dedicated highlighted boxes for Spanish target phrases with one-click native audio pronunciation.
- **Contextual Suggestion Chips**: Quick-access prompts for common questions (*"¿Por qué mi respuesta?"*, *"Explica la regla"*, *"Ser vs Estar"*).
- **Assessment Integrity Lock**: The chatbot is automatically locked during active, unanswered quiz questions, ensuring that learners independently attempt questions before consulting the tutor.

---

## 5. Technology Architecture

| Technology | Purpose in Camino |
|---|---|
| **Google Gemini API** (`gemini-flash-lite-latest` with model fallbacks) | Provides generative AI capabilities, natural language comprehension, and pedagogical response formulation. |
| **Serverless Proxy Endpoint** (`/api/camino-chat`) | Secure server-side relay running on Node.js / Vercel, protecting API credentials and keeping `GEMINI_API_KEY` 100% private. |
| **PostgreSQL RPC Rate Limiter** (`check_gemini_rate_limit`) | Atomic database-backed rate limit (20 calls / minute / user) safeguarding against abuse and API quota exhaustion. |
| **React 19 & TypeScript** | Power the reactive floating UI, drag-and-drop picture-in-picture window, and audio integration. |
| **Vite** | Fast development server with custom backend middleware and production bundling. |
| **Azure AI Speech** | Provides complementary acoustic pronunciation scoring for recorded voice exercises. |

---

## 6. Overall Objective

The objective of Camino is to make learning Spanish more accessible by providing learners with an intelligent assistant that can explain, guide, correct, and encourage them throughout their learning journey.

By leveraging the Google Gemini API through a private, server-secured architecture, Camino supports natural conversations and generates structured bilingual explanations for a broad range of Spanish-learning questions. Its seamless integration within ¡Aventura Española! allows learners to receive continuous assistance without ever leaving the game.

**Camino is the intelligent learning companion of ¡Aventura Española! — powered by Google Gemini, designed to make every learner's Spanish-learning journey more interactive, personalised, and engaging.**
