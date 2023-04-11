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

// hide the .search-container when scrolling down and show it again when scrolling up
let lastScrollTop = 0;

window.addEventListener("scroll", function() {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (currentScrollTop > lastScrollTop) {
    // Scrolling down
    document.querySelector(".search-container").classList.add("hidden");
  } else {
    // Scrolling up
    document.querySelector(".search-container").classList.remove("hidden");
  }

  lastScrollTop = currentScrollTop;
});

// hide the placeholder text when the user clicks on the search box
const searchBox = document.getElementById("query");

searchBox.addEventListener("click", function() {
  searchBox.placeholder = "";
});

searchBox.addEventListener("blur", function() {
  searchBox.placeholder = "ค้นหา";
});
