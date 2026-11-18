/* Clickjacking guard. GitHub Pages cannot send the frame-ancestors header, so a page that is shown inside a frame of another site hides itself
 * instead of offering its buttons (the configurator can write parameters). Frames of the same origin (the site's own pages) stay allowed.
 * Loaded synchronously at the top of <head>, before anything is painted. */
(()=>{'use strict';
let foreign=false;
try{if(window.top!==window.self)foreign=window.top.location.origin!==window.location.origin;}catch{foreign=true;}
if(foreign){
 document.documentElement.hidden=true;document.documentElement.style.display='none';
 try{window.top.location.replace(window.self.location.href);}catch{}
}
})();
