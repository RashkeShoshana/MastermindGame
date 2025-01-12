const colors = ["red", "green", "blue", "yellow", "pink", "orange"];
let code = [];
let bools = [];
let arounds = [];
//positions of color circles:
const positions = [{ top: 0, left: 32 }, { top: 18, left: 2 }, { top: 18, left: 62 }, { top: 48, left: 2 }, { top: 48, left: 61 }, { top: 65, left: 32 }]; 
let chanceNum = 0, holeNum = 0;
let focusedHole;

function onWelcomeLoad() { // Exec on welcome.html loaded
    // The next two lines are used to reset the data stored in localStorage. For testing by the programmer only. Usually not allowed.
    // localStorage.removeItem("players");
    // localStorage.removeItem("finalScore");

    // Saving and using the names of the players until now:
    let players = localStorage.getItem("players");
    let playersArr, playersStr = "";
    if (players != null)
        playersArr = JSON.parse(players);
    else
        playersArr = [];

    playersArr.forEach(p => {
        playersStr += p + ", ";
    });

    document.querySelector("#last_players").innerHTML += playersArr.length === 0 ? "No players yet" : playersStr;

    document.querySelector("#welcome_form").onsubmit = (e) => {
        e.preventDefault();
        if (playersArr.length === 5) {
            playersArr.shift();
        }
        playersArr.push(document.querySelector("#name").value);
        localStorage.setItem("players", JSON.stringify(playersArr));

        window.location.replace("game.html");
    };
    for (let i = 0; i < document.querySelector("#welcome_form").children.length; i++) {
        document.querySelector("#welcome_form").children[i].onfocus = (e) => {
            e.target.style.color = "red";
        }
    }
}

function onGameLoad() { // Exec on game.html loaded
    // Saving and using the scores of the players until now:
    if (localStorage.getItem("finalScore") === null) {
        localStorage.setItem("finalScore", 0);
    }
    createGameBoard();
    createPlatte();
    createCode();
    handleEvents();
    nextChance();
}

function onScoresLoad() { // Exec on scores.html loaded
    // Displaying the current score, and the highest score so far    
    document.querySelector("#last_highest_score").innerHTML = localStorage.getItem("finalScore");
    let finalScoreParam = new URLSearchParams(location.search).get("finalScore");
    document.querySelector("#final_score").innerHTML = finalScoreParam;

    if (parseInt(finalScoreParam) > parseInt(localStorage.getItem("finalScore"))) {
        localStorage.setItem("finalScore", finalScoreParam);
    }

    // start game again:
    document.querySelector("#backToGame").addEventListener("click", () => {
        window.location.replace("../index.html");
    });
}

function createGameBoard() { // create the game board
    let row, hole, hole_area, pins_area, pin_hole;
    for (i = 0; i <= 12; i++) {
        row = document.createElement("div");
        row.classList.add("row");
        for (j = 0; j < 4; j++) {
            hole_area = document.createElement("div");
            hole_area.classList.add("hole_area");

            hole = document.createElement("div");
            hole.classList.add("hole");
            hole.setAttribute("id", `hole_${i}_${j}`);
            hole_area.append(hole);

            row.append(hole_area);
        }

        if (i == 0) { // The secret code of game. first row.
            row.setAttribute("id", "code");
        }
        else {
            row.setAttribute("id", `row_${i}`);
            pins_area = document.createElement("div"); // pins_area = the score area for each line
            pins_area.classList.add("pins_area");
            for (k = 0; k < 4; k++) {
                pin_hole = document.createElement("div");
                pin_hole.classList.add("pin_hole");
                pin_hole.setAttribute("id", `pin_hole_${i}_${k}`);
                pins_area.append(pin_hole);
            }
            row.append(pins_area);
        }

        document.querySelector("#board").append(row);
    }
    document.querySelectorAll(".hole").forEach(elem => {
        elem.style.backgroundColor = "#3c3631";
    });
}

function createPlatte() { // create colors pallete
    let pallete = document.createElement("div");
    pallete.classList.add("pallete");
    for (i = 0; i < 6; i++) {
        let color = document.createElement("div");
        color.classList.add("color");
        color.setAttribute("id", colors[i]);
        color.style.backgroundColor = colors[i];
        color.style.top = (positions[i].top).toString() + "%";
        color.style.left = (positions[i].left).toString() + "%";
        pallete.append(color);
    }
    let checkBtn = document.createElement("div");
    checkBtn.classList.add("check-btn");
    checkBtn.innerHTML = "check";
    checkBtn.addEventListener("mouseover", function () {
        this.style.color = "rgb(255, 0, 217)";
    });
    checkBtn.addEventListener("mouseout", function () {
        this.style.color = "white";
    });
    checkBtn.addEventListener("click", checkBtnClick);

    pallete.append(checkBtn);
    document.getElementById("game_main").prepend(pallete);
}

