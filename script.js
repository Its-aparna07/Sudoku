// Register Service Worker for GitHub Pages PWA Support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("Cozy SW Registered!", reg.scope))
      .catch((err) => console.error("SW Registration Failed!", err));
  });
}

let currentBoard = [];
let initialBoard = [];
let solutionBoard = []; // Stores the perfect board solution for instant verification
let selectedCell = null;

// Timer Global States
let timerInterval = null;
let totalSeconds = 0;

const gridContainer = document.getElementById("sudoku-grid");

/**
 * 1. CORE VALIDATION LOGIC
 */
function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
    let boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    let boxCol = 3 * Math.floor(col / 3) + (i % 3);
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
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(
          () => Math.random() - 0.5,
        );
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
function createPlayablePuzzle(clues = 35) {
  let solvedBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(solvedBoard);

  // Save structural deep copy of correct solution
  solutionBoard = solvedBoard.map((row) => [...row]);

  let puzzle = solvedBoard.map((row) => [...row]);
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
 * 4. TIMER FUNCTIONALITIES
 */
function startTimer() {
  clearInterval(timerInterval);
  totalSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    totalSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  document.getElementById("timer").textContent = `${minutes}:${seconds}`;
}

/**
 * 5. GAME INITIALIZATION & INTERACTION HANDLERS
 */
function initBoard() {
  gridContainer.innerHTML = "";
  currentBoard = [];
  selectedCell = null;

  initialBoard = createPlayablePuzzle(35);
  startTimer();

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = initialBoard[r][c];
      currentBoard.push(val);

      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");
      cellElement.dataset.index = r * 9 + c;

      if (val !== 0) {
        cellElement.textContent = val;
        cellElement.classList.add("initial");
      } else {
        cellElement.addEventListener("click", () => selectCell(cellElement));
      }

      gridContainer.appendChild(cellElement);
    }
  }
}

function selectCell(element) {
  if (selectedCell) selectedCell.classList.remove("selected");
  selectedCell = element;
  selectedCell.classList.add("selected");
}

function updateSelectedCellValue(num) {
  if (!selectedCell) return;
  const index = parseInt(selectedCell.dataset.index);
  const row = Math.floor(index / 9);
  const col = index % 9;

  // Reset status styling flags
  selectedCell.classList.remove("error", "correct");

  if (num === "") {
    selectedCell.textContent = "";
    currentBoard[index] = 0;

    // Recalculate errors for the rest of the board when a number is wiped
    revalidateEntireBoard();
  } else {
    selectedCell.textContent = num;
    const inputNum = parseInt(num);
    currentBoard[index] = inputNum;

    // Check if this input conflicts with CURRENT visible numbers
    if (hasCurrentConflict(index, inputNum)) {
      selectedCell.classList.add("error");
    } else {
      // It's a clean, logically valid placement for now!
      selectedCell.classList.add("correct");
    }
  }
}

/**
 * Helper to check if a placement conflicts with any CURRENT numbers on the board
 */
function hasCurrentConflict(index, num) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  for (let i = 0; i < 81; i++) {
    if (i === index || currentBoard[i] !== num) continue;

    const peerRow = Math.floor(i / 9);
    const peerCol = i % 9;

    // Check Row conflict
    if (peerRow === row) return true;
    // Check Column conflict
    if (peerCol === col) return true;
    // Check 3x3 Box conflict
    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;
    const peerBoxRowStart = Math.floor(peerRow / 3) * 3;
    const peerBoxColStart = Math.floor(peerCol / 3) * 3;

    if (boxRowStart === peerBoxRowStart && boxColStart === peerBoxColStart) {
      return true;
    }
  }
  return false;
}

/**
 * Optional: Cleans up old error highlights if a conflicting number is deleted
 */
function revalidateEntireBoard() {
  document.querySelectorAll(".cell").forEach((cell) => {
    if (cell.classList.contains("initial")) return;
    const idx = parseInt(cell.dataset.index);
    const val = currentBoard[idx];

    cell.classList.remove("error", "correct");
    if (val !== 0) {
      if (hasCurrentConflict(idx, val)) {
        cell.classList.add("error");
      } else {
        cell.classList.add("correct");
      }
    }
  });
}

// User Control Inputs (Keyboard / On-screen Pad)
document.addEventListener("keydown", (e) => {
  if (!selectedCell) return;
  if (e.key >= "1" && e.key <= "9") updateSelectedCellValue(e.key);
  else if (e.key === "Backspace" || e.key === "Delete")
    updateSelectedCellValue("");
});

document.querySelectorAll(".pad-btn").forEach((btn) => {
  btn.addEventListener("click", () => updateSelectedCellValue(btn.dataset.num));
});

// Grid Completion Tracker Action
document.getElementById("check-btn").addEventListener("click", () => {
  let hasErrors = false;
  let isComplete = true;

  document.querySelectorAll(".cell").forEach((cell) => {
    if (cell.classList.contains("error")) hasErrors = true;
    const index = parseInt(cell.dataset.index);
    if (currentBoard[index] === 0) isComplete = false;
  });

  if (hasErrors) {
    alert(
      "There are some cozy mistakes on the board. Correct the red cells! 🌸",
    );
  } else if (!isComplete) {
    alert("So far, so good! Keep going. ☕");
  } else {
    clearInterval(timerInterval);
    alert(
      `Congratulations! You solved it perfectly in ${document.getElementById("timer").textContent}! 🎉`,
    );
  }
});

// Theme Selector Logic Switch
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    themeToggle.textContent = "🌙 Cozy Dark";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️ Cozy Light";
  }
});

document.getElementById("reset-btn").addEventListener("click", initBoard);

// Fire application initialization
initBoard();
