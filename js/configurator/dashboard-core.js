/* The A.T.L.A.S. tools of the Flight-data screen: how the cards are grouped and found. Pure data and matching, no DOM.
   The cards themselves (their logic and what they write) live in their own files; dashboard-ui.js only arranges them. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasDashboard=api;})(globalThis,()=>{
 'use strict';
 // The groups of the panel, in order, and the ids of the cards in them (the ids that the card scripts give their cards).
 const GROUPS=Object.freeze([
  Object.freeze({id:'protect',cards:Object.freeze(['orderPanel','fslogPanel'])}),
  Object.freeze({id:'nogps',cards:Object.freeze(['globalPanel','windPanel'])}),
  Object.freeze({id:'sound',cards:Object.freeze(['songPanel'])})
 ]);
 const CARDS=Object.freeze(GROUPS.flatMap(g=>g.cards));
 // What a card is found by besides its title and everything it shows: words in the three languages and the names of the parameters it concerns.
 const KEYWORDS=Object.freeze({
  orderPanel:'приказ наказ order o.r.d.e.r крен тангаж bank pitch roll limit ограничения обмеження тумблер перемикач switch fbwa руль кермо rudder rc13 ORDER_MODE ORDER_REV ORDER_RC_CH ORDER_RLL_LIM ORDER_PIT_MIN ORDER_PIT_MAX RUD_LIMIT_DEG ROLL_LIMIT_DEG STALL_PREVENTION',
  fslogPanel:'отказ відмова радио радіо radio failsafe фейлсейф лог log circle rtl круг коло домой додому home glide планирование планування приемник приймач связь зв’язок ARSPD_USE FS_EKF_THRESH FS_GCS_ENABL FS_LONG_ACTN FS_LONG_TIMEOUT FS_SHORT_ACTN RC_FS_TIMEOUT LOG_BACKEND_TYPE LOG_BITMASK',
  globalPanel:'global g.l.o.b.a.l ekf ekf3 gps no-gps noaid безgps без gps позиция позиція position спутники супутники satellites dcm навигация навігація горизонт horizon профиль профіль profile EK3_NOAID_POS EK3_NOAID_GPS EK3_NOAID_AUTO EK3_MAV_POS EK3_MAV_HGT EK3_SRC1_POSXY EK3_SRC1_POSZ EK3_SRC1_VELXY EK3_SRC1_VELZ EK3_SRC1_YAW EK3_SRC2_POSXY EK3_SRC2_POSZ EK3_SRC2_VELXY EK3_SRC2_VELZ EK3_SRC2_YAW AHRS_EKF_TYPE AHRS_GPS_USE EK3_NOAID_M_NSE',
  windPanel:'ветер вітер wind штиль calm обучение навчання learning метки мітки метка мітка fix pitot курс heading noaid NOAID_WIND NOAID_SLEW NOAID_WAGE 43004 MAV_CMD_EXTERNAL_WIND_ESTIMATE',
  songPanel:'мелодия мелодія melody song звук sound пищалка пищалки buzzer mml ноты ноти notes музыка музика music startup запуск BUZ_CSTM_SONG'
 });
 /** Text as it is compared: lower case, ё as е, the apostrophes of the three languages dropped, one space between words. */
 const normalize=text=>String(text??'').toLowerCase().replace(/ё/g,'е').replace(/['’ʼ`]/g,'').replace(/\s+/g,' ').trim();
 /** Every word of the query has to be somewhere in the text (a part of a word or of a parameter name counts). An empty query matches everything. */
 function matches(haystack,query){
  const words=normalize(query).split(' ').filter(Boolean);
  if(!words.length)return true;
  const text=normalize(haystack);
  return words.every(w=>text.includes(w));
 }
 /** The ids of the cards that match, in the order of the panel. headOf(id) gives the name, the purpose and the group of a card, textOf(id) everything it shows now.
     The cards found by their name, purpose or keywords come out alone; only when there is none, what is written inside the cards is searched too (so a word that one
     card merely mentions does not hide the card it is about). */
 function search(query,headOf,textOf=()=>''){
  const named=CARDS.filter(id=>matches(`${KEYWORDS[id]||''} ${headOf(id)||''}`,query));
  return named.length?named:CARDS.filter(id=>matches(`${KEYWORDS[id]||''} ${headOf(id)||''} ${textOf(id)||''}`,query));
 }
 // the open cards are remembered in localStorage, only for the viewer; every access may throw (private windows, blocked storage)
 const OPEN_KEY='atlas-dashboard-open';
 function readOpen(storage){
  try{const list=JSON.parse(storage.getItem(OPEN_KEY)||'[]');return Array.isArray(list)?list.filter(id=>CARDS.includes(id)):[];}catch{return [];}
 }
 function writeOpen(storage,ids){try{storage.setItem(OPEN_KEY,JSON.stringify(ids.filter(id=>CARDS.includes(id))));return true;}catch{return false;}}
 return Object.freeze({GROUPS,CARDS,KEYWORDS,OPEN_KEY,normalize,matches,search,readOpen,writeOpen});
});
