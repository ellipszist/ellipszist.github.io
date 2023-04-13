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
        }, 100);
      }
    }
  });

  noResults.style.display = results ? "none" : "block";
});

// hide the .search-container when scrolling down and show it again when scrolling up
let lastScrollTop = 0;

window.addEventListener("scroll", function() {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (currentScrollTop > lastScrollTop && currentScrollTop > 30) {
    // Scrolling down and past 30px from top
    document.querySelector(".search-container").classList.add("hidden");
  } else {
    // Scrolling up or not past 30px from top
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
  searchBox.placeholder = "พิมพ์ชื่อเกม หรือ ชื่อเพจ";
});

// JavaScript code to populate the input field
const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get('query');
document.getElementById('query').value = query;

// Trigger the search function
searchBox.dispatchEvent(new Event('input'));

// Disable right-click on the page
document.addEventListener('contextmenu', event => event.preventDefault());

// Add context menu to all images with the "shareable" class
const shareableImages = document.querySelectorAll('.shareable');
let previousMenu = null;
shareableImages.forEach(image => {
  image.addEventListener('contextmenu', event => {
    event.preventDefault();
    if (previousMenu) previousMenu.remove();
    const menu = document.createElement('div');
    menu.classList.add('menu');
    menu.innerHTML = `
      <a href="#" onclick="copyUrl(event, 'https://ellipszist.github.io/x/beta.html?query=${encodeURIComponent(image.alt)}');">คัดลอกลิงก์ม็อด</a>
      <a href="#" onclick="shareByEmail(event, 'https://ellipszist.github.io/x/beta.html?query=${encodeURIComponent(image.alt)}', '${encodeURIComponent(image.alt)}');">แบ่งปันทางอีเมล</a>
      <a href="#" onclick="shareOnFacebook(event, 'https://ellipszist.github.io/x/beta.html?query=${encodeURIComponent(image.alt)}', '${encodeURIComponent(image.alt)}');">แชร์บน Facebook</a>
      <a href="#" onclick="shareOnTwitter(event, 'https://ellipszist.github.io/x/beta.html?query=${encodeURIComponent(image.alt)}', '${encodeURIComponent(image.alt)}');">แชร์บนทวิตเตอร์</a>
    `;
    menu.style.top = `${event.pageY}px`;
    menu.style.left = `${event.pageX}px`;
    document.body.appendChild(menu);
    document.addEventListener('click', () => {
      menu.remove();
      previousMenu = null;
    }, { once: true });
    previousMenu = menu;
  });
});

// Copy URL to clipboard and display message
function copyUrl(event, url) {
  event.preventDefault();
  navigator.clipboard.writeText(url);
  //alert('คัดลอก URL ไปยังคลิปบอร์ดแล้ว');
}

function shareByEmail(event, url, alt) {
  event.preventDefault();
  const subject = encodeURIComponent(`Check out this page: ${decodeURIComponent(alt)}`);
  const body = encodeURIComponent(`I thought you might find this page interesting: ${url}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function shareOnFacebook(event, url, alt) {
  event.preventDefault();
  const shareUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(url)}&quote=${decodeURIComponent(alt)}`;
  window.open(shareUrl, '_blank');
}

function shareOnTwitter(event, url, alt) {
  event.preventDefault();
  const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${decodeURIComponent(alt)}`;
  window.open(shareUrl, '_blank');
}
