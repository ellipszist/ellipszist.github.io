const games = {
  "sdv": "100%",
  "sdvalpha": "95%",
  "sve": "100%",
  "svebeta": "98%",
  "pane": "100%",
  "overcooked2": "100%",
  "deathsdoor": "96%",
  "secret2": "65%",
  "bcapp": "3/5",
  "hand": "30%",
  "hades": "17%",
  "eastward": "5%",
  "secret1": "??%"
};

let multiply = 4;

Object.entries(games).forEach(([game, pourcent]) => {
  const delay = 700;

  setTimeout(() => {
    document.getElementById(`${game}-pourcent`).textContent = pourcent;
  }, delay * multiply);

  multiply++;
});


const collapsibles = document.getElementsByClassName("collapsible");

for (let i = 0; i < collapsibles.length; i++) {
  collapsibles[i].addEventListener("click", function() {
    this.classList.toggle("active");
    const content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
      content.style.marginBottom = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
      content.style.marginBottom = "10px";
    } 
  });
}
