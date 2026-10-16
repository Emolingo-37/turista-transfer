
/* Turista Transfer – conversational booking enhancement v2.
   Load AFTER the existing inline app.html script. No changes to auth. */
(() => {
  'use strict';
  const oldOpen = openChat, oldShow = showForm, oldGo = go, oldWay = setWay, oldRoute = routeCard;
  const state = {data:{}, stage:'', done:false, busy:false};
  const clean = v => String(v ?? '').trim();
  const lower = v => clean(v).toLocaleLowerCase('tr-TR');
  const norm = v => lower(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const purposeFrom = t => /iş|toplantı|müşteri|fuar|kongre/i.test(t)?'İş seyahati':/tatil|gezi|gezmek|tur|eğlen/i.test(t)?'Tatil / gezi':/havaalan|havaliman|uçuş|uçak/i.test(t)?'Havalimanı transferi':/aile|akraba|ziyaret|düğün/i.test(t)?'Aile / özel ziyaret':'';
  function mergeText(t) {
    const p = parse(t); const d = state.data;
    for (const k of ['from','to','pax','lug','date','time','way']) if (p[k] != null && p[k] !== '') d[k] = p[k];
    if(p.ex?.length) d.ex = [...new Set([...(d.ex||[]),...p.ex])];
    if (!d.purpose) d.purpose=purposeFrom(t);
  }
  function question(){
    const d=state.data;
    if (!d.purpose) return ['purpose','Öncelikle bu yolculuğun amacı nedir?', ['Tatil / gezi','İş seyahati','Havalimanı transferi','Aile / özel ziyaret']];
    if (!d.to) return ['to','Nereye gitmek istiyorsunuz?',[]];
    if (!d.from) return ['from',`${esc(d.to)} için nereden yola çıkacaksınız?`,[]];
    if (!d.pax) return ['pax','Kaç kişi seyahat edeceksiniz?', ['1 kişi','2 kişi','4 kişi','8 kişi','12 kişi']];
    if (!d.date) return ['date','Gidiş hangi tarihte olacak? Tarihi GG.AA.YYYY şeklinde yazabilirsiniz.', ['Bugün','Yarın']];
    if (!d.time) return ['time','Gidiş saatiniz yaklaşık kaç?', ['08:00','12:00','18:00','Henüz belli değil']];
    if (!d.way) return ['way','Tek yön mü olacak, yoksa dönüşünüz için de araç ayarlayalım mı?', ['Tek yön','Gidiş-dönüş']];
    if (d.way==='Gidiş-dönüş' && !d.returnDate) return ['returnDate','Dönüşünüz hangi tarihte?',[]];
    if (d.way==='Gidiş-dönüş' && !d.returnTime) return ['returnTime','Dönüşte saat kaçta yola çıkmak istersiniz?', ['10:00','14:00','18:00','Henüz belli değil']];
    if (d.lug==null) return ['lug','Kaç bavulunuz olacak?', ['0 bavul','1 bavul','2 bavul','4 bavul']];
    if (!d.extrasConfirmed) return ['extras','Son bir şey: özel bir ihtiyacınız var mı?', ['Yok, teşekkürler','Çocuk koltuğu','İsimle karşılama','Tekerlekli sandalye']];
    return null;
  }
  function ask(){
    const q=question();
    if(!q){ state.done=true; mode='form'; bot('Seyahatinizi anladım. ✨ Aşağıdaki özeti sizin için hazırladım. Araç aramadan önce istediğiniz bilgiyi değiştirebilirsiniz.',null,()=>showForm({...state.data})); return; }
    state.stage=q[0]; state.busy=true;
    bot(q[1],q[2],()=>{state.busy=false;});
  }
  function toISO(v){
    const s=clean(v), now=new Date();
    if(/yarın/i.test(s)){now.setDate(now.getDate()+1);return iso(now)}
    if(/bugün/i.test(s))return iso(now);
    let m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if(m){const y=+m[3],mo=+m[2],day=+m[1],dt=new Date(y,mo-1,day);return dt.getFullYear()===y&&dt.getMonth()===mo-1&&dt.getDate()===day?`${y}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`:''}
    if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
    return '';
  }
  function toTime(v){const m=clean(v).match(/(?:^|\s)([01]?\d|2[0-3])[:.]([0-5]\d)(?:$|\s)/);return m?m[1].padStart(2,'0')+':'+m[2]:'';}
  openChat=function(to,from,text){
    oldOpen();
    // Original greeting is deferred; clear and replace it with conversational prompts.
    chat.innerHTML=''; state.data={};state.stage='';state.done=false;state.busy=false;mode='conversation';
    if(to)state.data.to=clean(to); if(from)state.data.from=clean(from);
    if(text){mergeText(text);add(esc(text),'m me')}
    bot('Merhaba, ben Turista Asistan. ✨ Transferinizi birlikte planlayalım. Size birkaç kısa soru soracağım; en sonunda tüm ayrıntıları kendiniz düzenleyebileceksiniz.',null,ask);
  };
  submit=function(value){
    const v=clean(value || inp.value); if(!v)return; inp.value='';
    if(mode==='form'){bot('Transfer özetindeki alanları doğrudan düzenleyebilirsiniz.');return}
    if(mode!=='conversation')return;
    if(state.busy)return;
    add(esc(v),'m me');const d=state.data;const s=state.stage;
    if(s==='purpose'){d.purpose=v;mergeText(v)}
    else if(s==='from'||s==='to'){d[s]=v}
    else if(s==='pax'||s==='lug'){
      const n=Number((v.match(/\d+/)||[])[0]);if(!Number.isInteger(n)||(s==='pax'?n<1:n<0)||n>60){bot('Lütfen geçerli bir sayı belirtin.',null,ask);return}d[s]=n;
    }
    else if(s==='date'||s==='returnDate'){
      const dt=toISO(v);if(!dt){bot('Tarihi anlayamadım. Örneğin 25.10.2026 yazabilirsiniz.',null,ask);return}
      if(dt<iso(new Date())||(s==='returnDate'&&d.date&&dt<d.date)){bot('Dönüş tarihi gidişten önce olamaz; lütfen geçerli bir tarih yazın.',null,ask);return}
      d[s]=dt;
    }
    else if(s==='time'||s==='returnTime'){
      const t=toTime(v);if(!t&& !/belli değil|kararsız/i.test(v)){bot('Saati 09:30 gibi yazabilirsiniz.',null,ask);return}d[s]=t||'12:00';
    }
    else if(s==='way'){
      if(/dönüş|gidis.donus/i.test(norm(v)))d.way='Gidiş-dönüş';
      else if(/tek|gidis/i.test(norm(v)))d.way='Tek yön';
      else {bot('Tek yön veya Gidiş-dönüş seçeneklerinden birini seçin.',null,ask);return}
    }
    else if(s==='extras'){
      d.ex=d.ex||[];if(!/yok|hayır|istemiyorum/i.test(v)){let x=EX.find(e=>lower(v).includes(lower(e[1])));if(x&&!d.ex.includes(x[1]))d.ex.push(x[1]);else if(!x){bot('Bu isteği transfer notunuza eklemek için geliştirme gerekiyor. Şimdilik formdaki seçeneklerden ilerleyelim.',null,ask);return}}
      d.extrasConfirmed=true;
    }
    else mergeText(v);
    ask();
  };
  // Keep the original form and add purpose + return fields without rewriting it.
  showForm=function(s){
    oldShow(s);const card=$('tf');if(!card)return;
    const head=card.querySelector('h4');
    if(head){head.textContent='Seyahat özeti';head.insertAdjacentHTML('afterend','<p class="tf-help">Tüm bilgileri kontrol edebilir ve değiştirebilirsiniz.</p>')}
    const purpose=document.createElement('div');purpose.innerHTML='<label class="lb" for="f-purpose">Yolculuk amacı</label><select class="fld" id="f-purpose"><option value="">Seçiniz</option><option>Tatil / gezi</option><option>İş seyahati</option><option>Havalimanı transferi</option><option>Aile / özel ziyaret</option><option>Diğer</option></select>';
    head?.after(purpose); $('f-purpose').value=state.data.purpose||'';
    const segment=card.querySelector('.seg');
    if(segment){const box=document.createElement('div');box.id='return-fields';box.className='return-fields';box.innerHTML='<div class="return-title">↩ Dönüş yolculuğu</div><div class="two"><div style="flex:1"><label class="lb" for="f-return-date">Dönüş tarihi</label><input class="fld" id="f-return-date" type="date" min="'+iso(new Date())+'"></div><div style="flex:1"><label class="lb" for="f-return-time">Dönüş saati</label><input class="fld" id="f-return-time" type="time"></div></div><p class="tf-help">Dönüş rotası ters yönde planlanacaktır.</p>';segment.after(box);$('f-return-date').value=state.data.returnDate||'';$('f-return-time').value=state.data.returnTime==='12:00'?'':state.data.returnTime||''}
    toggleReturn();
  };
  function toggleReturn(){const r=$('return-fields');if(r)r.hidden=way!=='Gidiş-dönüş';const d=$('f-date'),rd=$('f-return-date');if(d&&rd)rd.min=d.value||iso(new Date());}
  setWay=function(b,w){oldWay(b,w);toggleReturn()};
  document.addEventListener('change',e=>{if(e.target?.id==='f-date')toggleReturn()});
  go=function(){
    const purpose=$('f-purpose');if(purpose&&!purpose.value){purpose.classList.add('bad');purpose.focus();return}
    if(way==='Gidiş-dönüş'){
      const d=$('f-date'),t=$('f-time'),rd=$('f-return-date'),rt=$('f-return-time');
      for(const el of [rd,rt])el.classList.toggle('bad',!el.value);
      if(!rd.value||!rt.value){(rd.value?rt:rd).focus();return}
      if(rd.value<d.value||(rd.value===d.value&&rt.value<=t.value)){
        rd.classList.add('bad');rt.classList.add('bad');alert('Dönüş, gidişten sonraki bir tarih ve saatte olmalıdır.');return;
      }
    }
    oldGo();
    if(mode==='wait'){
      T.purpose=purpose?.value||'';
      T.returnISO=way==='Gidiş-dönüş'?$('f-return-date').value+'T'+$('f-return-time').value:null;
      T.returnDate=way==='Gidiş-dönüş'?$('f-return-date').value.split('-').reverse().join('.')+' '+$('f-return-time').value:null;
      // Note: booking DB currently stores only outbound time; see integration notes.
    }
  };
  routeCard=function(){let html=oldRoute();const rd=$('f-return-date'),rt=$('f-return-time');if(way==='Gidiş-dönüş'&&rd?.value&&rt?.value){const display=rd.value.split('-').reverse().join('.')+' '+rt.value;html=html.replace(/<\/div>$/, '<div class="rc"><span>↩ Dönüş: '+esc(display)+'</span></div></div>')}return html;};
  const style=document.createElement('style');style.textContent=`
  #chatv,#chatv input,#chatv button,#chatv select{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif}
  #chatv{background:radial-gradient(circle at 88% 10%,rgba(109,91,208,.08),transparent 44%),#f8fafc}
  #chat .m.bot{font-weight:500;letter-spacing:-.025em;line-height:1.55;font-size:16px;color:#142b49}
  #chat .card{border:1px solid #e7eaf0;border-radius:24px;box-shadow:0 14px 36px rgba(10,35,66,.08);max-width:700px;width:100%;margin:4px auto 0;padding:18px}
  #chat .card h4{color:#0a2342;font-size:13px;letter-spacing:.02em;text-transform:none}
  #chat .fld{outline:none;transition:border-color .2s,box-shadow .2s}
  #chat .fld:focus{border-color:#6d5bd0;box-shadow:0 0 0 3px rgba(109,91,208,.10)}
  #chat .return-fields{margin-top:14px;padding:14px;border:1px solid #ece7d3;background:#fffdf5;border-radius:17px;animation:in .2s ease-out}
  #chat .return-fields[hidden]{display:none!important}
  #chat .return-title{font-size:14px;font-weight:750;letter-spacing:-.02em;color:#0a2342}
  #chat .tf-help{color:#64748b;font-size:12px;line-height:1.5;margin:7px 0 5px}
  #chat .chips .chip{transition:transform .15s,background .15s}#chat .chips .chip:active{transform:scale(.97)}
  #chat .card .lb{font-weight:600;font-size:12px}
  `;document.head.appendChild(style);
})();
