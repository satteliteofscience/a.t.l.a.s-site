/* A.T.L.A.S. donation + opt-in early-release email registration.
 * Payments use a hosted provider URL or a manual IBAN transfer, never a browser API secret.
 * Brevo uses provider-hosted double opt-in forms; no user email is sent to GitHub Pages.
 * Optional legacy private HTTPS subscription API can still be selected explicitly. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const host=$('atlasDonation');if(!host)return;
 const trigger=$('donationReveal'),panel=$('donationPanel');
 const actions=$('donationActions'),bankBox=$('donationBank'),hint=$('donationHint');
 const form=$('atlasSubscriberForm'),stage=$('donationPaymentStage'),status=$('donationFormStatus');
 const words={
  ru:{reveal:'ПОДДЕРЖАТЬ ПРОЕКТ',subtitle:'/// ДОБРОВОЛЬНЫЙ ДОНАТ ///',lead:'Реквизиты для добровольной поддержки:',pay:'Перейти к пожертвованию',bank:'Показать IBAN',iban:'IBAN',recipient:'Получатель',bankName:'Банк',purpose:'Назначение',copy:'Копировать IBAN',copied:'IBAN скопирован',noPayment:'Донаты пока не настроены.',disclaimer:'IBAN-перевод совершается в банковском приложении. Сайт не проверяет поступление средств и не запрашивает данные карты.',formTitle:'Подписка на обновления A.T.L.A.S.',formExplain:'Укажи email и полётный контроллер. После подтверждения адреса можно получать новости, списки изменений, приглашения на ранние тесты и подходящие прошивки.',email:'Электронная почта',board:'Полётный контроллер',boardHint:'Выберите плату',cube:'Cube Orange (планируется)',other:'Другая плата / ожидание поддержки',consent:'Согласен получать письма о версиях A.T.L.A.S. и тестировании. Подписка добровольна; отписаться можно в любой момент.',early:'Хочу участвовать в раннем тестировании после одобрения разработчиком.',subscribe:'Подписаться на обновления',skip:'Перейти к IBAN без подписки',back:'Вернуться к подписке',privacy:'Как используются ваши данные',invalid:'Укажите корректный email, плату и подтвердите согласие.',unavailable:'Рассылка ещё не подключена к серверу. Email не отправлен и не сохранён. Можно перевести донат по IBAN без подписки.',sending:'Отправляем запрос…',sent:'Запрос отправлен. Проверьте почту и подтвердите подписку. Это не подтверждение доната.',failed:'Не получилось отправить запрос. Данные не подтверждены. Можно продолжить без подписки.',noSupport:'Для этой платы пока нет прошивки; письма со сборкой придут только после появления поддерживаемого релиза.',brevoExplain:'Выберите модель контроллера и откройте защищённую форму Brevo. Email, согласие на письма и интерес к ранним тестам заполняются там. После этого подтвердите адрес через письмо.',brevoButton:'Открыть форму подписки Brevo ↗',chooseBoard:'Сначала выберите полётный контроллер.',brevoUnavailable:'Для этой платы форма Brevo ещё не подключена. Email не собирается на сайте.',brevoOpened:'Переходим к форме Brevo. Подтверждение подписки выполняется на стороне Brevo.',hostedPaymentDisclaimer:'Оплата проходит на отдельной HTTPS-странице платёжного сервиса. Способы оплаты, включая Google Pay, зависят от устройства и настроек провайдера. Сайт не видит и не проверяет платежи.',},
  uk:{reveal:'ПІДТРИМАТИ ПРОЄКТ',subtitle:'/// ДОБРОВІЛЬНИЙ ДОНАТ ///',lead:'Реквізити для добровільної підтримки:',pay:'Перейти до внеску',bank:'Показати IBAN',iban:'IBAN',recipient:'Одержувач',bankName:'Банк',purpose:'Призначення',copy:'Копіювати IBAN',copied:'IBAN скопійовано',noPayment:'Пожертви ще не налаштовані.',disclaimer:'Переказ за IBAN здійснюється в банківському застосунку. Сайт не перевіряє отримання коштів і не запитує дані картки.',formTitle:'Підписка на оновлення A.T.L.A.S.',formExplain:'Вкажіть email і польотний контролер. Після підтвердження адреси ви зможете отримувати новини, списки змін, запрошення на ранні тести та сумісні прошивки.',email:'Електронна пошта',board:'Польотний контролер',boardHint:'Оберіть плату',cube:'Cube Orange (планується)',other:'Інша плата / очікування підтримки',consent:'Погоджуюся отримувати листи про випуски A.T.L.A.S. і тестування. Підписка добровільна; відписатися можна будь-коли.',early:'Хочу брати участь у ранньому тестуванні після схвалення розробником.',subscribe:'Підписатися на оновлення',skip:'Перейти до IBAN без підписки',back:'Повернутися до підписки',privacy:'Як використовуються ваші дані',invalid:'Вкажіть коректну пошту, плату та підтвердьте згоду.',unavailable:'Розсилку ще не підключено до сервера. Email не надіслано і не збережено. Можна переказати пожертву за IBAN без підписки.',sending:'Надсилаємо запит…',sent:'Запит надіслано. Перевірте пошту й підтвердьте підписку. Це не підтвердження внеску.',failed:'Не вдалося надіслати запит. Дані не підтверджено. Можна продовжити без підписки.',noSupport:'Для цієї плати ще немає прошивки; листи зі збіркою надійдуть після появи сумісного випуску.',brevoExplain:'Оберіть польотний контролер та відкрийте захищену форму Brevo. Email, згода на листи та зацікавленість у ранньому тестуванні заповнюються там. Потім підтвердьте адресу через лист.',brevoButton:'Відкрити форму підписки Brevo ↗',chooseBoard:'Спочатку оберіть польотний контролер.',brevoUnavailable:'Для цієї плати форма Brevo ще не налаштована. Email не збирається на сайті.',brevoOpened:'Переходимо до форми Brevo. Підтвердження підписки виконується в Brevo.',hostedPaymentDisclaimer:'Оплата проходить на окремій HTTPS-сторінці платіжного сервісу. Доступність Google Pay залежить від пристрою та провайдера. Сайт не бачить і не перевіряє платежі.',},
  en:{reveal:'SUPPORT THE PROJECT',subtitle:'/// VOLUNTARY DONATION ///',lead:'Details for voluntary support:',pay:'Open donation page',bank:'Show IBAN',iban:'IBAN',recipient:'Recipient',bankName:'Bank',purpose:'Payment reference',copy:'Copy IBAN',copied:'IBAN copied',noPayment:'Donations have not been configured.',disclaimer:'IBAN transfers take place in your banking app. This site does not verify receipt of funds or request card details.',formTitle:'Subscribe to A.T.L.A.S. updates',formExplain:'Enter your email address and flight controller. After confirming your address, you can receive news, change logs, early-test invitations and compatible firmware images.',email:'Email address',board:'Flight controller',boardHint:'Select a board',cube:'Cube Orange (planned)',other:'Other board / awaiting support',consent:'I agree to receive emails about A.T.L.A.S. releases and testing. Subscription is optional and I may unsubscribe at any time.',early:'I would like to take part in early testing if approved by the developer.',subscribe:'Subscribe to updates',skip:'Continue to IBAN without subscribing',back:'Back to subscription',privacy:'How your data is used',invalid:'Enter a valid email, select your board and consent to receiving updates.',unavailable:'Email subscriptions are not connected to a server yet. Your email was not sent or saved. You can still donate by IBAN.',sending:'Sending request…',sent:'Request sent. Check your email and confirm your subscription. This is not donation confirmation.',failed:'Could not send the request. Registration was not confirmed. You can continue without subscribing.',noSupport:'No firmware is available for this board yet; images will be emailed only after a compatible release exists.',brevoExplain:'Select your flight controller and open the hosted Brevo form. Enter your email, newsletter consent and early-testing interest there, then confirm your email using the verification message.',brevoButton:'Open Brevo subscription form ↗',chooseBoard:'Choose a flight controller first.',brevoUnavailable:'The Brevo form is not configured for this board yet. The website does not collect your email.',brevoOpened:'Opening the Brevo form. Subscription confirmation is handled by Brevo.',hostedPaymentDisclaimer:'Payment takes place on a separate HTTPS page of the payment provider. Available methods, including Google Pay, depend on the device and provider. This site cannot see or verify payments.',}
 };
 let config={},subs={},pinned=false,busy=false;
 const t=k=>(words[window.AtlasI18n?.lang]||words.ru)[k]||k;
 const lang=()=>window.AtlasI18n?.lang||'ru';
 const validURL=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:null;}catch{return null;}};
 const hostedBrevoURL=s=>{
  const href=validURL(s);if(!href)return null;
  const h=new URL(href).hostname.toLowerCase();
  return ['sibforms.com','brevo.com','sendinblue.com'].some(domain=>h===domain||h.endsWith('.'+domain))?href:null;
 };
 const validBoard=board=>['matek-h743-wing-v3','cube-orange','other'].includes(board);
 const hostedMode=()=>subs.provider==='brevo-hosted';
 const validIBAN=s=>{if(typeof s!=='string')return false;const a=s.replace(/\s/g,'').toUpperCase();if(!/^UA\d{27}$/.test(a))return false;const v=a.slice(4)+a.slice(0,4);let rem=0;for(const c of v){const p=(c>='A'&&c<='Z')?String(c.charCodeAt(0)-55):c;for(const d of p)rem=(rem*10+Number(d))%97;}return rem===1;};
 const addRow=(target,label,value)=>{const row=document.createElement('div'),l=document.createElement('span'),v=document.createElement('strong');row.className='donation-bank-row';l.textContent=label;v.textContent=value;row.append(l,v);target.append(row);};
 function render(){
  $('donationTriggerTitle').textContent=t('reveal');$('donationTriggerSecondary').textContent=t('subtitle');
  $('donationLead').textContent=t('lead');$('donationFormHeading').textContent=t('formTitle');$('donationFormExplain').textContent=t('formExplain');
  $('donationEmailLabel').textContent=t('email');$('donationBoardLabel').textContent=t('board');$('donationBoardPlaceholder').textContent=t('boardHint');
  $('donationBoard').options[2].textContent=t('cube');$('donationBoard').options[3].textContent=t('other');
  $('donationConsentText').textContent=t('consent');$('donationEarlyText').textContent=t('early');$('donationSubscribeButton').textContent=t('subscribe');
  $('donationSkipSubscription').textContent=t('skip');$('donationBackToForm').textContent=t('back');$('donationPrivacyLink').textContent=t('privacy');
  const useHosted=hostedMode();
  $('donationEmail').closest('label').hidden=useHosted;
  $('donationMailConsent').closest('label').hidden=useHosted;
  $('donationEarlyInterest').closest('label').hidden=useHosted;
  $('donationEmail').required=!useHosted;
  $('donationMailConsent').required=!useHosted;
  if(useHosted){
   $('donationFormExplain').textContent=t('brevoExplain');
   $('donationSubscribeButton').textContent=t('brevoButton');
  }
  actions.replaceChildren();bankBox.replaceChildren();
  const url=validURL(config.donation_url),iban=validIBAN(config.iban)?config.iban.replace(/\s/g,'').toUpperCase():null;
  if(url){const a=document.createElement('a');a.className='donation-action-primary';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=t('pay')+' ↗';actions.append(a);}
  if(iban){const b=document.createElement('button');b.className='donation-action-secondary';b.type='button';b.textContent=t('bank');b.addEventListener('click',()=>{bankBox.hidden=!bankBox.hidden;});actions.append(b);
   addRow(bankBox,t('iban'),iban);if(config.recipient)addRow(bankBox,t('recipient'),String(config.recipient));if(config.bank)addRow(bankBox,t('bankName'),String(config.bank));if(config.purpose)addRow(bankBox,t('purpose'),String(config.purpose));
   const copy=document.createElement('button');copy.className='donation-action-secondary';copy.type='button';copy.textContent=t('copy');copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(iban);copy.textContent=t('copied');}catch{copy.textContent=iban;}});bankBox.append(copy);
  }
  hint.textContent=url?t('hostedPaymentDisclaimer'):(iban?t('disclaimer'):t('noPayment'));
 }
 function show(visible){panel.hidden=!visible;host.classList.toggle('is-revealed',visible);trigger.setAttribute('aria-expanded',String(visible));}
 function payment(){form.hidden=true;stage.hidden=false;bankBox.hidden=false;}
 form.addEventListener('submit',async ev=>{
  ev.preventDefault();if(busy)return;
  const email=$('donationEmail').value.trim(),board=$('donationBoard').value,consent=$('donationMailConsent').checked;
  if(hostedMode()){
   if(!validBoard(board)){status.textContent=t('chooseBoard');return;}
   const url=hostedBrevoURL(subs.hosted_forms?.[board]);
   if(!url){status.textContent=t('brevoUnavailable');return;}
   // Brevo receives email, consent and early-tester interest on its hosted form.
   // Do NOT forward email or unchecked consent to a public GitHub Pages endpoint.
   status.textContent=t('brevoOpened');
   window.location.assign(url);
   return;
  }
  if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!validBoard(board)||!consent){status.textContent=t('invalid');return;}
  const endpoint=validURL(subs.api_endpoint);
  if(!endpoint){status.textContent=t('unavailable');return;}
  busy=true;$('donationSubscribeButton').disabled=true;status.textContent=t('sending');
  try{const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),12000);let response;try{response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,board,lang:lang(),consent:true,early_interest:$('donationEarlyInterest').checked,website:''}),signal:ctrl.signal,mode:'cors',cache:'no-store'});}finally{clearTimeout(timeout);}
   if(!response.ok)throw Error('HTTP '+response.status);status.textContent=t('sent');if(board!=='matek-h743-wing-v3')status.textContent+=' '+t('noSupport');payment();
  }catch(error){console.warn('A.T.L.A.S. subscription:',error);status.textContent=t('failed');}finally{busy=false;$('donationSubscribeButton').disabled=false;}
 });
 $('donationSkipSubscription').addEventListener('click',payment);
 $('donationBackToForm').addEventListener('click',()=>{stage.hidden=true;form.hidden=false;});
 trigger.addEventListener('click',()=>{pinned=!pinned;show(pinned);});
 host.addEventListener('pointerenter',ev=>{if(ev.pointerType!=='touch')show(true);});
 host.addEventListener('pointerleave',ev=>{if(ev.pointerType!=='touch'&&!pinned)show(false);});
 host.addEventListener('focusin',()=>show(true));
 host.addEventListener('focusout',()=>{queueMicrotask(()=>{if(!pinned&&!host.contains(document.activeElement)&&!host.matches(':hover'))show(false);});});
 window.addEventListener('atlas:languagechange',render);
 const embedded=$('atlasEmbeddedSupport');
 (async()=>{try{
  if(embedded){config=JSON.parse(embedded.textContent);}else{const r=await fetch('data/support.json',{cache:'no-store'});if(r.ok)config=await r.json();}
  const r=await fetch('data/subscriptions.json',{cache:'no-store'});if(r.ok)subs=await r.json();
 }catch(error){console.warn('A.T.L.A.S. support configuration:',error);}render();})();
 render();
})();
