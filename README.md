# ¡Aventura Española! — Spanish Level I Learning Adventure

**¡Aventura Española!** is a comprehensive, story-driven educational Spanish learning game designed for English-speaking travelers exploring Spain from A1 beginner to certified Level I mastery.

The course curriculum is strictly aligned with the official academic **BAESP101 Spanish Level I** university syllabus (15 Lecture Hours) and supported by the communicative framework of **Nuevo Español sin Fronteras (ESF 1)** and **Aula Internacional 1**.

---

## 🇪🇸 Game Overview

The player begins their journey arriving in **Madrid**, navigating 15 iconic Spanish cities across the Iberian Peninsula, culminating in the golden celebratory world of **La Gran Fiesta**:

| City # | City | Autonomous Region | Syllabus Module & Focus |
|:---:|:---|:---|:---|
| **1** | **Madrid** | Comunidad de Madrid | Módulo 1: Saludos, Abecedario, Datos Personales y Verbo SER |
| **2** | **Toledo** | Castilla-La Mancha | Módulo 1: Profesiones, Días de la Semana, Números 1-100 y SER |
| **3** | **Salamanca** | Castilla y León | Módulo 1: Gran Síntesis, Números hasta 100.000, Artículos y Adjetivos |
| **4** | **Segovia** | Castilla y León | Módulo 2: Mi Habitación, Colores, Verbo ESTAR y SER vs ESTAR |
| **5** | **Sevilla** | Andalucía | Módulo 2: Mi Familia, Verbo TENER, Expresar la Edad y Verbos en -AR |
| **6** | **Granada** | Andalucía | Módulo 2: Direcciones, Preposiciones de Lugar y Verbos en -ER / -IR |
| **7** | **Córdoba** | Andalucía | Módulo 3: Expresar la Hora, Meses del Año, Fechas y Verbo HAY |
| **8** | **Málaga** | Andalucía | Módulo 3: El Tiempo Atmosférico, Verbo HACER y Clima Mediterráneo |
| **9** | **Cádiz** | Andalucía | Módulo 3: Gustos (GUSTAR), Posesivos, y la Diferencia MUY vs MUCHO |
| **10** | **Valencia** | Comunidad Valenciana | Módulo 4: Rutinas Cotidianas, Verbos y Pronombres Reflexivos |
| **11** | **Barcelona** | Cataluña | Módulo 4: Horarios, Campus Universitario, Describir Barrios y Metro |
| **12** | **Zaragoza** | Aragón | Módulo 4: Describir Personas, Cualidades Morales y SABER + Infinitivo |
| **13** | **Bilbao** | País Vasco | Módulo 5: Alimentos, Tapas, Bebidas, Verbo IR y Contracción AL |
| **14** | **San Sebastián** | País Vasco | Módulo 5: En el Restaurante, Menú del Día, Opiniones y Verbo QUERER |
| **15** | **Santiago de Compostela** | Galicia | Módulo 5: Ubicar Sitios en la Ciudad y Verbo Modal PODER |
| **★** | **La Gran Fiesta** | Destino Central | **Pabellones Interactivos, 14 Personajes y Examen Oficial BAESP101** |

---

## 🎮 Level Architecture & Progression

- **10 Regular Levels per City**:
  - **Easy Tier**: Levels 1 & 2
  - **Medium Tier**: Levels 3 & 4
  - **Tough Tier**: Levels 5 & 6
  - **Hard Tier**: Levels 7 & 8
  - **Hot Tier**: Levels 9 & 10
- **1 Boss Mission per City**:
  - Narrative scenario featuring native historical characters (Don Rodrigo, Don Alonso, Catedrática Lucía, Doña Carmen, Tariq, Rafael, Manuel, Lola, Pau, Marc, Pilar, Iñaki, Maite, Xoán).
  - Enforces a **strict 80% mastery threshold** before unlocking the subsequent city.
