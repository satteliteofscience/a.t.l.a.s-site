/* A.T.L.A.S. — monobank support & Tally Early Tester Program (GitHub Pages).
 * No payments, credentials, subscriber emails or approvals pass through this static site. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const shortcut=$('atlasDonateShortcut');if(!shortcut)return;
 const copy={
  ru:{
   reveal:'ПОДДЕРЖАТЬ ПРОЕКТ',subtitle:'/// ДОБРОВОЛЬНАЯ ПОДДЕРЖКА ///',
   jarDescription:'Поддержка разработки A.T.L.A.S. через monobank Банку. Подписка не требуется.',
   jarPay:'Поддержать через monobank Банку ↗',
   jarNote:'Сумма и способы перевода выбираются на monobank. Сайт не видит карту и не проверяет поступление средств.',
   jarMissing:'Ссылка на Банку временно недоступна.',
   quickDonate:'ПОДДЕРЖАТЬ ЧЕРЕЗ MONOBANK ↗',
   quickDonateNote:'Добровольное пожертвование. Не требуется для участия в раннем тестировании.',
   testerTitle:'Программа раннего тестирования A.T.L.A.S.',
   testerDescription:'Оставьте заявку через Tally: email, модель контроллера, GitHub и опыт ArduPlane. Участие добровольное. Донат не обязателен и не гарантирует доступ.',
   testerButton:'Подать заявку тестировщика ↗',
   testerHint:'Заявку проверяет разработчик. Подтверждение email, проверка пожертвований и доступ к тестовым прошивкам — только вручную. Рассылки пока не автоматизированы.',
   testerMissing:'Регистрация временно недоступна.',
   privacy:'Как используются ваши данные',
   programInfo:'Участие в программе раннего тестирования добровольное. Заполните заявку и укажите подходящий контроллер. Пожертвования не обязательны и не дают автоматического доступа к закрытым прошивкам.',
   step1:'Заполнить заявку в Tally и выбрать модель полётного контроллера.',
   step2:'Дождаться ручной проверки заявки, email и совместимости оборудования.',
   step3:'После одобрения получить приглашение при наличии подходящего теста.'
  },
  uk:{
   reveal:'ПІДТРИМАТИ ПРОЄКТ',subtitle:'/// ДОБРОВІЛЬНА ПІДТРИМКА ///',
   jarDescription:'Підтримка розробки A.T.L.A.S. через monobank Банку. Підписка не потрібна.',
   jarPay:'Підтримати через monobank Банку ↗',
   jarNote:'Суму та способи переказу обирають на monobank. Сайт не отримує дані картки й не перевіряє зарахування.',
   jarMissing:'Посилання на Банку тимчасово недоступне.',
   quickDonate:'ПІДТРИМАТИ ЧЕРЕЗ MONOBANK ↗',
   quickDonateNote:'Добровільна пожертва. Не потрібна для участі в ранньому тестуванні.',
   testerTitle:'Програма раннього тестування A.T.L.A.S.',
   testerDescription:'Подайте заявку через Tally: email, модель контролера, GitHub та досвід ArduPlane. Участь добровільна. Донат не є обов’язковим і не гарантує доступ.',
   testerButton:'Подати заявку тестувальника ↗',
   testerHint:'Заявку перевіряє розробник. Підтвердження email, пожертв і доступ до тестових прошивок — лише вручну. Автоматичної розсилки поки немає.',
   testerMissing:'Реєстрація тимчасово недоступна.',
   privacy:'Як використовуються ваші дані',
   programInfo:'Участь у програмі раннього тестування добровільна. Подайте заявку й укажіть сумісний контролер. Пожертви не обов’язкові та не надають автоматичного доступу до закритих прошивок.',
   step1:'Подати заявку через Tally та обрати модель польотного контролера.',
   step2:'Дочекатися ручної перевірки заявки, email і сумісності обладнання.',
   step3:'Після схвалення отримати запрошення, якщо є відповідне тестування.'
  },
  en:{
   reveal:'SUPPORT THE PROJECT',subtitle:'/// VOLUNTARY SUPPORT ///',
   jarDescription:'Support A.T.L.A.S. development via monobank Jar. No subscription required.',
   jarPay:'Support via monobank Jar ↗',
   jarNote:'Select your amount and transfer method on monobank. This site never receives card details or verifies a transfer.',
   jarMissing:'The donation link is temporarily unavailable.',
   quickDonate:'SUPPORT VIA MONOBANK ↗',
   quickDonateNote:'Voluntary support. Not required to apply for early testing.',
   testerTitle:'A.T.L.A.S. Early Tester Program',
   testerDescription:'Apply via Tally with your email, flight controller, GitHub username and ArduPlane experience. Applying is voluntary; donations are not required and do not guarantee access.',
   testerButton:'Apply to test early firmware ↗',
   testerHint:'Applications are reviewed manually. Email confirmation, donation verification and firmware access are not automatic. Email campaigns are not yet automated.',
   testerMissing:'Registration is temporarily unavailable.',
   privacy:'How your data is used',
   programInfo:'Joining early testing is voluntary. Apply with a compatible flight controller. Donations are optional and never grant automatic access to private firmware.',
   step1:'Submit a Tally application and select your flight controller.',
   step2:'Wait for manual review of your application, email and equipment compatibility.',
   step3:'If approved, receive an invitation when a suitable test is available.'
  }
 };
 let support={},application={};
 const valid=(s,hostname,pathRegex)=>{
  try{
   const u=new URL(s);
   return u.protocol==='https:'&&u.hostname===hostname&&pathRegex.test(u.pathname)&&!u.search&&!u.hash?u.href:null;
  }catch{return null;}
 };
 const current=()=>copy[window.AtlasI18n?.lang]||copy.ru;
 function put(id,value){const e=$(id);if(e)e.textContent=value;}
 function render(){
  const t=current();
  const jar=support.donation_provider==='monobank-jar'?valid(support.donation_url,'send.monobank.ua',/^\/jar\/[A-Za-z0-9_-]+\/?$/):null;
  const quickLink=$('atlasQuickDonate');
  shortcut.hidden=!jar;
  if(jar){
   quickLink.href=jar;
   put('atlasQuickDonateLabel',t.quickDonate);
   put('atlasQuickDonateSubtitle',t.subtitle);
   put('atlasQuickDonateNote',t.quickDonateNote);
  }else{
   quickLink.removeAttribute('href');
  }
  const form=application.provider==='tally-hosted'?valid(application.form_url,'tally.so',/^\/r\/[A-Za-z0-9]+\/?$/):null;
  put('atlasTesterHint',form?t.testerHint:t.testerMissing);
  put('atlasTesterPrivacyLink',t.privacy);
  put('atlasTesterInfo',t.programInfo);
  put('atlasTesterStep1',t.step1);put('atlasTesterStep2',t.step2);put('atlasTesterStep3',t.step3);
  const applyLink=$('atlasTesterLink');applyLink.hidden=!form;
  if(form){applyLink.href=form;put('atlasTesterLinkLabel',t.testerButton);}
  else applyLink.removeAttribute('href');
 }
 // A native outbound anchor is always clickable; the glitch is purely decorative.
 for(const link of [$('atlasQuickDonate'),$('atlasTesterLink')]){
  link.addEventListener('click',()=>{
   link.classList.add('is-glitching');
   setTimeout(()=>link.classList.remove('is-glitching'),650);
  });
 }
 window.addEventListener('atlas:languagechange',render);
 (async()=>{try{
  const [a,b]=await Promise.all([fetch('data/support.json',{cache:'no-store'}),fetch('data/subscriptions.json',{cache:'no-store'})]);
  if(a.ok)support=await a.json();
  if(b.ok)application=await b.json();
 }catch(err){console.warn('A.T.L.A.S. support configuration:',err);}render();})();
 render();
})();
