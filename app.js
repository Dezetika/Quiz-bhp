// Quiz PWA - poprawiona wersja
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizStarted = false;

// Elementy DOM
const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');
const questionContainer = document.getElementById('question-container');
const questionElement = document.getElementById('question');
const answerButtons = document.getElementById('answer-buttons');
const resultContainer = document.getElementById('result-container');
const answerDetails = document.getElementById('answer-details');
const currentScoreElement = document.getElementById('current-score');
const totalQuestionsElement = document.getElementById('total-questions');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');

// Debug - sprawdzenie czy elementy istnieją
console.log('Elementy DOM:', {
    startButton,
    questionContainer,
    questionElement,
    answerButtons,
    resultContainer
});

// Funkcja ładowania pytań z fallbackiem
async function loadQuestions() {
    try {
        console.log('Próba ładowania pytań...');
        const response = await fetch('pytania.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Otrzymane pytania:', data);
        
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Pytania nie są w poprawnym formacie lub lista jest pusta');
        }
        
        questions = data;
        totalQuestionsElement.textContent = questions.length;
        console.log(`Załadowano ${questions.length} pytań`);
        
    } catch (error) {
        console.error('Błąd ładowania pytań:', error);
        
        // Fallback - podstawowe pytania jeśli plik nie działa
        questions = [{
            pytanie: "Przykładowe pytanie?",
            opcje: { A: "Opcja A", B: "Opcja B", C: "Opcja C" },
            poprawna_odpowiedz: "A"
        }];
        
        totalQuestionsElement.textContent = questions.length;
        console.warn('Używam przykładowych pytań z powodu błędu');
    }
}

// Inicjalizacja quizu
function initializeQuiz() {
    console.log('Inicjalizacja quizu...');
    
    loadQuestions().then(() => {
        startButton.addEventListener('click', startQuiz);
        restartButton.addEventListener('click', restartQuiz);
        console.log('Quiz zainicjalizowany');
    }).catch(error => {
        console.error('Błąd inicjalizacji quizu:', error);
    });
}

// Rozpocznij quiz
function startQuiz() {
    console.log('Rozpoczynanie quizu...');
    
    if (questions.length === 0) {
        console.error('Brak pytań do wyświetlenia!');
        alert('Nie udało się załadować pytań. Odśwież stronę.');
        return;
    }
    
    quizStarted = true;
    score = 0;
    currentQuestionIndex = 0;
    currentScoreElement.textContent = score;
    
    startScreen.classList.add('hide');
    resultContainer.classList.add('hide');
    questionContainer.classList.remove('hide');
    
    showQuestion();
}

// Restart quizu
function restartQuiz() {
    console.log('Restartowanie quizu...');
    resultContainer.classList.add('hide');
    startQuiz();
}

// Pokazanie pytania
function showQuestion() {
    console.log(`Pokazywanie pytania ${currentQuestionIndex + 1}/${questions.length}`);
    
    resetState();
    const question = questions[currentQuestionIndex];
    
    if (!question) {
        console.error('Brak pytania dla indeksu:', currentQuestionIndex);
        showResults();
        return;
    }
    
    questionElement.textContent = `${currentQuestionIndex + 1}. ${question.pytanie}`;
    
    // Tworzenie przycisków z opcjami
    Object.entries(question.opcje).forEach(([key, value]) => {
        const button = document.createElement('button');
        button.textContent = `${key}: ${value}`;
        button.classList.add('btn', 'btn-option');
        button.dataset.key = key;
        button.addEventListener('click', selectAnswer);
        answerButtons.appendChild(button);
    });
    
    console.log('Pytanie wyświetlone');
}

// Reset stanu przycisków
function resetState() {
    console.log('Resetowanie stanu...');
    while (answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

// Wybór odpowiedzi
function selectAnswer(e) {
    if (!quizStarted) return;
    
    const selectedButton = e.target;
    const question = questions[currentQuestionIndex];
    const correctKey = question.poprawna_odpowiedz;
    const isCorrect = selectedButton.dataset.key === correctKey;
    
    console.log(`Wybrana odpowiedź: ${selectedButton.dataset.key}, poprawna: ${correctKey}`);
    
    // Zaznaczanie odpowiedzi
    Array.from(answerButtons.children).forEach(button => {
        button.disabled = true;
        if (button.dataset.key === correctKey) {
            button.classList.add('correct');
        } else if (button === selectedButton && !isCorrect) {
            button.classList.add('wrong');
        }
    });
    
    // Aktualizacja wyniku
    if (isCorrect) {
        score++;
        currentScoreElement.textContent = score;
        console.log('Poprawna odpowiedź!');
    } else {
        console.log('Błędna odpowiedź!');
    }
    
    // Zapisz odpowiedź w localStorage
    localStorage.setItem(`answer_${currentQuestionIndex}`, selectedButton.dataset.key);
    
    // Przejdź do następnego pytania lub wyników
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }, 1500);
}

// Pokazanie wyników
function showResults() {
    console.log('Pokazywanie wyników...');
    quizStarted = false;
    
    questionContainer.classList.add('hide');
    resultContainer.classList.remove('hide');
    
    const percentage = Math.round((score / questions.length) * 100);
    finalScoreElement.textContent = percentage;
    
    // Szczegóły odpowiedzi
    answerDetails.innerHTML = '';
    questions.forEach((question, index) => {
        const userAnswer = localStorage.getItem(`answer_${index}`);
        const isCorrect = userAnswer === question.poprawna_odpowiedz;
        
        const answerItem = document.createElement('div');
        answerItem.classList.add('answer-item', isCorrect ? 'correct' : 'wrong');
        
        answerItem.innerHTML = `
            <p><strong>Pytanie ${index + 1}:</strong> ${question.pytanie}</p>
            <p>Twoja odpowiedź: ${userAnswer ? question.opcje[userAnswer] : 'Brak'}</p>
            <p>Poprawna odpowiedź: ${question.opcje[question.poprawna_odpowiedz]}</p>
        `;
        
        answerDetails.appendChild(answerItem);
    });
    
    console.log('Wyniki wyświetlone');
}

// Service Worker dla PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker zarejestrowany:', registration.scope);
            })
            .catch(error => {
                console.log('Rejestracja ServiceWorker nieudana:', error);
            });
    });
}

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM załadowany');
    initializeQuiz();
});

// Debug - sprawdzenie localStorage
console.log('Zapisane odpowiedzi:', Object.entries(localStorage)
    .filter(([key]) => key.startsWith('answer_'))
    .map(([key, value]) => ({ key, value }))
);