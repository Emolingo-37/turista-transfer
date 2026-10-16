(()=>{'use strict';
const KEY='turista_live_demo_v1',EVENT='turista-demo-sync';
const id=()=>Math.random().toString(36).slice(2,10).toUpperCase();
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
const write=a=>{localStorage.setItem(KEY,JSON.stringify(a.slice(0,35)));window.dispatchEvent(new Event(EVENT))};
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active=null,timer=null;
const originalSearch=window.search;
window.search=function(){
 if(typeof T==='undefined'||!T.from||!T.to){originalSearch();return}
 const ref=id(), d={id:ref,from:T.from,to:T.to,when:T.date,pax:T.n,luggage:lug,category:T.n<=8?'Vito / Caravelle':T.n<=16?'Sprinter':'Midibüs',status:'new',created:Date.now(),offers:[]};
 write([d,...read()]);
 active=ref;
 step(2);
 const c=add('<h4>🧭 Demo: Firmalardan teklif bekleniyor</h4><div id="demo-msg" style="line-height:1.6;font-size:14px;color:#64748b">Talebiniz Turista Partner paneline iletildi. Partner panelini ikinci sekmede açıp teklif gönderebilirsiniz.</div><div id="demo-offers" style="margin-top:12px"></div><a href="/turista-partner.html" target="_blank" rel="noopener" style="display:inline-block;margin-top:12px;color:#13315c;font-weight:700">↗ Turista Partner demosunu aç</a><button class="btn alt" id="demo-cancel">Demo talebini iptal et</button>','card');
 c.querySelector('#demo-cancel').onclick=()=>{const r=read(),j=r.find(x=>x.id===ref);if(j&&j.status==='new'){j.status='cancelled';write(r)}active=null;clearInterval(timer);c.querySelector('#demo-msg').textContent='Demo talebi iptal edildi.'};
 function refresh(){
  const j=read().find(x=>x.id===ref);if(!j||!c.isConnected)return;
  const msg=c.querySelector('#demo-msg'),o=c.querySelector('#demo-offers');
  if(j.status==='cancelled'){msg.textContent='Talep iptal edildi.';clearInterval(timer);return}
  if(j.status==='confirmed'){msg.textContent='✅ Demo rezervasyonu onaylandı. Gerçek ödeme veya SMS gönderimi yapılmadı.';clearInterval(timer);return}
  msg.textContent=j.offers.length?'Firmanızdan teklif geldi! İsterseniz kabul edin.':'Firmadan teklif bekleniyor… Partner paneli üzerinden teklif gönderin.';
  o.innerHTML=j.offers.map((v,i)=>'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px;margin-bottom:8px"><b>'+safe(v.company)+'</b><div style="color:#64748b;font-size:13px;margin:6px 0">'+safe(v.vehicle)+' · '+Number(v.price).toLocaleString('tr-TR')+' ₺</div><button class="btn" data-idx="'+i+'" style="margin-top:5px">Teklifi kabul et (demo)</button></div>').join('');
  o.querySelectorAll('button[data-idx]').forEach(b=>b.onclick=()=>{const all=read(),cur=all.find(x=>x.id===ref);if(!cur||cur.status!=='new')return;cur.status='confirmed';cur.selected=cur.offers[Number(b.dataset.idx)];write(all);refresh()});
 }
 refresh();clearInterval(timer);timer=setInterval(refresh,850);window.addEventListener('storage',refresh);window.addEventListener(EVENT,refresh);
};
})();