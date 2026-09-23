(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const rooms = {waldruhe:{name:'Waldruhe',rate:98,capacity:2},uferblick:{name:'Uferblick',rate:128,capacity:2},lieblingsplatz:{name:'Lieblingsplatz',rate:168,capacity:4}};
  const money = amount => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(amount);
  const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const addDays = (value,days) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate()+days); return iso(date); };
  const today = () => iso(new Date());
  const nightsBetween = (start,end) => (Date.parse(`${end}T00:00:00Z`)-Date.parse(`${start}T00:00:00Z`))/86400000;
  const formatDate = value => new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${value}T12:00:00`));
  const menu = document.querySelector('.menu-toggle');
  const closeMenu = () => { menu.setAttribute('aria-expanded','false'); $('navigation').classList.remove('open'); };
  menu.addEventListener('click',() => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); $('navigation').classList.toggle('open',open); });
  $('navigation').addEventListener('click',e => { if(e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown',e => { if(e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true'){closeMenu();menu.focus();} });
  for (const prefix of ['', 'quick-']) {
    const arrival = $(prefix+'arrival'), departure = $(prefix+'departure');
    arrival.min = today(); arrival.value = addDays(today(),7);
    departure.min = addDays(arrival.value,1); departure.value = addDays(arrival.value,2);
    arrival.addEventListener('change',() => {
      arrival.min=today();
      if(arrival.value) { departure.min=addDays(arrival.value,1); if(!departure.value || departure.value<=arrival.value) departure.value=departure.min; }
      departure.setCustomValidity('');
      if(!prefix) update();
    });
    departure.addEventListener('input',()=>departure.setCustomValidity(''));
  }
  function calculate() {
    const arrival=$('arrival').value, departure=$('departure').value, guests=Number($('guests').value), room=rooms[$('room').value];
    const nights=nightsBetween(arrival,departure);
    if(!arrival || !departure) return {error:'Bitte wählen Sie An- und Abreise.'};
    if(arrival<today()) return {error:'Die Anreise darf nicht in der Vergangenheit liegen.'};
    if(!Number.isInteger(nights) || nights<1) return {error:'Die Abreise muss nach der Anreise liegen.'};
    if(nights>30) return {error:'Bitte wählen Sie für die Demo höchstens 30 Nächte.'};
    if(guests>room.capacity) return {error:`${room.name} bietet Platz für höchstens ${room.capacity} Gäste. Bitte wählen Sie die Familiensuite.`};
    const lodging=nights*room.rate, breakfast=$('breakfast').checked?nights*guests*16:0;
    return {arrival,departure,guests,room,nights,lodging,breakfast,total:lodging+breakfast};
  }
  function update() {
    const result=calculate();
    $('booking-error').textContent=result.error || '';
    $('estimate-total').textContent=result.error?'—':money(result.total);
    $('estimate-detail').textContent=result.error?'Bitte Angaben prüfen':`${result.nights} ${result.nights===1?'Nacht':'Nächte'} · ${result.guests} ${result.guests===1?'Gast':'Gäste'} · ${result.room.name}`;
    return result;
  }
  function edit() {$('booking-form').hidden=false;$('confirmation').hidden=true;}
  ['departure','guests','room','breakfast'].forEach(id => $(id).addEventListener('change',update));
  $('quick-form').addEventListener('submit',event => {
    event.preventDefault();
    const a=$('quick-arrival').value,d=$('quick-departure').value,n=nightsBetween(a,d);
    if(a<today() || !Number.isInteger(n) || n<1 || n>30) {$('quick-departure').setCustomValidity('Bitte wählen Sie 1 bis 30 Nächte mit Anreise ab heute.');$('quick-departure').reportValidity();return;}
    edit();$('arrival').value=a;$('departure').value=d;$('departure').min=addDays(a,1);$('guests').value=$('quick-guests').value;
    if(Number($('guests').value)>2) $('room').value='lieblingsplatz';
    update();$('anfrage').scrollIntoView();$('arrival').focus({preventScroll:true});
  });
  document.querySelectorAll('[data-room]').forEach(link=>link.addEventListener('click',()=>{edit();$('room').value=link.dataset.room;update();}));
  $('booking-form').addEventListener('submit',event=>{
    event.preventDefault();const result=update();if(result.error){$('booking-error').scrollIntoView({block:'center'});return;}
    if(!$('guest-name').value.trim()){$('guest-name').setCustomValidity('Bitte geben Sie einen Beispielnamen ein.');$('guest-name').reportValidity();return;}
    $('confirmation-copy').textContent=`Danke, ${$('guest-name').value.trim()}. Hier ist die Zusammenfassung Ihrer beispielhaften Anfrage.`;
    const details=[['Zimmer',result.room.name],['Reisezeit',`${formatDate(result.arrival)} – ${formatDate(result.departure)}`],['Aufenthalt',`${result.nights} Nächte · ${result.guests} Gäste`],['Zimmerpreis',money(result.lodging)],['Frühstück',result.breakfast?money(result.breakfast):'Nicht ausgewählt'],['Gesamt (Beispiel)',money(result.total)],['Beispiel-E-Mail',$('guest-email').value]];
    if($('wishes').value.trim())details.push(['Wünsche',$('wishes').value.trim()]);
    $('confirmation-details').replaceChildren(...details.map(([term,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=value;row.append(dt,dd);return row;}));
    $('booking-form').hidden=true;$('confirmation').hidden=false;$('confirmation').focus();
  });
  $('guest-name').addEventListener('input',()=>$('guest-name').setCustomValidity(''));
  $('edit-booking').addEventListener('click',()=>{edit();$('arrival').focus();});
  update();
})();
