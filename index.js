let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchCount = 0;
let clickCount = 0;
let powerUpUsed = false;
const powerUpConfig = { easy: 1, medium: 2, hard: 3 };

//const totalPairs = 3;
//let timeLeft = 30;
let timerInterval;
let gameStarted = false;
let difficulty = 'easy';
let difficultyConfig = {
  easy: { pairs: 3, time: 25 },
  medium: { pairs: 6, time: 40 },
  hard: { pairs: 9, time: 75 }
};

let totalPairs = difficultyConfig[difficulty].pairs;
let timeLeft = difficultyConfig[difficulty].time;

function updateStats() {
  $("#click_count").text(clickCount);
  $("#matched_count").text(matchCount);
  $("#remaining_count").text(totalPairs - matchCount);
  $("#total_pairs").text(totalPairs);
  $("#time_left").text(timeLeft);
}


function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    updateStats();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (matchCount < totalPairs) {
        showGameOverPopup();
      }
    }
  }, 1000);
}


function setup() {
  $(".card").on("click", function () {
    if (lockBoard || $(this).hasClass("flip")) return;

    $(this).addClass("flip");
    clickCount++;
    updateStats();

    if (!firstCard) {
      firstCard = $(this);
    } else if (firstCard.is($(this))) {
      return;
    } else {
      secondCard = $(this);
      lockBoard = true;

      const img1 = firstCard.find(".front_face").attr("src");
      const img2 = secondCard.find(".front_face").attr("src");

      if (img1 === img2) {
        setTimeout(() => {
          firstCard.addClass("matched").off("click");
          secondCard.addClass("matched").off("click");
          matchCount++;
          updateStats();
          checkWin();
          resetCards();
        }, 1000);
      } else {
        setTimeout(() => {
          firstCard.removeClass("flip");
          secondCard.removeClass("flip");
          resetCards();
        }, 1000);
      }
    }
  });
}

function resetCards() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function shuffle() {
  const cards = $("#game_grid .card").toArray();
  cards.sort(() => Math.random() - 0.5);
  $("#game_grid").empty().append(cards);
}

function checkWin() {
  if (matchCount === totalPairs) {
    clearInterval(timerInterval); 
    showWinPopup();
  }
}

function showWinPopup() {
  const popup = $(`
    <div id="popup">
      <div id="popup-content">
        <h2>🎉 You Win! 🎉</h2>
        <button id="close-popup">Close</button>
      </div>
    </div>
  `);
  $("body").append(popup);
  $("#close-popup").on("click", () => $("#popup").remove());
}

function showGameOverPopup() {
  clearInterval(timerInterval);

  lockBoard = true;
  $(".card").off("click");
  
  const popup = $(`
    <div id="popup">
      <div id="popup-content">
        <h2>⏰ Time's Up! Game Over. 😢</h2>
        <button id="close-popup">Close</button>
      </div>
    </div>
  `);
  $("body").append(popup);
  $("#close-popup").on("click", () => $("#popup").remove());
}


async function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  
  clearInterval(timerInterval);
  matchCount     = 0;
  clickCount     = 0;
  firstCard      = null;
  secondCard     = null;
  lockBoard      = false;
  powerUpUsed    = false;
  $("#powerup_button").prop("disabled", false);

  
  totalPairs = difficultyConfig[difficulty].pairs;
  timeLeft   = difficultyConfig[difficulty].time;
  updateStats();


  $("#game_grid").empty();
  const pokemonCards = await generatePokemonCards(totalPairs);
  $("#game_grid").append(pokemonCards);
  setup();                 

  
  $("#game_area").show();
  startTimer();
}


function resetGame() {
  clearInterval(timerInterval);
  gameStarted = false;
  $("#game_area").hide();
  matchCount = 0;
  clickCount = 0;
  updateStats();
}


async function generatePokemonCards(pairCount) {
  const allPokemon = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025")
    .then(res => res.json())
    .then(data => data.results);

  
  const selected = allPokemon.sort(() => 0.5 - Math.random()).slice(0, pairCount);

  const cards = [];

  for (let i = 0; i < selected.length; i++) {
    const pokeUrl = selected[i].url;
    const pokeData = await fetch(pokeUrl).then(res => res.json());
    const imageUrl = pokeData.sprites.other['official-artwork'].front_default;

    
    for (let j = 0; j < 2; j++) {
      const card = $(`
        <div class="card" data-pokemon="${selected[i].name}">
          <img class="front_face" src="${imageUrl}" />
          <img class="back_face" src="back.webp" />
        </div>
      `);
      cards.push(card);
    }
  }

  
  cards.sort(() => 0.5 - Math.random());

  return cards;
}

function setDifficulty(level) {
  difficulty = level;
  totalPairs = difficultyConfig[difficulty].pairs;
  timeLeft = difficultyConfig[difficulty].time;
  updateStats();

  
  $(".difficulty").removeClass("active");
  $(`.difficulty[data-level='${level}']`).addClass("active");
}


$(document).ready(() => {
  updateStats();
  
  $("#game_grid").addClass("light");

  $("#start_button").on("click", startGame);
  $("#reset_button").on("click", resetGame);
  $(".difficulty").on("click", function () {
    setDifficulty($(this).data("level"));
  });

  $("#powerup_button").on("click", () => {
  if (!gameStarted || powerUpUsed) return;
  powerUpUsed = true;
  $("#powerup_button").prop("disabled", true);

  const revealCount = powerUpConfig[difficulty];
  
  const groups = {};
  $(".card").each(function() {
    const name = $(this).data("pokemon");
    (groups[name] = groups[name] || []).push(this);
  });

  
  const names = Object.keys(groups).slice(0, revealCount);
  names.forEach(name =>
    groups[name].forEach(card => $(card).addClass("flip"))
  );

  
  setTimeout(() => {
    names.forEach(name =>
      groups[name].forEach(card => {
        const $c = $(card);
        if (!$c.hasClass("matched")) $c.removeClass("flip");
      })
    );
  }, 3000);
});


  setDifficulty("easy"); 
  
  $("#light_mode").on("click", () => {
  $("body")
    .removeClass("dark-theme")
    .addClass("light-theme");
  $("#game_grid")
    .removeClass("dark")
    .addClass("light");

  });


  $("#dark_mode").on("click", () => {

    $("body")

    .removeClass("light-theme")
    .addClass("dark-theme");

    $("#game_grid")

    .removeClass("light")

    .addClass("dark");

  });


});
