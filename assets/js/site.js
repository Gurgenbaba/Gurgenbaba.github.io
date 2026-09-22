(function () {
  var box = document.getElementById("lightbox");
  var boxImg = box ? box.querySelector("img") : null;
  document.querySelectorAll("[data-full]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!box || !boxImg) return;
      boxImg.src = btn.getAttribute("data-full");
      boxImg.alt = btn.getAttribute("data-alt") || "";
      box.classList.add("open");
      box.removeAttribute("hidden");
    });
  });
  if (box) {
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest("[data-close]")) {
        box.classList.remove("open");
        box.setAttribute("hidden", "");
        if (boxImg) boxImg.removeAttribute("src");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("open")) {
        box.classList.remove("open");
        box.setAttribute("hidden", "");
      }
    });
  }
})();
