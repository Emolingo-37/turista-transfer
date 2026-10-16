
/*
 TURISTA TRANSFER — ASİSTAN V3
 Sohbet sade, adres düzenleme son formda.
 Mevcut giriş ve rezervasyon sistemi korunur.
*/

(() => {
  "use strict";

  const oldForm = showForm;
  const oldWay = setWay;
  const oldGo = go;

  const get = id => document.getElementById(id);
  const clean = v => String(v ?? "").trim();
  const lower = v => clean(v).toLocaleLowerCase("tr-TR");

  const state = {
    data: {},
    stage: "",
    busy: false,
    session: 0
  };

  const purposes = [
    "Tatil / gezi",
    "İş seyahati",
    "Havalimanı transferi",
    "Aile / özel ziyaret",
    "Diğer"
  ];

  const questions = [
    {
      id: "purpose",
      text: "Öncelikle yolculuğunuzun amacı nedir?",
      options: purposes
    },
    {
      id: "from",
      text: "Anladım. Peki nereden yola çıkacaksınız?",
      options: [],
      hint: "İl, ilçe veya kalkış noktanızı yazın."
    },
    {
      id: "to",
      text: "Sizi nereye götürmemizi istersiniz?",
      options: [],
      hint: "Gideceğiniz konumu yazın."
    },
    {
      id: "pax",
      text: "Kaç kişi seyahat edeceksiniz?",
      options: [
        "1 kişi", "2 kişi", "4 kişi",
        "8 kişi", "12 kişi", "16 kişi"
      ]
    },
    {
      id: "date",
      text: "Gidişiniz hangi tarihte olacak?",
      options: ["Bugün", "Yarın", "Tarih seç"]
    },
    {
      id: "time",
      text: "Saat kaçta yola çıkmak istersiniz?",
      options: [
        "08:00", "10:00", "12:00",
        "15:00", "18:00", "Saat seç"
      ]
    },
    {
      id: "way",
      text: "Yolculuğunuz tek yön mü, gidiş-dönüş mü olacak?",
      options: ["Tek yön", "Gidiş-dönüş"]
    },
    {
      id: "returnDate",
      text: "Dönüş yolculuğunuz hangi tarihte olacak?",
      options: ["Yarın", "Tarih seç"]
    },
    {
      id: "returnTime",
      text: "Dönüşte saat kaçta yola çıkacaksınız?",
      options: [
        "09:00", "12:00", "15:00",
        "18:00", "21:00", "Saat seç"
      ]
    },
    {
      id: "lug",
      text: "Yanınızda toplam kaç bavul olacak?",
      options: [
        "0 bavul", "1 bavul", "2 bavul",
        "4 bavul", "8 bavul", "12 bavul"
      ]
    },
    {
      id: "extras",
      text: "Son olarak özel bir isteğiniz var mı?",
      options: [
        "Yok, teşekkürler",
        "Çocuk koltuğu",
        "İsimle karşılama",
        "Tekerlekli sandalye"
      ]
    }
  ];

  function today() {
    return iso(new Date());
  }

  function parseDate(v) {
    if (lower(v) === "bugün") return today();

    if (lower(v) === "yarın") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return iso(d);
    }

    const s = clean(v);

    const match = s.match(
      /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/
    );

    let result = s;

    if (match) {
      result =
        match[3] + "-" +
        match[2].padStart(2, "0") + "-" +
        match[1].padStart(2, "0");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) {
      return "";
    }

    const [year, month, day] = result.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) return "";

    return result;
  }

  function parseTime(v) {
    const match = clean(v).match(
      /^([01]?\d|2[0-3])[:.]([0-5]\d)$/
    );

    return match
      ? match[1].padStart(2, "0") + ":" + match[2]
      : "";
  }

  function initialDetails(text) {
    const d = state.data;
    const t = clean(text);

    const people = t.match(
      /(\d+)\s*(?:kişi|kişilik|yolcu)/i
    );

    if (people) d.pax = Number(people[1]);

    const bags = t.match(
      /(\d+)\s*(?:bavul|valiz)/i
    );

    if (bags) d.lug = Number(bags[1]);

    if (/gidiş.dönüş/i.test(t)) {
      d.way = "Gidiş-dönüş";
    }

    // Yalnızca konumu açık ve güvenilir biçimde
    // tespit edebiliyorsak önceden dolduruyoruz.
    const locations = [
      "İstanbul Havalimanı",
      "Sabiha Gökçen Havalimanı",
      "Sapanca",
      "Bursa",
      "Taksim",
      "Kadıköy",
      "Kapadokya",
      "Antalya"
    ];

    const matches = locations.filter(place =>
      lower(t).includes(lower(place))
    );

    if (matches.length === 1) {
      // Tek konum varsa kalkış olduğunu varsayma.
      if (!/havalimanından|havaalanından/i.test(t)) {
        d.to = matches[0];
      }
    }

    if (/iş seyahati|iş toplantısı|fuar/i.test(t)) {
      d.purpose = "İş seyahati";
    } else if (/tatil|gezi/i.test(t)) {
      d.purpose = "Tatil / gezi";
    }

    const time = t.match(
      /\b([01]?\d|2[0-3]):([0-5]\d)\b/
    );

    if (time) {
      d.time = time[1].padStart(2, "0") + ":" + time[2];
    }
  }

  function nextQuestion() {
    const d = state.data;

    return questions.find(q => {
      if (
        ["returnDate", "returnTime"].includes(q.id) &&
        d.way !== "Gidiş-dönüş"
      ) return false;

      if (q.id === "lug") return d.lug == null;

      if (q.id === "extras") {
        return !d.extrasConfirmed;
      }

      return !d[q.id];
    });
  }

  function clearOptions() {
    chat.querySelectorAll(
      ".turista-choices, .turista-date-picker"
    ).forEach(el => el.remove());
  }

  function message(text, callback) {
    const session = state.session;
    state.busy = true;

    bot(esc(text), null, () => {
      if (session !== state.session) return;

      state.busy = false;

      if (callback) callback();
    });
  }

  function showChoices(q) {
    if (!q.options.length) {
      inp.placeholder = q.hint || "Cevabınızı yazın...";
      inp.focus();
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "turista-choices";

    q.options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option;

      button.onclick = () => {
        if (
          state.busy ||
          state.stage !== q.id ||
          mode !== "conversation"
        ) return;

        if (option === "Tarih seç") {
          showPicker("date");
          return;
        }

        if (option === "Saat seç") {
          showPicker("time");
          return;
        }

        submit(option);
      };

      wrap.appendChild(button);
    });

    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  }

  function showPicker(type) {
    clearOptions();

    const box = document.createElement("div");
    box.className = "turista-date-picker";

    const input = document.createElement("input");
    input.type = type;
    input.className = "fld";

    if (type === "date") {
      input.min =
        state.stage === "returnDate" && state.data.date
          ? state.data.date
          : today();
    }

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Devam et";
    button.className = "btn";

    button.onclick = () => {
      if (input.value) submit(input.value);
    };

    box.append(input, button);
    chat.appendChild(box);

    input.focus();
    chat.scrollTop = chat.scrollHeight;
  }

  function ask() {
    clearOptions();

    const q = nextQuestion();

    if (!q) {
      finish();
      return;
    }

    state.stage = q.id;

    message(q.text, () => showChoices(q));
  }

  function error(text) {
    const q = questions.find(x => x.id === state.stage);

    message(text, () => {
      if (q) showChoices(q);
    });
  }

  function save(stage, value) {
    const d = state.data;
    const v = clean(value);

    if (stage === "purpose") {
      d.purpose = v;
      return true;
    }

    if (stage === "from" || stage === "to") {
      if (v.length < 2) {
        error("Lütfen geçerli bir konum yazın.");
        return false;
      }

      if (
        stage === "to" &&
        lower(d.from) === lower(v)
      ) {
        error("Kalkış ve varış noktaları aynı olamaz.");
        return false;
      }

      d[stage] = v;
      return true;
    }

    if (stage === "pax" || stage === "lug") {
      const match = v.match(/\d+/);
      const number = match ? Number(match[0]) : NaN;

      const min = stage === "pax" ? 1 : 0;

      if (
        !Number.isInteger(number) ||
        number < min ||
        number > 60
      ) {
        error("Lütfen geçerli bir sayı girin.");
        return false;
      }

      d[stage] = number;
      return true;
    }

    if (stage === "date" || stage === "returnDate") {
      const date = parseDate(v);

      if (!date || date < today()) {
        error("Lütfen geçerli bir tarih seçin.");
        return false;
      }

      if (
        stage === "returnDate" &&
        d.date &&
        date < d.date
      ) {
        error("Dönüş tarihi gidişten önce olamaz.");
        return false;
      }

      d[stage] = date;
      return true;
    }

    if (stage === "time" || stage === "returnTime") {
      const time = parseTime(v);

      if (!time) {
        error("Lütfen 09:30 gibi bir saat girin.");
        return false;
      }

      if (
        stage === "returnTime" &&
        d.date === d.returnDate &&
        time <= d.time
      ) {
        error("Dönüş saati, gidiş saatinden sonra olmalı.");
        return false;
      }

      d[stage] = time;
      return true;
    }

    if (stage === "way") {
      if (/gidiş.dönüş/i.test(v)) {
        d.way = "Gidiş-dönüş";
      } else if (/tek yön/i.test(v)) {
        d.way = "Tek yön";
        delete d.returnDate;
        delete d.returnTime;
      } else {
        error("Tek yön veya gidiş-dönüş seçin.");
        return false;
      }

      return true;
    }

    if (stage === "extras") {
      const matched = EX.find(
        item => lower(item[1]) === lower(v)
      );

      if (
        !matched &&
        !/yok|hayır|teşekkür/i.test(v)
      ) {
        error("Lütfen seçeneklerden birini seçin.");
        return false;
      }

      d.ex = matched ? [matched[1]] : [];
      d.extrasConfirmed = true;
      return true;
    }

    return false;
  }

  // SOHBET BAŞLANGICI
  openChat = function(to, from, text) {
    state.session++;
    state.data = {};
    state.stage = "";
    state.busy = true;

    T = {};
    vi = 0;
    notify = false;
    pax = 2;
    lug = 2;
    way = "Tek yön";
    extras = new Set();

    chat.innerHTML = "";
    inp.value = "";
    inp.placeholder = "Cevabınızı yazın...";

    mode = "conversation";

    step(1);
    get("chatv").classList.add("on");

    if (to) state.data.to = clean(to);
    if (from) state.data.from = clean(from);

    if (text) {
      initialDetails(text);
      add(esc(text), "m me");
    }

    message(
      "Merhaba! ✨ Ben Turista Asistan. Yolculuğunuzu birlikte planlayalım. Sonunda bütün bilgileri kendiniz düzenleyebileceksiniz.",
      ask
    );
  };

  // CEVAPLARI DOĞRU SORUYA KAYDET
  submit = function(value) {
    const v = clean(value || inp.value);
    if (!v) return;

    if (mode === "form") {
      inp.value = "";
      return;
    }

    if (
      mode !== "conversation" ||
      state.busy ||
      !state.stage
    ) return;

    const stage = state.stage;

    inp.value = "";

    if (!save(stage, v)) return;

    clearOptions();
    add(esc(v), "m me");

    state.stage = "";
    ask();
  };

  function finish() {
    state.stage = "";
    mode = "form";

    message(
      "Seyahat özetinizi hazırladım. ✨ Nereden ve Nereye alanları dahil bütün bilgileri kontrol edebilir, yanlış olanları düzeltebilirsiniz.",
      () => showForm({...state.data})
    );
  }

  // SON DÜZENLENEBİLİR FORM
  showForm = function(data) {
    oldForm(data);

    const form = get("tf");
    if (!form) return;

    const heading = form.querySelector("h4");

    if (heading) {
      heading.textContent = "Seyahat Özeti";
    }

    const purposeBox = document.createElement("div");
    purposeBox.className = "turista-purpose";

    const label = document.createElement("label");
    label.className = "lb";
    label.textContent = "Yolculuk amacı";

    const select = document.createElement("select");
    select.className = "fld";
    select.id = "f-purpose";

    const available = purposes.includes(data.purpose)
      ? purposes
      : [...purposes, data.purpose].filter(Boolean);

    available.forEach(p => {
      const option = document.createElement("option");
      option.value = p;
      option.textContent = p;
      select.appendChild(option);
    });

    select.value = data.purpose || purposes[0];

    purposeBox.append(label, select);

    if (heading) heading.after(purposeBox);

    const description = document.createElement("p");
    description.className = "turista-form-description";

    description.textContent =
      "Bilgilerinizi kontrol edin. Adresleri ve diğer detayları değiştirebilirsiniz.";

    purposeBox.after(description);

    // Sohbette hiçbir harita menüsü yok.
    // Adres arama yalnızca bu formda çalışır.
    ["f-from", "f-to"].forEach(id => {
      const input = get(id);
      if (!input) return;

      input.removeAttribute("list");
      input.autocomplete = "off";

      input.placeholder =
        id === "f-from"
          ? "Kalkış adresini yazın"
          : "Varış adresini yazın";

      const hint = document.createElement("p");
      hint.className = "turista-address-hint";
      hint.textContent =
        "İl, ilçe, otel, havalimanı veya açık adres";

      input.insertAdjacentElement("afterend", hint);

      attachGooglePlaces(input);
    });

    const segment = form.querySelector(".seg");

    if (segment) {
      const returnBox = document.createElement("div");

      returnBox.id = "turista-return";
      returnBox.innerHTML = `
        <h4>Dönüş Yolculuğu</h4>
        <div class="two">
          <div style="flex:1;min-width:0">
            <label class="lb">Dönüş tarihi</label>
            <input
              id="f-return-date"
              class="fld"
              type="date"
            >
          </div>
          <div style="flex:1;min-width:0">
            <label class="lb">Dönüş saati</label>
            <input
              id="f-return-time"
              class="fld"
              type="time"
            >
          </div>
        </div>
      `;

      segment.after(returnBox);

      get("f-return-date").value = data.returnDate || "";
      get("f-return-time").value = data.returnTime || "";
    }

    get("f-date")?.addEventListener(
      "change",
      updateReturn
    );

    updateReturn();
  };

  function updateReturn() {
    const box = get("turista-return");
    if (!box) return;

    box.hidden = way !== "Gidiş-dönüş";

    const date = get("f-date");
    const returnDate = get("f-return-date");

    if (date && returnDate) {
      returnDate.min = date.value || today();
    }
  }

  setWay = function(button, selected) {
    oldWay(button, selected);
    updateReturn();
  };

  go = function() {
    const from = get("f-from");
    const to = get("f-to");

    if (
      from?.value.trim() &&
      lower(from.value) === lower(to?.value)
    ) {
      alert("Kalkış ve varış adresleri aynı olamaz.");
      to.focus();
      return;
    }

    const date = get("f-date");
    const time = get("f-time");

    if (date?.value && date.value < today()) {
      alert("Gidiş tarihi geçmişte olamaz.");
      date.focus();
      return;
    }

    const returnDate = get("f-return-date");
    const returnTime = get("f-return-time");

    if (way === "Gidiş-dönüş") {
      if (!returnDate?.value || !returnTime?.value) {
        alert("Dönüş tarihi ve saatini doldurun.");
        return;
      }

      if (
        returnDate.value < date.value ||
        (
          returnDate.value === date.value &&
          returnTime.value <= time.value
        )
      ) {
        alert(
          "Dönüş tarihi ve saati gidişten sonra olmalıdır."
        );
        return;
      }
    }

    const purpose = get("f-purpose")?.value || "";

    const returnInfo =
      way === "Gidiş-dönüş"
        ? {
            iso: returnDate.value + "T" + returnTime.value,
            text:
              returnDate.value.split("-").reverse().join(".") +
              " " + returnTime.value
          }
        : null;

    oldGo();

    if (mode === "wait") {
      T.purpose = purpose;
      T.returnISO = returnInfo?.iso || null;
      T.returnDate = returnInfo?.text || null;

      if (returnInfo) {
        const card = chat.querySelector(".rt .rc");

        if (card) {
          const detail = document.createElement("span");
          detail.textContent = "↩ " + returnInfo.text;
          card.appendChild(detail);
        }
      }
    }
  };

  /*
   GOOGLE MAPS PLACES
   Yalnızca seyahat özeti formuna bağlanır.

   Google Maps API etkinleştirilmediği sürece
   manuel adres yazma çalışmaya devam eder.
  */

  function attachGooglePlaces(input) {
    if (!window.google?.maps?.places?.Autocomplete) {
      return;
    }

    const autocomplete =
      new google.maps.places.Autocomplete(input, {
        componentRestrictions: {country: "tr"},
        fields: [
          "formatted_address",
          "name",
          "geometry",
          "place_id"
        ],
        types: ["geocode", "establishment"]
      });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place?.formatted_address) return;

      input.value = place.formatted_address;
      input.dataset.placeId = place.place_id || "";

      input.dispatchEvent(
        new Event("change", {bubbles: true})
      );
    });
  }

  // SADE VE ESTETİK TASARIM
  const style = document.createElement("style");

  style.textContent = `
    #chatv,
    #chatv input,
    #chatv button,
    #chatv select {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "SF Pro Text",
        "Helvetica Neue",
        system-ui,
        sans-serif;
    }

    #chatv {
      background:
        radial-gradient(
          circle at 85% 0%,
          rgba(109,91,208,.07),
          transparent 45%
        ), #f8fafc;
    }

    #chat .m.bot {
      color:#0a2342;
      font-size:15px;
      line-height:1.55;
      letter-spacing:-.02em;
      font-weight:500;
    }

    .turista-choices {
      display:flex;
      flex-wrap:wrap;
      gap:9px;
      max-width:680px;
      margin-bottom:14px;
      flex-shrink:0;
    }

    .turista-choices button {
      border:1px solid #e2e8f0;
      background:#fff;
      color:#0a2342;
      border-radius:14px;
      padding:11px 15px;
      font-size:13px;
      font-weight:600;
      cursor:pointer;
      transition:background .2s,border-color .2s;
    }

    .turista-choices button:hover {
      background:#fffbeb;
      border-color:#d4af37;
    }

    .turista-date-picker {
      display:flex;
      align-items:center;
      gap:10px;
      max-width:400px;
      padding:12px;
      background:#fff;
      border:1px solid #e2e8f0;
      border-radius:16px;
    }

    .turista-date-picker input {
      min-width:0;
      flex:1;
    }

    .turista-date-picker button {
      width:auto;
      white-space:nowrap;
    }

    #chat .card {
      background:#fff;
      border:1px solid #e2e8f0;
      border-radius:24px;
      padding:18px;
      box-shadow:0 12px 32px rgba(10,35,66,.06);
    }

    #chat #tf > h4 {
      font-size:17px;
      font-weight:750;
      color:#0a2342;
      letter-spacing:-.025em;
      text-transform:none;
    }

    .turista-form-description {
      margin:12px 0;
      color:#64748b;
      font-size:12px;
      line-height:1.5;
    }

    .turista-address-hint {
      margin:5px 0 8px;
      font-size:11px;
      color:#94a3b8;
    }

    #chat .fld {
      border-radius:13px;
      font-size:14px;
      outline:none;
    }

    #chat .fld:focus {
      border-color:#d4af37;
      box-shadow:0 0 0 3px rgba(212,175,55,.12);
    }

    #turista-return {
      margin-top:14px;
      padding:16px;
      background:#fffcf2;
      border:1px solid #eee6cf;
      border-radius:18px;
    }

    #turista-return[hidden] {
      display:none!important;
    }

    #turista-return h4 {
      font-size:14px;
      text-transform:none;
      color:#0a2342;
    }

    #chatv footer {
      flex:none;
      min-width:0;
    }

    #chatv footer input {
      flex:1;
      min-width:0;
      width:auto;
      height:46px;
      border-radius:24px;
    }

    #chatv footer button {
      flex:none;
      width:46px;
      height:46px;
      border-radius:50%;
    }

    @media(max-width:600px) {
      .turista-choices button {
        font-size:12px;
        padding:10px 13px;
      }

      #chat .card {
        padding:14px;
        border-radius:20px;
      }
    }
  `;

  document.head.appendChild(style);

  console.info("Turista Asistan V3 hazır.");
})();
