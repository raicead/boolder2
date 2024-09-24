document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score');
    const verticalThresholdSelect = document.getElementById('vertical-threshold');
    const startingColumnSelect = document.getElementById('starting-column');
    const startButton = document.getElementById('start');
    const resetButton = document.getElementById('reset');
    const moveInterval = 300; // 0.3 seconds
    let score = 0;
    let rows, cols, cellContents;
    const playerPos = { row: null, col: null };
    const visitedTiles = new Set(); // Set to track visited tiles
    let moveTimer;

    const loadGridData = async () => {
        try {
            const response = await fetch('grid-data.json');
            const data = await response.json();

            rows = data.rows;
            cols = data.cols;
            cellContents = data.data.flat(); // Flatten the 2D array to 1D

            // Generate the grid
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    const number = data.data[r][c];
                    cell.textContent = number;
                    gameContainer.appendChild(cell);
                }
            }

            startButton.addEventListener('click', () => {
                const startingColumn = parseInt(startingColumnSelect.value, 10) - 1; // Adjust for 0-based index
                if (startingColumn < 0 || startingColumn >= cols) {
                    alert(`Please select a column between 1 and ${cols}.`);
                    return;
                }
                resetGame(startingColumn);
                startMovement();
            });

            resetButton.addEventListener('click', () => {
                const startingColumn = parseInt(startingColumnSelect.value, 10) - 1; // Adjust for 0-based index
                if (startingColumn < 0 || startingColumn >= cols) {
                    alert(`Please select a column between 1 and ${cols}.`);
                    return;
                }
                resetGame(startingColumn);
            });

        } catch (error) {
            console.error('Error loading grid data:', error);
        }
    };

    const updatePlayerPosition = (row, col) => {
        const cell = gameContainer.children[row * cols + col];
        cell.classList.add('player');
        cell.textContent = '@';
    };

    const clearPlayerPosition = (row, col) => {
        const cell = gameContainer.children[row * cols + col];
        cell.classList.remove('player');
        cell.classList.add('visited');
        cell.textContent = cellContents[row * cols + col];
    };

    const getCellValue = (row, col) => {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
            return cellContents[row * cols + col];
        }
        return Infinity; // Out of bounds cells have an infinite value
    };

    const moveToBestCell = () => {
        const { row, col } = playerPos;
        const verticalThreshold = parseInt(verticalThresholdSelect.value, 10);

        let bestMove = null;
        let minValue = Infinity;

        // Values to left and right
        const leftValue = col > 0 ? getCellValue(row, col - 1) : Infinity;
        const rightValue = col < cols - 1 ? getCellValue(row, col + 1) : Infinity;

        // Value above
        const valueAbove = row > 0 ? getCellValue(row - 1, col) : Infinity;

        // Move up if value above is below the threshold or no better option
        if (row > 0 && (valueAbove < verticalThreshold || !bestMove)) {
            if (!visitedTiles.has(`${row - 1},${col}`)) {
                bestMove = { row: row - 1, col };
                minValue = valueAbove;
            }
        }

        // Check left and right if moving up is not the best option
        if (!bestMove || minValue >= verticalThreshold) {
            if (col > 0 && leftValue < minValue && !visitedTiles.has(`${row},${col - 1}`)) {
                minValue = leftValue;
                bestMove = { row, col: col - 1 };
            }

            if (col < cols - 1 && rightValue < minValue && !visitedTiles.has(`${row},${col + 1}`)) {
                minValue = rightValue;
                bestMove = { row, col: col + 1 };
            }
        }

        return bestMove;
    };

    const moveToTopRow = () => {
        let moved = true;
        while (playerPos.row > 0 && moved) {
            const bestMove = moveToBestCell();

            if (bestMove) {
                // Update score with the value of the new tile
                score += getCellValue(bestMove.row, bestMove.col);

                // Update the grid and player position
                clearPlayerPosition(playerPos.row, playerPos.col);
                playerPos.row = bestMove.row;
                playerPos.col = bestMove.col;
                updatePlayerPosition(playerPos.row, playerPos.col);
                visitedTiles.add(`${playerPos.row},${playerPos.col}`); // Mark new position as visited
                scoreDisplay.textContent = score; // Update score in sidebar
            } else {
                moved = false; // Stop if no valid move is found
            }
        }
    };

    const startMovement = () => {
        moveTimer = setInterval(() => {
            const bestMove = moveToBestCell();

            if (bestMove) {
                // Update score with the value of the new tile
                score += getCellValue(bestMove.row, bestMove.col);

                // Update the grid and player position
                clearPlayerPosition(playerPos.row, playerPos.col);
                playerPos.row = bestMove.row;
                playerPos.col = bestMove.col;
                updatePlayerPosition(playerPos.row, playerPos.col);
                visitedTiles.add(`${playerPos.row},${playerPos.col}`); // Mark new position as visited
                scoreDisplay.textContent = score; // Update score in sidebar

                // Stop if the player reaches the top row
                if (playerPos.row <= 0) {
                    clearInterval(moveTimer);
                }
            } else {
                // No valid move; still move up
                if (playerPos.row > 0) {
                    const newPos = { row: playerPos.row - 1, col: playerPos.col };
                    if (!visitedTiles.has(`${newPos.row},${newPos.col}`)) {
                        clearPlayerPosition(playerPos.row, playerPos.col);
                        playerPos.row = newPos.row;
                        playerPos.col = newPos.col;
                        updatePlayerPosition(playerPos.row, playerPos.col);
                        visitedTiles.add(`${playerPos.row},${playerPos.col}`); // Mark new position as visited
                        score += getCellValue(playerPos.row, playerPos.col);
                        scoreDisplay.textContent = score; // Update score in sidebar
                    }
                }
            }
        }, moveInterval);
    };
    
    const resetGame = (startingColumn) => {
        // Clear the game container
        gameContainer.innerHTML = '';

        // Reset score and visited tiles
        score = 0;
        scoreDisplay.textContent = score;
        visitedTiles.clear();

        // Reload grid data
        loadGridData().then(() => {
            playerPos.row = rows - 1;
            playerPos.col = startingColumn;
            updatePlayerPosition(playerPos.row, playerPos.col);
        });
    };

    loadGridData();
});
