// Compact educational nonlinear MNA engine for IonCalc Circuit Lab.
// Models: R/C/L, independent sources, VCVS/VCCS/CCVS/CCCS, Shockley diode,
// finite-gain rail-limited op-amp, Shichman-Hodges NMOS and simplified NPN BJT.
// This is a learning simulator, not a validated vendor-compatible SPICE engine.
const PIN={
 resistor:2,capacitor:2,inductor:2,voltage:2,current:2,ground:1,diode:2,
 vcv:4,vccs:4,ccvs:4,cccs:4,opamp:5,mosfet:3,bjt:3,voltmeter:2,ammeter:2,scope:2
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function solveLinear(A,b){
 const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
 for(let i=0;i<n;i++){let p=i;for(let j=i+1;j<n;j++)if(Math.abs(M[j][i])>Math.abs(M[p][i]))p=j;
  if(Math.abs(M[p][i])<1e-13)throw Error('Singular matrix: check floating nodes, ground and ideal-source loops.');
  [M[i],M[p]]=[M[p],M[i]];const d=M[i][i];for(let k=i;k<=n;k++)M[i][k]/=d;
  for(let j=0;j<n;j++)if(j!==i){const q=M[j][i];for(let k=i;k<=n;k++)M[j][k]-=q*M[i][k];}
 }return M.map(r=>r[n]);
}
function topology(parts,wires){
 const parent=new Map(),key=(id,i)=>id+':'+i;
 parts.forEach(p=>{const count=PIN[p.type];if(!count)throw Error('No terminal definition for '+p.type);for(let i=0;i<count;i++)parent.set(key(p.id,i),key(p.id,i));});
 const find=k=>{let r=k;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(k)!==k){const n=parent.get(k);parent.set(k,r);k=n;}return r;};
 wires.forEach(w=>{const a=key(w.a,w.ai),b=key(w.b,w.bi);if(!parent.has(a)||!parent.has(b))throw Error('A wire refers to a missing terminal.');const x=find(a),y=find(b);if(x!==y)parent.set(x,y);});
 const ground=parts.find(p=>p.type==='ground');if(!ground)throw Error('Add a ground reference.');
 const gr=find(key(ground.id,0)),ids=new Map();parent.forEach((_,k)=>{const r=find(k);if(r!==gr&&!ids.has(r))ids.set(r,ids.size);});
 return {node:(p,i)=>ids.get(find(key(p.id,i)))??-1,n:ids.size};
}
function diodeModel(v,Is=1e-12,nv=1.8){
 const vt=.02585*nv,ve=clamp(v,-5,0.85),z=ve/vt,ez=Math.exp(clamp(z,-40,30));
 const current=Is*(ez-1),g=Math.max(Is/vt*ez,1e-12);
 return {g,ieq:current-g*v};
}
function mosfetId(vgs,vds,p){
 const vto=Number(p.vto??2),kp=Number(p.kp??.001),lambda=Number(p.lambda??.01);
 if(vgs<=vto)return 1e-12*vds;
 const ov=vgs-vto;let id;
 if(vds<ov)id=kp*(ov*vds-.5*vds*vds)*(1+lambda*vds);
 else id=.5*kp*ov*ov*(1+lambda*vds);
 return Math.max(0,id);
}
function bjtCurrent(vbe,p){const is=Number(p.is??1e-14),beta=Number(p.beta??100),z=clamp(vbe/.02585,-40,25),ib=is*(Math.exp(z)-1)/Math.max(beta,1);return {ib,ic:beta*ib,gbe:Math.max(is*Math.exp(z)/(.02585*Math.max(beta,1)),1e-12)};}
function solveNetwork(parts,wires,{mode='dc',dt=.0001,capPrev=new Map(),indPrev=new Map(),guess=null}={}){
 const {node,n}=topology(parts,wires);
 const voltage=parts.filter(p=>['voltage','vcv','ccvs','opamp'].includes(p.type));
 const inductors=mode==='transient'?parts.filter(p=>p.type==='inductor'):parts.filter(p=>p.type==='inductor');
 const branches=[...voltage,...inductors],branchIndex=new Map(branches.map((p,i)=>[p.id,n+i]));
 const dim=n+branches.length;if(!dim)throw Error('No connected non-ground nodes.');
 const v=(x,p,i)=>{const q=node(p,i);return q<0?0:x[q]||0;};
 const refBranch=new Map(branches.map(p=>[p.ref,branchIndex.get(p.id)]));
 let x=guess&&guess.length===dim?[...guess]:Array(dim).fill(0),iterations=0;
 for(;iterations<80;iterations++){
  const A=Array.from({length:dim},()=>Array(dim).fill(0)),b=Array(dim).fill(0);
  const conduct=(a,c,g)=>{if(a>=0)A[a][a]+=g;if(c>=0)A[c][c]+=g;if(a>=0&&c>=0){A[a][c]-=g;A[c][a]-=g;}};
  const inject=(a,c,i)=>{if(a>=0)b[a]-=i;if(c>=0)b[c]+=i;};
  const controlled=(outP,outN,ctrlP,ctrlN,g)=>{if(outP>=0){if(ctrlP>=0)A[outP][ctrlP]+=g;if(ctrlN>=0)A[outP][ctrlN]-=g;}if(outN>=0){if(ctrlP>=0)A[outN][ctrlP]-=g;if(ctrlN>=0)A[outN][ctrlN]+=g;}};
  // Tiny gmin prevents numerically isolated nonlinear junctions from singularity.
  for(let i=0;i<n;i++)A[i][i]+=1e-12;
  parts.filter(p=>p.type==='resistor').forEach(p=>{const r=Number(p.value);if(!(r>0))throw Error(p.ref+': resistance must be positive.');conduct(node(p,0),node(p,1),1/r);});
  parts.filter(p=>p.type==='voltmeter'||p.type==='scope').forEach(p=>conduct(node(p,0),node(p,1),1e-12));
  parts.filter(p=>p.type==='ammeter').forEach(p=>conduct(node(p,0),node(p,1),1e6));
  parts.filter(p=>p.type==='current').forEach(p=>inject(node(p,0),node(p,1),Number(p.value)||0));
  parts.filter(p=>p.type==='diode').forEach(p=>{const a=node(p,0),c=node(p,1),d=diodeModel(v(x,p,0)-v(x,p,1),Number(p.is??1e-12),Number(p.n??1));conduct(a,c,d.g);inject(a,c,d.ieq);});
  parts.filter(p=>p.type==='capacitor'&&mode==='transient').forEach(p=>{const c=Number(p.value);if(!(c>0))throw Error(p.ref+': capacitance must be positive.');const geq=c/dt,vprev=capPrev.get(p.id)||0;conduct(node(p,0),node(p,1),geq);inject(node(p,0),node(p,1),-geq*vprev);});
  // Dependent current sources: output terminals 0/1; control terminals 2/3.
  parts.filter(p=>p.type==='vccs').forEach(p=>controlled(node(p,0),node(p,1),node(p,2),node(p,3),Number(p.value)||0));
  parts.filter(p=>p.type==='cccs').forEach(p=>{const k=refBranch.get(String(p.controlRef||''));if(k==null)throw Error(p.ref+': set Control reference to a voltage source or inductor reference.');const g=Number(p.value)||0,a=node(p,0),c=node(p,1);if(a>=0)A[a][k]+=g;if(c>=0)A[c][k]-=g;});
  // Independent and dependent voltage-source branches.
  voltage.forEach(p=>{const k=branchIndex.get(p.id),a=node(p,0),c=node(p,1);if(a>=0){A[a][k]++;A[k][a]++;}if(c>=0){A[c][k]--;A[k][c]--;}
   if(p.type==='voltage')b[k]=Number(p.value)||0;
   if(p.type==='vcv'){const gain=Number(p.value)||1;const cp=node(p,2),cn=node(p,3);if(cp>=0)A[k][cp]-=gain;if(cn>=0)A[k][cn]+=gain;}
   if(p.type==='ccvs'){const ctrl=refBranch.get(String(p.controlRef||''));if(ctrl==null)throw Error(p.ref+': set Control reference to a voltage source or inductor reference.');A[k][ctrl]-=Number(p.value)||0;}
   if(p.type==='opamp'){const gain=Number(p.value)||1e5,raw=gain*(v(x,p,0)-v(x,p,1));const hi=p.vpos==null?15:Number(p.vpos),lo=p.vneg==null?-15:Number(p.vneg);if(raw>=hi)b[k]=hi;else if(raw<=lo)b[k]=lo;else{const cp=node(p,0),cn=node(p,1);if(cp>=0)A[k][cp]-=gain;if(cn>=0)A[k][cn]+=gain;}}
  });
  inductors.forEach(p=>{const k=branchIndex.get(p.id),a=node(p,0),c=node(p,1);if(a>=0){A[a][k]++;A[k][a]++;}if(c>=0){A[c][k]--;A[k][c]--;}
   if(mode==='transient'){const L=Number(p.value);if(!(L>0))throw Error(p.ref+': inductance must be positive.');A[k][k]-=L/dt;b[k]=-L/dt*(indPrev.get(p.id)||0);}
  });
  // NPN BJT: exponential base-emitter junction plus beta-controlled collector current.
  parts.filter(p=>p.type==='bjt').forEach(p=>{const be=v(x,p,0)-v(x,p,2),d=bjtCurrent(be,p),a=node(p,0),e=node(p,2),c=node(p,1);conduct(a,e,d.gbe);inject(a,e,d.ib-d.gbe*be);controlled(c,e,a,e,Number(p.beta??100)*d.gbe);inject(c,e,-Number(p.beta??100)*(d.ib-d.gbe*be));});
  // NMOS square-law with numerical derivatives for gm and gds.
  parts.filter(p=>p.type==='mosfet').forEach(p=>{const vg=v(x,p,0),vd=v(x,p,1),vs=v(x,p,2),vgs=vg-vs,vds=vd-vs,id=mosfetId(vgs,vds,p),h=1e-5,gm=(mosfetId(vgs+h,vds,p)-mosfetId(vgs-h,vds,p))/(2*h),gds=(mosfetId(vgs,vds+h,p)-mosfetId(vgs,vds-h,p))/(2*h),ieq=id-gm*vgs-gds*vds;conduct(node(p,1),node(p,2),Math.max(gds,1e-12));controlled(node(p,1),node(p,2),node(p,0),node(p,2),gm);inject(node(p,1),node(p,2),ieq);});
  let next;try{next=solveLinear(A,b);}catch(err){throw err;}
  let delta=0;for(let i=0;i<dim;i++)delta=Math.max(delta,Math.abs(next[i]-x[i]));x=next;
  if(delta<1e-7)break;
 }
 if(iterations>=80)throw Error('Nonlinear solver did not converge. Try smaller time steps, check polarities, or simplify the circuit.');
 const nodes={};for(let i=0;i<n;i++)nodes['N'+(i+1)]=x[i];
 const currents={};
 parts.forEach(p=>{const vp=v(x,p,0),vn=v(x,p,1),dv=vp-vn;
  if(p.type==='resistor')currents[p.ref]=dv/Number(p.value);
  else if(p.type==='voltage'||p.type==='vcv'||p.type==='ccvs'||p.type==='opamp')currents[p.ref]=x[branchIndex.get(p.id)];
  else if(p.type==='current')currents[p.ref]=Number(p.value)||0;
  else if(p.type==='voltmeter'||p.type==='scope')currents[p.ref]=dv*1e-12;
  else if(p.type==='ammeter')currents[p.ref]=dv*1e6;
  else if(p.type==='diode')currents[p.ref]=diodeModel(dv,Number(p.is??1e-12),Number(p.n??1)).g*dv+diodeModel(dv,Number(p.is??1e-12),Number(p.n??1)).ieq;
  else if(p.type==='capacitor')currents[p.ref]=mode==='transient'?Number(p.value)*(dv-(capPrev.get(p.id)||0))/dt:0;
  else if(p.type==='inductor')currents[p.ref]=mode==='transient'?x[branchIndex.get(p.id)]:(x[branchIndex.get(p.id)]||0);
  else if(p.type==='bjt')currents[p.ref]=bjtCurrent(v(x,p,0)-v(x,p,2),p).ic;
  else if(p.type==='mosfet')currents[p.ref]=mosfetId(v(x,p,0)-v(x,p,2),v(x,p,1)-v(x,p,2),p);
  else if(p.type==='vccs')currents[p.ref]=(Number(p.value)||0)*(v(x,p,2)-v(x,p,3));
  else if(p.type==='cccs'){const k=refBranch.get(String(p.controlRef||''));currents[p.ref]=(Number(p.value)||0)*x[k];}
 });
 return {x,nodes,currents,iterations:iterations+1,nodeCount:n};
}
export function runDc(parts,wires){const result=solveNetwork(parts,wires,{mode:'dc'});return {nodes:Object.values(result.nodes).reduce((a,v)=>[...a,v], [0]),nodeMap:result.nodes,currents:result.currents,iterations:result.iterations};}
export function runTransient(parts,wires,{stopTime=.01,step=.0001}={}){
 if(!(stopTime>0&&step>0&&stopTime/step<=3000))throw Error('Choose positive stop time and step; maximum 3000 samples.');
 const capPrev=new Map(),indPrev=new Map(),rows=[];let guess=null;
 const samples=Math.floor(stopTime/step)+1;
 for(let k=0;k<samples;k++){const t=k*step,result=solveNetwork(parts,wires,{mode:'transient',dt:step,capPrev,indPrev,guess});guess=result.x;
  const nodes={...result.nodes},currents={...result.currents};rows.push({time:t,nodes,currents});
  // Capacitor state is the terminal differential voltage, obtained from the node union map.
  const topo=topology(parts,wires);parts.filter(p=>p.type==='capacitor').forEach(p=>{const a=topo.node(p,0),b=topo.node(p,1),va=a<0?0:result.x[a],vb=b<0?0:result.x[b];capPrev.set(p.id,va-vb);});
  parts.filter(p=>p.type==='inductor').forEach(p=>indPrev.set(p.id,result.currents[p.ref]||0));
 }
 return {samples:rows,step,stopTime:rows[rows.length-1].time,method:'Backward Euler + Newton iteration'};
}
