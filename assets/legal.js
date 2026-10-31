// Decrypts assets/legal.json (see scripts/encrypt-legal.mjs) and fills
// elements marked with data-legal="<field>". The e-mail becomes a mailto link.
(async function () {
    const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const fields = document.querySelectorAll("[data-legal]");
    try {
        const p = await fetch("/assets/legal.json", { cache: "no-cache" }).then((r) => r.json());
        const key = await crypto.subtle.importKey("raw", b64(p.key), "AES-GCM", false, ["decrypt"]);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(p.iv) }, key, b64(p.ct));
        const data = JSON.parse(new TextDecoder().decode(plain));
        fields.forEach((el) => {
            const value = data[el.dataset.legal];
            if (value === undefined) return;
            if (el.dataset.legal === "email") {
                const a = document.createElement("a");
                a.href = "mai" + "lto:" + value;
                a.textContent = value;
                el.replaceChildren(a);
            } else {
                el.textContent = value;
            }
        });
    } catch (e) {
        fields.forEach((el) => { el.textContent = "[Fehler beim Laden – bitte Seite neu laden]"; });
    }
})();
