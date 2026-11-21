const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const KEY='csms_v1',APP='Chemical Store Management System';
let DB,cat='',dper='7';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const f3=n=>(+n||0).toFixed(3),fm=(k,l)=>[k?f3(k)+' kg':'',l?f3(l)+' L':''].filter(Boolean).join(' + ')||'0';
const pad=n=>String(n).padStart(2,'0'),iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),today=()=>iso(new Date());
const addDays=(d,k)=>{const x=new Date(d);x.setDate(x.getDate()+k);return x};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2400)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('⚠ Could not save (storage blocked/full)')}}
function load(){try{DB=JSON.parse(localStorage.getItem(KEY))}catch(e){DB=null}
 if(!DB||!DB.items){DB={items:[],batches:[],nid:1};SEED.trim().split('\n').forEach(l=>{l=l.trim();if(l)DB.items.push({id:DB.nid++,name:l.slice(2).trim(),category:l[0]=='C'?'Chemical':'Dye'})});save()}}
/* ---------- data helpers ---------- */
function flat(f,t,q){const im=Object.fromEntries(DB.items.map(i=>[i.id,i])),ql=(q||'').trim().toLowerCase(),o=[];
 DB.batches.forEach(b=>{if(ql?!b.batch_no.toLowerCase().includes(ql):!(b.date>=f&&b.date<=t))return;
  b.lines.forEach(l=>{const it=im[l.item_id];if(!it)return;const k=l.qty/((l.unit=='g'||l.unit=='ml')?1000:1),w=l.unit=='kg'||l.unit=='g';
   o.push({bid:b.id,batch_no:b.batch_no,d:b.date,cat:it.category,item:it.name,qty:l.qty,unit:l.unit,kg:w?k:0,l:w?0:k})})});
 return o.sort((a,b)=>a.d.localeCompare(b.d)||a.batch_no.localeCompare(b.batch_no)||a.cat.localeCompare(b.cat)||a.item.localeCompare(b.item))}
function agg(ls){const o={chem:0,dye:0,chem_l:0,dye_l:0};ls.forEach(r=>{const p=r.cat=='Chemical'?'chem':'dye';o[p]+=r.kg;o[p+'_l']+=r.l});
 o.total=o.chem+o.dye;o.total_l=o.chem_l+o.dye_l;return o}
function group(ls,key){const g=new Map();ls.forEach(r=>{const k=key(r);if(!g.has(k))g.set(k,[]);g.get(k).push(r)});return g}
const nb=ls=>new Set(ls.map(x=>x.bid)).size;
/* ---------- navigation ---------- */
function show(p){$$('.page').forEach(x=>x.classList.toggle('on',x.id==p));$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.p==p));
 ({dash:dash,issue:()=>{},entry:renderItems,rec:rec})[p]()}
$$('#nav button').forEach(b=>b.onclick=()=>show(b.dataset.p));
function cards(box,r,extra=''){box.innerHTML=`<div class="card c1"><small>Chemicals</small><b>${fm(r.chem,r.chem_l)}</b></div><div class="card c2"><small>Dyes</small><b>${fm(r.dye,r.dye_l)}</b></div><div class="card c3"><small>Total</small><b>${fm(r.total,r.total_l)}</b></div>`+extra}
/* ---------- dashboard ---------- */
function drange(){const t=new Date();
 if(dper=='today')return[iso(t),iso(t)];if(dper=='7')return[iso(addDays(t,-6)),iso(t)];
 if(dper=='month')return[iso(new Date(t.getFullYear(),t.getMonth(),1)),iso(t)];return[$('#df').value,$('#dt').value]}
