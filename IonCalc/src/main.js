import './style.css';
import { evaluate, derivative, parse } from 'mathjs';

const $ = (s) => document.querySelector(s);
const app = $('#app');
let mode = localStorage.getItem('ioncalc-theme') || 'dark';
let active = 'standard';
let expression = '';
let answer = '0';
let sciExpression = '';
let sciAnswer = '0';
const tabs = [
  ['standard','Calculator'], ['scientific','Scientific'], ['calculus','∫ Calculus'],
  ['age','Age'], ['tax','Tax'], ['split','Split'], ['currency','Currency'], ['convert','Convert']
];
const symbols = ['sin','cos','tan','asin','acos','atan','√','ln','log','π','e','x²','(',')','÷','×','−','+'];
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shell() {
 app.innerHTML = `<div class="shell">
  <header><div class="brand"><div class="logo">∑</div><div><b>IonCalc</b><small>ALL-IN-ONE CALCULATOR</small></div></div>
   <button class="theme" id="themeBtn" aria-label="Toggle theme">${mode==='dark'?'☀':'☾'} <span>${mode==='dark'?'Light':'Dark'}</span></button></header>
  <div class="intro"><div><div class="eyebrow">SMART CALCULATION SUITE</div><h1>Numbers, <span>made simple.</span></h1><p>Everyday maths to engineering calculations.</p></div><div class="orb">π</div></div>
  <nav class="tabs">${tabs.map(([id,n])=>`<button data-tab="${id}" class="${id===active?'selected':''}">${n}</button>`).join('')}</nav>
  <main id="panel"></main>
  <footer>IonCalc <span>•</span> Built for learning and everyday use</footer>
 </div>`;
 $('#themeBtn').onclick=()=>{mode=mode==='dark'?'light':'dark';localStorage.setItem('ioncalc-theme',mode);document.documentElement.dataset.theme=mode;shell();};
 document.documentElement.dataset.theme=mode;
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{active=b.dataset.tab;shell();});
 renderPanel();
}
function renderPanel(){
 const p=$('#panel');
 if(active==='standard'||active==='scientific') return calculator(p,active==='scientific');
 if(active==='calculus') return calculus(p);
 if(active==='age') return age(p);
 if(active==='tax') return tax(p);
 if(active==='split') return split(p);
 if(active==='currency') return currency(p);
 if(active==='convert') return convert(p);
}
function calculator(p, sci){
 const val=sci?sciExpression:expression, result=sci?sciAnswer:answer;
 p.innerHTML=`<section class="card calc"><div class="cardhead"><div><span class="eyebrow">${sci?'ENGINEERING MODE':'QUICK CALCULATION'}</span><h2>${sci?'Scientific calculator':'Standard calculator'}</h2></div><span class="chip">${sci?'TCS iON-style layout':'BASIC'}</span></div>
 <div class="display"><div class="history">${esc(val||'Enter an expression')}</div><div class="result">${esc(result)}</div></div>
 ${sci?`<div class="keygrid scientific">${symbols.map(x=>`<button class="key fn" data-key="${x}">${x}</button>`).join('')}</div>`:''}
 <div class="keygrid">${['AC','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','±','0','.','='].map(x=>`<button class="key ${['=','+','−','×','÷'].includes(x)?'operator':''} ${x==='='?'equals':''} " data-key="${x}">${x}</button>`).join('')}</div>
 <p class="hint">Keyboard supported · Use × for multiplication and ÷ for division</p></section>`;
 p.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>calcKey(b.dataset.key,sci));
}
function calcKey(k,sci){
 let v=sci?sciExpression:expression, r=sci?sciAnswer:answer;
 const set=(nv,nr=r)=>{if(sci){sciExpression=nv;sciAnswer=nr;}else{expression=nv;answer=nr;}calculator($('#panel'),sci);};
 if(k==='AC') return set('','0');
 if(k==='⌫') return set(v.slice(0,-1),'0');
 if(k==='='){try{const clean=v.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/x²/g,'^2');set(v,String(evaluate(clean)));}catch{set(v,'Error');}return;}
 if(k==='±') return set(v.startsWith('-')?v.slice(1):'-'+v);
 if(k==='%') return set(v+'/100');
 const map={'×':'*','÷':'/','−':'-','π':'pi','√':'sqrt(','ln':'log(','log':'log10(','sin':'sin(','cos':'cos(','tan':'tan(','asin':'asin(','acos':'acos(','atan':'atan(','x²':'^2'};
 set(v+(map[k]??k),'0');
}
function cardHead(kicker,title,chip='TOOL'){return `<div class="cardhead"><div><span class="eyebrow">${kicker}</span><h2>${title}</h2></div><span class="chip">${chip}</span></div>`}
function field(label,id,placeholder='',type='number',value=''){return `<label class="field">${label}<input id="${id}" type="${type}" placeholder="${placeholder}" value="${value}"></label>`}
function output(id){return `<div class="output" id="${id}">Your result will appear here.</div>`}
function calculus(p){
 p.innerHTML=`<section class="card">${cardHead('ENGINEERING MATHS','Integral & differential calculator','CALCULUS')}
 <div class="switchrow"><span>Choose operation</span><div class="seg"><button class="active" id="diffBtn">Differential</button><button id="intBtn">Integral</button></div></div>
 <div class="grid2">${field('Function f(x)','fn','e.g. x^3 + 2*x')}${field('Evaluate at x =','atx','e.g. 2')}</div>
 <div id="integralBounds" class="grid2 hidden">${field('Lower bound','lower','e.g. 0')}${field('Upper bound','upper','e.g. 2')}</div>
 <button class="primary" id="solveCalc">Calculate</button>${output('calcOut')}
 <p class="hint">Differentiation uses symbolic differentiation. Definite integration uses numerical Simpson’s rule. Enter expressions using * for multiplication.</p></section>`;
 let op='diff'; const db=$('#diffBtn'), ib=$('#intBtn'), bounds=$('#integralBounds');
 db.onclick=()=>{op='diff';db.classList.add('active');ib.classList.remove('active');bounds.classList.add('hidden');};
 ib.onclick=()=>{op='int';ib.classList.add('active');db.classList.remove('active');bounds.classList.remove('hidden');};
 $('#solveCalc').onclick=()=>{
  try{const f=$('#fn').value.trim();if(!f)throw Error('Enter a function first.');
   if(op==='diff'){const d=derivative(f,'x').toString();const x=Number($('#atx').value||0);$('#calcOut').innerHTML=`<small>DERIVATIVE</small><strong>f′(x) = ${esc(d)}</strong><span>At x = ${x}: ${Number(evaluate(d,{x})).toPrecision(8)}</span>`;}
   else{const a=Number($('#lower').value),b=Number($('#upper').value);if(!Number.isFinite(a)||!Number.isFinite(b)||a===b)throw Error('Enter two different finite bounds.');const n=1000,h=(b-a)/n;let sum=evaluate(f,{x:a})+evaluate(f,{x:b});for(let i=1;i<n;i++)sum+=(i%2?4:2)*evaluate(f,{x:a+i*h});$('#calcOut').innerHTML=`<small>DEFINITE INTEGRAL · SIMPSON’S RULE</small><strong>∫ f(x) dx ≈ ${((h/3)*sum).toPrecision(10)}</strong><span>From ${a} to ${b}</span>`;}
  }catch(e){$('#calcOut').textContent='Could not calculate: '+e.message;}
 };
}
function age(p){
 p.innerHTML=`<section class="card">${cardHead('DATE & TIME','Age calculator')}<div class="grid2">${field('Date of birth','dob','','date')}${field('Calculate age on','ageOn','','date',new Date().toISOString().slice(0,10))}</div><button class="primary" id="ageGo">Calculate age</button>${output('ageOut')}</section>`;
 $('#ageGo').onclick=()=>{const d=new Date($('#dob').value+'T00:00:00'),t=new Date($('#ageOn').value+'T00:00:00');if(!$('#dob').value||isNaN(d)||t<d)return $('#ageOut').textContent='Please enter valid dates.';let y=t.getFullYear()-d.getFullYear(),m=t.getMonth()-d.getMonth(),day=t.getDate()-d.getDate();if(day<0){m--;day+=new Date(t.getFullYear(),t.getMonth(),0).getDate();}if(m<0){y--;m+=12;}$('#ageOut').innerHTML=`<small>YOUR AGE</small><strong>${y} years, ${m} months, ${day} days</strong>`;};
}
function tax(p){
 p.innerHTML=`<section class="card">${cardHead('INDIA · ESTIMATOR','GST / tax calculator','INR')}<div class="grid2">${field('Amount (₹)','taxAmt','e.g. 10000')}${`<label class="field">GST rate<select id="gstRate"><option value="5">5%</option><option value="12">12%</option><option value="18" selected>18%</option><option value="28">28%</option><option value="custom">Custom</option></select></label>`}</div><div class="grid2">${`<label class="field">Calculation<select id="taxMode"><option value="add">Add tax to amount</option><option value="remove">Remove tax from inclusive amount</option></select></label>`}${field('Custom rate (%)','customRate','e.g. 3')}</div><button class="primary" id="taxGo">Calculate tax</button>${output('taxOut')}<p class="hint">This is a general GST estimator, not tax filing or professional tax advice.</p></section>`;
 $('#taxGo').onclick=()=>{const a=Number($('#taxAmt').value),r=$('#gstRate').value==='custom'?Number($('#customRate').value):Number($('#gstRate').value);if(!(a>=0)||!(r>=0))return $('#taxOut').textContent='Enter valid amount and rate.';let tax,base,total;if($('#taxMode').value==='add'){base=a;tax=a*r/100;total=a+tax;}else{total=a;base=a/(1+r/100);tax=total-base;}$('#taxOut').innerHTML=`<div class="stats"><div><small>BASE AMOUNT</small><b>₹${base.toFixed(2)}</b></div><div><small>TAX</small><b>₹${tax.toFixed(2)}</b></div><div><small>TOTAL</small><b>₹${total.toFixed(2)}</b></div></div>`;};
}
function split(p){
 p.innerHTML=`<section class="card">${cardHead('SHARE THE BILL','Bill split calculator')}<div class="grid2">${field('Total bill amount (₹)','bill','e.g. 2450')}${field('Number of persons','persons','e.g. 4')}</div><div class="grid2">${field('Tip / extra (%)','tip','0')}</div><button class="primary" id="splitGo">Split bill</button>${output('splitOut')}</section>`;
 $('#splitGo').onclick=()=>{const b=Number($('#bill').value),n=Math.floor(Number($('#persons').value)),t=Number($('#tip').value||0);if(!(b>=0)||n<1||n>10000||t<0)return $('#splitOut').textContent='Enter a valid bill, person count and tip.';const total=b*(1+t/100);$('#splitOut').innerHTML=`<small>AMOUNT PER PERSON</small><strong>₹${(total/n).toFixed(2)}</strong><span>Total including tip: ₹${total.toFixed(2)} · ${n} people</span>`;};
}
function currency(p){
 const codes=['INR','USD','EUR','GBP','JPY','AUD','CAD','SGD','AED','CHF','CNY'];
 p.innerHTML=`<section class="card">${cardHead('LIVE EXCHANGE RATES','Currency converter','ONLINE')}<div class="grid2">${field('Amount','curAmt','1','number','1')}<label class="field">From<select id="fromCur">${codes.map(c=>`<option ${c==='INR'?'selected':''}>${c}</option>`)}</select></label><label class="field">To<select id="toCur">${codes.map(c=>`<option ${c==='USD'?'selected':''}>${c}</option>`)}</select></label></div><button class="primary" id="curGo">Convert currency</button>${output('curOut')}<p class="hint">Rates are fetched from the Frankfurter public exchange-rate service. Internet connection required; rates may be delayed.</p></section>`;
 $('#curGo').onclick=async()=>{const a=Number($('#curAmt').value),f=$('#fromCur').value,t=$('#toCur').value;if(!Number.isFinite(a))return $('#curOut').textContent='Enter a valid amount.';$('#curOut').textContent='Fetching latest available rate…';try{const res=await fetch(`https://api.frankfurter.app/latest?amount=${encodeURIComponent(a)}&from=${f}&to=${t}`);if(!res.ok)throw Error('Rate service unavailable');const data=await res.json();$('#curOut').innerHTML=`<small>${a} ${f} IN ${t}</small><strong>${Number(data.rates[t]).toLocaleString(undefined,{maximumFractionDigits:4})} ${t}</strong><span>Rate date: ${esc(data.date)}</span>`;}catch(e){$('#curOut').textContent=e.message+'. Check your internet connection.';}};
}
function convert(p){
 const opts={Length:['Meters','Kilometers','Miles','Feet','Inches'],Weight:['Kilograms','Grams','Pounds','Ounces'],Temperature:['Celsius','Fahrenheit','Kelvin'],Area:['Square meters','Square feet','Acres','Hectares'],Speed:['m/s','km/h','mph']};
 p.innerHTML=`<section class="card">${cardHead('QUICK UNIT TOOLS','Unit converter')}<label class="field">Category<select id="unitCat">${Object.keys(opts).map(x=>`<option>${x}</option>`)}</select></label><div class="grid2"><label class="field">From<select id="unitFrom"></select></label><label class="field">To<select id="unitTo"></select></label></div>${field('Value','unitVal','Enter value','number','1')}<button class="primary" id="unitGo">Convert</button>${output('unitOut')}</section>`;
 const update=()=>{const a=opts[$('#unitCat').value];$('#unitFrom').innerHTML=a.map(x=>`<option>${x}</option>`).join('');$('#unitTo').innerHTML=a.map((x,i)=>`<option ${i===1?'selected':''}>${x}</option>`).join('');};$('#unitCat').onchange=update;update();
 $('#unitGo').onclick=()=>{const v=Number($('#unitVal').value),cat=$('#unitCat').value,f=$('#unitFrom').value,t=$('#unitTo').value;if(!Number.isFinite(v))return $('#unitOut').textContent='Enter a valid number.';let result;
 const groups={Length:{Meters:1,Kilometers:1000,Miles:1609.344,Feet:.3048,Inches:.0254},Weight:{Kilograms:1,Grams:.001,Pounds:.45359237,Ounces:.0283495},Area:{'Square meters':1,'Square feet':.092903,Acres:4046.856,Hectares:10000},Speed:{'m/s':1,'km/h':1/3.6,mph:.44704}};
 if(cat==='Temperature'){let c=f==='Celsius'?v:f==='Fahrenheit'?(v-32)*5/9:v-273.15;result=t==='Celsius'?c:t==='Fahrenheit'?c*9/5+32:c+273.15;}else result=v*groups[cat][f]/groups[cat][t];
 $('#unitOut').innerHTML=`<small>CONVERTED VALUE</small><strong>${Number(result.toPrecision(10)).toLocaleString()} ${esc(t)}</strong><span>${v} ${esc(f)} = ${result} ${esc(t)}</span>`;};
}
shell();