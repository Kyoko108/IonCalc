const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let parts = [];
let wires = [];
let selected = null;
let nextId = 1;
let wireStart = null;
let result = null;
let drag = null;
const defaults = {
  resistor: { value: 1000, unit: 'Ω', pins: [[-42,0],[42,0]] },
  source: { value: 5, unit: 'V', pins: [[0,-42],[0,42]] },
  ground: { value: 0, unit: 'GND', pins: [[0,-8]] }
};
function addPart(type, x, y) {
  const d = defaults[type];
  parts.push({id:nextId++,type,x,y,value:d.value,ref:type==='resistor'?'R'+nextId:type==='source'?'V'+nextId:'GND'+nextId});
  selected = parts[parts.length-1].id; result = null; render();
}
function point(p, pin) { const d=defaults[p.type].pins[pin]; return [p.x+d[0],p.y+d[1]]; }
function pinMarkup(p, i) { const q=point(p,i); return '<circle class="cl-pin" data-pin="'+p.id+':'+i+'" cx="'+q[0]+'" cy="'+q[1]+'" r="5"/>'; }
function symbol(p) {
  if(p.type==='resistor') return '<path d="M -42 0 H -25 L -18 -12 L -6 12 L 6 -12 L 18 12 L 25 0 H 42" class="cl-symbol"/>';
  if(p.type==='source') return '<path d="M 0 -42 V -14 M 0 14 V 42" class="cl-symbol"/><circle cx="0" cy="0" r="14" class="cl-symbol"/><path d="M -6 -5 H 6 M 0 -11 V 1 M -6 7 H 6" class="cl-symbol"/>';
  return '<path d="M 0 -8 V 0 M -16 0 H 16 M -10 6 H 10 M -4 12 H 4" class="cl-symbol"/>';
}
function renderCircuitLab(host) {
  host.innerHTML = '<section class="card cl-card"><div class="cardhead"><div><span class="eyebrow">ANALOG DESIGN WORKSPACE</span><h2>Circuit Lab</h2></div><span class="chip">BETA · DC</span></div><p class="cl-intro">Build a small schematic, connect nodes and solve its DC operating point. This is an educational simulator, not a full SPICE engine yet.</p><div class="cl-toolbar"><button data-add="resistor">＋ Resistor</button><button data-add="source">＋ DC source</button><button data-add="ground">＋ Ground</button><button id="cl-wire" class="cl-mode">Wire: off</button><button id="cl-delete">Delete selected</button><button id="cl-demo">Load demo</button></div><div class="cl-work"><div class="cl-canvas-wrap"><svg id="cl-svg" viewBox="0 0 760 430" role="img" aria-label="Circuit schematic editor"><defs><pattern id="cl-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" class="cl-grid-dot"/></pattern></defs><rect width="760" height="430" fill="url(#cl-grid)"/><g id="cl-wires"></g><g id="cl-parts"></g></svg></div><aside class="cl-inspector"><h3>Properties</h3><div id="cl-properties"><p>Select a component to edit its value.</p></div><div class="cl-help">Tip: select Wire, then click one pin and another pin to connect them. Drag components to arrange the schematic.</div></aside></div><div class="cl-actions"><button id="cl-run" class="primary">Run DC operating point</button><button id="cl-reset">Clear circuit</button></div><div id="cl-output" class="cl-output"><strong>Ready</strong><p>Add a voltage source, resistor and ground, then connect their pins.</p></div></section>';
  if (!document.getElementById('cl-style')) {
    const style=document.createElement('style'); style.id='cl-style';
    style.textContent='.cl-card{max-width:100%}.cl-intro,.cl-help{color:var(--muted);font-size:12px;line-height:1.6}.cl-toolbar,.cl-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.cl-toolbar button,.cl-actions button:not(.primary){border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:10px;padding:10px 12px;cursor:pointer;font-size:12px}.cl-toolbar button.active{border-color:var(--accent);color:var(--accent)}.cl-work{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:14px}.cl-canvas-wrap{min-width:0;overflow:auto;border:1px solid var(--line);border-radius:14px;background:var(--panel2)}#cl-svg{display:block;width:100%;min-width:560px;height:auto;min-height:340px;touch-action:none}.cl-grid-dot{fill:var(--muted);opacity:.45}.cl-symbol{fill:none;stroke:var(--text);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.cl-part{cursor:grab}.cl-part.selected .cl-symbol{stroke:var(--accent)}.cl-label{fill:var(--text);font:12px monospace;text-anchor:middle}.cl-value{fill:var(--muted);font:10px monospace;text-anchor:middle}.cl-pin{fill:var(--accent2);stroke:var(--panel);stroke-width:2;cursor:pointer}.cl-wire{stroke:var(--accent2);stroke-width:2.5;fill:none}.cl-inspector{background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:14px}.cl-inspector h3{font-size:14px;margin:0 0 12px}.cl-inspector p{font-size:12px;color:var(--muted)}.cl-inspector input{width:100%;padding:9px;border-radius:8px;border:1px solid var(--line);background:var(--panel);color:var(--text);margin:5px 0 12px}.cl-inspector label{display:block;font-size:11px;color:var(--muted)}.cl-help{margin-top:18px}.cl-output{margin-top:14px;padding:16px;border-radius:12px;background:var(--panel2);border:1px solid var(--line);font-size:12px;color:var(--muted);overflow-wrap:anywhere}.cl-output strong{display:block;color:var(--text);font-size:15px;margin-bottom:6px}.cl-output table{width:100%;border-collapse:collapse}.cl-output td{padding:6px;border-bottom:1px solid var(--line)}@media(max-width:760px){.cl-work{grid-template-columns:1fr}.cl-inspector{order:2}}';
    document.head.appendChild(style);
  }
  const svg=host.querySelector('#cl-svg');
  function draw() {
    host.querySelector('#cl-wires').innerHTML=wires.map(w=>{const a=parts.find(p=>p.id===w.a),b=parts.find(p=>p.id===w.b);if(!a||!b)return '';const p=point(a,w.ai),q=point(b,w.bi),mx=(p[0]+q[0])/2;return '<path class="cl-wire" d="M '+p[0]+' '+p[1]+' H '+mx+' V '+q[1]+' H '+q[0]+'"/>';}).join('');
    host.querySelector('#cl-parts').innerHTML=parts.map(p=>'<g class="cl-part '+(p.id===selected?'selected':'')+'" data-part="'+p.id+'" transform="translate('+p.x+' '+p.y+')">'+symbol(p)+'<text class="cl-label" y="-25">'+esc(p.ref)+'</text><text class="cl-value" y="31">'+esc(String(p.value)+(defaults[p.type].unit==='Ω'?' Ω':defaults[p.type].unit==='V'?' V':''))+'</text>'+defaults[p.type].pins.map((_,i)=>pinMarkup(p,i)).join('')+'</g>').join('');
    renderProperties();
  }
  function renderProperties() {
    const p=parts.find(x=>x.id===selected), box=host.querySelector('#cl-properties');
    if(!p){box.innerHTML='<p>Select a component to edit its value.</p>';return;}
    box.innerHTML='<label>Reference</label><input id="cl-ref" value="'+esc(p.ref)+'"><label>Value ('+defaults[p.type].unit+')</label><input id="cl-value" type="number" value="'+p.value+'" '+(p.type==='ground'?'disabled':'')+'>';
    box.querySelector('#cl-ref').onchange=e=>{p.ref=e.target.value||p.ref;draw();};
    box.querySelector('#cl-value').onchange=e=>{p.value=Number(e.target.value);result=null;draw();};
  }
  function status(title,body){host.querySelector('#cl-output').innerHTML='<strong>'+title+'</strong>'+body;}
  function parsePin(s){const [id,i]=s.split(':').map(Number);return {id, i};}
  svg.addEventListener('click',e=>{
    const pin=e.target.closest('[data-pin]');
    if(wireStart!==null && pin){const end=parsePin(pin.dataset.pin);if(wireStart.id!==end.id||wireStart.i!==end.i)wires.push({a:wireStart.id,ai:wireStart.i,b:end.id,bi:end.i});wireStart=null;host.querySelector('#cl-wire').classList.remove('active');host.querySelector('#cl-wire').textContent='Wire: off';draw();return;}
    const g=e.target.closest('[data-part]');
    if(g){selected=Number(g.dataset.part);draw();}
  });
  svg.addEventListener('pointerdown',e=>{const g=e.target.closest('[data-part]');if(!g||wireStart!==null)return;const p=parts.find(x=>x.id===Number(g.dataset.part));selected=p.id;const r=svg.getBoundingClientRect();drag={p,dx:(e.clientX-r.left)*760/r.width-p.x,dy:(e.clientY-r.top)*430/r.height-p.y};svg.setPointerCapture(e.pointerId);});
  svg.addEventListener('pointermove',e=>{if(!drag)return;const r=svg.getBoundingClientRect();drag.p.x=Math.max(50,Math.min(710,(e.clientX-r.left)*760/r.width-drag.dx));drag.p.y=Math.max(50,Math.min(380,(e.clientY-r.top)*430/r.height-drag.dy));draw();});
  svg.addEventListener('pointerup',()=>{drag=null;});
  host.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addPart(b.dataset.add,180+Math.random()*300,100+Math.random()*200));
  host.querySelector('#cl-wire').onclick=e=>{wireStart=null;const on=e.currentTarget.classList.toggle('active');e.currentTarget.textContent='Wire: '+(on?'on':'off');};
  svg.addEventListener('click',e=>{if(!host.querySelector('#cl-wire').classList.contains('active'))return;const pin=e.target.closest('[data-pin]');if(!pin)return;const p=parsePin(pin.dataset.pin);if(wireStart===null){wireStart=p;status('Wire mode','<p>Now click a destination pin.</p>');}else{wireStart=null;}});
  host.querySelector('#cl-delete').onclick=()=>{if(selected===null)return;parts=parts.filter(p=>p.id!==selected);wires=wires.filter(w=>w.a!==selected&&w.b!==selected);selected=null;draw();};
  host.querySelector('#cl-reset').onclick=()=>{parts=[];wires=[];selected=null;result=null;nextId=1;draw();status('Circuit cleared','<p>Add components to begin.</p>');};
  host.querySelector('#cl-demo').onclick=()=>{parts=[];wires=[];nextId=1;addPart('source',150,200);addPart('resistor',350,200);addPart('ground',550,200);wires=[{a:1,ai:0,b:2,bi:0},{a:2,ai:1,b:3,bi:0},{a:3,ai:0,b:1,bi:1}];draw();status('Demo loaded','<p>5 V source with a 1 kΩ load. Run DC analysis to inspect the node voltages.</p>');};
  host.querySelector('#cl-run').onclick=()=>{const out=solveDc();if(out.error){status('Simulation stopped','<p>'+esc(out.error)+'</p>');return;}status('DC operating point','<table>'+out.nodes.map((v,i)=>'<tr><td>Node '+i+'</td><td>'+v.toFixed(6)+' V</td></tr>').join('')+'</table><p>Educational nodal solver: ideal DC source and resistors only.</p>');};
  function solveDc(){
    if(!parts.some(p=>p.type==='ground'))return {error:'Place a ground reference.'};
    const nodes=new Map();let count=0;const key=(id,i)=>id+':'+i;
    const links=wires.map(w=>[key(w.a,w.ai),key(w.b,w.bi)]);
    const find=k=>{let parent=k;while(nodes.has(parent)&&nodes.get(parent)!==parent)parent=nodes.get(parent);return parent;};
    const all=parts.flatMap(p=>defaults[p.type].pins.map((_,i)=>key(p.id,i)));
    all.forEach(k=>nodes.set(k,k));
    links.forEach(([a,b])=>{const ra=find(a),rb=find(b);if(ra!==rb)nodes.set(ra,rb);});
    const ground=parts.find(p=>p.type==='ground'), g=find(key(ground.id,0));
    const ids=new Map();all.forEach(k=>{const root=find(k);if(root!==g&&!ids.has(root))ids.set(root,++count);});
    const n=count, sources=parts.filter(p=>p.type==='source');if(!n)return {error:'Connect circuit nodes with wires.'};
    const size=n+sources.length,A=Array.from({length:size},()=>Array(size+1).fill(0));
    const stamp=(a,b,v)=>{if(a)A[a-1][size]+=v;if(b)A[b-1][size]-=v;};
    const conduct=(a,b,g)=>{if(a)A[a-1][a-1]+=g;if(b)A[b-1][b-1]+=g;if(a&&b){A[a-1][b-1]-=g;A[b-1][a-1]-=g;}};
    const node=(p,i)=>ids.get(find(key(p.id,i)))||0;
    parts.filter(p=>p.type==='resistor').forEach(p=>{const r=Number(p.value);if(!(r>0))throw new Error('Resistance must be greater than zero.');conduct(node(p,0),node(p,1),1/r);});
    sources.forEach((p,i)=>{const a=node(p,0),b=node(p,1),k=n+i; if(a){A[a-1][k]+=1;A[k][a-1]+=1;}if(b){A[b-1][k]-=1;A[k][b-1]-=1;}A[k][size]=Number(p.value);});
    for(let i=0;i<size;i++){let pivot=i;for(let j=i+1;j<size;j++)if(Math.abs(A[j][i])>Math.abs(A[pivot][i]))pivot=j;if(Math.abs(A[pivot][i])<1e-12)return {error:'Singular circuit matrix. Check for floating nodes or missing paths.'};[A[i],A[pivot]]=[A[pivot],A[i]];const d=A[i][i];for(let k=i;k<=size;k++)A[i][k]/=d;for(let j=0;j<size;j++)if(j!==i){const f=A[j][i];for(let k=i;k<=size;k++)A[j][k]-=f*A[i][k];}}
    const values=Array(n+1).fill(0);for(let i=1;i<=n;i++)values[i]=A[i-1][size];return {nodes:values};
  }
  draw();
}
export { renderCircuitLab };