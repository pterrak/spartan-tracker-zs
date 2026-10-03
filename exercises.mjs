import {EXERCISES} from './core.mjs';
// Links restored from the original exercise library. Search links are labelled explicitly.
export const VIDEOS={
 'A-0':{query:'goblet squat to box proper form'},
 'A-1':{id:'W8C7tChZ1CE'},
 'A-2':{query:'resistance band row proper form'},
 'A-3':{id:'oLiQAFxXsIQ'},
 'B-0':{id:'URHdW9js6DM'},
 'B-1':{query:'banded glute bridge proper form'},
 'B-2':{query:'resistance band row proper form'},
 'B-3':{id:'ZdAHe9_HeEw'},
 warmup:{id:'c0VxUFHdYzs',name:'Pětiminutové zahřátí před silovým tréninkem'}
};
export function exerciseHtml(group){return `<div class="exercise-list">${(EXERCISES[group]||[]).map(([name,dose,tip],i)=>{const key=group+'-'+i,video=VIDEOS[key];return `<div class="exercise"><div class="exercise-title"><strong>${name}</strong><small>${dose}</small></div><p>${tip}</p>${video.id?`<button type="button" class="text-button video-link" data-action="video" data-video="${key}">▷ Přehrát ukázku</button>`:`<a class="text-button video-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}" target="_blank" rel="noopener">▷ Vyhledat video ukázky ↗</a>`}</div>`;}).join('')}</div>`;}
