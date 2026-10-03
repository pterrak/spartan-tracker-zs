import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,weekPlan,metricValue} from '../core.mjs';
import {metricSummary,rollingAverage,chartPoints,pressureChart} from '../insights.mjs';
import {sessionRows} from '../ui.mjs';
test('averages ignore missing days, preserve zero and distinguish recent from historic data',()=>{
 const s=normalize({measurements:[{date:'2026-01-01',weight:80},{date:'2026-09-27',weight:82},{date:'2026-10-02',weight:84},{date:'2026-10-03',weight:''},{date:'2026-10-04',weight:200}]});
 const result=metricSummary(s,'weight','2026-10-03');assert.equal(result.average,82);assert.equal(result.recentAverage,83);assert.equal(result.recent.length,2);assert.equal(metricSummary(s,'weight','2026-09-01').recentAverage,null);
 const zeros=metricSummary(normalize({measurements:[{date:'2026-10-03',sleepMinutes:0}]}),'sleepMinutes','2026-10-03');assert.equal(zeros.average,0);assert.equal(metricValue('sleepMinutes',419.8),'7 h 0 min');
});
test('rolling mean uses last five actual measurements, range uses calendar days',()=>{
 const points=[10,20,30,40,50,100].map((value,i)=>({date:`2026-09-${String(i+1).padStart(2,'0')}`,value}));assert.deepEqual(rollingAverage(points).map(p=>p.value),[10,15,20,25,30,48]);
 const s=normalize({measurements:[{date:'2026-09-03',weight:70},{date:'2026-09-04',weight:71},{date:'2026-10-03',weight:72}]});assert.equal(chartPoints(s,'weight','30','2026-10-03').length,2);
});
test('calm week adds only optional easy movement and family override remains authoritative',()=>{
 const s=normalize({version:4,profile:{weekMode:'calm',planLevel:0,swimOptional:true}});const calm=weekPlan(s,'2026-10-03');assert.equal(calm.length,4);assert.equal(calm.filter(x=>!x.optional).length,2);assert.equal(calm.at(-1).type,'Plavání');s.profile.swimOptional=false;assert.equal(weekPlan(s,'2026-10-03').at(-1).type,'Chůze');s.profile.familyDate='2028-05-20';assert.equal(weekPlan(s,'2028-05-15').filter(x=>!x.optional).length,1);
});
test('optional activity cannot mark a required slot complete, even with identical type',()=>{
 const s=normalize({version:4,profile:{weekMode:'calm',swimOptional:false}}),date='2026-10-03',plan=weekPlan(s,date);s.customWorkouts.push({id:'extra',planSessionId:plan.at(-1).id,type:'Chůze',date,duration:20});let rows=sessionRows(s,date);assert.equal(rows[0].logged,undefined);assert.equal(rows.at(-1).logged.id,'extra');s.customWorkouts.push({id:'basic',type:'Chůze',date,duration:20});rows=sessionRows(s,date);assert.equal(rows[0].logged.id,'basic');assert.equal(rows.at(-1).logged.id,'extra');
});
test('pressure references are labelled and removable',()=>{const s=normalize({measurements:[{date:'2026-09-01',systolicBp:120,diastolicBp:80}]});assert.match(pressureChart(s,'all',true),/SYS 135/);assert.doesNotMatch(pressureChart(s,'all',false),/chart-reference/);});
