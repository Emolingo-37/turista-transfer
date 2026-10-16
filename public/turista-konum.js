
/*
 * TURISTA TRANSFER — PHOTON KONUM ARAMA
 * Yalnızca son Seyahat Özeti formunda çalışır.
 * Google API anahtarı gerekmez.
 * Photon / OpenStreetMap
 */

(() => {
  "use strict";

  const ENDPOINT = "https://photon.komoot.io/api/";
  const fields = ["f-from", "f-to"];
  const instances = new WeakMap();

  function formatPlace(properties) {
    const p = properties || {};

    const title =
      p.name ||
      p.street ||
      p.city ||
      p.district ||
      p.county ||
      "Konum";

    const parts = [
      p.street && p.housenumber
        ? `${p.street} ${p.housenumber}`
        : p.street,
      p.district,
      p.city,
      p.county,
      p.state,
      p.country
    ].filter(Boolean);

    const unique = [...new Set(parts)];

    const description = unique
      .filter(part => part !== title)
      .join(", ");

    return {
      title: String(title),
      description,
      address: [
        title,
        ...unique.filter(part => part !== title)
      ].join(", ")
    };
  }

  function createSearch(input) {
    if (instances.has(input)) return;

    // Eski HTML datalist önerilerini kaldır.
    input.removeAttribute("list");
    input.autocomplete = "off";
    input.spellcheck = false;

    const wrapper = document.createElement("div");
    wrapper.className = "tt-place-wrapper";

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const panel = document.createElement("div");
    panel.className = "tt-place-results";
    panel.hidden = true;
    panel.setAttribute("role", "listbox");

    wrapper.appendChild(panel);

    const status = document.createElement("div");
    status.className = "tt-place-status";
    status.setAttribute("aria-live", "polite");

    wrapper.after(status);

    let timer = null;
    let controller = null;
    let sequence = 0;
    let selected = null;

    function updateStatus(message, valid = false) {
      status.textContent = message;
      status.classList.toggle("verified", valid);
    }

    function closeResults() {
      panel.hidden = true;
      panel.replaceChildren();
    }

    function invalidate() {
      selected = null;
      delete input.dataset.placeId;
      delete input.dataset.latitude;
      delete input.dataset.longitude;
      delete input.dataset.verifiedAddress;

      updateStatus(
        input.value.trim()
          ? "Konumu doğrulamak için listeden seçin."
          : ""
      );
    }

    function choose(feature) {
      if (!feature?.properties) return;

      const location = formatPlace(feature.properties);
      const coordinates = feature.geometry?.coordinates;

      if (
        !Array.isArray(coordinates) ||
        coordinates.length < 2
      ) return;

      const longitude = Number(coordinates[0]);
      const latitude = Number(coordinates[1]);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) return;

      selected = {
        address: location.address,
        latitude,
        longitude,
        osmId: feature.properties.osm_id ?? null
      };

      input.value = selected.address;
      input.dataset.latitude = String(latitude);
      input.dataset.longitude = String(longitude);
      input.dataset.verifiedAddress = selected.address;

      if (selected.osmId !== null) {
        input.dataset.placeId = String(selected.osmId);
      }

      input.classList.remove("bad");
      closeResults();
      updateStatus("✓ Konum seçildi", true);

      input.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }

    function render(features) {
      panel.replaceChildren();

      if (!features.length) {
        const empty = document.createElement("div");
        empty.className = "tt-place-empty";
        empty.textContent =
          "Konum bulunamadı. Daha ayrıntılı yazmayı deneyin.";
        panel.appendChild(empty);
        panel.hidden = false;
        return;
      }

      features.slice(0, 5).forEach(feature => {
        const location = formatPlace(feature.properties);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "tt-place-item";
        button.setAttribute("role", "option");

        const icon = document.createElement("span");
        icon.className = "tt-place-icon";
        icon.textContent = "⌖";

        const content = document.createElement("span");
        content.className = "tt-place-content";

        const title = document.createElement("strong");
        title.textContent = location.title;

        const description = document.createElement("small");
        description.textContent =
          location.description || "Türkiye";

        content.append(title, description);
        button.append(icon, content);

        button.addEventListener("mousedown", event => {
          event.preventDefault();
        });

        button.addEventListener("click", () => {
          choose(feature);
        });

        panel.appendChild(button);
      });

      panel.hidden = false;
    }

    async function search(value, currentSequence) {
      if (controller) controller.abort();

      controller = new AbortController();

      const params = new URLSearchParams({
        q: value,
        limit: "5",
        lang: "tr"
      });

      // Türkiye içindeki sonuçlara öncelik ver.
      // Photon sürümüne göre desteklenen ülke filtresi.
      params.append("countrycode", "TR");

      updateStatus("Konumlar aranıyor...");

      try {
        const response = await fetch(
          `${ENDPOINT}?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("Photon isteği başarısız");
        }

        const data = await response.json();

        if (currentSequence !== sequence) return;
        if (!input.isConnected) return;

        const features = Array.isArray(data.features)
          ? data.features
          : [];

        render(features);

        updateStatus(
          features.length
            ? "Doğrulamak için bir sonuç seçin."
            : "Eşleşen konum bulunamadı."
        );
      } catch (error) {
        if (error.name === "AbortError") return;
        if (currentSequence !== sequence) return;

        closeResults();

        updateStatus(
          "Konum servisine ulaşılamadı. Biraz sonra tekrar deneyin."
        );
      }
    }

    input.addEventListener("input", () => {
      invalidate();
      closeResults();

      clearTimeout(timer);
      if (controller) controller.abort();

      sequence++;
      const currentSequence = sequence;
      const value = input.value.trim();

      if (value.length < 3) return;

      // Gereksiz API isteklerini azalt.
      timer = setTimeout(() => {
        search(value, currentSequence);
      }, 650);
    });

    input.addEventListener("focus", () => {
      if (panel.children.length) {
        panel.hidden = false;
      } else if (
        input.value.trim().length >= 3 &&
        !selected
      ) {
        sequence++;
        search(input.value.trim(), sequence);
      }
    });

    input.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeResults();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(closeResults, 180);
    });

    instances.set(input, {
      isVerified() {
        return Boolean(
          selected &&
          input.value.trim() === selected.address
        );
      },
      getLocation() {
        return selected;
      },
      invalidate
    });

    if (input.value.trim()) {
      updateStatus("Konumu doğrulamak için listeden seçin.");
    }
  }

  // Seyahat özeti sohbet sonrasında oluşturulduğu
  // için alanları dinamik olarak buluyoruz.
  function initialize() {
    for (const id of fields) {
      const input = document.getElementById(id);

      if (
        input &&
        input.closest("#tf") &&
        !instances.has(input)
      ) {
        createSearch(input);
      }
    }
  }

  const observer = new MutationObserver(() => {
    initialize();
  });

  const chat = document.getElementById("chat");

  if (chat) {
    observer.observe(chat, {
      childList: true,
      subtree: true
    });
  }

  initialize();

  // Doğrulanmamış konumla araç arama yapılmasın.
  document.addEventListener("click", event => {
    const button = event.target.closest("#go");
    if (!button) return;

    for (const id of fields) {
      const input = document.getElementById(id);
      const instance = input && instances.get(input);

      if (!input || !instance) {
        event.preventDefault();
        event.stopImmediatePropagation();
        alert("Konum doğrulama henüz hazır değil.");
        return;
      }

      if (!instance.isVerified()) {
        event.preventDefault();
        event.stopImmediatePropagation();

        input.classList.add("bad");
        input.focus();

        alert(
          "Lütfen kalkış ve varış konumlarını önerilerden seçerek doğrulayın."
        );

        return;
      }
    }

    // Seçilen koordinatları mevcut rezervasyon
    // sürecinde kullanılabilmesi için hazırla.
    const from = instances.get(
      document.getElementById("f-from")
    )?.getLocation();

    const to = instances.get(
      document.getElementById("f-to")
    )?.getLocation();

    window.turistaVerifiedRoute = { from, to };
  }, true);

  const style = document.createElement("style");

  style.textContent = `
    .tt-place-wrapper {
      position: relative;
      width: 100%;
      min-width: 0;
    }

    .tt-place-wrapper > input {
      width: 100%;
      min-width: 0;
    }

    .tt-place-results {
      position: absolute;
      z-index: 10000;
      top: calc(100% + 5px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 17px;
      box-shadow:
        0 16px 42px rgba(10, 35, 66, .14);
      padding: 6px;
      max-height: 290px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .tt-place-results[hidden] {
      display: none !important;
    }

    .tt-place-item {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 11px;
      border: 0;
      background: #fff;
      text-align: left;
      padding: 12px 11px;
      border-radius: 11px;
      cursor: pointer;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "SF Pro Text",
        system-ui,
        sans-serif;
    }

    .tt-place-item:hover,
    .tt-place-item:focus {
      background: #f1f5f9;
      outline: none;
    }

    .tt-place-icon {
      flex: none;
      display: grid;
      place-items: center;
      background: #f1f5f9;
      width: 35px;
      height: 35px;
      border-radius: 11px;
      color: #0a2342;
      font-size: 23px;
    }

    .tt-place-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
      gap: 3px;
    }

    .tt-place-content strong {
      font-size: 13px;
      color: #0a2342;
      font-weight: 650;
    }

    .tt-place-content small {
      font-size: 11px;
      color: #64748b;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    .tt-place-empty {
      padding: 15px;
      color: #64748b;
      font-size: 12px;
    }

    .tt-place-status {
      font-size: 11px;
      color: #64748b;
      margin: 5px 0 9px;
      min-height: 14px;
    }

    .tt-place-status.verified {
      color: #15803d;
      font-weight: 650;
    }

    @media (max-width: 600px) {
      .tt-place-results {
        max-height: 225px;
      }

      .tt-place-item {
        padding: 11px 9px;
      }
    }
  `;

  document.head.appendChild(style);

  console.info("Turista Photon konum arama yüklendi.");
})();