- **4 Interactive Question Modalities**:
  1. *Multiple-Choice*: Options with instant feedback and key shortcuts.
  2. *Fill-in-the-Blank*: Input box with on-screen virtual Spanish accent keys (`á`, `é`, `í`, `ó`, `ú`, `ñ`, `¿`, `¡`).
  3. *Word-Ordering Sentence Constructor*: Tap-to-build chips that assemble grammatically correct sentences.
  4. *Selectable Branching Multi-Turn NPC Dialogue*: Interactive conversations testing communicative competence with reactive NPC responses.
- **Pronunciation & Native Audio**:
  - Integrated Spanish text-to-speech audio on every question, word, and character speech bubble via native Web Speech API (`es-ES`).

---

## 💰 Rewards Economy & Anti-Duplication Safeguards

Configured economic reward values:
- **First-Attempt Correct Answer**: `+100 coins`
- **Completed NPC Dialogue**: `+250 coins`
- **City Completion Bonus**: `+500 bonus coins`
- **English Translation Purchase**: `-1,000 coins`
  - Unlocked upon repeated attempts with explanation and correct Spanish construction.
  - Safeguard prevents negative balances (displays friendly message if insufficient funds).
  - Safeguard prevents duplicate deductions once purchased.
  - Safeguard prevents duplicate first-attempt coin rewards upon replay.
  - Safeguard prevents duplicate repeated submissions.

---

## 📚 Spaced Review Notebook & 35-Day Curriculum

- **Cuaderno de Repaso (Mistakes Review)**: Automatically logs any incorrect answer with fail counts and grammar notes. Includes a dedicated *Modo Práctica* where players re-test mistaken questions to mark them as *Dominadas* (+25 XP).
- **Plan de Estudio 35 Días**: Structured day-by-day study roadmap covering all 5 modules, daily goals, and milestone assessments with completion rewards.
- **Matriz de Cobertura del Sílabo BAESP101**: Dedicated modal displaying 100% verified coverage of every syllabus topic across the 15 cities with zero uncovered gaps.
- **Examen Oficial Acumulativo BAESP101**: 30 comprehensive questions spanning all 5 modules that evaluates competency and renders an official printable/downloadable **Diploma de Nivel I (A1)**.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom Spanish palette (`fiesta-red`, `fiesta-yellow`, `andalusian-blue`, `terracotta`)
- **Icons**: Lucide React
- **Celebrations**: Canvas Confetti
- **Audio**: Web Speech API (`speechSynthesis`) + Web Audio API synthesizer for melodic chimes and fanfares (zero external sound file dependencies)
- **Persistence**: Safe `localStorage` with JSON schema validation, error recovery, export save file, and import save file
- **Testing**: Vitest for unit, integration, and curriculum integrity tests

---

## 🚀 Setup & Development

### Prerequisites
- Node.js version 18+ (verified on Node v24.20.0 and npm 11.19.0)

### Installation
```bash
# Clone or navigate to the repository
cd spanish

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 🧪 Testing

Run the Vitest test suite to verify all curriculum mappings, reward rules, answer keys, and economic safeguards:

```bash
# Run unit and integration tests once
npm test

# Run tests in watch mode
npx vitest
```

---

## 📦 Production Build & Deployment

To build the optimized static production bundle:

```bash
npm run build
```

The production assets are generated in the `/dist` directory. You can deploy `/dist` directly to:
- **Vercel**: `vercel deploy`
- **Netlify**: drag and drop `/dist` or link repository
- **GitHub Pages**: deploy `/dist` branch or GitHub Actions
- **Cloudflare Pages / Firebase Hosting / S3**

To preview the built production site locally:
```bash
npm run preview
```

---

## 📜 Course Accreditation

This educational software implements the course outcomes for **BAESP101 (Spanish Level I)**:
1. Introduce oneself and conduct basic communicative dialogue.
2. Communicate using basic grammar and vocabulary at the A1 level.
3. Comprehend and translate simple written and spoken sentences.
4. Appreciate Spanish society, art, geography, and culture through 15 historic cities.