$$('#dtabs button').forEach(b=>b.onclick=()=>{dper=b.dataset.p;$$('#dtabs button').forEach(x=>x.classList.toggle('on',x==b));$('#dcustom').style.display=dper=='custom'?'flex':'none';if(dper!='custom')dash()});
$('#dgo').onclick=dash;
function dash(){const[f,t]=drange();if(!f||!t||f>t)return;
 const d0=new Date(f+'T00:00:00'),d1=new Date(t+'T00:00:00'),n=Math.round((d1-d0)/864e5)+1;
 const ls=flat(f,t),c=agg(ls),p=agg(flat(iso(addDays(d0,-n)),iso(addDays(d0,-1)))),B=nb(ls);
 $('#dlabel').textContent=f==t?f:f+'  →  '+t;
 const tot=r=>r.total+r.total_l,pc=(a,b)=>b>0?(a-b)/b*100:null;
 const dl=(a,b)=>{const v=pc(a,b);return v===null?'<small>no previous data</small>':`<small>${v>=0?'▲':'▼'} ${Math.abs(v).toFixed(1)}% vs previous period</small>`};
 $('#dkpi').innerHTML=`<div class="card c1"><small>Chemicals</small><b>${fm(c.chem,c.chem_l)}</b>${dl(c.chem+c.chem_l,p.chem+p.chem_l)}</div>
 <div class="card c2"><small>Dyes</small><b>${fm(c.dye,c.dye_l)}</b>${dl(c.dye+c.dye_l,p.dye+p.dye_l)}</div>
 <div class="card c3"><small>Total</small><b>${fm(c.total,c.total_l)}</b>${dl(tot(c),tot(p))}</div>
 <div class="card c4"><small>Batches</small><b>${B}</b><small>Avg ${B?(tot(c)/B).toFixed(2):'0'} per batch</small></div>`;
 const g=group(ls,r=>r.d),days=[];
 if(n<=92)for(let k=0;k<n;k++){const d=iso(addDays(d0,k)),a=agg(g.get(d)||[]);days.push({d,...a})}else g.forEach((x,d)=>days.push({d,...agg(x)}));
 const v=x=>x.chem+x.dye+x.chem_l+x.dye_l,mx=Math.max(1e-9,...days.map(v)),many=days.length>15;
 $('#bars').innerHTML=days.map(x=>`<div class="bg" title="${x.d}: ${fm(x.chem+x.dye,x.chem_l+x.dye_l)}"><div class="st" style="height:${v(x)/mx*150}px"><i class="ch" style="flex:${x.chem+x.chem_l}"></i><i class="dy" style="flex:${x.dye+x.dye_l}"></i></div>${many?x.d.slice(8):x.d.slice(5)}</div>`).join('')||'<p>No data</p>';
 const a=c.chem+c.chem_l,b=c.dye+c.dye_l,pct=a+b?a/(a+b)*100:0;
 $('#donut').innerHTML=a+b?`<div class="dn"><div class="donut" style="background:conic-gradient(#6366f1 0 ${pct}%,#ec4899 0)"><div>${pct.toFixed(0)}%<small>Chemical</small></div></div>
 <div><div class="tr"><span><i class="dot ch"></i>Chemical</span><b>${fm(c.chem,c.chem_l)}</b></div><div class="tr"><span><i class="dot dy"></i>Dyes</span><b>${fm(c.dye,c.dye_l)}</b></div></div></div>`:'<p>No data</p>';
 const it=[...group(ls,r=>r.item+'|'+r.cat)].map(([k,x])=>({name:x[0].item,category:x[0].cat,...(a=>({kg:a.total,l:a.total_l}))(agg(x))})).sort((x,y)=>y.kg+y.l-x.kg-x.l).slice(0,10);
 const im=Math.max(1e-9,...it.map(i=>i.kg+i.l));
 $('#top').innerHTML=it.map(i=>`<div class="hb"><div class="hl"><span>${esc(i.name)}</span><b>${fm(i.kg,i.l)}</b></div><div class="hbar"><i class="${i.category=='Dye'?'dy':'ch'}" style="width:${(i.kg+i.l)/im*100}%"></i></div></div>`).join('')||'<p>No data</p>';
 const tb=[...group(ls,r=>r.bid)].map(([k,x])=>({batch_no:x[0].batch_no,d:x[0].d,kg:agg(x).total,l:agg(x).total_l})).sort((x,y)=>y.kg+y.l-x.kg-x.l).slice(0,5);
 const bm=Math.max(1e-9,...tb.map(i=>i.kg+i.l));
 $('#topb').innerHTML=tb.map((i,k)=>`<div class="hb"><div class="hl"><span>${k+1}. ${esc(i.batch_no)} <small>${i.d}</small></span><b>${fm(i.kg,i.l)}</b></div><div class="hbar"><i class="ch" style="width:${(i.kg+i.l)/bm*100}%"></i></div></div>`).join('')||'<p>No data</p>'}
