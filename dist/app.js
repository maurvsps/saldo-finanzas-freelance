const KEY='saldo-freelance-v1';
// ID de cliente OAuth (público). Se usa para guardar tus datos en tu Google Drive (carpeta oculta de la app).
const GOOGLE_CLIENT_ID='1057047663238-a3prjms222f111drrcse66qtrpu400sv.apps.googleusercontent.com';
const DRIVE_FILE='saldo-datos.json';
let gToken=null,gExpires=0,gTokenClient=null,gFileId=null,driveTimer,driveNeedsSave=false;
const colors=[['#e9f1eb','#397655'],['#eef1fa','#626fa8'],['#fbf0e7','#b8794f'],['#f5eafa','#916ca0'],['#e9f3f2','#47847d']];
const now=new Date(); now.setHours(0,0,0,0);
const uid=()=>Math.random().toString(36).slice(2,10);
const iso=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const addMonths=(d,n)=>{const x=new Date(d);const day=x.getDate();x.setDate(1);x.setMonth(x.getMonth()+n);x.setDate(Math.min(day,new Date(x.getFullYear(),x.getMonth()+1,0).getDate()));return x};
const startMonth=(d)=>new Date(d.getFullYear(),d.getMonth(),1);
const money=(n,cur='PEN',digits=0)=>new Intl.NumberFormat('es-PE',{style:'currency',currency:cur,minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number(n)||0);
const monthName=(d,opts={month:'long',year:'numeric'})=>new Intl.DateTimeFormat('es-PE',opts).format(d);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function seed(){
 return {rates:{USD:3.72,EUR:4.05,GBP:4.72},wallets:{account:0,yape:0,paypal:0},clients:[],incomes:[],withdrawals:[],products:[],monthOffset:0,forecastMonths:3};
}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d?.clients&&d?.wallets&&d?.rates)return d;}catch{}return seed()}
let data=load();data.products=data.products||[];let selectedMonth=Number(data.monthOffset)||0;let forecastMonths=[3,6,12].includes(Number(data.forecastMonths))?Number(data.forecastMonths):3;let toastTimer;
const save=()=>{data.monthOffset=selectedMonth;data.forecastMonths=forecastMonths;localStorage.setItem(KEY,JSON.stringify(data));render();queueCloudSave()};
function fmtRate(c){return (Number(data.rates[c])||0).toFixed(2)}
function toPEN(n,c){return Number(n||0)*(c==='PEN'?1:Number(data.rates[c])||0)}
function allProducts(){const none={name:'Sin cliente',description:'',color:0,products:[]};return [...data.clients.flatMap(c=>c.products.map(p=>({p,c}))),...data.products.map(p=>({p,c:none}))]}
function productIsActive(p,m){const begin=startMonth(new Date(p.start+'T12:00:00'));const diff=(m.getFullYear()-begin.getFullYear())*12+m.getMonth()-begin.getMonth();if(diff<0)return false;if(p.frequency==='once')return diff===0;if(p.frequency==='monthly'&&Number(p.months)>0&&diff>=Number(p.months))return false;return true}
function weekCountInMonth(month,day){let n=0;for(let d=new Date(month.getFullYear(),month.getMonth(),1);d.getMonth()===month.getMonth();d.setDate(d.getDate()+1))if(d.getDay()===day)n++;return n}
function occurrenceCount(p,m){if(p.frequency==='weekly'){const wd=new Date(p.start+'T12:00:00').getDay();return weekCountInMonth(m,wd)}if(p.frequency==='once')return 1;return 1}
function monthlyRange(p,m){if(!productIsActive(p,m))return [0,0];const count=occurrenceCount(p,m), low=Number(p.low||1),high=Number(p.high||low), price=Number(p.price||0);return [price*low*count,price*high*count]}
function projection(month){return allProducts().reduce((a,{p})=>{const [lo,hi]=monthlyRange(p,month);return[a[0]+toPEN(lo,p.currency),a[1]+toPEN(hi,p.currency)]},[0,0]).map(v=>v+data.incomes.filter(x=>{let d=new Date(x.date+'T12:00:00');return d.getFullYear()===month.getFullYear()&&d.getMonth()===month.getMonth()}).reduce((a,x)=>a+toPEN(x.amount,x.currency),0))}
function fmtCompact(v){if(Math.abs(v)>=10000)return 'S/ '+(v/1000).toFixed(0)+'k';if(Math.abs(v)>=1000)return 'S/ '+(v/1000).toFixed(1)+'k';return 'S/ '+Math.round(v).toLocaleString('es-PE')}
function totalBalance(){return toPEN(data.wallets.account,'PEN')+toPEN(data.wallets.yape,'PEN')+toPEN(data.wallets.paypal,'USD')}
function productLabel(p){return p.frequency==='weekly'?'Por semana':p.frequency==='monthly'?'Mensual':'Único'}
function monthlyExpectation(c){const [lo,hi]=c.products.reduce((a,p)=>{const factor=p.frequency==='weekly'?52/12:p.frequency==='once'?0:1;return[a[0]+toPEN(p.price*p.low*factor,p.currency),a[1]+toPEN(p.price*p.high*factor,p.currency)]},[0,0]);return (lo+hi)/2}
function render(){renderNav();renderOverview();renderClients();renderProducts();renderMonths();renderWithdrawals();renderRates()}
function renderNav(){document.getElementById('clientCount').textContent=data.clients.length;document.getElementById('activeClientCount').textContent=data.clients.length;document.getElementById('directoryCount').textContent=data.clients.length;const today=new Intl.DateTimeFormat('es-PE',{weekday:'long',day:'numeric',month:'long'}).format(now);document.getElementById('todayDate').textContent=today.toUpperCase();}
function renderRates(){for(const [c,id] of [['USD','sideUsd'],['EUR','sideEur'],['GBP','sideGbp']])document.getElementById(id).textContent=fmtRate(c)}
function renderOverview(){document.getElementById('totalBalance').textContent=money(totalBalance());document.getElementById('accountValue').textContent=money(data.wallets.account);document.getElementById('yapeValue').textContent=money(data.wallets.yape);document.getElementById('paypalValue').textContent=money(data.wallets.paypal,'USD',2);const months=Array.from({length:forecastMonths},(_,i)=>addMonths(startMonth(now),i));const ranges=months.map(m=>projection(m));const low=ranges.reduce((s,x)=>s+x[0],0),high=ranges.reduce((s,x)=>s+x[1],0);document.getElementById('projectionRange').innerHTML=`${money(low)} <span class="range-separator">—</span> ${money(high)}`;document.getElementById('lowTotal').textContent=money(low);document.getElementById('highTotal').textContent=money(high);document.getElementById('monthlyEstimate').textContent=money((ranges[0][0]+ranges[0][1])/2);document.getElementById('chartRange').textContent=`${money(low)} – ${money(high)}`;document.getElementById('periodLabel').innerHTML=`Próximos ${forecastMonths} meses <span>⌄</span>`;document.querySelector('.projection-card .card-label').innerHTML=`PROYECCIÓN · ${forecastMonths} MESES <button class="info-dot" title="Ingresos mínimos y máximos previstos, antes de retiros">i</button>`;document.querySelector('.mini-chart-labels span:last-child').textContent=`+${forecastMonths-1} meses`;drawChart(months,ranges);drawSpark(ranges);document.getElementById('clientPreview').innerHTML=data.clients.slice(0,4).map((c,i)=>clientRow(c,i)).join('')||'<div class="empty-state">Agrega tu primer cliente para ver ingresos estimados.</div>';renderUpcoming()}
function drawChart(months,ranges){const svg=document.getElementById('projectionChart');const max=Math.max(1,...ranges.map(r=>r[1]))*1.12;const pts=ranges.map((r,i)=>[55+i*(610/Math.max(1,ranges.length-1)),192-(r[0]/max)*174,192-(r[1]/max)*174]);const low=pts.map(p=>`${p[0]},${p[1]}`).join(' '),high=pts.map(p=>`${p[0]},${p[2]}`).join(' ');const band=pts.map(p=>`${p[0]},${p[2]}`).join(' ')+' '+pts.slice().reverse().map(p=>`${p[0]},${p[1]}`).join(' ');svg.innerHTML=`<polygon class="band" points="${band}"/><polyline class="line-high" points="${high}"/><polyline class="line-low" points="${low}"/>${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4"/>`).join('')}`;document.getElementById('yAxis').innerHTML=[1,.66,.33,0].map(v=>`<span>${fmtCompact(max*v)}</span>`).join('');document.getElementById('xAxis').innerHTML=months.map(m=>`<span>${new Intl.DateTimeFormat('es-PE',{month:'short'}).format(m).replace('.','')}</span>`).join('')}
function drawSpark(r){const vals=r.map(x=>(x[0]+x[1])/2),mx=Math.max(1,...vals),coords=vals.map((v,i)=>`${i*50},${44-(v/mx)*37}`).join(' ');document.getElementById('incomeSpark').innerHTML=`<svg viewBox="0 0 100 48" preserveAspectRatio="none"><polyline points="${coords}" fill="none" stroke="#4f8a64" stroke-width="2.2" vector-effect="non-scaling-stroke"/><polyline points="0,46 ${coords} 100,46" fill="#e8f1e9" opacity=".8" stroke="none"/></svg>`}
function clientRow(c,i){const [bg,fg]=colors[c.color%colors.length];return `<div class="client-row"><div class="client-logo" style="background:${bg};color:${fg}">${safe(c.name.slice(0,1).toUpperCase())}</div><div><b>${safe(c.name)}</b><small>${c.products.length} ${c.products.length===1?'encargo':'encargos'} · ${safe(c.description||'')}</small></div><div class="client-amount">${money(monthlyExpectation(c))}<small> / mes aprox.</small></div></div>`}
function renderUpcoming(){const entries=[];for(let i=0;i<4;i++){const m=startMonth(addMonths(now,i));for(const {p,c} of allProducts()){if(!productIsActive(p,m))continue;const start=new Date(p.start+'T12:00:00');let d;if(p.frequency==='weekly'){d=new Date(m.getFullYear(),m.getMonth(),1);while(d.getMonth()===m.getMonth()&&d.getDay()!==start.getDay())d.setDate(d.getDate()+1)}else d=i===0&&start>now?start:new Date(m.getFullYear(),m.getMonth(),Math.max(start.getDate(),1));if(d>=now&&d.getMonth()===m.getMonth()){const [l,h]=monthlyRange(p,m);entries.push({d,c,p,l,h})}}}for(const x of data.incomes){const d=new Date(x.date+'T12:00:00');if(d>=now)entries.push({d,c:{name:x.client||'Ingreso puntual'},p:{name:x.name||'Ingreso puntual'},l:x.amount,h:x.amount,currency:x.currency,manual:true})}entries.sort((a,b)=>a.d-b.d);const list=entries.slice(0,3);document.getElementById('upcomingList').innerHTML=list.map(x=>`<div class="upcoming-item"><div class="date-badge"><b>${x.d.getDate()}</b><small>${new Intl.DateTimeFormat('es-PE',{month:'short'}).format(x.d).replace('.','')}</small></div><div class="upcoming-info"><b>${safe(x.c.name)}</b><small>${safe(x.p.name)}</small></div><div class="upcoming-amount">${x.manual?money(x.h,x.currency):money((toPEN(x.l,x.p.currency)+toPEN(x.h,x.p.currency))/2)}</div></div>`).join('')||'<div class="empty-state">Aún no hay ingresos próximos configurados.</div>'}
function renderClients(){document.getElementById('clientDirectory').innerHTML=data.clients.map((c,i)=>{const [bg,fg]=colors[c.color%colors.length];return `<article class="directory-card"><div class="directory-top"><div class="client-logo" style="background:${bg};color:${fg}">${safe(c.name.slice(0,1).toUpperCase())}</div><div><b>${safe(c.name)}</b><small>${safe(c.description||'Sin descripción')}</small></div><div class="directory-total">${money(monthlyExpectation(c))}<small> / mes</small></div><div class="directory-actions"><button class="subtle-button" data-edit-client="${c.id}">Editar</button><button class="subtle-button delete" data-delete-client="${c.id}">×</button></div></div><div class="product-pills">${c.products.map(p=>`<span class="product-pill">${safe(p.name)} · ${productLabel(p)} <b>${p.low===p.high?p.low:`${p.low}–${p.high}`} × ${money(p.price,p.currency,2)}</b></span>`).join('')}</div></article>`}).join('')||'<div class="empty-state">Aún no tienes clientes. Añade uno para comenzar.</div>';document.querySelectorAll('[data-edit-client]').forEach(b=>b.onclick=()=>openClient(b.dataset.editClient));document.querySelectorAll('[data-delete-client]').forEach(b=>b.onclick=()=>deleteClient(b.dataset.deleteClient))}
function renderMonths(){const m=startMonth(addMonths(now,selectedMonth));document.getElementById('monthTitle').textContent=monthName(m,{month:'long',year:'numeric'});document.getElementById('monthTableTitle').textContent=`Ingresos de ${monthName(m,{month:'long'})}`;const [lo,hi]=projection(m);const jobs=allProducts().map(({p,c})=>{const [low,high]=monthlyRange(p,m);return {c,p,low,high}}).filter(x=>x.high>0);const count=jobs.length+data.incomes.filter(x=>{const d=new Date(x.date+'T12:00:00');return d.getFullYear()===m.getFullYear()&&d.getMonth()===m.getMonth()}).length;document.getElementById('monthKpis').innerHTML=`<div class="month-kpi"><span>INGRESO MÍNIMO</span><b>${money(lo)}</b></div><div class="month-kpi"><span>INGRESO MÁXIMO</span><b>${money(hi)}</b></div><div class="month-kpi"><span>ESCENARIO MEDIO</span><b>${money((lo+hi)/2)}</b></div><div class="month-kpi"><span>ENCARGOS ACTIVOS</span><b>${count}</b></div>`;const rows=[];for(const x of jobs){const freq=x.p.frequency==='weekly'?`Cada ${new Intl.DateTimeFormat('es-PE',{weekday:'long'}).format(new Date(x.p.start+'T12:00:00'))} · ${occurrenceCount(x.p,m)} veces aprox.`:x.p.frequency==='once'?'Pago único':'Pago mensual';rows.push({day:x.p.frequency==='weekly'?Math.max(1,new Date(x.p.start+'T12:00:00').getDay()||7):Math.min(new Date(x.p.start+'T12:00:00').getDate(),new Date(m.getFullYear(),m.getMonth()+1,0).getDate()),html:`<div class="schedule-row"><b>${safe(x.c.name)} <small>· ${safe(x.p.name)}</small></b><small>${safe(freq)}</small><span class="schedule-quantity">${x.p.low===x.p.high?x.p.low:`${x.p.low}–${x.p.high}`} unidades · ${money(x.p.price,x.p.currency,2)} c/u</span><span class="schedule-amount">${money(toPEN(x.low,x.p.currency))} — ${money(toPEN(x.high,x.p.currency))}</span></div>`})}for(const x of data.incomes){const d=new Date(x.date+'T12:00:00');if(d.getFullYear()===m.getFullYear()&&d.getMonth()===m.getMonth())rows.push({day:d.getDate(),html:`<div class="schedule-row"><b>${safe(x.client||'Ingreso puntual')} <small>· ${safe(x.name||'Pago recibido')}</small></b><small>${iso(d)}</small><span class="schedule-quantity">Registrado · ${money(x.amount,x.currency,2)}</span><span class="schedule-amount">${money(toPEN(x.amount,x.currency))}</span></div>`})}rows.sort((a,b)=>a.day-b.day);document.getElementById('monthSchedule').innerHTML=rows.length?rows.map(r=>r.html).join(''):'<div class="schedule-empty">No hay ingresos planificados para este mes. Puedes añadir un ingreso manual o actualizar tus encargos.</div>'}
function renderWithdrawals(){const wallet=document.getElementById('withdrawWallet').value||'paypal';const currency=wallet==='paypal'?'USD':'PEN';document.getElementById('walletGrid').innerHTML=[['account','Cuenta','▣','PEN'],['yape','Yape','Y','PEN'],['paypal','PayPal','P','USD']].map(([id,n,s,c])=>`<div class="wallet-item"><div class="wallet-symbol ${id}">${s}</div><div><span>${n} · ${c}</span><b>${money(data.wallets[id],c,c==='USD'?2:0)}</b></div></div>`).join('');document.getElementById('withdrawCurrency').textContent=currency==='USD'?'$':'S/';document.getElementById('withdrawDate').value=document.getElementById('withdrawDate').value||iso(now);const fee=Number(document.getElementById('withdrawFee').value)||0,amount=Number(document.getElementById('withdrawAmount').value)||0,pen=toPEN(amount,currency)*(1-fee/100);document.getElementById('withdrawResult').textContent=money(pen);document.getElementById('withdrawBreakdown').textContent=`${money(amount,currency,2)} ${currency} · cotización ${currency==='PEN'?'1.00':fmtRate(currency)} · comisión ${fee}%`;document.getElementById('withdrawalList').innerHTML=data.withdrawals.length?data.withdrawals.slice().reverse().map(w=>`<div class="history-row"><div class="history-icon">↗</div><div><b>${safe(w.wallet)} · ${money(w.amount,w.currency,2)}</b><small>${safe(w.date)} · comisión ${w.fee}%</small></div><strong>${money(w.net)}</strong></div>`).join(''):'<div class="empty-state">Tus simulaciones guardadas aparecerán aquí.</div>'}
function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300)}
function go(view){document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===`view-${view}`));document.getElementById('crumb').textContent=({inicio:'Resumen',clientes:'Clientes',productos:'Productos',meses:'Mes a mes',retiros:'Retiros'})[view];window.scrollTo({top:0,behavior:'smooth'})}
function openModal(title,body,kicker='DETALLES'){document.getElementById('modalTitle').textContent=title;document.getElementById('modalKicker').textContent=kicker;document.getElementById('modalBody').innerHTML=body;document.getElementById('modalBackdrop').hidden=false;document.body.style.overflow='hidden'}function closeModal(){document.getElementById('modalBackdrop').hidden=true;document.body.style.overflow=''}
function editRates(){openModal('Cotizaciones a soles',`<form id="ratesForm"><div class="form-grid">${[['USD','Dólar estadounidense (USD)'],['EUR','Euro (EUR)'],['GBP','Libra esterlina (GBP)']].map(([c,l])=>`<label>${l}<input name="${c}" type="number" min="0" step="0.001" value="${fmtRate(c)}" required></label>`).join('')}</div><div class="modal-actions"><button class="secondary-button" type="button" data-close>Cancelar</button><button class="primary-button">Guardar cotizaciones</button></div></form>`,'TIPO DE CAMBIO');document.getElementById('ratesForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);for(const c of ['USD','EUR','GBP'])data.rates[c]=Number(f.get(c));save();closeModal();showToast('Cotizaciones actualizadas')};bindClose()}
function openClient(id=null){const c=id?data.clients.find(x=>x.id===id):null;const i=c?data.clients.indexOf(c):data.clients.length;openModal(c?'Editar cliente':'Nuevo cliente',`<form id="clientForm"><div class="form-grid"><label>Nombre del cliente<input name="name" maxlength="60" placeholder="Ej. Estudio Norte" value="${safe(c?.name||'')}" required></label><label>Qué haces para este cliente<input name="description" maxlength="70" placeholder="Ej. Diseño para redes" value="${safe(c?.description||'')}"></label><label class="full">Color de identificación<select name="color">${colors.map((_,n)=>`<option value="${n}" ${(c?.color??i)%colors.length===n?'selected':''}>${['Verde','Azul','Naranja','Lila','Turquesa'][n]}</option>`).join('')}</select></label><div class="form-section">ENCARGOS Y PRODUCTOS</div><div class="full" id="productList">${c?.products.map(p=>productCard(p)).join('')||''}</div><button type="button" class="secondary-button full" id="addProduct">＋ Añadir producto o servicio</button></div><div class="modal-actions"><button class="secondary-button" type="button" data-close>Cancelar</button><button class="primary-button">${c?'Guardar cambios':'Crear cliente'}</button></div></form>`,c?'EDITAR CLIENTE':'NUEVO CLIENTE');const form=document.getElementById('clientForm');document.getElementById('addProduct').onclick=()=>addProductForm();document.querySelectorAll('[data-remove-product]').forEach(b=>b.onclick=()=>b.closest('.product-edit-card').remove());form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form),products=[];for(const card of form.querySelectorAll('.product-edit-card')){const g=n=>card.querySelector(`[name="${n}"]`).value;products.push({id:card.dataset.id||uid(),name:g('pname'),currency:g('currency'),price:Number(g('price')),frequency:g('frequency'),low:Number(g('low')||1),high:Number(g('high')||1),start:g('start'),months:Number(g('months')||0)})}if(c)Object.assign(c,{name:fd.get('name').trim(),description:fd.get('description').trim(),color:Number(fd.get('color')),products});else data.clients.push({id:uid(),name:fd.get('name').trim(),description:fd.get('description').trim(),color:Number(fd.get('color')),products});save();closeModal();showToast(c?'Cliente actualizado':'Cliente agregado')};bindClose()}
function productCard(p={}){const d=p.start||iso(new Date(now.getFullYear(),now.getMonth(),15));return `<div class="product-edit-card" data-id="${safe(p.id||'')}"><div class="form-grid"><label class="full">Nombre del producto<input name="pname" value="${safe(p.name||'')}" placeholder="Ej. Gráfico para redes" required></label><label>Precio por unidad<input name="price" type="number" min="0" step="0.01" value="${Number(p.price)||''}" required></label><label>Moneda<select name="currency">${['USD','EUR','GBP','PEN'].map(c=>`<option ${p.currency===c?'selected':''} value="${c}">${c}</option>`).join('')}</select></label><label>Frecuencia<select name="frequency"><option value="weekly" ${p.frequency==='weekly'?'selected':''}>Semanal</option><option value="monthly" ${p.frequency==='monthly'?'selected':''}>Mensual</option><option value="once" ${p.frequency==='once'?'selected':''}>Pago único</option></select></label><label>Comienza el<input name="start" type="date" value="${d}" required></label><label class="full">Unidades mín. / máx.<div style="display:flex;gap:5px"><input name="low" type="number" min="0" step="1" value="${p.low??1}" required aria-label="Mínimo"><input name="high" type="number" min="0" step="1" value="${p.high??1}" required aria-label="Máximo"></div></label><div class="full product-advanced"><details><summary>Más opciones</summary><label>Meses activos<input name="months" type="number" min="1" placeholder="Sin límite" value="${p.months||''}"></label></details></div><button type="button" class="subtle-button delete full" data-remove-product>Quitar producto</button></div></div>`}
function addProductForm(){const box=document.getElementById('productList');const empty=box.querySelector('.hint');if(empty)box.innerHTML='';box.insertAdjacentHTML('beforeend',productCard());box.lastElementChild.querySelector('[data-remove-product]').onclick=e=>e.target.closest('.product-edit-card').remove()}
function deleteClient(id){const c=data.clients.find(x=>x.id===id);if(!c)return;if(confirm(`¿Eliminar a ${c.name} y sus encargos?`)){data.clients=data.clients.filter(x=>x.id!==id);save();showToast('Cliente eliminado')}}
function addIncome(){openModal('Registrar un ingreso',`<form id="incomeForm"><div class="form-grid"><label>Cliente<select name="client"><option value="">Sin cliente</option>${data.clients.map(c=>`<option value="${safe(c.name)}">${safe(c.name)}</option>`).join('')}</select></label><label>Concepto<input name="name" placeholder="Ej. 2 gráficos" required></label><label>Monto<input name="amount" type="number" min="0.01" step="0.01" required></label><label>Moneda<select name="currency"><option>USD</option><option>EUR</option><option>GBP</option><option>PEN</option></select></label><label>Fecha de pago<input name="date" type="date" value="${iso(now)}" required></label></div><div class="modal-actions"><button class="secondary-button" type="button" data-close>Cancelar</button><button class="primary-button">Registrar ingreso</button></div></form>`,'INGRESO RECIBIDO O CONFIRMADO');document.getElementById('incomeForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);data.incomes.push({id:uid(),client:f.get('client').trim(),name:f.get('name').trim(),amount:Number(f.get('amount')),currency:f.get('currency'),date:f.get('date')});save();closeModal();showToast('Ingreso registrado')};bindClose()}
function editWallets(field){openModal('Saldos de tus billeteras',`<form id="walletForm"><div class="form-grid"><label>Cuenta · soles (PEN)<input name="account" type="number" min="0" step="0.01" value="${data.wallets.account}"></label><label>Yape · soles (PEN)<input name="yape" type="number" min="0" step="0.01" value="${data.wallets.yape}"></label><label class="full">PayPal · dólares (USD)<input name="paypal" type="number" min="0" step="0.01" value="${data.wallets.paypal}"></label></div><div class="modal-actions"><button class="secondary-button" type="button" data-close>Cancelar</button><button class="primary-button">Actualizar saldos</button></div></form>`,'TU DINERO DISPONIBLE');document.getElementById('walletForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);for(const c of ['account','yape','paypal'])data.wallets[c]=Number(f.get(c)||0);save();closeModal();showToast('Saldos actualizados')};bindClose();if(field)document.querySelector(`#walletForm [name="${field}"]`)?.focus()}
document.querySelector('.balance-breakdown').onclick=e=>{const row=e.target.closest('[data-wallet]');if(row)editWallets(row.dataset.wallet)};document.getElementById('editBalances').onclick=()=>editWallets();
function bindClose(){document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal)}
function saveWithdrawal(){const wallet=document.getElementById('withdrawWallet').value,currency=wallet==='paypal'?'USD':'PEN',amount=Number(document.getElementById('withdrawAmount').value),fee=Number(document.getElementById('withdrawFee').value)||0,date=document.getElementById('withdrawDate').value;if(!amount||amount<0||!date)return showToast('Ingresa un monto y una fecha válidos');const amountPen=toPEN(amount,currency)*(1-fee/100);data.withdrawals.push({wallet:wallet==='paypal'?'PayPal':wallet==='yape'?'Yape':'Cuenta',currency,amount,fee,date,net:amountPen});save();showToast('Simulación de retiro guardada')}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`saldo-respaldo-${iso(now)}.json`;a.click();URL.revokeObjectURL(a.href);showToast('Respaldo descargado')}
function importData(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const imported=JSON.parse(reader.result);if(!Array.isArray(imported.clients)||!imported.wallets||!imported.rates)throw new Error('Formato');data={...seed(),...imported};selectedMonth=Number(data.monthOffset)||0;forecastMonths=[3,6,12].includes(Number(data.forecastMonths))?Number(data.forecastMonths):3;save();showToast('Respaldo importado')}catch{showToast('Ese archivo no parece un respaldo de Saldo')}};reader.readAsText(file)}
window.addEventListener('hashchange',()=>{const view=location.hash.slice(6);if(['inicio','clientes','productos','meses','retiros'].includes(view))go(view)});document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>go(b.dataset.goto));document.getElementById('editRates').onclick=editRates;document.getElementById('quickAdd').onclick=addIncome;document.getElementById('newClient').onclick=()=>openClient();document.getElementById('newClientBottom').onclick=()=>openClient();document.getElementById('addMonthIncome').onclick=addIncome;document.getElementById('exportBtn').onclick=exportData;document.getElementById('editWallets').onclick=()=>editWallets();document.getElementById('newWithdrawal').onclick=()=>{go('retiros');document.getElementById('withdrawAmount').focus()};document.getElementById('monthPrev').onclick=()=>{selectedMonth--;save()};document.getElementById('monthNext').onclick=()=>{selectedMonth++;save()};document.getElementById('withdrawWallet').onchange=renderWithdrawals;for(const id of ['withdrawAmount','withdrawFee','withdrawDate'])document.getElementById(id).oninput=renderWithdrawals;document.getElementById('saveWithdrawal').onclick=saveWithdrawal;document.getElementById('closeModal').onclick=closeModal;document.getElementById('modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.getElementById('brandHome').onclick=e=>{e.preventDefault();go('inicio');history.replaceState(null,'','#view-inicio')};document.getElementById('periodLabel').onclick=()=>{forecastMonths=forecastMonths===3?6:forecastMonths===6?12:3;save()};document.getElementById('importBtn').onclick=()=>document.getElementById('importFile').click();document.getElementById('importFile').onchange=e=>{importData(e.target.files?.[0]);e.target.value=''};
render();if(location.hash.startsWith('#view-')){const initialView=location.hash.slice(6);if(['inicio','clientes','productos','meses','retiros'].includes(initialView))go(initialView)}
// ── Cuenta de Google + guardado en tu Google Drive (carpeta oculta de la app) ──
const DRIVE_CONNECTED='saldo-drive-connected';
function setAuthButton(label,signedIn){const b=document.getElementById('authBtn');b.textContent=label;b.dataset.signedIn=signedIn?'1':''}
function driveAuthed(){return gToken&&Date.now()<gExpires}
async function driveFetch(url,opts={}){
  if(!driveAuthed())throw new Error('auth');
  const r=await fetch(url,{...opts,headers:{Authorization:`Bearer ${gToken}`,...(opts.headers||{})}});
  if(r.status===401){gToken=null;throw new Error('auth')}
  if(!r.ok)throw new Error('drive '+r.status);
  return r;
}
async function findDriveFile(){
  const q=encodeURIComponent(`name='${DRIVE_FILE}'`);
  const r=await driveFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=${q}`);
  const {files}=await r.json();
  return files?.[0]?.id||null;
}
async function pushDrive(){
  if(!driveAuthed())return;
  const boundary='saldo'+Date.now();
  const meta=gFileId?{name:DRIVE_FILE}:{name:DRIVE_FILE,parents:['appDataFolder']};
  const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data)}\r\n--${boundary}--`;
  const url=gFileId
    ?`https://www.googleapis.com/upload/drive/v3/files/${gFileId}?uploadType=multipart`
    :'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const r=await driveFetch(url,{method:gFileId?'PATCH':'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
  gFileId=(await r.json()).id;
}
async function loadDrive(){
  try{
    gFileId=await findDriveFile();
    if(!gFileId){await pushDrive();showToast('Datos guardados en tu Google Drive');return}
    const r=await driveFetch(`https://www.googleapis.com/drive/v3/files/${gFileId}?alt=media`);
    data={...seed(),...JSON.parse(await r.text())};
    selectedMonth=Number(data.monthOffset)||0;
    forecastMonths=[3,6,12].includes(Number(data.forecastMonths))?Number(data.forecastMonths):3;
    localStorage.setItem(KEY,JSON.stringify(data));
    render();showToast('Datos cargados desde tu Google Drive');
  }catch(e){
    if(e.message==='auth')return driveExpired();
    showToast('No se pudieron cargar tus datos de Drive');
  }
}
function driveExpired(){setAuthButton('Entrar con Google',false);localStorage.removeItem(DRIVE_CONNECTED);showToast('Vuelve a entrar con Google para seguir guardando')}
function onDriveToken(r){
  if(r.error){showToast('No se pudo iniciar sesión con Google');return}
  gToken=r.access_token;gExpires=Date.now()+(Number(r.expires_in)-60)*1000;
  localStorage.setItem(DRIVE_CONNECTED,'1');
  setAuthButton('Sincronizado',true);
  if(driveNeedsSave){driveNeedsSave=false;pushDrive().catch(()=>showToast('No se pudo guardar en Drive'))}
  else loadDrive();
}
function queueCloudSave(){
  if(!driveAuthed()){
    // El token dura ~1 h: si expiró, pedimos uno nuevo sin ventana y guardamos después
    if(gTokenClient&&localStorage.getItem(DRIVE_CONNECTED)){driveNeedsSave=true;gTokenClient.requestAccessToken({prompt:''})}
    return;
  }
  clearTimeout(driveTimer);
  driveTimer=setTimeout(()=>pushDrive().catch(e=>{if(e.message==='auth')driveExpired();else showToast('No se pudo guardar en Drive')}),800);
}
function toggleAuth(){
  if(!gTokenClient)return;
  if(driveAuthed()){
    if(!confirm('¿Desconectar Google? Tus datos seguirán en este navegador y en tu Drive.'))return;
    google.accounts.oauth2.revoke(gToken,()=>{});
    gToken=null;gFileId=null;localStorage.removeItem(DRIVE_CONNECTED);
    setAuthButton('Entrar con Google',false);showToast('Cuenta desconectada');return;
  }
  gTokenClient.requestAccessToken({prompt:''});
}
function initDrive(){
  const btn=document.getElementById('authBtn');
  if(!window.google?.accounts?.oauth2)return;
  gTokenClient=google.accounts.oauth2.initTokenClient({client_id:GOOGLE_CLIENT_ID,scope:'https://www.googleapis.com/auth/drive.appdata',callback:onDriveToken});
  btn.hidden=false;
  btn.onclick=toggleAuth;
  if(localStorage.getItem(DRIVE_CONNECTED)){try{gTokenClient.requestAccessToken({prompt:''})}catch{}}
}
window.addEventListener('load',initDrive);
// ── Productos independientes (con o sin cliente) ──
function findProduct(id){for(const c of data.clients){const p=c.products.find(x=>x.id===id);if(p)return{p,c}}const p=data.products.find(x=>x.id===id);return p?{p,c:null}:null}
function renderProducts(){
  const all=allProducts();
  document.getElementById('productCount').textContent=all.length;
  document.getElementById('productsCount').textContent=all.length;
  document.getElementById('productDirectory').innerHTML=all.map(({p,c})=>{
    const [bg,fg]=colors[(c.color||0)%colors.length];
    const units=p.low===p.high?p.low:`${p.low}–${p.high}`;
    const total=p.low===p.high?money(p.price*p.low,p.currency,2):`${money(p.price*p.low,p.currency,2)} – ${money(p.price*p.high,p.currency,2)}`;
    return `<article class="directory-card"><div class="directory-top"><div class="client-logo" style="background:${bg};color:${fg}">${safe(p.name.slice(0,1).toUpperCase())}</div><div><b>${safe(p.name)}</b><small>${safe(c.name)} · ${productLabel(p)}</small></div><div class="directory-total">${money(p.price,p.currency,2)}<small> / unidad</small></div><div class="directory-actions"><button class="subtle-button" data-edit-product="${p.id}">Editar</button><button class="subtle-button delete" data-delete-product="${p.id}">×</button></div></div><div class="product-pills"><span class="product-pill">${units} unidades <b>${total}</b></span></div></article>`;
  }).join('')||'<div class="empty-state">Aún no tienes productos. Crea uno sin necesidad de un cliente.</div>';
  document.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>openProduct(b.dataset.editProduct));
  document.querySelectorAll('[data-delete-product]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.deleteProduct));
}
function openProduct(id=null){
  const f=id?findProduct(id):null,p=f?.p,owner=f?.c;
  openModal(p?'Editar producto':'Nuevo producto',`<form id="productForm"><div class="form-grid"><label class="full">Cliente (opcional)<select name="clientId"><option value="">Sin cliente</option>${data.clients.map(c=>`<option value="${c.id}" ${owner?.id===c.id?'selected':''}>${safe(c.name)}</option>`).join('')}</select></label><div class="full">${productCard(p||{})}</div></div><div class="modal-actions"><button class="secondary-button" type="button" data-close>Cancelar</button><button class="primary-button">${p?'Guardar cambios':'Crear producto'}</button></div></form>`,p?'EDITAR PRODUCTO':'NUEVO PRODUCTO');
  const form=document.getElementById('productForm');
  form.querySelector('[data-remove-product]')?.remove();
  form.onsubmit=e=>{
    e.preventDefault();
    const card=form.querySelector('.product-edit-card'),g=n=>card.querySelector(`[name="${n}"]`).value;
    const np={id:p?.id||uid(),name:g('pname').trim(),currency:g('currency'),price:Number(g('price')),frequency:g('frequency'),low:Number(g('low')||1),high:Number(g('high')||1),start:g('start'),months:Number(g('months')||0)};
    if(p){if(owner)owner.products=owner.products.filter(x=>x.id!==p.id);else data.products=data.products.filter(x=>x.id!==p.id)}
    const target=data.clients.find(c=>c.id===form.elements.clientId.value);
    if(target)target.products.push(np);else data.products.push(np);
    save();closeModal();showToast(p?'Producto actualizado':'Producto creado');
  };
  bindClose();
}
function deleteProduct(id){
  const f=findProduct(id);if(!f)return;
  if(confirm(`¿Eliminar el producto ${f.p.name}?`)){
    if(f.c)f.c.products=f.c.products.filter(x=>x.id!==id);else data.products=data.products.filter(x=>x.id!==id);
    save();showToast('Producto eliminado');
  }
}
document.getElementById('newProduct').onclick=()=>openProduct();
document.getElementById('newProductBottom').onclick=()=>openProduct();
renderProducts();
