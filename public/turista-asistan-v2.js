
/*
 * TURISTA TRANSFER — ASİSTAN V2.1
 * public/turista-asistan-v2.js
 *
 * Mevcut app.html ile birlikte çalışır.
 * Giriş sistemini değiştirmez.
 * Harita önerileri şimdilik yereldir.
 */

(() => {
  "use strict";

  // Mevcut çalışan fonksiyonları sakla.
  const originalShowForm = showForm;
  const originalSetWay = setWay;
  const originalGo = go;
  const originalRouteCard = routeCard;

  const state = {
    data: {},
    stage: "",
    busy: false,
    finished: false,
    session: 0
  };

  const clean = value => String(value ?? "").trim();

  const low = value =>
    clean(value).toLocaleLowerCase("tr-TR");

  const safe = value => esc(clean(value));

  const PURPOSES = [
    "Tatil / gezi",
    "İş seyahati",
    "Havalimanı transferi",
    "Aile / özel ziyaret",
    "Diğer"
  ];

  const LOCATIONS = [
    "İstanbul Havalimanı",
    "Sabiha Gökçen Havalimanı",
    "Taksim",
    "Kadıköy",
    "Beşiktaş",
    "Sultanahmet",
    "Şişli",
    "Bakırköy",
    "Üsküdar",
    "Ataşehir",
    "Sapanca",
    "Bursa",
    "Kapadokya",
    "Antalya"
  ];

  const QUESTIONS = [
    {
      id: "purpose",
      text: "Öncelikle, bu yolculuğunuzun amacı nedir?",
      choices: PURPOSES
    },
    {
      id: "from",
      text: "Anladım. Peki nereden yola çıkacaksınız?",
      choices: [
        "İstanbul Havalimanı",
        "Sabiha Gökçen Havalimanı",
        "Taksim",
        "Kadıköy",
        "Beşiktaş"
      ]
    },
    {
      id: "to",
      text: "Sizi nereye götürmemizi istersiniz?",
      choices: [
        "İstanbul Havalimanı",
        "Sabiha Gökçen Havalimanı",
        "Sapanca",
        "Bursa",
        "Sultanahmet"
      ]
    },
    {
      id: "pax",
      text: "Kaç kişi seyahat edeceksiniz?",
      choices: [
        "1 kişi",
        "2 kişi",
        "4 kişi",
        "8 kişi",
        "12 kişi",
        "16 kişi"
      ]
    },
    {
      id: "date",
      text: "Gidişiniz hangi tarihte olacak?",
      choices: [
        "Bugün",
        "Yarın",
        "Tarih seç"
      ]
    },
    {
      id: "time",
      text: "Saat kaçta yola çıkmayı planlıyorsunuz?",
      choices: [
        "08:00",
        "10:00",
        "12:00",
        "15:00",
        "18:00",
        "Saat seç"
      ]
    },
    {
      id: "way",
      text: "Dönüş yolculuğunuz için de araç ayarlayalım mı?",
      choices: [
        "Tek yön",
        "Gidiş-dönüş"
      ]
    },
    {
      id: "returnDate",
      text: "Dönüşünüz hangi tarihte olacak?",
      choices: [
        "Yarın",
        "Tarih seç"
      ]
    },
    {
      id: "returnTime",
      text: "Dönüşte saat kaçta yola çıkmak istersiniz?",
      choices: [
        "09:00",
        "12:00",
        "15:00",
        "18:00",
        "21:00",
        "Saat seç"
      ]
    },
    {
      id: "lug",
      text: "Yanınızda toplam kaç bavul olacak?",
      choices: [
        "0 bavul",
        "1 bavul",
        "2 bavul",
        "4 bavul",
        "8 bavul",
        "12 bavul"
      ]
    },
    {
      id: "extras",
      text: "Son olarak, yolculuğunuz için özel bir isteğiniz var mı?",
      choices: [
        "Yok, teşekkürler",
        "Çocuk koltuğu",
        "İsimle karşılama",
        "Tekerlekli sandalye"
      ]
    }
  ];

  const $id = id => document.getElementById(id);

  function localDate(date) {
    return iso(date);
  }

  function dateFromText(value) {
    const text = low(value);
    const d = new Date();

    if (text === "bugün") return localDate(d);

    if (text === "yarın") {
      d.setDate(d.getDate() + 1);
      return localDate(d);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [y, m, day] = text.split("-").map(Number);
      const check = new Date(y, m - 1, day);

      if (
        check.getFullYear() === y &&
        check.getMonth() === m - 1 &&
        check.getDate() === day
      ) return text;

      return "";
    }

    const m = text.match(
      /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/
    );

    if (!m) return "";

    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);

    const check = new Date(year, month - 1, day);

    if (
      check.getFullYear() !== year ||
      check.getMonth() !== month - 1 ||
      check.getDate() !== day
    ) return "";

    return [
      year,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");
  }

  function timeFromText(value) {
    const m = clean(value).match(
      /^([01]?\d|2[0-3])[:.]([0-5]\d)$/
    );

    if (!m) return "";

    return m[1].padStart(2, "0") + ":" + m[2];
  }

  function numberFromText(value) {
    const m = clean(value).match(/\d+/);
    return m ? Number(m[0]) : NaN;
  }

  function detectPurpose(text) {
    const t = low(text);

    if (/toplantı|iş seyahati|fuar|kongre/.test(t))
      return "İş seyahati";

    if (/tatil|gezi|gezmeye|turistik/.test(t))
      return "Tatil / gezi";

    if (/havalimanı transferi|uçuşum/.test(t))
      return "Havalimanı transferi";

    if (/aile|akraba|ziyaret/.test(t))
      return "Aile / özel ziyaret";

    return "";
  }

  // İlk cümledeki belirgin bilgileri ayır.
  // Bu fonksiyon soru cevapları üzerinde çalıştırılmaz.
  function readInitialText(text) {
    if (!text) return;

    const t = clean(text);
    const d = state.data;

    d.purpose = detectPurpose(t) || "";

    const n = t.match(/(\d+)\s*(kişi|kişilik|yolcu)/i);
    if (n) d.pax = Number(n[1]);

    const luggage = t.match(/(\d+)\s*(bavul|valiz)/i);
    if (luggage) d.lug = Number(luggage[1]);

    // Sadece açıkça belirtilen güzergâhı ayrıştır.
    const route = t.match(
      /(.+?)(?:'|’)?(?:dan|den|tan|ten)\s+(.+?)(?:'|’)?(?:a|e|ya|ye)\s+(?:gideceğiz|gidiyoruz|gitmek)/i
    );

    if (route) {
      d.from = route[1].trim();
      d.to = route[2].trim();
    } else {
      const dest = t.match(
        /(?:ile|ekibimizle|grubumuzla)?\s*([\p{L}\s]+?)(?:'|’)?(?:a|e|ya|ye)\s+(?:gideceğiz|gidiyoruz|gitmek)/iu
      );

      if (dest) {
        const candidate = dest[1].trim();

        const known = LOCATIONS.find(
          p => low(candidate).includes(low(p))
        );

        if (known) d.to = known;
      }
    }

    if (/gidiş.dönüş|gidip.dön/i.test(t))
      d.way = "Gidiş-dönüş";
  }

  function getQuestion() {
    const d = state.data;

    for (const q of QUESTIONS) {
      if (
        ["returnDate", "returnTime"].includes(q.id) &&
        d.way !== "Gidiş-dönüş"
      ) continue;

      if (q.id === "lug") {
        if (d.lug == null) return q;
        continue;
      }

      if (q.id === "extras") {
        if (!d.extrasConfirmed) return q;
        continue;
      }

      if (!d[q.id]) return q;
    }

    return null;
  }

  function removeOldChoices() {
    chat.querySelectorAll(".turista-options").forEach(el => {
      el.remove();
    });

    chat.querySelectorAll(".turista-picker").forEach(el => {
      el.remove();
    });
  }

  function say(text, callback) {
    const session = state.session;

    state.busy = true;

    bot(safe(text), null, () => {
      if (session !== state.session) return;

      state.busy = false;

      if (callback) callback();
    });
  }

  function createChoices(question) {
    const container = document.createElement("div");

    container.className = "turista-options";
    container.dataset.question = question.id;

    question.choices.forEach(choice => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "turista-option";
      button.textContent = choice;

      button.onclick = () => {
        if (
          state.busy ||
          state.stage !== question.id ||
          mode !== "conversation"
        ) return;

        if (choice === "Tarih seç") {
          showPicker("date", question.id);
          return;
        }

        if (choice === "Saat seç") {
          showPicker("time", question.id);
          return;
        }

        submit(choice);
      };

      container.appendChild(button);
    });

    chat.appendChild(container);
    chat.scrollTop = chat.scrollHeight;
  }

  function showPicker(type, stage) {
    removeOldChoices();

    const box = document.createElement("div");
    box.className = "turista-picker";

    const input = document.createElement("input");
    input.type = type;
    input.className = "fld";

    if (type === "date") {
      input.min =
        stage === "returnDate" && state.data.date
          ? state.data.date
          : localDate(new Date());
    }

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Devam et";
    button.className = "btn";

    button.onclick = () => {
      if (!input.value) {
        input.focus();
        return;
      }

      submit(input.value);
    };

    box.append(input, button);
    chat.appendChild(box);

    input.focus();
    chat.scrollTop = chat.scrollHeight;
  }

  function askNext() {
    removeOldChoices();

    const question = getQuestion();

    if (!question) {
      finishConversation();
      return;
    }

    state.stage = question.id;

    say(question.text, () => {
      inp.placeholder = "Cevabınızı yazın...";

      createChoices(question);
    });
  }

  function invalid(message) {
    say(message, () => {
      const q = QUESTIONS.find(
        item => item.id === state.stage
      );

      if (q) createChoices(q);
    });
  }

  function saveAnswer(stage, value) {
    const d = state.data;
    const v = clean(value);

    switch (stage) {
      case "purpose":
        if (!PURPOSES.includes(v)) {
          d.purpose = v;
        } else {
          d.purpose = v;
        }
        break;

      case "from":
      case "to":
        if (v.length < 2) {
          invalid("Lütfen bir konum belirtin.");
          return false;
        }

        if (
          stage === "to" &&
          low(v) === low(d.from)
        ) {
          invalid("Kalkış ve varış noktaları aynı olamaz.");
          return false;
        }

        d[stage] = v;
        break;

      case "pax": {
        const n = numberFromText(v);

        if (!Number.isInteger(n) || n < 1 || n > 60) {
          invalid("Lütfen 1 ile 60 arasında bir yolcu sayısı yazın.");
          return false;
        }

        d.pax = n;
        break;
      }

      case "lug": {
        const n = numberFromText(v);

        if (!Number.isInteger(n) || n < 0 || n > 60) {
          invalid("Lütfen geçerli bir bavul sayısı yazın.");
          return false;
        }

        d.lug = n;
        break;
      }

      case "date":
      case "returnDate": {
        const date = dateFromText(v);

        if (!date || date < localDate(new Date())) {
          invalid("Geçerli ve geçmişte olmayan bir tarih seçin.");
          return false;
        }

        if (
          stage === "returnDate" &&
          d.date &&
          date < d.date
        ) {
          invalid("Dönüş tarihi gidişten önce olamaz.");
          return false;
        }

        d[stage] = date;
        break;
      }

      case "time":
      case "returnTime": {
        const time = timeFromText(v);

        if (!time) {
          invalid("Saati 09:30 şeklinde yazabilir veya seçebilirsiniz.");
          return false;
        }

        if (
          stage === "returnTime" &&
          d.returnDate === d.date &&
          time <= d.time
        ) {
          invalid("Aynı gün dönüş saati gidiş saatinden sonra olmalı.");
          return false;
        }

        d[stage] = time;
        break;
      }

      case "way":
        if (/dönüş/i.test(v)) {
          d.way = "Gidiş-dönüş";
        } else if (/tek/i.test(v)) {
          d.way = "Tek yön";
          delete d.returnDate;
          delete d.returnTime;
        } else {
          invalid("Lütfen tek yön veya gidiş-dönüş seçin.");
          return false;
        }
        break;

      case "extras": {
        d.ex = [];

        const matched = EX.find(
          item => low(item[1]) === low(v)
        );

        if (matched) {
          d.ex.push(matched[1]);
        } else if (!/yok|hayır|teşekkür/i.test(v)) {
          invalid("Lütfen önerilen özel isteklerden birini seçin.");
          return false;
        }

        d.extrasConfirmed = true;
        break;
      }

      default:
        return false;
    }

    return true;
  }

  // Ana sohbet giriş noktası.
  // Eski openChat çağrılmaz: iki sohbet akışı karışmaz.
  openChat = function(to, from, text) {
    state.session++;
    state.data = {};
    state.stage = "";
    state.busy = true;
    state.finished = false;

    T = {};
    vi = 0;
    notify = false;
    pax = 2;
    lug = 2;
    way = "Tek yön";
    extras = new Set();

    chat.innerHTML = "";
    inp.value = "";

    mode = "conversation";

    step(1);
    $id("chatv").classList.add("on");

    if (to) state.data.to = clean(to);
    if (from) state.data.from = clean(from);

    if (text) {
      readInitialText(text);
      add(safe(text), "m me");
    }

    say(
      "Merhaba! ✨ Ben Turista Asistan. Yolculuğunuzu birlikte planlayalım. Size birkaç kısa soru soracağım. En sonunda bilgileri istediğiniz gibi düzenleyebilirsiniz.",
      askNext
    );
  };

  // Her cevap, sadece aktif sorunun alanına kaydedilir.
  submit = function(value) {
    const v = clean(value || inp.value);

    if (!v) return;

    if (mode === "form") {
      inp.value = "";
      say("Bilgileri yukarıdaki seyahat kartından düzenleyebilirsiniz.");
      return;
    }

    if (mode !== "conversation") return;
    if (state.busy || !state.stage) return;

    inp.value = "";

    const stage = state.stage;

    if (!saveAnswer(stage, v)) return;

    removeOldChoices();
    add(safe(v), "m me");

    state.stage = "";

    askNext();
  };

  function finishConversation() {
    if (state.finished) return;

    state.finished = true;
    state.stage = "";
    state.busy = true;

    mode = "form";

    say(
      "Harika! ✨ Seyahatinizi planladım. Aşağıdaki özet üzerinden tüm bilgileri kontrol edebilir ve istediğiniz değişiklikleri yapabilirsiniz.",
      () => {
        showForm({...state.data});
      }
    );
  }

  // Mevcut formu koruyup yeni alanlar ekle.
  showForm = function(data) {
    originalShowForm(data);

    const card = $id("tf");
    if (!card) return;

    const heading = card.querySelector("h4");

    if (heading) {
      heading.textContent = "Seyahat özeti";
    }

    // Yolculuk amacı.
    const purposeBox = document.createElement("div");

    purposeBox.className = "turista-purpose";
    purposeBox.innerHTML = `
      <label class="lb" for="f-purpose">
        Yolculuk amacı
      </label>
      <select class="fld" id="f-purpose">
        <option value="">Seçiniz</option>
        ${PURPOSES.map(p =>
          `<option value="${safe(p)}">${safe(p)}</option>`
        ).join("")}
      </select>
    `;

    if (heading) heading.after(purposeBox);

    $id("f-purpose").value = data.purpose || "";

    // Açıklama.
    const info = document.createElement("p");
    info.className = "turista-info";

    info.textContent =
      "Bilgileri kontrol edin. Her alanı değiştirebilirsiniz.";

    purposeBox.after(info);

    // Gidiş-dönüş alanları.
    const segment = card.querySelector(".seg");

    if (segment) {
      const returnBox = document.createElement("div");

      returnBox.id = "turista-return";

      returnBox.innerHTML = `
        <h4>↩ Dönüş yolculuğu</h4>

        <div class="two">
          <div style="flex:1;min-width:0">
            <label class="lb" for="f-return-date">
              Dönüş tarihi
            </label>

            <input
              class="fld"
              type="date"
              id="f-return-date"
            >
          </div>

          <div style="flex:1;min-width:0">
            <label class="lb" for="f-return-time">
              Dönüş saati
            </label>

            <input
              class="fld"
              type="time"
              id="f-return-time"
            >
          </div>
        </div>

        <p class="turista-info">
          Dönüş güzergâhı ters yönde planlanacaktır.
        </p>
      `;

      segment.after(returnBox);

      $id("f-return-date").value =
        data.returnDate || "";

      $id("f-return-time").value =
        data.returnTime || "";
    }

    const originalDate = $id("f-date");

    if (originalDate) {
      originalDate.addEventListener(
        "change",
        updateReturnFields
      );
    }

    updateReturnFields();
  };

  function updateReturnFields() {
    const box = $id("turista-return");
    if (!box) return;

    const enabled = way === "Gidiş-dönüş";

    box.hidden = !enabled;

    const date = $id("f-date");
    const returnDate = $id("f-return-date");

    if (date && returnDate) {
      returnDate.min =
        date.value || localDate(new Date());
    }
  }

  // Tek yön / Gidiş-dönüş butonları.
  setWay = function(button, selectedWay) {
    originalSetWay(button, selectedWay);
    updateReturnFields();
  };

  // Araç aramadan önce bütün tarihleri doğrula.
  go = function() {
    const purpose = $id("f-purpose");

    if (purpose && !purpose.value) {
      purpose.classList.add("bad");
      purpose.focus();
      return;
    }

    const from = $id("f-from");
    const to = $id("f-to");

    if (
      from &&
      to &&
      from.value.trim() &&
      low(from.value) === low(to.value)
    ) {
      to.classList.add("bad");
      to.focus();
      alert("Kalkış ve varış noktaları aynı olamaz.");
      return;
    }

    const departureDate = $id("f-date");
    const departureTime = $id("f-time");

    if (
      departureDate?.value &&
      departureDate.value < localDate(new Date())
    ) {
      departureDate.classList.add("bad");
      departureDate.focus();
      return;
    }

    let returnDateValue = "";
    let returnTimeValue = "";

    if (way === "Gidiş-dönüş") {
      const returnDate = $id("f-return-date");
      const returnTime = $id("f-return-time");

      if (!returnDate.value) {
        returnDate.classList.add("bad");
        returnDate.focus();
        return;
      }

      if (!returnTime.value) {
        returnTime.classList.add("bad");
        returnTime.focus();
        return;
      }

      if (
        returnDate.value < departureDate.value ||
        (
          returnDate.value === departureDate.value &&
          returnTime.value <= departureTime.value
        )
      ) {
        alert(
          "Dönüş tarihi ve saati, gidişten sonra olmalıdır."
        );
        return;
      }

      returnDateValue = returnDate.value;
      returnTimeValue = returnTime.value;
    }

    const selectedPurpose = purpose?.value || "";

    // Eski araç arama akışını çalıştır.
    originalGo();

    // Sadece başarılı bir arama başlatıldıysa ekle.
    if (mode === "wait") {
      T.purpose = selectedPurpose;

      T.returnISO = returnDateValue
        ? `${returnDateValue}T${returnTimeValue}`
        : null;

      T.returnDate = returnDateValue
        ? `${returnDateValue.split("-").reverse().join(".")} ${returnTimeValue}`
        : null;
    }
  };

  // Araç arama özetine dönüş bilgisini ekle.
  routeCard = function() {
    let html = originalRouteCard();

    const returnDate = $id("f-return-date")?.value;
    const returnTime = $id("f-return-time")?.value;

    if (
      way !== "Gidiş-dönüş" ||
      !returnDate ||
      !returnTime
    ) return html;

    const formatted =
      returnDate.split("-").reverse().join(".") +
      " " +
      returnTime;

    const returnBadge =
      `<span>↩ Dönüş: ${safe(formatted)}</span>`;

    html = html.replace(
      /(<\/div>\s*<\/div>\s*)$/,
      returnBadge + "$1"
    );

    return html;
  };

  // Konum önerileri: gerçek harita API'si değil.
  // İstanbul gibi genel girdiler için hazır öneriler.
  function showLocationSuggestions(input) {
    const old = document.querySelector(
      ".turista-location-suggestions"
    );

    if (old) old.remove();

    const value = low(input.value);

    if (value.length < 2) return;

    let suggestions = LOCATIONS.filter(place =>
      low(place).includes(value)
    );

    if (
      value.includes("istanbul") ||
      value === "ist"
    ) {
      suggestions = [
        "İstanbul Havalimanı",
        "Sabiha Gökçen Havalimanı",
        "Taksim",
        "Kadıköy",
        "Beşiktaş",
        "Sultanahmet"
      ];
    }

    if (!suggestions.length) return;

    const panel = document.createElement("div");
    panel.className =
      "turista-location-suggestions";

    suggestions.slice(0, 6).forEach(place => {
      const item = document.createElement("button");
      item.type = "button";
      item.textContent = "📍 " + place;

      item.onclick = () => {
        input.value = place;
        panel.remove();

        input.dispatchEvent(
          new Event("input", {bubbles:true})
        );

        input.focus();
      };

      panel.appendChild(item);
    });

    input.parentNode.insertBefore(
      panel,
      input.nextSibling
    );
  }

  // Sohbette konum önerilerini de göster.
  inp.addEventListener("input", () => {
    const stage = state.stage;

    const old = document.querySelector(
      ".turista-location-suggestions"
    );

    if (old) old.remove();

    if (
      mode === "conversation" &&
      (stage === "from" || stage === "to")
    ) {
      showLocationSuggestions(inp);
    }
  });

  // Sonradan açılan form inputlarına da öneri ekle.
  document.addEventListener("input", event => {
    const target = event.target;

    if (
      target.id === "f-from" ||
      target.id === "f-to"
    ) {
      showLocationSuggestions(target);
    }
  });

  // Tasarım: Apple benzeri sistem fontu ve sade kartlar.
  const style = document.createElement("style");

  style.textContent = `
    #chatv,
    #chatv button,
    #chatv input,
    #chatv select {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "SF Pro Text",
        "SF Pro Display",
        "Helvetica Neue",
        system-ui,
        sans-serif;
    }

    #chatv {
      background:
        radial-gradient(
          circle at 85% 5%,
          rgba(109,91,208,.08),
          transparent 44%
        ),
        #f8fafc;
    }

    #chat .m.bot {
      font-size:16px;
      font-weight:500;
      line-height:1.55;
      letter-spacing:-.025em;
      color:#0a2342;
    }

    #chat .m.me {
      border-radius:20px;
      padding:12px 16px;
      font-size:14px;
    }

    .turista-options {
      display:flex;
      flex-wrap:wrap;
      gap:9px;
      margin:4px 0 18px;
      max-width:680px;
    }

    .turista-option {
      border:1px solid #e4e8f0;
      background:#fff;
      color:#0a2342;
      border-radius:16px;
      padding:12px 16px;
      font-size:13px;
      font-weight:600;
      cursor:pointer;
      transition:.18s ease;
      box-shadow:0 3px 12px rgba(10,35,66,.035);
    }

    .turista-option:hover {
      border-color:#d4af37;
      background:#fffbeb;
      transform:translateY(-1px);
    }

    .turista-option:active {
      transform:scale(.98);
    }

    .turista-picker {
      background:#fff;
      border:1px solid #e2e8f0;
      padding:14px;
      border-radius:20px;
      max-width:320px;
    }

    .turista-picker .btn {
      border-radius:13px;
    }

    #chat .card {
      border:1px solid #e5eaf0;
      border-radius:24px;
      box-shadow:0 12px 36px rgba(10,35,66,.07);
      max-width:700px;
      width:100%;
      margin:6px auto 0;
      padding:18px;
    }

    #chat #tf > h4 {
      color:#0a2342;
      font-size:16px;
      letter-spacing:-.025em;
      text-transform:none;
      margin-bottom:14px;
    }

    #chat .fld {
      border-radius:14px;
      outline:none;
      transition:.2s ease;
    }

    #chat .fld:focus {
      border-color:#6d5bd0;
      box-shadow:0 0 0 3px rgba(109,91,208,.09);
    }

    .turista-info {
      font-size:12px;
      color:#64748b;
      line-height:1.5;
      margin:10px 0;
    }

    #turista-return {
      margin-top:14px;
      border:1px solid #eee7d6;
      background:#fffdf5;
      border-radius:18px;
      padding:15px;
      animation:in .25s ease;
    }

    #turista-return[hidden] {
      display:none !important;
    }

    #turista-return h4 {
      font-size:14px !important;
      color:#0a2342 !important;
      text-transform:none !important;
    }

    .turista-location-suggestions {
      display:flex;
      flex-direction:column;
      gap:3px;
      background:#fff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      padding:6px;
      margin-top:4px;
      max-height:260px;
      overflow-y:auto;
      box-shadow:0 8px 25px rgba(10,35,66,.06);
      width:100%;
      flex-shrink:0;
    }

    .turista-location-suggestions button {
      border:0;
      background:#fff;
      text-align:left;
      padding:11px 12px;
      font-size:13px;
      color:#0a2342;
      border-radius:10px;
      cursor:pointer;
    }

    .turista-location-suggestions button:hover {
      background:#f1f5f9;
    }

    #chat .lb {
      font-size:12px;
      font-weight:600;
    }

    @media(max-width:600px) {
      .turista-option {
        padding:11px 13px;
        font-size:12px;
      }

      #chat .card {
        border-radius:20px;
        padding:14px;
      }
    }
  `;

  document.head.appendChild(style);

  console.info(
    "Turista Asistan v2.1 yüklendi."
  );
})();
