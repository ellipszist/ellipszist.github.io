document.getElementById("query").addEventListener("input", function() {
  const query = this.value.toLowerCase();
  const modContainers = document.querySelectorAll("#mods .mod-container");
  const noResults = document.querySelector(".no-results");
  let results = false;

  modContainers.forEach(modContainer => {
    const imgAlt = modContainer.querySelector("img").alt.toLowerCase();

    if (imgAlt.includes(query)) {
      modContainer.classList.remove("hide");
      if (modContainer.style.display === "none") {
        modContainer.style.display = "inline-block";
        modContainer.style.opacity = 0;
        setTimeout(() => {
          modContainer.style.opacity = 1;
        }, 10);
      }
      results = true;
    } else {
      modContainer.classList.add("hide");
      if (modContainer.style.display !== "none") {
        modContainer.style.opacity = 0;
        setTimeout(() => {
          modContainer.style.display = "none";
          modContainer.style.opacity = 1;
        }, 500);
      }
    }
  });

  noResults.style.display = results ? "none" : "block";
});