/* ---------- batch issue ---------- */
function opts(sel){const g=c=>`<optgroup label="${c}s">`+DB.items.filter(i=>i.category==c).sort((a,b)=>a.name.localeCompare(b.name)).map(i=>`<option value="${i.id}"${i.id==sel?' selected':''}>${esc(i.name)}</option>`).join('')+'</optgroup>';
 return '<option value="">-- Select item --</option>'+g('Chemical')+g('Dye')}
function makeLine(sel,qty,unit){const d=document.createElement('div');d.className='ln';
 d.innerHTML=`<select>${opts(sel)}</select><input type="number" step="any" min="0" inputmode="decimal" placeholder="Qty" value="${qty??''}"><select class="u"><option>kg</option><option>g</option><option>L</option><option value="ml">ml</option></select><button>✕</button>`;
 if(unit)d.querySelector('.u').value=unit;d.querySelector('button').onclick=()=>d.remove();return d}
const collect=box=>[...box.querySelectorAll('.ln')].map(d=>({item_id:+d.querySelector('select').value,qty:parseFloat(d.querySelector('input').value),unit:d.querySelector('.u').value})).filter(l=>l.item_id&&l.qty>0);
function addLine(){$('#lines').append(makeLine())}$('#addline').onclick=addLine;
$('#save').onclick=()=>{const bn=$('#bno').value.trim(),ls=collect($('#lines'));
 if(!bn)return toast('⚠ Batch No required');if(!ls.length)return toast('⚠ Add at least one item with quantity');
 let b=DB.batches.find(x=>x.batch_no===bn);if(!b){b={id:DB.nid++,batch_no:bn,date:$('#bdate').value||today(),lines:[]};DB.batches.push(b)}
 b.lines.push(...ls);save();toast('✅ Saved');$('#lines').innerHTML='';addLine();$('#bno').value=''};
/* ---------- item entry ---------- */
function renderItems(){const q=$('#isearch').value.toLowerCase();
 const l=DB.items.filter(i=>(!cat||i.category==cat)&&i.name.toLowerCase().includes(q)).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
 $('#icount').textContent=l.length;
 $('#ilist').innerHTML=l.map(i=>`<div class="it"><span><span class="tag ${i.category}">${i.category}</span>${esc(i.name)}</span><span><button class="del" data-act="sw" data-id="${i.id}" title="Change category">⇄</button><button class="del" data-act="rm" data-id="${i.id}" title="Delete">🗑</button></span></div>`).join('')}
$('#isearch').oninput=renderItems;
$$('#itabs button').forEach(b=>b.onclick=()=>{cat=b.dataset.c;$$('#itabs button').forEach(x=>x.classList.toggle('on',x==b));renderItems()});
$('#ilist').onclick=e=>{const id=+e.target.dataset.id,act=e.target.dataset.act;if(!id)return;const it=DB.items.find(i=>i.id==id);
 if(act=='sw'){it.category=it.category=='Dye'?'Chemical':'Dye';save();renderItems();return}
 if(DB.batches.some(b=>b.lines.some(l=>l.item_id==id)))return toast('⚠ Already used in a batch, cannot delete');
 if(confirm('Delete this item?')){DB.items=DB.items.filter(i=>i.id!=id);save();renderItems()}};
$('#iadd').onclick=()=>{const name=$('#iname').value.split(/\s+/).filter(Boolean).join(' ').toUpperCase();
 if(!name)return toast('⚠ Name required');if(DB.items.some(i=>i.name.toUpperCase()==name))return toast('⚠ This name already exists');
 DB.items.push({id:DB.nid++,name,category:$('#icat').value});save();$('#iname').value='';toast('✅ Item added');renderItems()};
