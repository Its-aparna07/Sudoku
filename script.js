let currentBoard = [];
let initialBoard = [];
let selectedCell = null;

const gridContainer = document.getElementById('sudoku-grid');

/**
 * 1. CORE VALIDATION LOGIC
 * Checks if placing a number at a specific row/col breaks Sudoku rules.
 */
function isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        // Check row
        if (board[row][i] === num) return false;
        // Check column
        if (board[i][col] === num) return false;
        // Check 3x3 sub-grid box
        let boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
        let boxCol = 3 * Math.floor(col / 3) + i % 3;
        if (board[boxRow][boxCol] === num) return false;
    }
    return true;
}

/**
 * 2. BACKTRACKING GENERATOR
 * Fills an empty 9x9 matrix with a fully valid, solved Sudoku puzzle.
 */
function fillBoard(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                // Shuffle array [1-9] to ensure the board layout is random every game
                const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                
                for (let num of numbers) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;

                        // Recursively attempt to fill the rest of the board
                        if (fillBoard(board)) return true;

                        // BACKTRACK: Undo choice if it leads to a dead end
                        board[row][col] = 0;
                    }
                }
                return false; // Triggers backtracking in the previous recursion layer
            }
        }
    }
    return true; // Board completely filled
}

/**
 * 3. DIFFICULTY CREATOR
 * Removes items from a solved board to make it playable.
 * 'clues' determines how many visible numbers are left behind.
 */
function createPlayablePuzzle(clues = 35) {
    // Generate a completely solved blank board structure first
    let solvedBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillBoard(solvedBoard);

    // Deep clone the solved matrix to structure our starting puzzle grid
    let puzzle = solvedBoard.map(row => [...row]);
    
    // Remove numbers at random positions until we match our target clue density
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
 * 4. GAME INITIALIZATION & INTERACTION HANDLERS
 */
function initBoard() {
    gridContainer.innerHTML = '';
    currentBoard = [];
    selectedCell = null;

    // Create a new randomized puzzle layout (35 numbers left visible)
    initialBoard = createPlayablePuzzle(35);
    
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
    if (!selectedCell) return;
    const index = parseInt(selectedCell.dataset.index);
    
    if (num === "") {
        selectedCell.textContent = "";
        currentBoard[index] = 0;
    } else {
        selectedCell.textContent = num;
        currentBoard[index] = parseInt(num);
    }
    selectedCell.classList.remove('error');
}

// User Control Inputs (Keyboard / On-screen Pad)
document.addEventListener('keydown', (e) => {
    if (!selectedCell) return;
    if (e.key >= '1' && e.key <= '9') updateSelectedCellValue(e.key);
    else if (e.key === 'Backspace' || e.key === 'Delete') updateSelectedCellValue("");
});

document.querySelectorAll('.pad-btn').forEach(btn => {
    btn.addEventListener('click', () => updateSelectedCellValue(btn.dataset.num));
});

// Grid Validation Check
document.getElementById('check-btn').addEventListener('click', () => {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('error'));
    let hasErrors = false;

    for (let i = 0; i < 81; i++) {
        let val = currentBoard[i];
        if (val === 0) continue;

        let row = Math.floor(i / 9);
        let col = i % 9;

        for (let x = 0; x < 9; x++) {
            let rowPeer = (row * 9) + x;
            let colPeer = (x * 9) + col;
            if (rowPeer !== i && currentBoard[rowPeer] === val) {
                document.querySelector(`[data-index='${i}']`).classList.add('error');
                hasErrors = true;
            }
            if (colPeer !== i && currentBoard[colPeer] === val) {
                document.querySelector(`[data-index='${i}']`).classList.add('error');
                hasErrors = true;
            }
        }

        let boxRowStart = Math.floor(row / 3) * 3;
        let boxColStart = Math.floor(col / 3) * 3;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                let boxPeer = (r * 9) + c;
                if (boxPeer !== i && currentBoard[boxPeer] === val) {
                    document.querySelector(`[data-index='${i}']`).classList.add('error');
                    hasErrors = true;
                }
            }
        }
    }

    if (!hasErrors) {
        alert(currentBoard.includes(0) ? "So far, so good! Keep going." : "Congratulations! You solved it perfectly!");
    }
});

// The Clear Button now serves to generate a completely new game map
document.getElementById('reset-btn').textContent = "New Game";
document.getElementById('reset-btn').addEventListener('click', initBoard);

// Fire application initialization
initBoard();