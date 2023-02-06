const gamesContainer = document.getElementById("games");
const noResults = document.getElementById("no-results");

document.getElementById("query").addEventListener("input", function() {
  const query = this.value;
  
  // fetch the game data
  fetch('gameData.json')
    .then(response => response.json())
    .then(data => {
      const filteredData = data.games.filter(game => game.title.toLowerCase().includes(query.toLowerCase()));
      gamesContainer.innerHTML = "";

      if (filteredData.length === 0) {
        noResults.style.display = "block";
        return;
      }

      noResults.style.display = "block";

      filteredData.forEach(game => {
        const gameContainer = document.createElement("div");
        gameContainer.classList.add("game-container");

        const gameLink = document.createElement("a");
        gameLink.href = game.url;

        const gameImage = document.createElement("img");
        gameImage.src = game.image;
        gameImage.alt = game.title;

        gameLink.appendChild(gameImage);
        gameContainer.appendChild(gameLink);
        gamesContainer.appendChild(gameContainer);
      });
    });
});
