(()=>{"use strict";
const KEY="turista_live_demo_v1",RATE=.12;
const store=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}};
const save=data=>{localStorage.setItem(KEY,JSON.stringify(data.slice(0,35)));window.dispatchEvent(new Event("turista-demo-sync"))};
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>Number(n||0).toLocaleString("tr-TR")+" ₺";
const refgen=()=>Math.random().toString(36).slice(2,10).toUpperCase();
let poll=null,cleanup=null;
const original=window.search;
window.search=function(){
 if(typeof T==="undefined"||!T.from||!T.to){if(typeof original==="function")original();return}
 if(cleanup)cleanup();
 const ref=refgen(),data={id:ref,from:T.from,to:T.to,when:T.date,pax:Number(T.n)||1,luggage:Number(lug)||0,category:T.n<=8?"Vito / Caravelle":T.n<=16?"Sprinter":"Midibüs",status:"new",created:Date.now(),offers:[]};
 save([data,...store()]);step(2);
 const root=add('<h4 class="td-title">Firmalardan araç aranıyor</h4><p class="td-caption" style="font-size:13px;color:#64748b">Transfer talebiniz alındı. Teklif bekleniyor.</p><div class="tg"><div>🔔 <b>Araç bulununca bana bildirim gönder</b><br><small>Bildirimler için izin verebilirsiniz</small></div><button type="button" class="sw td-notify" aria-label="Bildirimleri aç"></button></div><div class="td-stage"></div><div style="font-size:11px;color:#64748b;margin-top:12px">Önizleme: Gerçek ödeme veya SMS yapılmaz.</div>','card');
 const title=root.querySelector(".td-title"),caption=root.querySelector(".td-caption"),stage=root.querySelector(".td-stage");
 let notify=false,version="",lastOffers=0;
 const update=fn=>{const list=store(),item=list.find(x=>x.id===ref);if(!item)return false;const changed=fn(item);if(changed===false)return false;save(list);render(true);return true};
 const notice=message=>{if(notify&&"Notification"in window&&Notification.permission==="granted"&&!document.hasFocus()){try{new Notification("Turista Transfer",{body:message})}catch{}}};
 function render(force=false){
  if(!root.isConnected)return;
  const item=store().find(x=>x.id===ref);if(!item)return;
  const fingerprint=JSON.stringify(item);
  if(!force&&fingerprint===version)return;
  version=fingerprint;
  const state=item.status;
  const paid=["confirmed","driver_assigned","completed"].includes(state);
  const chosen=state!=="new"&&item.selected;
  if(state!=="new")step(3);
  title.textContent=state==="cancelled"?"Talep iptal edildi":state==="completed"?"Transfer tamamlandı":paid?"Rezervasyon alındı":state==="pending_payment"?(item.passengerDetailsReady?"Ödeme":"Yolcu bilgileri"):"Firmalardan araç aranıyor";
  caption.textContent=state==="cancelled"?"Yeni bir talep oluşturabilirsiniz.":paid?"✓ Rezervasyonunuz onaylandı. Şoför bilgileri SMS olarak gönderilecektir.":state==="pending_payment"?"Rezervasyonunuzu tamamlamak için aşağıdaki adımları izleyin.":(item.offers||[]).length?"Teklifler hazır. Uygun aracı seçebilirsiniz.":"Uygun araç teklifleri bekleniyor.";
  if(state==="cancelled"){stage.innerHTML="";return}
  const offers=chosen?[item.selected]:(item.offers||[]);
  const parts=offers.map((v,i)=>{
    const net=Number(v.price),fee=Math.round(net*RATE);
    return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:15px;padding:13px;margin-top:10px"><b>'+escape(v.company)+'</b><p style="font-size:12px;color:#64748b">'+escape(v.vehicle)+'</p><div class="row"><span>Firma fiyatı</span><b>'+money(net)+'</b></div><div class="row"><span>Turista hizmet bedeli (%12)</span><b>'+money(fee)+'</b></div><div class="row"><span>Toplam</span><b>'+money(net+fee)+'</b></div>'+(state==="new"?'<button type="button" class="btn" data-action="offer" data-index="'+i+'">Teklifi kabul et</button>':'<p style="font-size:12px;color:#15803d;font-weight:700;margin-top:10px">✓ Teklif seçildi</p>')+'</div>';
  });
  if(state==="pending_payment"&&!item.passengerDetailsReady){
    const fields=Array.from({length:Math.min(item.pax,40)},(_,i)=>'<div style="margin:12px 0"><label class="lb">'+(i+1)+'. Yolcu</label><input class="fld td-name" placeholder="Ad Soyad" autocomplete="off"><input class="fld" placeholder="T.C. Kimlik No (önizlemede kullanılmaz)" disabled style="background:#f1f5f9;margin-top:6px"></div>').join("");
    parts.push('<div class="card" style="margin-top:12px"><h4>Yolcu bilgileri</h4><p style="font-size:12px;color:#64748b">Gerçek kimlik bilgisi girmeyin.</p>'+fields+'<button type="button" class="btn" data-action="next">Ödemeye geç</button></div>');
  }else if(state==="pending_payment"){
    parts.push('<div class="card" style="margin-top:12px"><h4>Ödeme</h4><p style="font-size:13px;color:#64748b">Kart bilgisi gerekli değildir. Ücret tahsil edilmeyecek.</p><button type="button" class="btn" data-action="pay">Öde ve rezervasyonu tamamla</button></div>');
  }else if(paid){
    parts.push('<div class="ok"><svg viewBox="0 0 52 52" aria-hidden="true"><circle class="c" cx="26" cy="26" r="24"/><path class="k" d="M14 27l8 8 16-17"/></svg><h3>Rezervasyon Alındı</h3><p>Şoför bilgileri SMS olarak gönderilecektir.</p><small>TT-'+escape(ref)+'</small></div>');
    if(item.driver)parts.push('<div class="shield">Şoför: '+escape(item.driver.name)+' · Plaka: '+escape(item.driver.plate)+'</div>');
  }else parts.push('<button type="button" class="btn alt" data-action="cancel">Talebi iptal et</button>');
  stage.innerHTML=parts.join("");
  if((item.offers||[]).length>lastOffers){if(lastOffers>0)notice("Yeni araç teklifi alındı");lastOffers=item.offers.length}
 }
 // One stable delegated handler. State is always re-read before the action.
 root.addEventListener("click",async event=>{
  const note=event.target.closest(".td-notify");
  if(note){notify=!notify;note.classList.toggle("on",notify);if(notify&&"Notification"in window&&Notification.permission==="default")await Notification.requestPermission().catch(()=>{});return}
  const button=event.target.closest("button[data-action]");
  if(!button||!root.contains(button))return;
  event.preventDefault();
  const action=button.dataset.action;
  if(action==="offer")update(j=>{if(j.status!=="new")return false;const offer=j.offers?.[Number(button.dataset.index)];if(!offer)return false;j.selected=offer;j.status="pending_payment"});
  if(action==="next"){
   // Stage change happens immediately; no dependence on name input focus or form-submit.
   update(j=>{if(j.status!=="pending_payment")return false;j.passengerDetailsReady=true});
  }
  if(action==="pay")update(j=>{if(j.status!=="pending_payment"||!j.passengerDetailsReady)return false;j.status="confirmed";j.confirmedAt=Date.now()});
  if(action==="cancel")update(j=>{if(j.status!=="new")return false;j.status="cancelled"});
 });
 const sync=()=>render();
 window.addEventListener("storage",sync);
 window.addEventListener("turista-demo-sync",sync);
 poll=setInterval(render,1200);
 cleanup=()=>{clearInterval(poll);window.removeEventListener("storage",sync);window.removeEventListener("turista-demo-sync",sync)};
 render(true);
};
})();