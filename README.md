# Alexit 🇮🇹

A personal Italian flashcard app built while studying abroad in Rome. I got tired of Quizlet's paywall, so I made my own.

## Features

- **Vocab Mode** — Flashcard-style quizzing across multiple vocabulary lists (food, places, phrases, numbers, and more)
- **Grammar Mode** — Verb conjugation drills for 20+ Italian verbs (essere, avere, fare, andare...) plus indefinite and definite articles
- **Direction toggle** — Flip between English → Italian and Italian → English
- **Wrong answer retry** — If you get a term wrong, you have to type the correct answer before moving on
- **Review incorrect terms** — After a round, drill only the terms you missed
- **Editable vocab lists** — Add, edit, or remove terms from any list; changes persist via localStorage
- **Chronological mode** — For the Numbers list, toggle between shuffled and sequential order
- **Smooth theme switching** — Vocab mode and Grammar mode have distinct visual themes

## Tech Stack

- **React** (Create React App)
- **JavaScript**
- **CSS**
- **Python** — `clean_vocab.py` script to parse and clean raw vocab notes into structured data

## How It Works

Vocabulary is stored in `vocabData.js` as structured lists. The Python script `clean_vocab.py` was used to process raw vocab notes into the initial dataset. The React app handles all quiz logic, state management, and list editing on the frontend, with edits persisted to `localStorage`.

## Running Locally

```bash
npm install
npm start
```

## Notes

Built with AI using Windsurf/Cascade. Vocab data sourced from my own Italian coursework during the Northeastern NUin program in Rome.
