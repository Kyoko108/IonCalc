import './style.css';
import { evaluate, derivative, parse } from 'mathjs';
import { renderCodeLab, renderVerilogLab } from './coding.js';
import { renderCircuitLab } from './circuitlab.js';

const $ = (s) => document.querySelector(s);
const app = $('#app');
let mode = localStorage.getItem('ioncalc-theme') || 'dark';
let active = 'circuit';
let expression = '';
let answer = '0';
let sciExpression = '';
let sciAnswer = '0';
const tabs = [
  ['scientific','Scientific'], ['calculus','∫ Calculus'],
  ['age','Age'], ['tax','Tax'], ['split','Split'], ['currency','Currency'], ['convert','Convert'], ['logic','Logic Gates'], ['signals','Signal Graphs'], ['code','Code Studio'], ['verilog','Verilog'], ['circuit','Circuit Lab']
];
const symbols = ['sin','cos','tan','asin','acos','atan','√','ln','log','π','e','x²','!','nPr','nCr','(',')','÷','×','−','+'];
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
 if(active==='logic') return logicGates(p);
 if(active==='signals') return signalGraphs(p);
 if(active==='code') return renderCodeLab(p);
 if(active==='verilog') return renderVerilogLab(p);
 if(active==='circuit') return renderCircuitLab(p);
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
 if(k==='='){try{const clean=v.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/x²/g,'^2');const factorial=n=>{if(!Number.isInteger(n)||n<0||n>170)throw Error('Factorial requires an integer from 0 to 170.');let z=1;for(let i=2;i<=n;i++)z*=i;return z;};const choose=(n,r)=>{if(!Number.isInteger(n)||!Number.isInteger(r)||n<0||r<0||r>n||n>170)throw Error('n and r must be integers with 0 ≤ r ≤ n ≤ 170.');let z=1;for(let i=1;i<=r;i++)z=z*(n-r+i)/i;return Math.round(z);};const scope={factorial,nPr:(n,r)=>choose(n,r)*factorial(r),nCr:choose};set(v,String(evaluate(clean,scope)));}catch{set(v,'Error');}return;}
 if(k==='±') return set(v.startsWith('-')?v.slice(1):'-'+v);\n if(k==='nPr'||k==='nCr') return set(v+k+'(','0');\n if(k==='!') return set(v+'!','0');
 if(k==='%') return set(v+'/100');
 const map={'×':'*','÷':'/','−':'-','π':'pi','√':'sqrt(','ln':'log(','log':'log10(','sin':'sin(','cos':'cos(','tan':'tan(','asin':'asin(','acos':'acos(','atan':'atan(','x²':'^2'};
 set(v+(map[k]??k),'0');
}
function normalizePowers(s){const sup={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+'};return String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g,m=>'^('+[...m].map(c=>sup[c]).join('')+')').replace(/x\s*\^\s*\(([-+]?\d+)\)/g,'x^$1');}\nfunction cardHead(kicker,title,chip='TOOL'){return `<div class="cardhead"><div><span class="eyebrow">${kicker}</span><h2>${title}</h2></div><span class="chip">${chip}</span></div>`}
function field(label,id,placeholder='',type='number',value=''){return `<label class="field">${label}<input id="${id}" type="${type}" placeholder="${placeholder}" value="${value}"></label>`}
function output(id){return `<div class="output" id="${id}">Your result will appear here.</div>`}
function calculus(p){
 p.innerHTML=`<section class="card">${cardHead('ENGINEERING MATHS','Integral & differential calculator','CALCULUS')}
 <div class="switchrow"><span>Choose operation</span><div class="seg"><button class="active" id="diffBtn">Differential</button><button id="intBtn">Integral</button></div></div>
 <div class="grid2">${field('Function f(x)','fn','e.g. x^3 + 2*x','text')}${field('Evaluate at x =','atx','e.g. 2')}</div>
 <div id="integralBounds" class="grid2 hidden">${field('Lower bound','lower','e.g. 0')}${field('Upper bound','upper','e.g. 2')}</div>
 <button class="primary" id="solveCalc">Calculate</button>${output('calcOut').replace('class="output"','class="output calc-output"')}
 <p class="hint">Differentiation uses symbolic differentiation. Definite integration uses numerical Simpson’s rule. Enter expressions using * for multiplication.</p></section>`;
 let op='diff'; const db=$('#diffBtn'), ib=$('#intBtn'), bounds=$('#integralBounds');
 db.onclick=()=>{op='diff';db.classList.add('active');ib.classList.remove('active');bounds.classList.add('hidden');};
 ib.onclick=()=>{op='int';ib.classList.add('active');db.classList.remove('active');bounds.classList.remove('hidden');};
 $('#solveCalc').onclick=()=>{
  try{const f=normalizePowers($('#fn').value.trim());if(!f)throw Error('Enter a function first.');
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

// Interactive digital logic gate laboratory.
function logicGates(p){
 p.innerHTML=`<section class="card">${cardHead('DIGITAL ELECTRONICS','Logic gate simulator','LIVE LOGIC')}
 <div class="logic-layout"><div>
 <label class="field">Select logic gate<select id="gateType"><option>AND</option><option>OR</option><option>NOT</option><option>NAND</option><option>NOR</option><option>XOR</option><option>XNOR</option></select></label>
 <div class="logic-inputs" id="logicInputs"></div>
 <div class="logic-output" id="logicOutput" aria-live="polite"><span>OUTPUT</span><b>0</b></div>
 </div><div class="gate-symbol" id="gateSymbol"><span>AND</span><small>A · B → Y</small></div></div>
 <h3 class="subheading">Truth table</h3><div class="table-wrap"><table class="truth-table"><thead id="truthHead"></thead><tbody id="truthBody"></tbody></table></div>
 <p class="hint">Toggle the input switches to see the output update instantly. NOT uses only input A; all other gates use A and B.</p></section>`;
 let a=0,b=0;
 const calc=(gate,x,y)=>{switch(gate){case'AND':return x&y;case'OR':return x|y;case'NOT':return x?0:1;case'NAND':return (x&y)^1;case'NOR':return (x|y)^1;case'XOR':return x^y;case'XNOR':return (x^y)^1;}};
 const draw=()=>{const g=$('#gateType').value,not=g==='NOT';$('#logicInputs').innerHTML=`<div class="logic-switch"><span>Input A</span><button id="inputA" class="toggle ${a?'on':''}" aria-pressed="${!!a}">${a?'1 · HIGH':'0 · LOW'}</button></div>${not?'':`<div class="logic-switch"><span>Input B</span><button id="inputB" class="toggle ${b?'on':''}" aria-pressed="${!!b}">${b?'1 · HIGH':'0 · LOW'}</button></div>`}`;
  const out=calc(g,a,b);$('#logicOutput b').textContent=out;$('#logicOutput').classList.toggle('high',!!out);$('#gateSymbol').innerHTML=`<span>${g}</span><small>${not?'A → Y':'A · B → Y'}</small>`;
  const rows=not?[[0,calc(g,0,0)],[1,calc(g,1,0)]]:[[0,0],[0,1],[1,0],[1,1]].map(([x,y])=>[x,y,calc(g,x,y)]);
  $('#truthHead').innerHTML=`<tr>${(not?['A','Y']:['A','B','Y']).map(x=>`<th>${x}</th>`).join('')}</tr>`;
  $('#truthBody').innerHTML=rows.map(row=>`<tr>${row.map((v,i)=>`<td class="${i===row.length-1?'result-cell':''}">${v}</td>`).join('')}</tr>`).join('');
  $('#inputA').onclick=()=>{a^=1;draw();};if(!not)$('#inputB').onclick=()=>{b^=1;draw();};
 };
 $('#gateType').onchange=draw;draw();
}

// Canvas plotter for continuous-time curves and discrete-time sequences.
function signalGraphs(p){
 p.innerHTML=`<section class="card">${cardHead('SIGNALS & SYSTEMS','Signal graphing calculator','PLOTTER')}
 <div class="seg signal-mode"><button class="active" id="continuousBtn">Continuous-time x(t)</button><button id="discreteBtn">Discrete-time x[n]</button></div>
 <label class="field">Signal expression<input id="signalExpr" type="text" value="sin(2*pi*t)" autocomplete="off" spellcheck="false"></label>
 <div class="grid2">${field('Start','sigStart','-5','number','-5')}${field('End','sigEnd','5','number','5')}</div>
 <div class="example-row"><span>Examples</span><button data-example="sin(2*pi*t)">Sine</button><button data-example="cos(t)">Cosine</button><button data-example="exp(-abs(t))*sin(5*t)">Damped sine</button><button data-example="(-1)^n">Alternating</button><button data-example="n>=0 ? 1 : 0">Unit step</button></div>
 <button class="primary" id="plotSignal">Plot signal</button>
 <div class="plot-meta" id="plotMeta">Continuous-time signal · x-axis: t</div>
 <div class="plot-frame"><canvas id="signalCanvas" aria-label="Signal plot"></canvas></div>
 <div class="plot-legend"><span><i class="legend-line"></i> Signal</span><span><i class="legend-axis"></i> Axes</span></div>
 <p class="hint">Use Math.js expressions. Continuous mode samples x(t) and joins the points; discrete mode evaluates integer n and draws stems. Angles in Math.js trigonometric functions are radians. Try t, n, pi, e, sin(), cos(), exp(), abs(), sqrt().</p>
 <div class="output" id="signalStatus">Enter an expression and select Plot signal.</div></section>`;
 let discrete=false;
 const mode=(d)=>{discrete=d;$('#continuousBtn').classList.toggle('active',!d);$('#discreteBtn').classList.toggle('active',d);$('#signalExpr').value=d?'(-1)^n':'sin(2*pi*t)';$('#plotMeta').textContent=d?'Discrete-time sequence · x-axis: n':'Continuous-time signal · x-axis: t';plot();};
 $('#continuousBtn').onclick=()=>mode(false);$('#discreteBtn').onclick=()=>mode(true);
 p.querySelectorAll('[data-example]').forEach(btn=>btn.onclick=()=>{const d=btn.dataset.example.includes('n');mode(d);$('#signalExpr').value=btn.dataset.example;plot();});
 $('#plotSignal').onclick=plot;
 function plot(){
  const canvas=$('#signalCanvas');if(!canvas)return;const expr=$('#signalExpr').value.trim();const start=Number($('#sigStart').value),end=Number($('#sigEnd').value);
  if(!expr||!Number.isFinite(start)||!Number.isFinite(end)||end<=start){$('#signalStatus').textContent='Enter a valid expression and a start value smaller than the end value.';return;}
  if(discrete&&(!Number.isInteger(start)||!Number.isInteger(end)||end-start>300)){ $('#signalStatus').textContent='Discrete-time limits must be integers, with no more than 300 samples.';return; }
  let xs=[],ys=[];try{const compiled=parse(expr).compile();const count=discrete?Math.round(end-start)+1:700;for(let i=0;i<count;i++){const x=discrete?start+i:start+(end-start)*i/(count-1);const y=compiled.evaluate(discrete?{n:x}:{t:x});if(typeof y!=='number'||!Number.isFinite(y))throw Error('The expression must return finite real numbers over this range.');xs.push(x);ys.push(y);}}catch(e){$('#signalStatus').textContent='Could not plot: '+e.message;return;}
  let ymin=Math.min(0,...ys),ymax=Math.max(0,...ys);if(ymax===ymin){ymax+=1;ymin-=1;}const pad=(ymax-ymin)*.12;ymin-=pad;ymax+=pad;
  const rect=canvas.getBoundingClientRect(),w=Math.max(320,rect.width),h=320,dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const css=getComputedStyle(document.documentElement),line=css.getPropertyValue('--accent').trim()||'#a78bfa',axis=css.getPropertyValue('--muted').trim()||'#9ba6bb',grid=css.getPropertyValue('--line').trim()||'#30394b',bg=css.getPropertyValue('--panel2').trim()||'#202737';ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const L=48,R=14,T=18,B=35,pw=w-L-R,ph=h-T-B,px=x=>L+(x-start)/(end-start)*pw,py=y=>T+(ymax-y)/(ymax-ymin)*ph;
  ctx.font='11px monospace';ctx.lineWidth=1;ctx.strokeStyle=grid;ctx.fillStyle=axis;
  for(let i=0;i<=5;i++){const y=ymin+(ymax-ymin)*i/5,yy=py(y);ctx.beginPath();ctx.moveTo(L,yy);ctx.lineTo(w-R,yy);ctx.stroke();ctx.fillText(Number(y.toPrecision(3)).toString(),5,yy+4);}
  for(let i=0;i<=6;i++){const x=start+(end-start)*i/6,xx=px(x);ctx.beginPath();ctx.moveTo(xx,T);ctx.lineTo(xx,h-B);ctx.stroke();ctx.fillText(Number(x.toPrecision(3)).toString(),xx-12,h-12);}
  ctx.strokeStyle=axis;ctx.lineWidth=1.5;ctx.beginPath();if(start<=0&&end>=0){ctx.moveTo(px(0),T);ctx.lineTo(px(0),h-B);}if(ymin<=0&&ymax>=0){ctx.moveTo(L,py(0));ctx.lineTo(w-R,py(0));}ctx.stroke();
  ctx.strokeStyle=line;ctx.fillStyle=line;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.beginPath();
  if(discrete){xs.forEach((x,i)=>{const xx=px(x),yy=py(ys[i]);ctx.moveTo(xx,py(0));ctx.lineTo(xx,yy);});ctx.stroke();xs.forEach((x,i)=>{ctx.beginPath();ctx.arc(px(x),py(ys[i]),3.6,0,Math.PI*2);ctx.fill();});}
  else{xs.forEach((x,i)=>{const xx=px(x),yy=py(ys[i]);if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});ctx.stroke();}
  $('#signalStatus').innerHTML=`<small>${discrete?'DISCRETE SEQUENCE':'CONTINUOUS SIGNAL'}</small><strong>${xs.length} samples plotted</strong><span>Range: ${start} to ${end} · y-range: ${Number(Math.min(...ys).toPrecision(5))} to ${Number(Math.max(...ys).toPrecision(5))}</span>`;
 }
 if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(()=>plot());ro.observe($('#signalCanvas'));}plot();
}
