let currentBoard = [];
let initialBoard = [];
let solutionBoard = [];
let selectedCell = null;
let mistakes = 0;
const maxMistakes = 3;
let hintsRemaining = 3;

// Timer state variables
let timerInterval = null;
let secondsElapsed = 0;

const gridContainer = document.getElementById('sudoku-grid');
const mistakesDisplay = document.getElementById('mistakes');
const timerDisplay = document.getElementById('timer');
const hintBtn = document.getElementById('hint-btn');
const difficultySelect = document.getElementById('difficulty-select');
const themeToggle = document.getElementById('theme-toggle');

/**
 * 1. CORE VALIDATION LOGIC
 */
function isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) return false;
        if (board[i][col] === num) return false;
        let boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
        let boxCol = 3 * Math.floor(col / 3) + i % 3;
        if (board[boxRow][boxCol] === num) return false;
    }
    return true;
}

/**
 * 2. BACKTRACKING GENERATOR
 */
function fillBoard(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                for (let num of numbers) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (fillBoard(board)) return true;
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

/**
 * 3. DIFFICULTY CREATOR
 */
function createPlayablePuzzle(clues = 45) {
    let solvedBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillBoard(solvedBoard);
    solutionBoard = solvedBoard.map(row => [...row]);

    let puzzle = solvedBoard.map(row => [...row]);
    let cellsToRemove = 81 - clues;
    while (cellsToRemove > 0) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);
        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            cellsToRemove--;
        }
    }
    return puzzle;
}

/**
 * TIMER CONTROLLER FUNCTIONS
 */
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    if (!timerDisplay) return;
    const minutes = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const seconds = (secondsElapsed % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

/**
 * 4. GAME INITIALIZATION & INTERACTION HANDLERS
 */
function initBoard() {
    gridContainer.innerHTML = '';
    currentBoard = [];
    selectedCell = null;
    
    mistakes = 0;
    if (mistakesDisplay) mistakesDisplay.textContent = `0/${maxMistakes}`;

    hintsRemaining = 3;
    if (hintBtn) {
        hintBtn.textContent = `💡 Hint (${hintsRemaining})`;
        hintBtn.disabled = false;
    }

    const structuralClues = parseInt(difficultySelect.value) || 45;

    startTimer();
    initialBoard = createPlayablePuzzle(structuralClues);
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = initialBoard[r][c];
            currentBoard.push(val);

            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.index = (r * 9) + c;

            if (val !== 0) {
                cellElement.textContent = val;
                cellElement.classList.add('initial');
            } else {
                cellElement.addEventListener('click', () => selectCell(cellElement));
            }
            gridContainer.appendChild(cellElement);
        }
    }
}

function selectCell(element) {
    if (selectedCell) selectedCell.classList.remove('selected');
    selectedCell = element;
    selectedCell.classList.add('selected');
}

function updateSelectedCellValue(num) {
    if (!selectedCell || selectedCell.classList.contains('initial')) return;
    const index = parseInt(selectedCell.dataset.index);
    const row = Math.floor(index / 9);
    const col = index % 9;
    
    if (num === "") {
        selectedCell.textContent = "";
        currentBoard[index] = 0;
        selectedCell.className = 'cell selected';
    } else {
        const val = parseInt(num);
        selectedCell.textContent = num;
        currentBoard[index] = val;

        if (val === solutionBoard[row][col]) {
            selectedCell.className = 'cell selected correct';
        } else {
            selectedCell.className = 'cell selected error';
            mistakes++;
            if (mistakesDisplay) mistakesDisplay.textContent = `${mistakes}/${maxMistakes}`;
            
            if (mistakes >= maxMistakes) {
                stopTimer();
                setTimeout(() => {
                    alert("Game Over! You made 3 mistakes. Starting a new game map!");
                    initBoard();
                }, 100);
                return;
            }
        }
    }
    checkWinCondition();
}

function checkWinCondition() {
    if (!currentBoard.includes(0) && document.querySelectorAll('.cell.error').length === 0) {
        stopTimer();
        setTimeout(() => {
            alert(`Congratulations! You solved it perfectly in ${timerDisplay.textContent}!`);
            initBoard();
        }, 100);
    }
}

if (hintBtn) {
    hintBtn.addEventListener('click', () => {
        if (hintsRemaining <= 0) return;

        if (!selectedCell) {

            alert("Please apne koi khali box pr click nhi kra h to hint ke liye click kre ek box pr jaha apko hint chahiye.");

            return;

        }

        if (selectedCell.classList.contains('initial')) {
            alert("✨ Cozy Notice: That's a permanent starting number! Choose an empty box instead. 🌸");
            return;
        }

        const index = parseInt(selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        const answer = solutionBoard[row][col];

        if (currentBoard[index] === answer) {
            alert("✨ we Notice: yeh box phle se hi solve hai...please hint ke liye ek khali box pr click kre.");
            return;
        }

        selectedCell.textContent = answer;
        currentBoard[index] = answer;
        selectedCell.className = 'cell selected correct';

        hintsRemaining--;
        hintBtn.textContent = `💡 Hint (${hintsRemaining})`;

        if (hintsRemaining <= 0) {
            hintBtn.disabled = true;
        }

        checkWinCondition();
    });
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        if (activeTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = "🌙 Cozy Dark";
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = "☀️ Cozy Light";
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (!selectedCell) return;
    if (e.key >= '1' && e.key <= '9') updateSelectedCellValue(e.key);
    else if (e.key === 'Backspace' || e.key === 'Delete') updateSelectedCellValue("");
});

document.querySelectorAll('.pad-btn').forEach(btn => {
    btn.addEventListener('click', () => updateSelectedCellValue(btn.dataset.num));
});

document.getElementById('reset-btn').addEventListener('click', initBoard);

// Auto-refresh the game board layout immediately when a different difficulty level is clicked
difficultySelect.addEventListener('change', initBoard);

// Start
initBoard();