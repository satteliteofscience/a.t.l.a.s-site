/* Hash links land where the user expects: the target sits just below the sticky header (or near the top edge when the page has none) and stays there while fonts,
 * images and script-built content settle. The offsets live in CSS (scroll-padding-top on html, scroll-margin-top on the target); this file only re-aligns,
 * and it stops as soon as the user scrolls by hand. */
(()=>{'use strict';
const root=document.documentElement,head=document.querySelector('.ch-head');
// the sticky header of the changelog / FAQ pages wraps on phones, so its real height drives scroll-padding-top (see css/changelog.css)
if(head&&window.ResizeObserver){const sync=()=>root.style.setProperty('--ch-head-h',Math.round(head.getBoundingClientRect().height)+'px');sync();new ResizeObserver(sync).observe(head);}
let touched=false,watching=0;
for(const name of ['wheel','touchstart','keydown','mousedown'])window.addEventListener(name,()=>{touched=true;},{passive:true});
const targetOf=()=>{let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{}return id?document.getElementById(id):null;};
function wanted(target){
 const page=getComputedStyle(root),own=getComputedStyle(target);
 return Math.max(0,target.getBoundingClientRect().top+window.scrollY-(parseFloat(page.scrollPaddingTop)||0)-(parseFloat(own.scrollMarginTop)||0));
}
function align(){
 const target=targetOf();if(!target||touched)return;
 const want=wanted(target);
 if(Math.abs(window.scrollY-want)>2)window.scrollTo({top:want,behavior:'instant'});
}
function settle(delay){
 touched=false;const token=++watching,run=()=>{if(token===watching)align();};
 setTimeout(run,delay);
 window.addEventListener('load',run,{once:true});
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(run);
 let observer=null;
 if(window.ResizeObserver){observer=new ResizeObserver(run);observer.observe(document.body);}
 setTimeout(()=>{if(observer)observer.disconnect();},12000);   // the catalogue (+700 px above #guide / #support) and the web fonts can arrive late on a slow network
}
if(location.hash.length>1)settle(0);
window.addEventListener('hashchange',()=>settle(900));
window.addEventListener('pageshow',event=>{if(event.persisted&&location.hash.length>1)settle(0);});
})();