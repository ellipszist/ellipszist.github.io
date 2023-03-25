const games = {
  "sdv": "100%",
  "sve": "100%",
  "pane": "100%",
  "overcooked2": "100%",
  "deathsdoor": "42%",
  "hand": "30%",
  "hades": "17%",
  "eastward": "5%",
  "secret1": "??%",
  "secret2": "??%"
};

let multiply = 4;

Object.entries(games).forEach(([game, pourcent]) => {
  const delay = 700;

  setTimeout(() => {
    document.getElementById(`${game}-pourcent`).textContent = pourcent;
  }, delay * multiply);

  multiply++;
});
