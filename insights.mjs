import {metricPoints,metricValue,formatDate,today,addDays,dayDiff} from './core.mjs';
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function metricSummary(state,key,date=today()){
 const all=metricPoints(state,key).filter(p=>p.date<=date),recent=all.filter(p=>p.date>=addDays(date,-6));
 const average=rows=>rows.length?rows.reduce((n,p)=>n+p.value,0)/rows.length:null;
 return {all,recent,average:average(all),recentAverage:average(recent),last:all.at(-1)};
}
export function rollingAverage(points,count=5){return points.map((point,i)=>{const window=points.slice(Math.max(0,i-count+1),i+1);return {...point,value:window.reduce((n,p)=>n+p.value,0)/window.length};});}
export function chartPoints(state,key,range='all',date=today()) {return metricSummary(state,key,date).all.filter(p=>range==='all'||p.date>=addDays(date,1-Number(range)));}
const colors={raw:'#376653',trend:'#347da1',average:'#b76f20',sys:'#a44f39',dia:'#347da1'};
function graph(series,references=[],label='Vývoj měření'){
 const points=series.flatMap(s=>s.points);if(!points.length)return '<div class="chart-empty">V tomto období nejsou záznamy. Vyber delší období.</div>';
 const dates=points.map(p=>p.date).sort(),start=dates[0],end=dates.at(-1),span=dayDiff(start,end)||1;
 const values=[...points.map(p=>p.value),...references.map(r=>r.value)],min=Math.min(...values),max=Math.max(...values),padding=Math.max((max-min)*.12,1),lo=min-padding,hi=max+padding;
 const x=p=>start===end?300:46+dayDiff(start,p.date)/span*520,y=v=>186-(v-lo)/(hi-lo)*154;
 const axis=[0,.5,1].map(f=>{const value=hi-f*(hi-lo),py=y(value);return `<line x1="46" x2="566" y1="${py}" y2="${py}" stroke="#e4e9e1"/><text x="37" y="${py+4}" text-anchor="end">${value.toLocaleString('cs-CZ',{maximumFractionDigits:1})}</text>`;}).join('');
 const refs=references.map(r=>`<line class="chart-reference" x1="46" x2="566" y1="${y(r.value)}" y2="${y(r.value)}" stroke="${r.color}" stroke-dasharray="${r.dash||'6 5'}" stroke-width="1.5"><title>${escape(r.label)}</title></line>`).join('');
 const paths=series.map(s=>`<path d="${s.points.map((p,i)=>`${i?'L':'M'}${x(p)},${y(p.value)}`).join(' ')}" stroke="${s.color}" stroke-width="${s.trend?3:2}" fill="none" stroke-linejoin="round" ${s.trend?'stroke-dasharray="5 3"':''}/>${s.trend?'':s.points.map(p=>{const description=`${formatDate(p.date,true)} · ${s.label}: ${p.formatted||p.value}`;return `<circle cx="${x(p)}" cy="${y(p.value)}" r="3.5" fill="white" stroke="${s.color}" stroke-width="2"/><circle class="chart-point" tabindex="0" role="button" aria-label="${escape(description)}" data-reading="${escape(description)}" cx="${x(p)}" cy="${y(p.value)}" r="10" fill="transparent"><title>${escape(description)}</title></circle>`;}).join('')}`).join('');
 return `<div class="chart trend-chart"><svg viewBox="0 0 600 224" role="group" aria-label="${escape(label)}">${axis}${refs}${paths}<text x="46" y="214">${formatDate(start,true)}</text><text x="566" y="214" text-anchor="end">${formatDate(end,true)}</text></svg></div><p class="chart-reading" aria-live="polite">Klepnutím na bod zobrazíš datum a hodnotu.</p>`;
}
export function trendChart(state,key,range='all',showAverage=true,showTrend=true){
 const all=metricSummary(state,key),rows=chartPoints(state,key,range),scale=key==='sleepMinutes'?60:1;
 const points=rows.map(p=>({...p,value:p.value/scale,formatted:metricValue(key,p.value)}));
 // Compute the rolling trend from the full history before cropping the viewport.
 const trends=rollingAverage(all.all).filter(p=>rows.some(r=>r.date===p.date)).map(p=>({...p,value:p.value/scale}));
 const series=[{label:'Měření',points,color:colors.raw},...(showTrend?[{label:'Klouzavý průměr',points:trends,color:colors.trend,trend:true}]:[])];
 const refs=showAverage&&all.average!==null?[{value:all.average/scale,label:'Dlouhodobý průměr',color:colors.average}]:[];
 return graph(series,refs,'Měření, klouzavý a dlouhodobý průměr')+`<div class="chart-legend"><span style="--series:${colors.raw}">Měření</span>${showTrend?`<span style="--series:${colors.trend}">Průměr posledních až 5 měření</span>`:''}${refs.length?`<span style="--series:${colors.average}">Dlouhodobý průměr · ${escape(metricValue(key,all.average))}</span>`:''}</div>`;
}
export function pressureChart(state,range='all',showReferences=true){
 const series=[['systolicBp','Systolický',colors.sys],['diastolicBp','Diastolický',colors.dia]].map(([key,label,color])=>({label,color,points:chartPoints(state,key,range).map(p=>({...p,formatted:p.value+' mmHg'}))}));
 const refs=showReferences?[{value:135,label:'Domácí měření: SYS 135',color:colors.sys},{value:85,label:'Domácí měření: DIA 85',color:colors.dia},{value:90,label:'Nízký tlak: SYS 90',color:'#929589',dash:'2 5'},{value:60,label:'Nízký tlak: DIA 60',color:'#929589',dash:'2 5'}]:[];
 return graph(series,refs,'Systolický a diastolický krevní tlak v mmHg')+`<div class="chart-legend"><span style="--series:${colors.sys}">Systolický</span><span style="--series:${colors.dia}">Diastolický</span>${showReferences?'<span style="--series:#b76f20">Čáry: SYS 135 / DIA 85 a SYS 90 / DIA 60 mmHg</span>':''}</div>`;
}
