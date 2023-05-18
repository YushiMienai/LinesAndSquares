class Coordinate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Line {
    constructor(start, end, clickableStart, clickableEnd) {
        this.start = start;
        this.end = end;
        this.clickableStart = clickableStart;
        this.clickableEnd = clickableEnd;
        this.isSelected = false;

        if (start.y === end.y) {
            // Если координаты y начала и конца линии совпадают,
            // то линия является горизонтальной:
            this.isHorizontal = true;

            if (start.y === 2 || start.y === 326) {
                // Если линия находится на верхней или нижней границе,
                // и не является самой левой или самой правой,
                // то устанавливаем isSelected в true:
                this.isSelected = true;
            }
        } else if (start.x === end.x) {
            // Если координаты x начала и конца линии совпадают,
            // то линия является вертикальной:
            this.isHorizontal = false;

            if (start.x === 2 || start.x === 326) {
                // Если линия находится на левой или правой границе,
                // и не является самой верхней или самой нижней,
                // то устанавливаем isSelected в true:
                this.isSelected = true;
            }
        }
    }
}

class Cell {
    constructor(top, bottom, left, right) {
        this.top = top;
        this.bottom = bottom;
        this.left = left;
        this.right = right;
        this.owner = null;
    }
}

class Player {
    constructor(id, color) {
        this.id = id;
        this.color = color;
        this.numCellsOwned = 0;
    }
}

const players = [
    new Player(1, 'blue'),
    new Player(2, 'red')
];
let activePlayerIndex = 0;
const currentPlayerElement = document.getElementById('current-player');
const player1ScoreElement = document.getElementById('player-1-score');
const player2ScoreElement = document.getElementById('player-2-score');
const activePlayer = players[activePlayerIndex];
currentPlayerElement.textContent = activePlayer.color;

const horizontalLines = [];
for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 9; j++) {
        const x = j * 36 + 2;
        const y = i * 36 + 2;
        const start = new Coordinate(x, y);
        const end = new Coordinate(x + 36, y);
        const clickableStart = new Coordinate(x + 2, y - 1);
        const clickableEnd = new Coordinate(x + 34, y + 1);
        const line = new Line(start, end, clickableStart, clickableEnd);
        horizontalLines.push(line);
    }
}

const verticalLines = [];
for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 10; j++) {
        const x = j * 36 + 2;
        const y = i * 36 + 2;
        const start = new Coordinate(x, y);
        const end = new Coordinate(x, y + 36);
        const clickableStart = new Coordinate(x - 1, y + 2);
        const clickableEnd = new Coordinate(x + 1, y + 34);
        const line = new Line(start, end, clickableStart, clickableEnd);
        verticalLines.push(line);
    }
}

const cells = [];
for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
        const topLine = horizontalLines[i * 9 + j];
        const bottomLine = horizontalLines[(i + 1) * 9 + j];
        const leftLine = verticalLines[i * 10 + j];
        const rightLine = verticalLines[i * 10 + j + 1];
        const cell = new Cell(topLine, bottomLine, leftLine, rightLine);
        cells.push(cell);
    }
}

const canvas = document.getElementById("my-canvas");
const ctx = canvas.getContext("2d");

const drawLine = line => {
    ctx.strokeStyle = line.isSelected ? "black" : "#ddd"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(line.start.x, line.start.y)
    ctx.lineTo(line.end.x, line.end.y)
    ctx.stroke()
}

// Рисуем линии
horizontalLines.concat(verticalLines).forEach(line => drawLine(line))

// Add a click event listener to the canvas
canvas.addEventListener('click', onCanvasClick);

function onCanvasClick(event) {
    const x = event.pageX - canvas.offsetLeft;
    const y = event.pageY - canvas.offsetTop;

    // Combine the arrays of lines for searching
    const lines = horizontalLines.concat(verticalLines);

    // Find the clicked line
    let clickedLine = findClickedLine(x, y, lines);

    // Output information based on whether a line was clicked or not
    if (clickedLine) {
        console.log(`Clicked on line: (${clickedLine.start.x},${clickedLine.start.y}) - (${clickedLine.end.x},${clickedLine.end.y})`);

        // Check if the click is within the clickable portion of the line
        const dx = clickedLine.end.x - clickedLine.start.x;
        const dy = clickedLine.end.y - clickedLine.start.y;
        const lengthSq = dx * dx + dy * dy;
        const u = ((x - clickedLine.start.x) * dx + (y - clickedLine.start.y) * dy) / lengthSq;

        if (u >= 0 && u <= 1) {
            console.log('Clicked on the clickable part of the line');
            clickedLine.isSelected = true;

            // Draw highlighted lines
            drawHighlightedLines(lines);

            // Check for completed cells
            checkForCompletedCells(cells, clickedLine, ctx);
        } else {
            console.log('Clicked on the line, but not on the clickable part');
        }
    } else {
        console.log(`Clicked outside of the lines at (${x}, ${y})`);
    }
}

const findClickedLine = (x, y, lines) => {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if ((y >= line.clickableStart.y && y <= line.clickableEnd.y &&
            x >= line.clickableStart.x && x <= line.clickableEnd.x) ||
            (x >= line.clickableStart.x && x <= line.clickableEnd.x &&
                y >= line.clickableStart.y && y <= line.clickableEnd.y)) {
            return line;
        }
    }
    return null;
}

const drawHighlightedLines = lines => {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.isSelected) {
            drawLine(line)
        }
    }
}

const checkForCompletedCells = cells => {
    // Check which player is active
    const activePlayer = players[activePlayerIndex];

    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell.owner === null &&
            cell.top.isSelected && cell.bottom.isSelected &&
            cell.left.isSelected && cell.right.isSelected) {

            // Set the owner of the cell to the active player and increase their number of owned cells by 1
            cell.owner = activePlayer.id;
            activePlayer.numCellsOwned++;

            // Fill the completed cell with the active player's color
            ctx.fillStyle = activePlayer.color;
            ctx.fillRect(cell.left.clickableEnd.x + 1, cell.top.clickableEnd.y + 1, cell.right.clickableStart.x - cell.left.clickableEnd.x - 2, cell.bottom.clickableStart.y - cell.top.clickableEnd.y - 2);

            player1ScoreElement.textContent = players[0].numCellsOwned.toString();
            player2ScoreElement.textContent = players[1].numCellsOwned.toString();

            // Don't switch to the next player's turn if they completed a cell
            return;
        }
    }

    // If the function hasn't returned yet, the active player didn't complete a cell

    // Switch to the next player's turn
    activePlayerIndex = (activePlayerIndex + 1) % players.length;
    currentPlayerElement.textContent = players[activePlayerIndex].color;
}