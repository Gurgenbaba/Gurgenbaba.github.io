(()=>{
'use strict';
const STORE='abbes-maintenance-demo-v1';
const GROUPS=[
  ['Allgemeiner Zustand',[['clean','Anlage / Umfeld sauber'],['fixings','Befestigungen & Schraubverbindungen'],['guards','Schutzabdeckungen'],['labels','Kennzeichnungen / Warnhinweise']]],
  ['Fördergurt',[['belt','Gurtzustand'],['tracking','Bandlauf'],['tension','Gurtspannung'],['joints','Gurtverbindung']]],
  ['Antrieb & Lagerung',[['motor','Motor / Getriebe'],['drive','Antriebstrommel'],['bearings','Lagerstellen'],['rollers','Umlenk- / Tragrollen']]],
  ['Elektrik & Sicherheit',[['estop','Not-Halt'],['sensors','Sensorik / Lichtschranken'],['cables','Kabel & Leitungen'],['switches','Schalter / Bedienelemente']]],
  ['Probelauf',[['noise','Laufgeräusch'],['function','Funktionsprüfung'],['handover','Anlage betriebsbereit']]]
];
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function readStore(){
  try{
    const raw=localStorage.getItem(STORE);
    const parsed=raw?JSON.parse(raw):null;
    return parsed&&Array.isArray(parsed.protocols)?parsed:{protocols:[],draft:null};
  }catch{
    return {protocols:[],draft:null};
  }
}

function fallbackDetails(p){
  const checks={};
  GROUPS.forEach(g=>g[1].forEach(i=>checks[i[0]]='ok'));
  const issueIds=['belt','tracking','motor','bearings','estop'];
  const issues=[];
  const count=Math.min(Number(p?.issues||0),issueIds.length);
  for(let n=0;n<count;n++){
    const id=issueIds[n];
    const item=GROUPS.flatMap(g=>g[1]).find(i=>i[0]===id);
    checks[id]='bad';
    issues.push({
      id:'archive-'+n,
      check:id,
      title:item?.[1]||'Auffälligkeit',
      desc:'Archivierte Demo-Auffälligkeit am Prüfpunkt „'+(item?.[1]||'Prüfung')+'“.',
      action:'Bei nächster Wartung erneut prüfen.',
      priority:'Hinweis',
      photo:''
    });
  }
  return {
    customer:p?.customer||'Musterkunde',
    location:p?.location||'Musterstandort',
    order:p?.id||'WA-DEMO',
    asset:p?.asset||'ANLAGE',
    type:p?.type||'Anlage',
    technician:'Max Mustermann',
    reason:'Archiviertes Wartungsprotokoll',
    note:'Archivierter Demo-Eintrag. Neue Protokolle speichern den vollständigen Originalstand.',
    checks,
    issues,
    confirm:true,
    signature:''
  };
}

function findProtocol(id){
  const store=readStore();
  return store.protocols.find(p=>String(p.id)===String(id))||null;
}

function getId(row){
  if(row.classList.contains('protocol')){
    const meta=row.querySelector('.pmeta');
    if(meta){
      const first=(meta.innerText||meta.textContent||'').trim().split(/\n|\r/)[0].trim();
      if(first) return first;
    }
  }
  if(row.classList.contains('trow')){
    const b=row.querySelector('b');
    if(b?.textContent) return b.textContent.trim();
  }
  return '';
}

function decorate(){
  document.querySelectorAll('.protocol,.trow').forEach(row=>{
    if(row.classList.contains('table-head')||row.dataset.viewerReady==='1') return;
    const id=getId(row);
    if(!id) return;
    row.dataset.viewerReady='1';
    row.dataset.protocolId=id;
    row.classList.add('protocol-openable');
    row.setAttribute('role','button');
    row.setAttribute('tabindex','0');
    row.setAttribute('aria-label','Protokoll '+id+' öffnen');

    const target=row.classList.contains('protocol') ? row : row.lastElementChild;
    if(target && !target.querySelector?.('.open-protocol-hint')){
      const hint=document.createElement('span');
      hint.className='open-protocol-hint';
      hint.textContent='Öffnen →';
      target.appendChild(hint);
    }
  });
}

function renderReport(p){
  const d=p?.details?JSON.parse(JSON.stringify(p.details)):fallbackDetails(p);
  d.checks=d.checks||{};
  d.issues=Array.isArray(d.issues)?d.issues:[];
  const values=Object.values(d.checks);
  const ok=values.filter(x=>x==='ok').length;
  const bad=values.filter(x=>x==='bad').length;
  const na=values.filter(x=>x==='na').length;
  const date=(p?.date||'').split(' · ')[0]||new Date().toLocaleDateString('de-DE');

  const checks=GROUPS.map(group=>{
    return '<div class="rsection"><h2>'+esc(group[0])+'</h2>'+
      group[1].map(item=>{
        const status=d.checks[item[0]]||'na';
        const label=status==='ok'?'OK':status==='bad'?'Mangel':'N/A';
        const cls=status==='ok'?'rok':status==='bad'?'rbad':'rna';
        return '<div class="rcheck"><span>'+esc(item[1])+'</span><span class="'+cls+'">'+label+'</span></div>';
      }).join('')+
      '</div>';
  }).join('');

  const issues=d.issues.length
    ? d.issues.map((x,n)=>{
        const photo=x.photo?'<img src="'+x.photo+'" alt="Mängelfoto" style="display:block;max-width:220px;max-height:160px;object-fit:cover;margin-top:8px;border-radius:8px">':'';
        return '<div class="rissue"><b>'+String(n+1).padStart(2,'0')+' · '+esc(x.title||'Auffälligkeit')+' · '+esc(x.priority||'Hinweis')+'</b><p>'+esc(x.desc||'Auffälligkeit dokumentiert.')+'</p>'+(x.action?'<p><strong>Maßnahme:</strong> '+esc(x.action)+'</p>':'')+photo+'</div>';
      }).join('')
    : '<p style="font-size:11px;color:#758091">Keine Mängel dokumentiert.</p>';

  const report=document.querySelector('#report');
  if(!report) return;
  report.innerHTML=
    '<div class="rhead"><div class="rlogo"><span class="mark" style="width:31px;height:31px"></span><div><b>ABBES</b><small>Digital · Konzeptdemo</small></div></div><div class="rtitle"><h1>Wartungsprotokoll</h1><span>'+esc(d.order||p?.id||'')+'</span></div></div>'+
    '<div class="rinfo">'+
      '<div class="rf"><span>Kunde</span><b>'+esc(d.customer||p?.customer||'–')+'</b></div>'+
      '<div class="rf"><span>Standort</span><b>'+esc(d.location||p?.location||'–')+'</b></div>'+
      '<div class="rf"><span>Anlage</span><b>'+esc((d.asset||p?.asset||'–')+' · '+(d.type||p?.type||''))+'</b></div>'+
      '<div class="rf"><span>Monteur</span><b>'+esc(d.technician||'–')+'</b></div>'+
      '<div class="rf"><span>Anlass</span><b>'+esc(d.reason||'–')+'</b></div>'+
      '<div class="rf"><span>Datum</span><b>'+esc(date)+'</b></div>'+
    '</div>'+
    '<div class="rnums"><div><strong>'+ok+'</strong><span>Prüfpunkte OK</span></div><div><strong>'+bad+'</strong><span>Mängel</span></div><div><strong>'+na+'</strong><span>N/A</span></div></div>'+
    checks+
    '<div class="rsection"><h2>Festgestellte Mängel / Maßnahmen</h2>'+issues+'</div>'+
    '<div class="rsection"><h2>Abschließende Bemerkung</h2><div style="background:#f5f7f9;padding:12px;border-radius:8px;font-size:11px;line-height:1.5">'+esc(d.note||'–')+'</div></div>'+
    '<div class="rsign"><div class="sigline">'+(d.signature?'<img class="sigimg" src="'+d.signature+'" alt="Unterschrift">':'')+'Monteur · '+esc(d.technician||'–')+'</div><div class="sigline">Kunde / Ansprechpartner '+(d.confirm?'· informiert':'· nicht bestätigt')+'</div></div>'+
    '<div class="rfoot"><span>Gespeichertes Wartungsprotokoll · ABBES Konzeptdemo</span><span>'+esc(p?.id||d.order||'')+'</span></div>';

  const num=document.querySelector('#reportnum');
  if(num) num.textContent=p?.id||d.order||'';
  const overlay=document.querySelector('#reportoverlay');
  if(overlay){
    overlay.classList.add('open');
    overlay.scrollTop=0;
    document.body.style.overflow='hidden';
  }
}

function openRow(row){
  const id=row?.dataset?.protocolId||getId(row);
  if(!id) return;
  const p=findProtocol(id);
  if(!p) return;
  renderReport(p);
}

function init(){
  decorate();
  const recent=document.querySelector('#recent');
  const ptable=document.querySelector('#ptable');
  const observer=new MutationObserver(()=>decorate());
  if(recent) observer.observe(recent,{childList:true,subtree:true});
  if(ptable) observer.observe(ptable,{childList:true,subtree:true});

  document.addEventListener('click',event=>{
    const row=event.target.closest?.('.protocol-openable');
    if(row) openRow(row);
  });

  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ') return;
    const row=event.target.closest?.('.protocol-openable');
    if(!row) return;
    event.preventDefault();
    openRow(row);
  });
}

try{
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
}catch(error){
  console.error('Protocol viewer failed safely:',error);
}
})();