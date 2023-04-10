document.getElementById("query").addEventListener("input", function() {
  const query = this.value.toLowerCase();
  const modContainers = document.querySelectorAll("#mods .mod-container");
  const noResults = document.querySelector(".no-results");
  let results = false;

  modContainers.forEach(modContainer => {
    const imgAlt = modContainer.querySelector("img").alt.toLowerCase();

    if (imgAlt.includes(query)) {
      modContainer.style.display = "inline-block";
      results = true;
    } else {
      modContainer.style.display = "none";
    }
  });

  noResults.style.display = results ? "none" : "block";
});
