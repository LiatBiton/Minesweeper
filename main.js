const MINE = '💣';
const FLAG = '🚩'
const timerSpeed = 100;
const LIVE ='💛';
const HINT = '💡'
const ACTIVE_HINT = '🤫'
const VICTORY = '🥳'
const LOSE = '😭'

var gTimer;

var gLevel = {
    SIZE: 4, //sizeXsize board and how many mines to put
    MINES: 2,
    LIVES: 1
};

var gBoard;
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    passedMs: 0,
    mines: [],
    availableHints: 0,
    lives: 0,
    isHintOn: false
}

function setGameLevel(){
    if(document.getElementById('easy').checked){
        gLevel.SIZE = 4
        gLevel.MINES = 2
        gLevel.LIVES = 1
        gLevel.HINTS = 2
    } else if (document.getElementById('hard').checked){ 
        gLevel.SIZE = 8
        gLevel.MINES = 12 
        gLevel.LIVES = 3
        gLevel.HINTS = 3
    } else if (document.getElementById('extreme').checked){
        gLevel.SIZE = 12
        gLevel.MINES = 30
        gLevel.LIVES = 4
        gLevel.HINTS = 4
    }
    return gLevel.MINES
}

function renderLives(){
    var currLives = ''
    for (let i = 0; i < gGame.lives; i++) {
        currLives += LIVE 
    }
    document.querySelector('.live span').innerHTML = currLives
}

function renderHints(){
    var currHints = ''

    for (let i = 0; i < gGame.availableHints; i++){
       currHints += HINT 
    }

    document.querySelector('.hint-button button').innerHTML = currHints
}

function takeHint(elHint){
    if(!gGame.isHintOn) {
        gGame.isHintOn = true
        gGame.availableHints--
        elHint.innerHTML = ACTIVE_HINT
    }
}

function toggleHintCells(cellI,cellJ){   
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j > gBoard[i].length - 1) continue;
            gBoard[i][j].isHint = !gBoard[i][j].isHint
            renderCell(i,j)
        }
    }
}

function init() {
    clearInterval(gTimer)
    setGameLevel()
    gBoard = createBoard(gLevel.SIZE,gLevel.SIZE);
    renderBoard(gBoard, '.board-container')

    document.querySelector('.win-lost').style.display = 'none'
    document.querySelector('.timer').innerHTML = 'timer: 000'
    document.querySelector('.minesNumber span').innerHTML = gLevel.MINES
    document.querySelector('.init-button').innerHTML = '😊'

    gGame.availableHints = gLevel.HINTS
    renderHints()

    gGame.lives = gLevel.LIVES
    renderLives()

    gGame.markedCount = 0
    gGame.shownCount = 0
    gGame.passedMs = 0
    gGame.isOn = true
    gGame.isHintOn = false
}

function createBoard(ROWS, COLS) {
    var board = []
    for (var i = 0; i < ROWS; i++) {
        var row = []
        for (var j = 0; j < COLS; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                isHint: false
            };
            row.push(cell)
        }
        board.push(row)
    }
    return board
}

function renderCell(i, j) {
    var elCell = document.querySelector(`#cell-${i}-${j}`)
    var cell = gBoard[i][j]
    var content =  getCellContent(cell)
    if(cell.isShown || cell.isHint){
        elCell.className += " shown"
    } else {
        elCell.className = elCell.className.replace('shown', '')
    }
    elCell.innerHTML = content
}

function getCellContent(cell) {
    var shouldShow = cell.isShown || cell.isHint;

    if(!cell.isMine && shouldShow && cell.minesAroundCount !== 0) {
        return cell.minesAroundCount
    } else if(cell.isMine && shouldShow && gGame.lives < 0) {
        gameOver()
        return `<div class=burn style="background-color: red; width: 100%; height:100%">${MINE}</div>`
    } else if(cell.isMine && shouldShow){
        return MINE
    } else if(cell.isMarked){
        return FLAG
    } else{
        return ''
    }    
}

function toggleFlag(cellI, cellJ) {
    gBoard[cellI][cellJ].isMarked = !gBoard[cellI][cellJ].isMarked
    gGame.markedCount += gBoard[cellI][cellJ].isMarked ? 1 : -1
    document.querySelector('.minesNumber span').innerHTML = gLevel.MINES - gGame.markedCount
}

