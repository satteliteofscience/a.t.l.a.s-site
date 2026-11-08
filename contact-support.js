/* A.T.L.A.S. technical support contact dialog.
 * Independent from newsletter registration, donations and firmware PIN handling. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const trigger=$('issuesLink'),dialog=$('supportContactDialog');
 if(!trigger||!dialog)return;
 const email='deluxe.history@outlook.com';
 const translations={
  ru:{
   title:'Связь с разработчиком',
   description:'Есть вопрос об A.T.L.A.S. или совместимости полётного контроллера? Напиши на почту проекта.',
   send:'Написать письмо ↗',copy:'Скопировать адрес',copied:'Адрес скопирован ✓',
   copyFailed:'Выдели и скопируй адрес выше',close:'Закрыть окно',
   hint:'Укажи модель платы, версию прошивки и опиши вопрос. Кнопка откроет почтовую программу.',
   subject:'A.T.L.A.S. — вопрос о прошивке'
  },
  uk:{
   title:'Зв’язок із розробником',
   description:'Є запитання щодо A.T.L.A.S. або сумісності польотного контролера? Напиши на електронну пошту проєкту.',
   send:'Написати листа ↗',copy:'Скопіювати адресу',copied:'Адресу скопійовано ✓',
   copyFailed:'Виділи та скопіюй адресу вище',close:'Закрити вікно',
   hint:'Укажи модель плати, версію прошивки й опиши запитання. Кнопка відкриє поштову програму.',
   subject:'A.T.L.A.S. — запитання щодо прошивки'
  },
  en:{
   title:'Contact the developer',
   description:'Have a question about A.T.L.A.S. or flight-controller compatibility? Email the project.',
   send:'Write an email ↗',copy:'Copy email address',copied:'Address copied ✓',
   copyFailed:'Select and copy the email address above',close:'Close dialog',
   hint:'Include the board model, firmware version and your question. This button opens your email application.',
   subject:'A.T.L.A.S. — firmware support question'
  }
 };
 const close=$('supportContactClose'),copy=$('supportContactCopy'),send=$('supportContactSend');
 const current=()=>translations[window.AtlasI18n?.lang]||translations.ru;
 function render(){
  const t=current();
  $('supportContactTitle').textContent=t.title;
  $('supportContactDescription').textContent=t.description;
  $('supportContactSendLabel').textContent=t.send;
  $('supportContactHint').textContent=t.hint;
  copy.textContent=t.copy;
  close.setAttribute('aria-label',t.close);
  close.title=t.close;
  send.href='mailto:'+email+'?subject='+encodeURIComponent(t.subject);
  $('supportContactEmail').href='mailto:'+email+'?subject='+encodeURIComponent(t.subject);
 }
 trigger.addEventListener('click',()=>{
  render();
  if(!dialog.open)dialog.showModal();
 });
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  // Click outside the panel dismisses without interfering with in-panel links.
  if(event.target===dialog)dialog.close();
 });
 copy.addEventListener('click',async()=>{
  const t=current();
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard not available');
   await navigator.clipboard.writeText(email);
   copy.textContent=t.copied;
  }catch{
   copy.textContent=t.copyFailed;
  }
 });
 window.addEventListener('atlas:languagechange',render);
 render();
})();