function createCode() { // create the secret code of game. (first line)
    let cloneColors = colors.slice(0);
    for (i = 0; i < 4; i++) {
        let rnd = Math.floor(Math.random() * ((cloneColors.length - 1) - 0 + 1));
        document.querySelector(`#hole_0_${i}`).style.backgroundColor = cloneColors[rnd];
        cloneColors.splice(rnd, 1);
    }
}

function handleEvents() { // Manager of events not recorded elsewhere
    document.querySelectorAll(".color").forEach(elem => {
        elem.addEventListener("click", colorClick);
    });
}

function colorClick() {
    focusedHole.style.backgroundColor = this.getAttribute("id");
    for (let i = holeNum + 1; i <= 3; i++) {
        if (document.querySelector(`#hole_${chanceNum}_${i}`).style.backgroundColor === "rgb(60, 54, 49)") {
            focusHole(document.querySelector(`#hole_${chanceNum}_${i}`));
            holeNum = i;
            break;
        }
    }
}

function holeClick() {
    holeNum = parseInt(this.getAttribute("id").substr(this.getAttribute("id").length - 1, 1));
    focusHole(this);
}

function checkBtnClick() { //Check if the guess is correct
    let countBools = 0;
    calcScoreChance();
    makePins();
    for (elem of bools) {
        if (elem === 1) {
            countBools++;
        }
    };
    if (countBools < 4) {
        nextChance();
    }
    else {
        endGame();
    }
}

function nextChance() { //Beyond another guessing opportunity
    if (document.querySelector(`#row_${chanceNum}`)) {
        document.querySelector(`#row_${chanceNum}`).style.backgroundColor = "#c69168";
    }
    document.querySelector(`#row_${++chanceNum}`).style.backgroundColor = "#e8c3a8";
    focusHole(document.querySelector(`#hole_${chanceNum}_0`));

    for (let i = 0; i < 4; i++) {
        document.querySelector(`#hole_${chanceNum}_${i}`).addEventListener("click", holeClick);
        document.querySelector(`#hole_${chanceNum - 1}_${i}`).removeEventListener("click", holeClick);
    }
    holeNum = 0;
}

function focusHole(elem) {
    if (focusedHole) {
        unFocusHole(focusedHole);
    }
    elem.style.boxShadow = "0px 0px 5px 10px white";
    focusedHole = elem;
}

function unFocusHole(elem) {
    elem.style.boxShadow = "0px 0px 2px";
}

function calcScoreChance() { // Calculate the score for the guess
    for (let i = 0; i < 4; i++) {
        code[i] = document.querySelector(`#hole_0_${i}`).style.backgroundColor;
    }
    bools = [0, 0, 0, 0];
    arounds = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        let currentCodeColor = document.querySelector(`#hole_0_${i}`).style.backgroundColor;
        let currentColor = document.querySelector(`#hole_${chanceNum}_${i}`).style.backgroundColor;
        if (currentCodeColor === currentColor) {
            bools[i] = 1;
            code[i] = null;
        }
    }
    for (let i = 0; i < 4; i++) {
        currentColor = document.querySelector(`#hole_${chanceNum}_${i}`).style.backgroundColor;
        for (let j = 0; j < 4; j++) {
            currentCodeColor = code[j];
            if (currentCodeColor === currentColor) {
                arounds[i] = 1;
                code[j] = null;
            }
        }
    }
}

function makePins() { //marking the score in the score area
    let countBools = countArounds = 0;
    for (let i = 0; i < 4; i++) {
        if (bools[i] === 1) {
            countBools++;
        }
        if (arounds[i] === 1) {
            countArounds++;
        }
    }
    let i;
    for (i = 0; i < countBools; i++) {
        document.querySelector(`#pin_hole_${chanceNum}_${i}`).style.backgroundColor = "black";
    }
    for (let j = i; j < i + countArounds; j++) {
        document.querySelector(`#pin_hole_${chanceNum}_${j}`).style.backgroundColor = "white";
    }
}

function endGame() { // An event at the end of the game
    document.querySelector("#code").style.visibility = "visible";
    setTimeout(() => {
        window.location.replace(`scores.html?finalScore=${calcFinalScore()}`);
    }, 1000);

}

function calcFinalScore() { // Final score calculation
    let score = (12 - chanceNum + 1) * 100;
    if (score === 1200) {
        score = 1500;
    }
    return score;
}
