import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { shuffleArray, getVocabPairs, getAvailableLists, getAvailableGrammarLists, listNameToVar } from './vocabData';

// Centralized grammar list names (used across the app)
const grammarListNames = ['Essere', 'Avere', 'Verbi- are', 'Verbi- ere', 'Verbi- ire', 'Fare', 'Andare', 'Stare', 'Bere', 'Sapere', 'Dare', 'Dire', 'Scegliere', 'Rimanere', 'Uscire', 'Venire', 'Dovere', 'Potere', 'Volere', 'Preferire', 'Capire', 'Finire', 'Pulire', 'Articoli Indeterminativi', 'Articoli Determinativi'];
// Conjugation-type grammar lists (pronoun -> conjugation)
const verbGrammarListNames = ['Essere', 'Avere', 'Verbi- are', 'Verbi- ere', 'Verbi- ire', 'Fare', 'Andare', 'Stare', 'Bere', 'Sapere', 'Dare', 'Dire', 'Scegliere', 'Rimanere', 'Uscire', 'Venire', 'Dovere', 'Potere', 'Volere', 'Preferire', 'Capire', 'Finire', 'Pulire'];

function App() {
  const [vocabPairs, setVocabPairs] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isEnglishToItalian, setIsEnglishToItalian] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [studiedTerms, setStudiedTerms] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [requiresCorrectAnswer, setRequiresCorrectAnswer] = useState(false);
  const [showVocabList, setShowVocabList] = useState(false);
  const [vocabList, setVocabList] = useState([]);
  const [editingWord, setEditingWord] = useState(null);
  const [newWord, setNewWord] = useState({ italian: '', english: '' });
  const [incorrectTerms, setIncorrectTerms] = useState([]);
  const [selectedVocabList, setSelectedVocabList] = useState('List 0');
  const [showListSelector, setShowListSelector] = useState(false);
  const [isGrammarMode, setIsGrammarMode] = useState(false);
  const [numbersChronological, setNumbersChronological] = useState(true);
  const answerInputRef = useRef(null);

  useEffect(() => {
    const vocabData = loadVocabList();
    // Initialize quiz with loaded vocabulary
    const shuffledPairs = shuffleArray(vocabData);
    setVocabPairs(shuffledPairs);
    setTotalQuestions(shuffledPairs.length);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStudiedTerms([]);
    setIncorrectTerms([]);
    setQuizStarted(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep theme consistent across the entire app (including when quiz starts)
  useEffect(() => {
    const body = document.body;
    body.classList.toggle('theme-grammar', isGrammarMode);
    body.classList.toggle('theme-normal', !isGrammarMode);
    return () => {
      body.classList.remove('theme-grammar');
      body.classList.remove('theme-normal');
    };
  }, [isGrammarMode]);

  // Keep the cursor in the answer input when playing the quiz
  useEffect(() => {
    if (!quizStarted) return;
    if (!answerInputRef.current) return;
    // Focus when result is not shown, or when retype is required
    if (!showResult || requiresCorrectAnswer) {
      // Delay to ensure the element is enabled and rendered
      setTimeout(() => {
        answerInputRef.current && answerInputRef.current.focus();
      }, 0);
    }
  }, [quizStarted, currentQuestionIndex, showResult, requiresCorrectAnswer, selectedVocabList]);

  const loadVocabList = (listName = selectedVocabList) => {
    const listVarName = listNameToVar[listName] || listNameToVar['List 0'];
    const isGrammar = grammarListNames.includes(listName);

    if (isGrammar) {
      // Load grammar list; verb grammar lists are stored as {pronoun, conjugation}.
      // Indefinite Articles uses regular {italian: noun, english: article} pairs.
      const savedGrammar = localStorage.getItem(`alexitGrammarList_${listVarName}`);
      if (savedGrammar) {
        try {
          const parsed = JSON.parse(savedGrammar);
          setVocabList(parsed);
          return parsed;
        } catch (e) {
          console.error('Error parsing saved grammar list:', e);
        }
      }
      if (verbGrammarListNames.includes(listName)) {
        // Build from defaults by converting into {pronoun, conjugation}
        const defaultPairs = getVocabPairs(listName).map(p => {
          const parts = p.italian.trim().split(' ');
          if (parts.length > 1) {
            const conj = parts.pop();
            const pron = parts.join(' ');
            return { pronoun: pron, conjugation: conj };
          }
          // Fallback for lists defined as pronoun -> ending (e.g., Verbi- are)
          return { pronoun: p.italian, conjugation: p.english };
        });
        setVocabList(defaultPairs);
        return defaultPairs;
      }
      // Indefinite Articles: use regular pairs
      const defaultPairs = getVocabPairs(listName);
      setVocabList(defaultPairs);
      return defaultPairs;
    }

    // Regular vocab mode: load {italian, english}
    const savedVocab = localStorage.getItem(`alexitVocabList_${listVarName}`);
    if (savedVocab) {
      try {
        const parsedVocab = JSON.parse(savedVocab);
        setVocabList(parsedVocab);
        return parsedVocab;
      } catch (error) {
        console.error('Error parsing saved vocabulary:', error);
      }
    }
    const pairs = getVocabPairs(listName);
    setVocabList(pairs);
    return pairs;
  };

  const initializeQuiz = () => {
    const currentVocab = vocabList.length > 0 ? vocabList : loadVocabList();
    const prepared = (selectedVocabList === 'Numbers' && numbersChronological)
      ? [...currentVocab].sort((a, b) => Number(a.english) - Number(b.english))
      : shuffleArray(currentVocab);
    setVocabPairs(prepared);
    setTotalQuestions(prepared.length);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStudiedTerms([]);
    setIncorrectTerms([]);
    setQuizStarted(false);
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const handleGrammarModeToggle = () => {
    const next = !isGrammarMode;
    setIsGrammarMode(next);
    // If turning on grammar mode and current list is not a grammar list, switch to Essere by default
    if (next && !grammarListNames.includes(selectedVocabList)) {
      handleListSelection('Essere');
    }
    // If turning off grammar mode and current list is a grammar list, switch to List 0 by default
    if (!next && grammarListNames.includes(selectedVocabList)) {
      handleListSelection('List 0');
    }
  };

  const getCurrentQuestion = () => {
    if (vocabPairs.length === 0) return null;
    const pair = vocabPairs[currentQuestionIndex];

    // Grammar mode handling
    const isGrammarList = grammarListNames.includes(selectedVocabList);
    if (isGrammarList) {
      if (verbGrammarListNames.includes(selectedVocabList)) {
        if (pair.pronoun && pair.conjugation) {
          return { question: pair.pronoun, answer: pair.conjugation };
        }
        // Fallback for default mapping
        const parts = pair.italian.split(' ');
        const verb = parts.pop();
        const pronoun = parts.join(' ');
        return { question: pronoun, answer: verb };
      }
      // Indefinite Articles: prompt noun, expect article
      return { question: pair.italian, answer: pair.english };
    }

    // Default vocab behavior respects direction toggle
    return isEnglishToItalian 
      ? { question: pair.english, answer: pair.italian }
      : { question: pair.italian, answer: pair.english };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const currentQ = getCurrentQuestion();
    const isAnswerCorrect = userAnswer.trim().toLowerCase() === currentQ.answer.toLowerCase();
    
    if (requiresCorrectAnswer) {
      // User is retyping the correct answer after getting it wrong
      if (isAnswerCorrect) {
        // Correct answer typed, proceed to next question
        setRequiresCorrectAnswer(false);
        setShowResult(false);
        setIsCorrect(null);
        setUserAnswer('');
        
        if (currentQuestionIndex < vocabPairs.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          // Quiz completed - show progress screen
          setQuizStarted(false);
        }
      } else {
        // Still incorrect, keep showing the correct answer
        setUserAnswer('');
      }
      return;
    }

    // First attempt at answering
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);

    if (isAnswerCorrect) {
      setScore(score + 1);
      
      // Add to studied terms
      const newStudiedTerm = {
        question: currentQ.question,
        answer: currentQ.answer,
        userAnswer: userAnswer.trim(),
        correct: isAnswerCorrect
      };
      setStudiedTerms([...studiedTerms, newStudiedTerm]);

      // Auto advance after showing result for correct answers (faster)
      setTimeout(() => {
        nextQuestion();
      }, 800);
    } else {
      // Wrong answer - require user to type the correct answer
      setRequiresCorrectAnswer(true);
      setUserAnswer('');
      
      // Add to studied terms
      const newStudiedTerm = {
        question: currentQ.question,
        answer: currentQ.answer,
        userAnswer: userAnswer.trim(),
        correct: isAnswerCorrect
      };
      setStudiedTerms([...studiedTerms, newStudiedTerm]);
      
      // Add to incorrect terms for review
      const currentPair = vocabPairs[currentQuestionIndex];
      setIncorrectTerms([...incorrectTerms, currentPair]);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setIsCorrect(null);
    setUserAnswer('');
    setRequiresCorrectAnswer(false);
    
    if (currentQuestionIndex < vocabPairs.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed - show progress screen
      setQuizStarted(false);
    }
  };

  const toggleDirection = () => {
    if (isGrammarMode) return; // Direction toggle not used in grammar mode
    setIsEnglishToItalian(!isEnglishToItalian);
  };

  const restartQuiz = () => {
    initializeQuiz();
  };

  const startIncorrectTermsQuiz = () => {
    if (incorrectTerms.length === 0) return;

    const prepared = (selectedVocabList === 'Numbers' && numbersChronological)
      ? [...incorrectTerms].sort((a, b) => Number(a.english) - Number(b.english))
      : shuffleArray(incorrectTerms);
    setVocabPairs(prepared);
    setTotalQuestions(prepared.length);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStudiedTerms([]);
    setIncorrectTerms([]);
    setQuizStarted(true);
  };

  const resetToDefaultVocab = () => {
    const isGrammar = grammarListNames.includes(selectedVocabList);
    if (isGrammar) {
      if (verbGrammarListNames.includes(selectedVocabList)) {
        // Build grammar defaults as {pronoun, conjugation}
        const defaults = getVocabPairs(selectedVocabList).map(p => {
          const parts = p.italian.trim().split(' ');
          if (parts.length > 1) {
            const conj = parts.pop();
            const pron = parts.join(' ');
            return { pronoun: pron, conjugation: conj };
          }
          // Fallback for lists defined as pronoun -> ending (e.g., Verbi- are)
          return { pronoun: p.italian, conjugation: p.english };
        });
        setVocabList(defaults);
        saveVocabToStorage(defaults);
        const shuffled = shuffleArray(defaults);
        setVocabPairs(shuffled);
        setTotalQuestions(shuffled.length);
        return;
      }
      // Indefinite Articles: reset to default noun->article pairs
      const defaultPairs = getVocabPairs(selectedVocabList);
      setVocabList(defaultPairs);
      saveVocabToStorage(defaultPairs);
      const prepared = shuffleArray(defaultPairs);
      setVocabPairs(prepared);
      setTotalQuestions(prepared.length);
      return;
    }
    // Use the display list name for fetching default pairs (regular vocab)
    const defaultPairs = getVocabPairs(selectedVocabList);
    setVocabList(defaultPairs);
    saveVocabToStorage(defaultPairs);
    const prepared = (selectedVocabList === 'Numbers' && numbersChronological)
      ? [...defaultPairs].sort((a, b) => Number(a.english) - Number(b.english))
      : shuffleArray(defaultPairs);
    setVocabPairs(prepared);
    setTotalQuestions(prepared.length);
  };

  // Toggle for chronological order in Numbers list
  const toggleNumbersOrder = () => {
    if (selectedVocabList !== 'Numbers') return;
    const next = !numbersChronological;
    setNumbersChronological(next);
    const base = vocabList.length > 0 ? vocabList : loadVocabList('Numbers');
    const prepared = next
      ? [...base].sort((a, b) => Number(a.english) - Number(b.english))
      : shuffleArray(base);
    setVocabPairs(prepared);
    setTotalQuestions(prepared.length);
    setCurrentQuestionIndex(0);
  };

  const handleVocabListToggle = () => {
    setShowVocabList(!showVocabList);
  };

  const handleListSelectorToggle = () => {
    setShowListSelector(!showListSelector);
  };

  const handleListSelection = (listName) => {
    setSelectedVocabList(listName);
    setShowListSelector(false);
    // Load the new vocabulary list
    const newVocabData = loadVocabList(listName);
    // Reset quiz with new vocabulary
    const prepared = (listName === 'Numbers' && numbersChronological)
      ? [...newVocabData].sort((a, b) => Number(a.english) - Number(b.english))
      : shuffleArray(newVocabData);
    setVocabPairs(prepared);
    setTotalQuestions(prepared.length);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStudiedTerms([]);
    setIncorrectTerms([]);
    setQuizStarted(false);
  };

  const handleEditWord = (index) => {
    setEditingWord(index);
  };

  const saveVocabToStorage = (vocabArray) => {
    try {
      const listVarName = listNameToVar[selectedVocabList] || listNameToVar['List 0'];
      const isGrammar = grammarListNames.includes(selectedVocabList);
      const key = isGrammar ? `alexitGrammarList_${listVarName}` : `alexitVocabList_${listVarName}`;
      localStorage.setItem(key, JSON.stringify(vocabArray));
    } catch (error) {
      console.error('Error saving vocabulary to localStorage:', error);
    }
  };

  const handleSaveEdit = (index, updatedWord) => {
    const updatedList = [...vocabList];
    updatedList[index] = updatedWord;
    setVocabList(updatedList);
    saveVocabToStorage(updatedList);
    setEditingWord(null);
    // Update the quiz data as well
    const prepared = (selectedVocabList === 'Numbers' && numbersChronological)
      ? [...updatedList].sort((a, b) => Number(a.english) - Number(b.english))
      : shuffleArray(updatedList);
    setVocabPairs(prepared);
    setTotalQuestions(prepared.length);
  };

  const handleDeleteWord = (index) => {
    const updatedList = vocabList.filter((_, i) => i !== index);
    setVocabList(updatedList);
    saveVocabToStorage(updatedList);
    // Update the quiz data as well
    const prepared = selectedVocabList === 'Numbers'
      ? [...updatedList].sort((a, b) => Number(a.english) - Number(b.english))
      : shuffleArray(updatedList);
    setVocabPairs(prepared);
    setTotalQuestions(prepared.length);
    // Reset quiz if we're in the middle of it
    if (currentQuestionIndex >= updatedList.length) {
      setCurrentQuestionIndex(0);
    }
  };

  const handleAddWord = () => {
    const isVerbGrammar = verbGrammarListNames.includes(selectedVocabList);
    const a = newWord.italian.trim();
    const b = newWord.english.trim();
    if (!a || !b) return;

    if (isVerbGrammar) {
      // Check for duplicates by pronoun
      const isDuplicate = vocabList.some(pair => pair.pronoun.toLowerCase() === a.toLowerCase());
      if (isDuplicate) {
        alert('This pronoun already exists in your grammar list!');
        return;
      }
      const updatedList = [...vocabList, { pronoun: a, conjugation: b }];
      setVocabList(updatedList);
      saveVocabToStorage(updatedList);
      setNewWord({ italian: '', english: '' });
      const prepared = (selectedVocabList === 'Numbers' && numbersChronological)
        ? [...updatedList].sort((x, y) => Number(x.english) - Number(y.english))
        : shuffleArray(updatedList);
      setVocabPairs(prepared);
      setTotalQuestions(prepared.length);
      return;
    }

    // Regular vocab mode
    const isDuplicate = vocabList.some(pair => 
      pair.italian.toLowerCase() === a.toLowerCase() ||
      pair.english.toLowerCase() === b.toLowerCase()
    );
    if (isDuplicate) {
      alert('This word already exists in your vocabulary list!');
      return;
    }
    const updatedList = [...vocabList, { italian: a, english: b }];
    setVocabList(updatedList);
    saveVocabToStorage(updatedList);
    setNewWord({ italian: '', english: '' });
    const prepared = (selectedVocabList === 'Numbers' && numbersChronological)
      ? [...updatedList].sort((x, y) => Number(x.english) - Number(y.english))
      : shuffleArray(updatedList);
    setVocabPairs(prepared);
    setTotalQuestions(prepared.length);
  };

  const handleCancelEdit = () => {
    setEditingWord(null);
  };

  const currentQuestion = getCurrentQuestion();
  const progressPercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Render vocabulary modal at top level so it's available in all states
  const vocabModal = showVocabList && (
    <div className="vocab-modal-overlay" onClick={handleVocabListToggle}>
      <div className="vocab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vocab-modal-header">
          <h2>Edit List</h2>
          <button className="close-modal-btn" onClick={handleVocabListToggle}>×</button>
        </div>
        
        <div className="vocab-modal-content">
          <div className="current-list-info">
            <h3>Current List: {selectedVocabList}</h3>
          </div>
          <div className="add-word-section">
            <h3>{grammarListNames.includes(selectedVocabList) ? ((selectedVocabList === 'Articoli Indeterminativi' || selectedVocabList === 'Articoli Determinativi') ? 'Add Noun + Article' : 'Add Pronoun + Conjugation') : 'Add New Word'}</h3>
            <div className="add-word-form">
              <input
                type="text"
                placeholder={grammarListNames.includes(selectedVocabList) ? ((selectedVocabList === 'Articoli Indeterminativi' || selectedVocabList === 'Articoli Determinativi') ? 'Italian noun (e.g., sedia, libro, acqua...)' : 'Pronoun (e.g., Io, Tu, Lui/Lei, ...)') : 'Italian word'}
                value={newWord.italian}
                onChange={(e) => setNewWord({...newWord, italian: e.target.value})}
                className="word-input"
              />
              <input
                type="text"
                placeholder={verbGrammarListNames.includes(selectedVocabList) ? 'Conjugation (e.g., sono, sei, è, ...)' : (selectedVocabList === 'Articoli Indeterminativi' ? "Indefinite article (un/uno/una/un')" : (selectedVocabList === 'Articoli Determinativi' ? "Definite article (il/lo/l'/la/i/gli/le)" : 'English translation'))}
                value={newWord.english}
                onChange={(e) => setNewWord({...newWord, english: e.target.value})}
                className="word-input"
              />
              <button onClick={handleAddWord} className="add-word-btn">Add Word</button>
            </div>
          </div>
          
          <div className="vocab-list-section">
            <div className="vocab-list-header">
              <h3>{verbGrammarListNames.includes(selectedVocabList) ? `Current Conjugations (${vocabList.length})` : `Current Vocabulary (${vocabList.length} words)`}</h3>
              <button onClick={resetToDefaultVocab} className="reset-vocab-btn">
                Reset to Default
              </button>
            </div>
            <div className="vocab-items">
              {vocabList.map((pair, index) => (
                <div key={index} className="vocab-item">
                  {editingWord === index ? (
                    <EditWordForm
                      word={pair}
                      isGrammar={verbGrammarListNames.includes(selectedVocabList)}
                      onSave={(updatedWord) => handleSaveEdit(index, updatedWord)}
                      onCancel={handleCancelEdit}
                    />
                  ) : (
                    <>
                      <div className="vocab-pair">
                        {(verbGrammarListNames.includes(selectedVocabList)) ? (
                          <>
                            <span className="italian-word">{pair.pronoun}</span>
                            <span className="english-word">{pair.conjugation}</span>
                          </>
                        ) : (
                          <>
                            <span className="italian-word">{pair.italian}</span>
                            <span className="english-word">{pair.english}</span>
                          </>
                        )}
                      </div>
                      <div className="vocab-actions">
                        <button onClick={() => handleEditWord(index)} className="edit-btn">✏️</button>
                        <button onClick={() => handleDeleteWord(index)} className="delete-btn">🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!quizStarted) {
    return (
      <div className={`App ${isGrammarMode ? 'theme-grammar' : 'theme-normal'}`}>
        <div className="progress-container">
          <div className="header">
            <div className="header-left">
              <div className="list-selector-container">
                <button className="list-selector-btn" onClick={handleListSelectorToggle}>
                  {selectedVocabList} ▼
                </button>
                {showListSelector && (
                  <div className="list-dropdown">
                    {(isGrammarMode
                      ? getAvailableGrammarLists()
                      : getAvailableLists().filter((n) => !grammarListNames.includes(n))
                    ).map((listName) => (
                      <button
                        key={listName}
                        className={`list-option ${selectedVocabList === listName ? 'selected' : ''}`}
                        onClick={() => handleListSelection(listName)}
                      >
                        {listName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="vocab-list-btn" onClick={handleVocabListToggle}>
                Edit List
              </button>
            </div>
            <button className="close-btn">×</button>
          </div>
          
          <div className="progress-content">
            <h1>Hi Alexia, Welcome to Alexit!</h1>
            
            {studiedTerms.length > 0 && (
              <>
                <h2>Great job, you're making progress.</h2>
                <div className="progress-section">
                  <p className="progress-text">Total set progress: {progressPercentage}%</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(score / totalQuestions) * 100}%` }}
                    ></div>
                    <span className="progress-score">{score}</span>
                    <span className="progress-total">{totalQuestions}</span>
                  </div>
                  <div className="progress-labels">
                    <span>Correct</span>
                    <span>Total questions</span>
                  </div>
                </div>

                <div className="terms-section">
                  <h3>Terms studied in this round</h3>
                  <div className="terms-list">
                    {studiedTerms.slice(-5).map((term, index) => (
                      <div key={index} className="term-row">
                        <div className="term-question">{term.question}</div>
                        <div className="term-answer">{term.answer}</div>
                        <div className="term-actions">
                          <button className="star-btn">☆</button>
                          <button className="audio-btn">🔊</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="quiz-controls">
              <button className={`mode-toggle ${isGrammarMode ? 'disabled' : ''}`} onClick={toggleDirection} disabled={isGrammarMode}>
                Mode: {isGrammarMode ? 'Grammar (Pronoun → Verb)' : (isEnglishToItalian ? 'English → Italian' : 'Italian → English')}
              </button>
              <button className={`mode-toggle`} onClick={handleGrammarModeToggle}>
                {isGrammarMode ? 'Grammar Mode: ON' : 'Grammar Mode: OFF'}
              </button>
              {studiedTerms.length === 0 && (
                <button className="start-btn" onClick={startQuiz}>
                  Start Quiz
                </button>
              )}
              {studiedTerms.length > 0 && (
                <button className="restart-btn" onClick={restartQuiz}>
                  Restart Quiz
                </button>
              )}
              {incorrectTerms.length > 0 && (
                <button className="review-incorrect-btn" onClick={startIncorrectTermsQuiz}>
                  Review Incorrect Terms ({incorrectTerms.length})
                </button>
              )}
            </div>
          </div>
        </div>
        {vocabModal}
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="App">Loading...</div>;
  }

  return (
    <div className="App">
      <div className="quiz-container">
        <div className="quiz-header">
          <button className="back-btn" onClick={() => setQuizStarted(false)}>←</button>
          <div className="quiz-progress">
            {currentQuestionIndex + 1} / {totalQuestions}
          </div>
        </div>

        <div className="question-container">
          {(grammarListNames.includes(selectedVocabList)) && (
            <div className="grammar-verb-label">
              {selectedVocabList}
            </div>
          )}
          {(selectedVocabList === 'Numbers') && (
            <div className="numbers-mode-row">
              <div className="numbers-mode-label">Chronological Order</div>
              <button type="button" className={`numbers-toggle ${numbersChronological ? 'on' : 'off'}`} onClick={toggleNumbersOrder}>
                {numbersChronological ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
          <div className="question-text">
            {currentQuestion.question}
          </div>
          
          <form onSubmit={handleSubmit} className="answer-form">
            <input
              type="text"
              value={userAnswer}
              ref={answerInputRef}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={requiresCorrectAnswer 
                ? `Type the correct answer: "${currentQuestion.answer}"` 
                : (verbGrammarListNames.includes(selectedVocabList)
                    ? 'Type the Italian verb conjugation...'
                    : (selectedVocabList === 'Indefinite Articles'
                        ? "Type the indefinite article (un/uno/una/un')..."
                        : `Type the ${isEnglishToItalian ? 'Italian' : 'English'} translation...`))}
              className={`answer-input ${showResult ? (isCorrect ? 'correct' : 'incorrect') : ''} ${requiresCorrectAnswer ? 'retype-mode' : ''}`}
              disabled={showResult && !requiresCorrectAnswer}
              autoFocus
            />
            {(!showResult || requiresCorrectAnswer) && (
              <button type="submit" className="submit-btn">
                {requiresCorrectAnswer ? 'Continue' : 'Submit'}
              </button>
            )}
          </form>

          {showResult && !requiresCorrectAnswer && (
            <div className={`result-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? (
                <div className="success-message">
                  ✓ Correct!
                </div>
              ) : (
                <div className="error-message">
                  ✗ Incorrect. The answer is: <strong>{currentQuestion.answer}</strong>
                  <br />
                  <span className="retype-instruction">Please type the correct answer to continue.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {vocabModal}
    </div>
  );
}

// Edit Word Form Component
function EditWordForm({ word, onSave, onCancel, isGrammar }) {
  const [editedWord, setEditedWord] = useState(word);

  const handleSave = () => {
    if (isGrammar) {
      if (editedWord.pronoun && editedWord.conjugation && editedWord.pronoun.trim() && editedWord.conjugation.trim()) {
        onSave({ pronoun: editedWord.pronoun.trim(), conjugation: editedWord.conjugation.trim() });
      }
      return;
    }
    if (editedWord.italian && editedWord.english && editedWord.italian.trim() && editedWord.english.trim()) {
      onSave({ italian: editedWord.italian.trim(), english: editedWord.english.trim() });
    }
  };

  return (
    <div className="edit-word-form">
      {isGrammar ? (
        <>
          <input
            type="text"
            value={editedWord.pronoun}
            onChange={(e) => setEditedWord({ ...editedWord, pronoun: e.target.value })}
            className="edit-input"
          />
          <input
            type="text"
            value={editedWord.conjugation}
            onChange={(e) => setEditedWord({ ...editedWord, conjugation: e.target.value })}
            className="edit-input"
          />
        </>
      ) : (
        <>
          <input
            type="text"
            value={editedWord.italian}
            onChange={(e) => setEditedWord({...editedWord, italian: e.target.value})}
            className="edit-input"
          />
          <input
            type="text"
            value={editedWord.english}
            onChange={(e) => setEditedWord({...editedWord, english: e.target.value})}
            className="edit-input"
          />
        </>
      )}
      <div className="edit-actions">
        <button onClick={handleSave} className="save-btn">✓</button>
        <button onClick={onCancel} className="cancel-btn">✗</button>
      </div>
    </div>
  );
}

export default App;