/* ---------- records ---------- */
const rf=()=>[$('#rf').value,$('#rt').value,$('#rq').value.trim()];
function rec(){const[f,t,s]=rf(),ls=flat(f,t,s),bg=group(ls,r=>r.bid);cards($('#rcards'),agg(ls));
 const rows=[...bg].map(([id,x])=>({id,...x[0],...agg(x)})).sort((a,b)=>b.d.localeCompare(a.d)||b.id-a.id);
 $('#rtab').innerHTML='<thead><tr><th>Batch No</th><th>Date</th><th>Chemical</th><th>Dyes</th><th>Total</th><th></th></tr></thead><tbody>'+rows.map(x=>`<tr data-id="${x.id}"><td><b>${esc(x.batch_no)}</b></td><td>${x.d}</td><td>${fm(x.chem,x.chem_l)}</td><td>${fm(x.dye,x.dye_l)}</td><td><b>${fm(x.total,x.total_l)}</b></td><td><button class="del" data-del="${x.id}">🗑</button></td></tr>`).join('')+'</tbody>';
 $('#dbox').style.display=s?'none':'';
 $('#dtab').innerHTML='<thead><tr><th>Date</th><th>Batches</th><th>Chemical</th><th>Dyes</th><th>Total</th></tr></thead><tbody>'+[...group(ls,r=>r.d)].map(([d,x])=>{const a=agg(x);return`<tr><td>${d}</td><td>${nb(x)}</td><td>${fm(a.chem,a.chem_l)}</td><td>${fm(a.dye,a.dye_l)}</td><td><b>${fm(a.total,a.total_l)}</b></td></tr>`}).join('')+'</tbody>'}
$('#rgo').onclick=rec;let rqt;$('#rq').oninput=()=>{clearTimeout(rqt);rqt=setTimeout(rec,250)};
$('#rtab').onclick=e=>{const del=+e.target.dataset.del;
 if(del){if(confirm('Delete this batch?')){DB.batches=DB.batches.filter(b=>b.id!=del);save();rec()}return}
 const tr=e.target.closest('tr[data-id]');if(tr)openBatch(+tr.dataset.id)};
function openBatch(id,edit){const b=DB.batches.find(x=>x.id==id),mb=$('#mb'),im=Object.fromEntries(DB.items.map(i=>[i.id,i]));$('#modal').classList.add('on');
 if(!edit){$('#mt').textContent='Batch '+b.batch_no;
  mb.innerHTML=b.lines.map(l=>({...l,it:im[l.item_id]})).filter(l=>l.it).sort((x,y)=>x.it.category.localeCompare(y.it.category)||x.it.name.localeCompare(y.it.name)).map(l=>`<div class="tr"><span><span class="tag ${l.it.category}">${l.it.category[0]}</span>${esc(l.it.name)}</span><b>${f3(l.qty)} ${l.unit}</b></div>`).join('')+'<button class="btn ghost" id="medit">✏ Edit</button>';
  $('#medit').onclick=()=>openBatch(id,true);return}
 $('#mt').textContent='Edit Batch';
 mb.innerHTML=`<label>Batch No<input id="ebn" value="${esc(b.batch_no)}"></label><label>Date<input type="date" id="ed" value="${b.date}"></label><div id="elines"></div><button class="btn ghost" id="eadd">+ Add item</button><button class="btn" id="esave">Save</button><button class="btn ghost" id="ecancel">Cancel</button>`;
 const box=$('#elines');b.lines.forEach(l=>box.append(makeLine(l.item_id,l.qty,l.unit)));
 $('#eadd').onclick=()=>box.append(makeLine());$('#ecancel').onclick=()=>openBatch(id);
 $('#esave').onclick=()=>{const bn=$('#ebn').value.trim(),dt=$('#ed').value,ls=collect(box);
  if(!bn||!dt)return toast('⚠ Batch No & date required');if(!ls.length)return toast('⚠ Add at least one item with quantity');
  if(DB.batches.some(x=>x.id!=id&&x.batch_no===bn))return toast('⚠ This Batch No already exists');
  b.batch_no=bn;b.date=dt;b.lines=ls;save();toast('✅ Updated');$('#modal').classList.remove('on');rec()}}
