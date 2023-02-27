const games = {
  "sdv": "100%",
  "sve": "100%",
  "pane": "100%",
  "hand": "35%",
  "hades": "17%"
};

let multiply = 4;

Object.entries(games).forEach(([game, pourcent]) => {
  const delay = 700;

  setTimeout(() => {
    document.getElementById(`${game}-pourcent`).textContent = pourcent;
  }, delay * multiply);

  multiply++;
});
