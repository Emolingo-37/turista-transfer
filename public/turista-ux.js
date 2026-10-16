
/*
 TURISTA TRANSFER — UX İYİLEŞTİRMELERİ
 Mevcut chatbot, oturum ve rezervasyon kodunu korur.
*/
(() => {
  "use strict";

  const style = document.createElement("style");
  style.textContent = `
    .turista-finish-actions {
      display: grid;
      gap: 10px;
      margin-top: 22px;
    }

    .turista-finish-actions button {
      width: 100%;
      padding: 15px 18px;
      border-radius: 15px;
      font: 700 14px -apple-system,
        BlinkMacSystemFont, system-ui, sans-serif;
      cursor: pointer;
      transition: transform .18s, background .18s;
    }

    .turista-finish-actions button:active {
      transform: scale(.98);
    }

    .turista-home-btn {
      background: #0a2342;
      color: white;
      border: none;
    }

    .turista-bookings-btn {
      background: #fff;
      border: 1px solid #dce3eb;
      color: #0a2342;
    }

    .turista-success-note {
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
      margin-top: 12px;
    }

    nav .brand {
      cursor: pointer;
      border-radius: 16px;
    }

    nav .brand:hover {
      background: #ffffff10;
    }

    .okc {
      max-width: 560px;
      width: 100%;
      margin-left: auto;
      margin-right: auto;
    }
  `;
  document.head.appendChild(style);

  function goHome() {
    const chatView = document.getElementById("chatv");

    if (chatView) {
      chatView.classList.remove("on");
    }

    const homeButton = document.querySelector(
      'nav button[data-t="home"]'
    );

    if (homeButton) {
      homeButton.click();
    }

    const home = document.getElementById("v-home");

    if (home) {
      home.scrollTop = 0;
    }
  }

  // Turista Transfer logosuna basınca ana menüye git.
  const brand = document.querySelector("nav .brand");

  if (brand) {
    brand.setAttribute("role", "button");
    brand.setAttribute("tabindex", "0");
    brand.setAttribute("aria-label", "Ana menüye dön");

    brand.addEventListener("click", goHome);

    brand.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goHome();
      }
    });
  }

  // Rezervasyon onayı tamamlanınca butonları ekle.
  function enhanceSuccess() {
    const success = document.querySelector("#chat .ok");

    if (!success) return;

    if (success.dataset.turistaEnhanced === "true") {
      return;
    }

    success.dataset.turistaEnhanced = "true";

    const actions = document.createElement("div");
    actions.className = "turista-finish-actions";

    const homeButton = document.createElement("button");
    homeButton.className = "turista-home-btn";
    homeButton.textContent = "Ana Menüye Dön →";
    homeButton.onclick = goHome;

    const bookingsButton = document.createElement("button");
    bookingsButton.className = "turista-bookings-btn";
    bookingsButton.textContent = "Rezervasyonlarımı Gör";
    bookingsButton.onclick = () => {
      window.location.assign("/taleplerim");
    };

    actions.append(homeButton, bookingsButton);
    success.appendChild(actions);

    const note = document.createElement("p");
    note.className = "turista-success-note";
    note.textContent =
      "Talebinizi Rezervasyonlarım bölümünden takip edebilirsiniz.";

    success.appendChild(note);
  }

  const chat = document.getElementById("chat");

  if (chat) {
    const observer = new MutationObserver(enhanceSuccess);

    observer.observe(chat, {
      childList: true,
      subtree: true
    });

    enhanceSuccess();
  }

  console.info("Turista UX iyileştirmeleri yüklendi.");
})();
