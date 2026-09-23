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

(function () {
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.textContent = "Kopiert";
        btn.classList.add("copied");
        setTimeout(function () { btn.textContent = label; btn.classList.remove("copied"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { window.location.href = "mailto:" + text; });
      } else {
        window.location.href = "mailto:" + text;
      }
    });
  });
})();
