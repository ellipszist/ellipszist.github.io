document.getElementById("query").addEventListener("input", function() {
  const query = this.value.toLowerCase();
  const modContainers = document.querySelectorAll("#mods .mod-container");
  const noResults = document.querySelector(".no-results");
  let results = false;

  modContainers.forEach(modContainer => {
    const imgAlt = modContainer.querySelector("img").alt.toLowerCase();

    if (imgAlt.includes(query)) {
      modContainer.style.display = "inline-block";
      modContainer.classList.remove("hide"); // remove the "hide" class if it was added before
      results = true;
    } else {
      modContainer.classList.add("hide"); // add the "hide" class to trigger the fade-out animation
      setTimeout(() => {
        modContainer.style.display = "none"; // hide the element after the animation is complete
      }, 500); // replace 500 with the duration of the transition in milliseconds
    }
  });

  noResults.style.display = results ? "none" : "block";
});