$('#mx').onclick=()=>$('#modal').classList.remove('on');$('#modal').onclick=e=>{if(e.target.id=='modal')$('#modal').classList.remove('on')};
/* ---------- backup ---------- */
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
$('#bkp').onclick=()=>dl(new Blob([JSON.stringify(DB)],{type:'application/json'}),`chemical_store_backup_${today()}.json`);
$('#rst').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.items)||!Array.isArray(d.batches))throw 0;
  if(confirm('Replace ALL current data with this backup?')){DB=d;DB.nid=DB.nid||1+Math.max(0,...DB.items.map(i=>i.id),...DB.batches.map(b=>b.id));save();toast('✅ Restored');rec()}}catch(x){toast('⚠ Invalid backup file')}e.target.value=''};r.readAsText(f)};
/* ---------- reports ---------- */
const period=(f,t,q)=>q?`Search: Batch No contains '${q}' (all dates)`:(f==t?`Date: ${f}`:`Period: ${f} to ${t}`);
function pdf(){if(!window.jspdf||!jspdf.jsPDF)return toast('⚠ PDF library not loaded (internet needed)');
 const[f,t,q]=rf(),ls=flat(f,t,q),A=agg(ls),bg=group(ls,r=>r.bid),{jsPDF}=jspdf,doc=new jsPDF({unit:'pt',format:'a4'});
 const IND=[79,70,229],LIG=[238,242,255],hs={fillColor:IND,textColor:255,fontStyle:'bold'};
 doc.setFont('helvetica','bold').setFontSize(20).setTextColor(...IND).text(APP,36,48);
 doc.setFontSize(11).setTextColor(60).text('Chemical & Dyes Consumption Report',36,66);
 doc.setFont('helvetica','normal').setFontSize(9).text(`${period(f,t,q)}   |   Batches: ${bg.size}`,36,82);
 doc.autoTable({startY:94,head:[['Chemicals','Dyes','Total']],body:[[fm(A.chem,A.chem_l),fm(A.dye,A.dye_l),fm(A.total,A.total_l)]],headStyles:hs,styles:{fontSize:9},theme:'grid'});
 const days=[...group(ls,r=>r.d)].map(([d,x])=>{const a=agg(x);return[d,nb(x),fm(a.chem,a.chem_l),fm(a.dye,a.dye_l),fm(a.total,a.total_l)]});
 days.push(['TOTAL',bg.size,fm(A.chem,A.chem_l),fm(A.dye,A.dye_l),fm(A.total,A.total_l)]);
 doc.setFont('helvetica','bold').setFontSize(13).setTextColor(...IND).text('Daily Summary',36,doc.lastAutoTable.finalY+26);
 doc.autoTable({startY:doc.lastAutoTable.finalY+34,head:[['Date','Batches','Chemical','Dyes','Total']],body:days,headStyles:hs,styles:{fontSize:8},theme:'grid',
  didParseCell:h=>{if(h.section=='body'&&h.row.index==days.length-1){h.cell.styles.fontStyle='bold';h.cell.styles.fillColor=LIG}}});
 doc.setFontSize(13).text('Batch-wise Details',36,doc.lastAutoTable.finalY+26);
 const body=[];bg.forEach(x=>{const a=agg(x);body.push([{content:`Batch: ${x[0].batch_no}    Date: ${x[0].d}`,colSpan:3,styles:{fillColor:LIG,fontStyle:'bold'}},{content:'Total: '+fm(a.total,a.total_l),styles:{fillColor:LIG,fontStyle:'bold'}}]);
  x.forEach(r=>body.push(['',r.cat,r.item,`${f3(r.qty)} ${r.unit}`]))});
 doc.autoTable({startY:doc.lastAutoTable.finalY+34,head:[['Batch','Category','Item','Quantity']],body:body.length?body:[[{content:'No records found.',colSpan:4}]],headStyles:hs,styles:{fontSize:8},theme:'grid',columnStyles:{0:{cellWidth:60},1:{cellWidth:62},3:{cellWidth:120}}});
 const n=doc.internal.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFont('helvetica','normal').setFontSize(8).setTextColor(120);
  doc.text(`${APP} | Generated ${today()}`,36,818);doc.text(`Page ${i} of ${n}`,559,818,{align:'right'})}
 doc.save(`chemical_store_report_${today()}.pdf`)}
