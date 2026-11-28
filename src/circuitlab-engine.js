// Educational transient MNA solver: R, C, L, ideal independent V and I sources.
// Uses backward-Euler integration. Not a production SPICE replacement.
const PIN={
 resistor:[[-42,0],[42,0]],capacitor:[[-42,0],[42,0]],inductor:[[-42,0],[42,0]],
 voltage:[[0,-42],[0,42]],current:[[0,-42],[0,42]],ground:[[0,-8]]
};
function solveLinear(A,b){
 const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
 for(let i=0;i<n;i++){
  let p=i;for(let j=i+1;j<n;j++)if(Math.abs(M[j][i])>Math.abs(M[p][i]))p=j;
  if(Math.abs(M[p][i])<1e-14)throw Error('Singular matrix: floating node or invalid source loop.');
  [M[i],M[p]]=[M[p],M[i]];const d=M[i][i];for(let k=i;k<=n;k++)M[i][k]/=d;
  for(let j=0;j<n;j++)if(j!==i){const f=M[j][i];for(let k=i;k<=n;k++)M[j][k]-=f*M[i][k];}
 }
 return M.map(r=>r[n]);
}
export function runTransient(parts,wires,{stopTime=0.01,step=0.0001}={}){
 const supported=new Set(['resistor','capacitor','inductor','voltage','current','ground']);
 const bad=parts.filter(p=>!supported.has(p.type));
 if(bad.length)throw Error('Transient models not yet available for: '+bad.map(p=>p.ref+' ('+p.type+')').join(', '));
 if(!parts.some(p=>p.type==='ground'))throw Error('Add a ground reference.');
 if(!(stopTime>0&&step>0&&stopTime/step<=2000))throw Error('Choose positive stop time and step; maximum 2000 samples.');
 const key=(id,i)=>id+':'+i,parent=new Map();
 const all=parts.flatMap(p=>(PIN[p.type]||[]).map((_,i)=>key(p.id,i)));all.forEach(k=>parent.set(k,k));
 const find=k=>{let r=k;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(k)!==k){const q=parent.get(k);parent.set(k,r);k=q;}return r;};
 wires.forEach(w=>{const a=find(key(w.a,w.ai)),b=find(key(w.b,w.bi));if(a!==b)parent.set(a,b);});
 const g=find(key(parts.find(p=>p.type==='ground').id,0)),ids=new Map();
 all.forEach(k=>{const r=find(k);if(r!==g&&!ids.has(r))ids.set(r,ids.size);});
 const node=(p,i)=>ids.get(find(key(p.id,i)))??-1,n=ids.size;
 const vs=parts.filter(p=>p.type==='voltage'),ls=parts.filter(p=>p.type==='inductor');
 if(!n)throw Error('No connected non-ground nodes.');
 const dim=n+vs.length+ls.length,dt=step;
 let capPrev=new Map(),indPrev=new Map(),rows=[];
 const samples=Math.floor(stopTime/step)+1;
 for(let sample=0;sample<samples;sample++){
  const t=sample*dt,A=Array.from({length:dim},()=>Array(dim).fill(0)),b=Array(dim).fill(0);
  const conduct=(a,c,v)=>{if(a>=0)A[a][a]+=v;if(c>=0)A[c][c]+=v;if(a>=0&&c>=0){A[a][c]-=v;A[c][a]-=v;}};
  const inject=(a,c,v)=>{if(a>=0)b[a]-=v;if(c>=0)b[c]+=v;};
  parts.filter(p=>p.type==='resistor').forEach(p=>{const r=Number(p.value);if(!(r>0))throw Error(p.ref+': resistance must be positive.');conduct(node(p,0),node(p,1),1/r);});
  parts.filter(p=>p.type==='capacitor').forEach(p=>{const c=Number(p.value);if(!(c>0))throw Error(p.ref+': capacitance must be positive.');const a=node(p,0),d=node(p,1),vprev=capPrev.get(p.id)||0,geq=c/dt;conduct(a,d,geq);inject(a,d,-geq*vprev);});
  parts.filter(p=>p.type==='current').forEach(p=>inject(node(p,0),node(p,1),Number(p.value)||0));
  vs.forEach((p,i)=>{const k=n+i,a=node(p,0),d=node(p,1);if(a>=0){A[a][k]++;A[k][a]++;}if(d>=0){A[d][k]--;A[k][d]--;}b[k]=Number(p.value)||0;});
  ls.forEach((p,i)=>{const k=n+vs.length+i,a=node(p,0),d=node(p,1),L=Number(p.value);if(!(L>0))throw Error(p.ref+': inductance must be positive.');if(a>=0){A[a][k]++;A[k][a]++;}if(d>=0){A[d][k]--;A[k][d]--;}A[k][k]=-L/dt;b[k]=-L/dt*(indPrev.get(p.id)||0);});
  const x=solveLinear(A,b);
  parts.filter(p=>p.type==='capacitor').forEach(p=>{const a=node(p,0),d=node(p,1);capPrev.set(p.id,(a>=0?x[a]:0)-(d>=0?x[d]:0));});
  ls.forEach((p,i)=>indPrev.set(p.id,x[n+vs.length+i]));
  const nodeValues={};for(const [root,index] of ids)nodeValues['N'+(index+1)]=x[index];
  const voltage=(p)=>{const a=node(p,0),d=node(p,1);return (a>=0?x[a]:0)-(d>=0?x[d]:0);};
  const currents={};
  parts.forEach(p=>{if(p.type==='resistor')currents[p.ref]=voltage(p)/Number(p.value);else if(p.type==='capacitor')currents[p.ref]=Number(p.value)*(sample===0?0:(voltage(p)-(capPrev.get(p.id)||0))/dt);else if(p.type==='inductor')currents[p.ref]=indPrev.get(p.id)||0;else if(p.type==='current')currents[p.ref]=Number(p.value)||0;else if(p.type==='voltage')currents[p.ref]=x[n+vs.indexOf(p)];});
  rows.push({time:t,nodes:nodeValues,currents});
 }
 return {samples:rows,step,stopTime:rows[rows.length-1].time,method:'Backward Euler'};
}