function cellClicked(cellI, cellJ , isRightClicked){
    if(gGame.isOn){
        if(gGame.passedMs === 0){
            putRandomMines(gBoard, gLevel.MINES , cellI,cellJ)
            gTimer = setInterval(setTime, timerSpeed);
        }

        if(gGame.isHintOn === true){
            toggleHintCells(cellI, cellJ);
            setTimeout(toggleHintCells, 1000 ,cellI,cellJ)
            setTimeout(renderHints, 1000);
            gGame.isHintOn = false;
            return;
        }

        if(isRightClicked){
            toggleFlag(cellI, cellJ)
        } else {
            if(gBoard[cellI][cellJ].isMarked) return;

            gBoard[cellI][cellJ].isShown = true
            if(gBoard[cellI][cellJ].isMine && gGame.lives < 0){
                gameOver(false)
                revealMines()
            }else if(gBoard[cellI][cellJ].isMine){
                gGame.lives--
                gGame.shownCount++
                renderLives()  
            } else {
                gGame.shownCount++
                if(gBoard[cellI][cellJ].minesAroundCount === 0){
                    expandShown(gBoard, cellI, cellJ)
                }
            }
        }

        checkGameOver()
        renderCell(cellI, cellJ)
    }
}

function renderBoard(board, selector) {
    console.table(board);
    var strHTML = '<table><tbody class = "table-border">';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            strHTML += `<td class=cell id=cell-${i}-${j}
            onclick="cellClicked(${i},${j})"
            oncontextmenu="cellClicked(${i},${j},true);return false;">
            ${getCellContent(cell,i,j)} </td>` 
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

function setMinesNegsCount(cellI, cellJ, board) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j > board[i].length - 1) continue;
            if (i === cellI && j === cellJ) continue;
            if (board[i][j].isMine === true){
                board[cellI][cellJ].minesAroundCount++
            }
        }
    }
}


function getRandomInt(min, max) {
    var randomI = Math.floor(Math.random() * (max - min)) + min;
    var randomJ = Math.floor(Math.random() * (max - min)) + min;
    return { i: randomI, j:randomJ }
}


function putRandomMines(board, count , protectedI, protectedJ){
    gGame.mines = []

    while (gGame.mines.length < count) {
        var randomLocation = getRandomInt(0, gBoard.length)
        var isAlreadyExist = gGame.mines.find((mine) => 
            mine.i === randomLocation.i && mine.j === randomLocation.j)

        if (!isAlreadyExist && (randomLocation.i != protectedI || randomLocation.j != protectedJ)) {
            board[randomLocation.i][randomLocation.j].isMine = true;
            gGame.mines.push(randomLocation)
        }
    }

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            setMinesNegsCount(i,j,board)
        }
    }
}

function checkGameOver(){
    if(gGame.shownCount + gGame.markedCount === (gLevel.SIZE*gLevel.SIZE) &&
        gLevel.MINES === gGame.markedCount + gLevel.LIVES - gGame.lives) {
            gameOver(true)
    }
}

function gameOver(isVictory) {  
    var massege = isVictory ? 'You won!!! 🏆' : 'You lost! Let\'s try again ';
    document.querySelector('.win-lost').style.display = 'block'
    document.querySelector('.win-lost').innerText = massege
    document.querySelector('.init-button').innerHTML = isVictory ? VICTORY : LOSE;
    clearInterval(gTimer)
    gGame.isOn = false
}

function setTime() {
    gGame.passedMs += timerSpeed;
    var minutes = Math.floor(gGame.passedMs / 1000 / 60);
    var seconds = Math.floor((gGame.passedMs / 1000) % 60);
    var ms = gGame.passedMs % 1000
    var str = ''

    if (minutes > 0) {
        str += minutes + "."
    }
    str += seconds;
    if (ms > 0) {
        str += "." + ms
    }

    document.querySelector('.timer').innerHTML = str
}

function revealMines(){
    for (var z = 0; z < gGame.mines.length; z++) {
        gBoard[gGame.mines[z].i][gGame.mines[z].j].isShown = true
        renderCell(gGame.mines[z].i,gGame.mines[z].j)       
    }
}

function expandShown(board, cellI, cellJ){
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j > board[i].length - 1) continue;
            if (i === cellI && j === cellJ) continue;
            if (board[i][j].isShown === false){
                board[i][j].isShown = true
                if (board[i][j].isMarked) {
                    toggleFlag(i, j)
                }
                renderCell(i,j)  
                gGame.shownCount++

                if(board[i][j].minesAroundCount === 0){
                    expandShown(board, i,j)
                } 
            }
        }
    }
}    