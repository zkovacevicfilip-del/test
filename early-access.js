// Landing page pro předběžný přístup: dokud není ve formuláři číslo formuláře z Kitu,
// e-mail se nikam neodešle a stránka to návštěvníkovi řekne (místo chybové stránky Kitu).
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("eaForm"), msg = document.getElementById("eaMsg");
    if (!form || !msg) return;
    form.addEventListener("submit", function (e) {
      if (form.getAttribute("action").indexOf("KIT_FORM_ID") !== -1) {
        e.preventDefault();
        msg.textContent = "Sign-ups open very soon. Please come back in a few days.";
      }
    });
  });
})();
