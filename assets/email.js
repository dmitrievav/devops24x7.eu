// Assembles the e-mail address from data-u / data-d (filled in at build time,
// see scripts/build.py) so that the full address is not in the page source.
document.querySelectorAll("span.email[data-u][data-d]").forEach(function (el) {
    var addr = el.dataset.u + "@" + el.dataset.d;
    var a = document.createElement("a");
    a.href = "mai" + "lto:" + addr;
    a.textContent = addr;
    el.replaceChildren(a);
});
