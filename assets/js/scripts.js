/* Sticky Navbar - Vanilla JS */
function stickyElement(a){a=document.querySelector(".header");a=getComputedStyle(a).height.split("px")[0];var b=document.querySelector(".navigation"),c=window.scrollY;c>a?b.classList.add("is-fixed"):c<a&&b.classList.remove("is-fixed")}window.addEventListener("scroll",stickyElement);

/* Autoplay audio with mute and play */
var pause=document.querySelector(".pause"),audio=document.querySelector(".audio");function togglePlay(){audio.paused?(audio.play(),pause.innerHTML="🔇"):(audio.pause(),pause.innerHTML="🏝️",pause.style.color=" #848484")};

/* Lazy-Load images with ScrollOut */
ScrollOut({targets:".photo",onShown:function(a){a.src||(a.src=a.dataset.src)}});