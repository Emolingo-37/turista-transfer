
/*
 TURISTA TRANSFER — PHOTON KONUM V2
 OpenStreetMap / Photon
 Yalnızca Seyahat Özeti ekranında çalışır.
 Giriş ve chatbot sistemini değiştirmez.
*/

(() => {
  "use strict";

  const API = "https://photon.komoot.io/api/";
  const FIELDS = ["f-from", "f-to"];
  const instances = new WeakMap();

  const clean = value => String(value || "").trim();

  function normalize(value) {
    return clean(value).toLocaleLowerCase("tr-TR");
  }

  // Photon'dan gelen adresi okunabilir hale getir.
  function formatPlace(feature) {
    const p = feature.properties || {};
    const coords = feature.geometry?.coordinates || [];

    const title =
      p.name ||
      [p.street, p.housenumber].filter(Boolean).join(" ") ||
      p.district ||
      p.city ||
      p.county ||
      "Konum";

    const details = [
      p.district,
      p.city,
      p.county,
      p.state,
      p.country
    ].filter(Boolean);

    const unique = [...new Set(
      details.filter(x => normalize(x) !== normalize(title))
    )];

    return {
      title,
      subtitle: unique.join(", "),
      address: [title, ...unique].join(", "),
      latitude: Number(coords[1]),
      longitude: Number(coords[0]),
      osmId: p.osm_id ?? null,
      country: p.countrycode || ""
    };
  }

  // Bir adres alanına arama özelliği ekle.
  function attach(input) {
    if (instances.has(input)) return;

    input.removeAttribute("list");
    input.autocomplete = "off";
    input.spellcheck = false;

    const wrapper = document.createElement("div");
    wrapper.className = "tt-location-box";

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const results = document.createElement("div");
    results.className = "tt-location-results";
    results.hidden = true;
    results.setAttribute("role", "listbox");

    wrapper.appendChild(results);

    const status = document.createElement("div");
    status.className = "tt-location-status";
    status.setAttribute("aria-live", "polite");

    wrapper.after(status);

    let timer = null;
    let controller = null;
    let requestId = 0;
    let selected = null;

    function setStatus(message, type = "") {
      status.textContent = message;
      status.dataset.type = type;
    }

    function close() {
      results.hidden = true;
      results.replaceChildren();
    }

    function cancelPending() {
      clearTimeout(timer);
      requestId++;

      if (controller) {
        controller.abort();
        controller = null;
      }
    }

    function invalidate() {
      selected = null;

      delete input.dataset.latitude;
      delete input.dataset.longitude;
      delete input.dataset.placeId;
      delete input.dataset.verifiedAddress;

      input.classList.remove("tt-verified");

      setStatus(
        input.value.trim()
          ? "Konumu doğrulamak için önerilerden seçim yapın."
          : ""
      );
    }

    function selectPlace(place) {
      if (
        !Number.isFinite(place.latitude) ||
        !Number.isFinite(place.longitude)
      ) return;

      cancelPending();

      selected = place;
      input.value = place.address;

      input.dataset.latitude = String(place.latitude);
      input.dataset.longitude = String(place.longitude);
      input.dataset.verifiedAddress = place.address;

      if (place.osmId !== null) {
        input.dataset.placeId = String(place.osmId);
      }

      input.classList.remove("bad");
      input.classList.add("tt-verified");

      close();
      setStatus("✓ Konum doğrulandı", "success");

      // Uygulamanın mevcut konum değişikliği
      // kontrollerini de tetikle.
      input.dispatchEvent(
        new Event("change", { bubbles: true })
      );

      if (input.id === "f-from") {
        try {
          if (typeof onFrom === "function") onFrom();
        } catch (error) {
          console.warn("onFrom:", error);
        }
      }
    }

    function showResults(places) {
      results.replaceChildren();

      if (!places.length) {
        const empty = document.createElement("div");
        empty.className = "tt-location-empty";

        empty.textContent =
          "Konum bulunamadı. İlçe, mahalle veya daha açık bir adres deneyin.";

        results.appendChild(empty);
        results.hidden = false;
        return;
      }

      places.forEach(place => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tt-location-item";
        button.setAttribute("role", "option");

        const icon = document.createElement("span");
        icon.className = "tt-location-icon";
        icon.textContent = "⌖";

        const info = document.createElement("span");
        info.className = "tt-location-info";

        const title = document.createElement("strong");
        title.textContent = place.title;

        const subtitle = document.createElement("small");
        subtitle.textContent =
          place.subtitle || "Konum sonucu";

        info.append(title, subtitle);
        button.append(icon, info);

        button.addEventListener("pointerdown", event => {
          event.preventDefault();
        });

        button.addEventListener("click", () => {
          selectPlace(place);
        });

        results.appendChild(button);
      });

      results.hidden = false;
    }

    async function search(query, id) {
      if (controller) controller.abort();

      controller = new AbortController();

      // Sade Photon isteği: dil veya desteklenmeyen
      // filtre parametreleri gönderilmiyor.
      const params = new URLSearchParams({
        q: query,
        limit: "12"
      });

      setStatus("Konumlar aranıyor...");

      try {
        const response = await fetch(
          `${API}?${params.toString()}`,
          {
            method: "GET",
            mode: "cors",
            signal: controller.signal,
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error(
            "Photon HTTP " + response.status
          );
        }

        const data = await response.json();

        if (
          requestId !== id ||
          !input.isConnected ||
          document.activeElement !== input
        ) return;

        const features = Array.isArray(data.features)
          ? data.features
          : [];

        const places = features
          .map(formatPlace)
          .filter(place =>
            Number.isFinite(place.latitude) &&
            Number.isFinite(place.longitude)
          );

        // Türkiye sonuçlarına öncelik ver.
        // Ülke bilgisi bulunmayan sonuçları
        // tamamen silmeden sıralamanın sonuna al.
        places.sort((a, b) => {
          const score = place =>
            normalize(place.country) === "tr" ||
            normalize(place.country) === "türkiye" ||
            normalize(place.country) === "turkey"
              ? 0 : 1;

          return score(a) - score(b);
        });

        showResults(places.slice(0, 6));

        setStatus(
          places.length
            ? "Doğrulamak için listeden konum seçin."
            : "Eşleşen konum bulunamadı."
        );

      } catch (error) {
        if (error.name === "AbortError") return;
        if (requestId !== id) return;

        console.error("Photon arama hatası:", error);

        close();

        setStatus(
          "Konum servisine ulaşılamadı. Bağlantıyı kontrol edip tekrar deneyin.",
          "error"
        );
      }
    }

    function scheduleSearch() {
      cancelPending();
      close();

      const query = input.value.trim();

      if (query.length < 3) {
        setStatus(
          query
            ? "Aramak için en az 3 karakter yazın."
            : ""
        );
        return;
      }

      const id = requestId;

      timer = setTimeout(() => {
        search(query, id);
      }, 700);
    }

    input.addEventListener("input", () => {
      invalidate();
      scheduleSearch();
    });

    input.addEventListener("focus", () => {
      if (!selected && input.value.trim().length >= 3) {
        scheduleSearch();
      }
    });

    input.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        cancelPending();
        close();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (document.activeElement !== input) close();
      }, 220);
    });

    instances.set(input, {
      verified() {
        return Boolean(
          selected &&
          input.value.trim() === selected.address
        );
      },

      location() {
        return selected;
      }
    });

    if (input.value.trim()) {
      setStatus(
        "Konumu doğrulamak için alana tıklayın ve önerilerden seçin."
      );
    }
  }

  // Form chatbot bittikten sonra oluşturuluyor.
  function initialize() {
    for (const id of FIELDS) {
      const input = document.getElementById(id);

      if (
        input &&
        input.closest("#tf") &&
        !instances.has(input)
      ) {
        attach(input);
      }
    }
  }

  const chat = document.getElementById("chat");

  if (chat) {
    const observer = new MutationObserver(initialize);

    observer.observe(chat, {
      childList: true,
      subtree: true
    });
  }

  initialize();

  // Rezervasyona geçmeden önce iki konumu kontrol et.
  document.addEventListener("click", event => {
    const button = event.target.closest?.("#go");

    if (!button) return;

    const fromInput = document.getElementById("f-from");
    const toInput = document.getElementById("f-to");

    if (!fromInput || !toInput) return;

    const from = instances.get(fromInput);
    const to = instances.get(toInput);

    if (!from || !to) {
      event.preventDefault();
      event.stopImmediatePropagation();

      alert("Konum arama henüz hazır değil. Tekrar deneyin.");
      return;
    }

    if (!from.verified() || !to.verified()) {
      event.preventDefault();
      event.stopImmediatePropagation();

      const missing = !from.verified()
        ? fromInput
        : toInput;

      missing.classList.add("bad");
      missing.focus();

      alert(
        "Lütfen Nereden ve Nereye alanlarını önerilerden seçerek doğrulayın."
      );

      return;
    }

    const fromPlace = from.location();
    const toPlace = to.location();

    if (
      fromPlace.latitude === toPlace.latitude &&
      fromPlace.longitude === toPlace.longitude
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      alert("Kalkış ve varış noktaları aynı olamaz.");
      return;
    }

    // Gelecekte Supabase rezervasyonuna
    // bağlanabilmesi için koordinatları sakla.
    window.turistaVerifiedRoute = {
      from: fromPlace,
      to: toPlace
    };

  }, true);

  // APPLE TARZI KÜÇÜK ADRES MENÜSÜ
  const style = document.createElement("style");

  style.textContent = `
    .tt-location-box {
      position: relative;
      width: 100%;
      min-width: 0;
    }

    .tt-location-box .fld {
      width: 100%;
    }

    .tt-location-results {
      position: absolute;
      top: calc(100% + 5px);
      left: 0;
      right: 0;
      z-index: 9999;

      padding: 6px;
      background: #fff;

      border: 1px solid #e2e8f0;
      border-radius: 16px;

      box-shadow:
        0 16px 40px rgba(10,35,66,.15);

      max-height: 280px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .tt-location-results[hidden] {
      display: none !important;
    }

    .tt-location-item {
      display: flex;
      align-items: center;
      gap: 11px;

      width: 100%;
      padding: 12px;

      background: white;
      border: 0;
      border-radius: 11px;

      cursor: pointer;
      text-align: left;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "SF Pro Text",
        system-ui,
        sans-serif;
    }

    .tt-location-item:hover,
    .tt-location-item:focus {
      background: #f1f5f9;
      outline: none;
    }

    .tt-location-icon {
      flex: none;
      width: 35px;
      height: 35px;

      display: grid;
      place-items: center;

      border-radius: 10px;
      background: #f1f5f9;

      font-size: 23px;
      color: #0a2342;
    }

    .tt-location-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .tt-location-info strong {
      font-size: 13px;
      color: #0a2342;
      font-weight: 650;
    }

    .tt-location-info small {
      font-size: 11px;
      line-height: 1.45;
      color: #64748b;
      overflow-wrap: anywhere;
    }

    .tt-location-empty {
      padding: 14px;
      font-size: 12px;
      color: #64748b;
    }

    .tt-location-status {
      font-size: 11px;
      color: #64748b;
      margin: 7px 0 9px;
      min-height: 14px;
    }

    .tt-location-status[data-type="success"] {
      color: #15803d;
      font-weight: 650;
    }

    .tt-location-status[data-type="error"] {
      color: #b91c1c;
    }

    .tt-location-box .tt-verified {
      border-color: #16a34a !important;
    }

    @media(max-width:600px) {
      .tt-location-results {
        max-height: 220px;
      }

      .tt-location-item {
        padding: 11px 9px;
      }
    }
  `;

  document.head.appendChild(style);

  console.info("Turista Photon Konum V2 yüklendi.");
})();
