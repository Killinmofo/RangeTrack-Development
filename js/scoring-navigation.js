'use strict';
let rtLastField = '';
function rtFields(){return [...document.querySelectorAll('.rt-score-view .rt-score-input:not(:disabled)')];}
function rtFieldKey(el){return el ? [el.dataset.shooter,el.dataset.attempt,el.dataset.area].join('|') : '';}
function rtVisibleScore(){
 const el=document.activeElement;
 if(!el?.matches?.('.rt-score-input'))return;
 const vp=window.visualViewport;
 const top=vp?vp.offsetTop:0, bottom=top+(vp?vp.height:window.innerHeight);
 const rect=el.getBoundingClientRect(), safeBottom=bottom-76;
 if(rect.bottom>safeBottom)window.scrollBy(0,rect.bottom-safeBottom+12);
 else if(rect.top<top+12)window.scrollBy(0,rect.top-top-24);
}
function rtKeyboardLayout(){
 const vp=window.visualViewport;
 const active=document.activeElement?.matches?.('.rt-score-input');
 const isOpen=Boolean(vp&&active&&vp.height<window.innerHeight-110);
 const inset=isOpen?Math.max(0,window.innerHeight-vp.height-vp.offsetTop):0;
 document.documentElement.style.setProperty('--rt-keyboard-inset',inset+'px');
 document.body.classList.toggle('rt-scoring-keyboard',isOpen);
 if(isOpen)rtVisibleScore();
}
function rtFocusScore(el){
 if(!el)return;
 rtLastField=rtFieldKey(el);
 el.focus({preventScroll:true});
 requestAnimationFrame(rtVisibleScore);
 setTimeout(rtVisibleScore,130);
 setTimeout(rtVisibleScore,390);
}
function rtUpdateNextScoreButton(){
 const btn=document.querySelector('.rt-next-btn');if(!btn)return;
 const inputs=rtFields(),incomplete=inputs.some(el=>el.value==='');
 const last=scoreTableIndex>=tableList().length-1;
 btn.disabled=!inputs.length||(!incomplete&&last);
 const label=btn.querySelector('small');
 if(label)label.textContent=incomplete?'Next Field':last?'Complete':'Next Table';
 btn.setAttribute('aria-label',incomplete?'Go to next empty scoring field':last?'Scoring complete':'Go to next table');
}
function rtNextScoreField(){
 const inputs=rtFields(),empties=inputs.filter(el=>el.value==='');
 if(empties.length){
  const idx=inputs.findIndex(el=>rtFieldKey(el)===rtLastField);
  const next=inputs.slice(Math.max(0,idx+1)).find(el=>el.value==='')||empties[0];
  rtFocusScore(next);
 }else if(scoreTableIndex<tableList().length-1){
  rtLastField='';
  changeScoringTable(1);
  rtUpdateNextScoreButton();
 }
}
document.addEventListener('focusin',e=>{
 if(!e.target.matches?.('.rt-score-input'))return;
 rtLastField=rtFieldKey(e.target);rtFocusScore(e.target);rtKeyboardLayout();
});
document.addEventListener('input',e=>{if(e.target.matches?.('.rt-score-input'))rtUpdateNextScoreButton();});
document.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&e.target.matches?.('.rt-score-input')){e.preventDefault();rtNextScoreField();}
});
document.addEventListener('focusout',e=>{
 if(e.target.matches?.('.rt-score-input'))setTimeout(rtKeyboardLayout,100);
});
if(window.visualViewport){
 window.visualViewport.addEventListener('resize',rtKeyboardLayout);
 window.visualViewport.addEventListener('scroll',rtKeyboardLayout);
}
window.addEventListener('resize',rtKeyboardLayout);