async function xlsx(){if(!window.ExcelJS)return toast('⚠ Excel library not loaded (internet needed)');
 const[f,t,q]=rf(),ls=flat(f,t,q),A=agg(ls),bg=group(ls,r=>r.bid),sub=period(f,t,q),wb=new ExcelJS.Workbook();
 const th={style:'thin',color:{argb:'FFCBD5E1'}},BD={top:th,left:th,bottom:th,right:th};
 function sheet(name,title,heads,rows,widths,total=true){const ws=wb.addWorksheet(name,{views:[{state:'frozen',ySplit:4,showGridLines:false}]});
  ws.getCell('A1').value=APP+' - '+title;ws.getCell('A1').font={size:15,bold:true,color:{argb:'FF4F46E5'}};
  ws.getCell('A2').value=sub+'   |   Generated: '+today();ws.getCell('A2').font={italic:true,color:{argb:'FF64748B'}};
  heads.forEach((h,j)=>{const c=ws.getCell(4,j+1);c.value=h;c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF4F46E5'}};c.border=BD;c.alignment={horizontal:'center',wrapText:true}});
  rows.forEach((r,i)=>r.forEach((v,j)=>{const c=ws.getCell(5+i,j+1);c.value=v;c.border=BD;if(typeof v=='number'&&!Number.isInteger(v))c.numFmt='#,##0.000';if(i%2)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF5F3FF'}}}));
  const n=4+rows.length;
  if(total&&rows.length){ws.getCell(n+1,1).value='TOTAL';heads.forEach((h,j)=>{if(/\((kg|L)\)/.test(h)){const L=String.fromCharCode(65+j);ws.getCell(n+1,j+1).value={formula:`SUM(${L}5:${L}${n})`};ws.getCell(n+1,j+1).numFmt='#,##0.000'}});
   heads.forEach((h,j)=>{const c=ws.getCell(n+1,j+1);c.font={bold:true};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE0E7FF'}};c.border=BD});
   ws.autoFilter={from:{row:4,column:1},to:{row:n,column:heads.length}}}
  widths.forEach((w,j)=>ws.getColumn(j+1).width=w);ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}}
 const H8=['Chemical (kg)','Chemical (L)','Dyes (kg)','Dyes (L)','Total (kg)','Total (L)'],v6=a=>[a.chem,a.chem_l,a.dye,a.dye_l,a.total,a.total_l];
 sheet('Summary','Consumption Summary',['Category','Weight (kg)','Volume (L)','Batches'],[['Chemicals',A.chem,A.chem_l,bg.size],['Dyes',A.dye,A.dye_l,bg.size]],[22,18,18,12],false);
 sheet('Daily','Daily Summary',['Date','Batches',...H8],[...group(ls,r=>r.d)].map(([d,x])=>[d,nb(x),...v6(agg(x))]),[14,10,15,15,15,15,15,15]);
 sheet('Batch-wise','Batch-wise Summary',['Batch No','Date',...H8],[...bg].map(([k,x])=>[x[0].batch_no,x[0].d,...v6(agg(x))]),[22,14,15,15,15,15,15,15]);
 sheet('Batch Details','Batch-wise Item Details',['Batch No','Date','Category','Item','Qty','Unit','Qty (kg)','Qty (L)'],ls.map(r=>[r.batch_no,r.d,r.cat,r.item,r.qty,r.unit,r.kg,r.l]),[22,14,12,36,12,8,13,13]);
 sheet('Items','Item-wise Usage',['Item','Category','Qty (kg)','Qty (L)'],[...group(ls,r=>r.item+'|'+r.cat)].map(([k,x])=>[x[0].item,x[0].cat,x.reduce((s,r)=>s+r.kg,0),x.reduce((s,r)=>s+r.l,0)]).sort((a,b)=>b[2]+b[3]-a[2]-a[3]),[38,14,14,14]);
 dl(new Blob([await wb.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`chemical_store_report_${today()}.xlsx`)}
$('#rpdf').onclick=pdf;$('#rxls').onclick=()=>xlsx().catch(e=>toast('⚠ '+e.message));
/* ---------- start ---------- */
load();$('#bdate').value=$('#rf').value=$('#rt').value=$('#df').value=$('#dt').value=today();addLine();dash();
