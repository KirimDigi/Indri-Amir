(function($){'use strict';var config=window.WDSFARsvpGuard||null;if(!config||!config.postId){return}
var state={challenge:'',challengeIssuedAt:0,challengeMinAge:parseInt(config.challengeMinAge||4,10)||4,challengeExpiresIn:600,challengeLoading:!1,ticket:'',ticketIssuedAt:0,ticketExpiresIn:parseInt(config.ticketExpiresIn||180,10)||180,ticketLoading:!1,ticketTimer:null,interactions:0,formIntent:!1,viewportEngaged:!1,viewportPrefetchAllowed:!0,writeInFlight:!1,turnstileToken:'',turnstileWidget:null,turnstileReady:!1,replayingSubmit:!1};function getAjaxUrl(){var modern=$('.wds-wishes[data-ajax-url], .wds-rsvp-only[data-ajax-url]').first().attr('data-ajax-url');if(modern){return modern}
if(window.WDS_RSVP&&window.WDS_RSVP.ajaxurl){return window.WDS_RSVP.ajaxurl}
return config.ajaxUrl||''}
function isProtected(data){if(!(data instanceof FormData)){return!1}
var action=String(data.get('action')||'');var name=String(data.get('name')||'');return action==='insert_comment'||(action==='run_wds'&&(name==='wishes_submit'||name==='rsvp_submit'))}
function getPostId(data){return parseInt(data.get('comment_post_ID')||data.get('post_id')||0,10)||0}
function nowSeconds(){return Math.floor(Date.now()/1000)}
function clearTicketTimer(){if(state.ticketTimer){window.clearTimeout(state.ticketTimer);state.ticketTimer=null}}
function ticketIsFresh(){if(!state.ticket||!state.ticketIssuedAt){return!1}
return(nowSeconds()-state.ticketIssuedAt)<Math.max(20,state.ticketExpiresIn-20)}
function challengeIsFresh(){if(!state.challenge||!state.challengeIssuedAt){return!1}
return(nowSeconds()-state.challengeIssuedAt)<Math.max(20,state.challengeExpiresIn-20)}
var challengeTargets=[];var challengeViewportQueued=!1;function challengeTargetForForm(form){if(!form||typeof form.closest!=='function'){return form||null}
return form.closest('.saic-wrapper, .wds-wishes, .wds-rsvp-only')||form}
function registerChallengeTarget(form){var target=challengeTargetForForm(form);if(!target||target.__wdsfaRsvpGuardChallengeTarget){return}
target.__wdsfaRsvpGuardChallengeTarget=!0;challengeTargets.push(target);if(state.viewportEngaged){queueChallengeViewportCheck()}}
function challengeTargetNearViewport(target){if(!target||!target.isConnected||typeof target.getBoundingClientRect!=='function'){return!1}
var margin=720;var rect=target.getBoundingClientRect();return rect.bottom>=-margin&&rect.top<=window.innerHeight+margin}
function checkChallengeTargetsNearViewport(){challengeViewportQueued=!1;challengeTargets=challengeTargets.filter(function(target){return!!(target&&target.isConnected)});for(var i=0;i<challengeTargets.length;i+=1){if(challengeTargetNearViewport(challengeTargets[i])){prefetchChallenge();return}}}
function queueChallengeViewportCheck(){if(challengeViewportQueued){return}
challengeViewportQueued=!0;window.requestAnimationFrame(checkChallengeTargetsNearViewport)}
function recordFormInteraction(event){if(event&&event.isTrusted===!1){return}
if(event&&event.target&&event.target.name==='wdsfa_company'){return}
state.interactions=Math.min(50,state.interactions+1);state.formIntent=!0;ensureSecurityMaterial()}
function bindProtectedForm(form){if(!form||form.__wdsfaRsvpGuardBound){return}
form.__wdsfaRsvpGuardBound=!0;['pointerdown','keydown','change','focusin'].forEach(function(eventName){form.addEventListener(eventName,recordFormInteraction,!0)});registerChallengeTarget(form)}
function initLazySecurityActivation(){window.addEventListener('scroll',function(){state.viewportEngaged=!0;queueChallengeViewportCheck()},{passive:!0});window.addEventListener('resize',function(){if(state.viewportEngaged){queueChallengeViewportCheck()}},{passive:!0})}
function addTrapToForm(form){if(!form||form.querySelector('[name="wdsfa_company"]')){return}
var wrap=document.createElement('div');wrap.setAttribute('aria-hidden','true');wrap.style.position='absolute';wrap.style.left='-10000px';wrap.style.top='auto';wrap.style.width='1px';wrap.style.height='1px';wrap.style.overflow='hidden';wrap.style.opacity='0';wrap.style.pointerEvents='none';var label=document.createElement('label');label.textContent='Company website';var input=document.createElement('input');input.type='text';input.name='wdsfa_company';input.value='';input.tabIndex=-1;input.autocomplete='new-password';label.appendChild(input);wrap.appendChild(label);form.appendChild(wrap)}
function setupTraps(){document.querySelectorAll('.saic-container-form form, .wds-wishes__form, .wds-rsvp-only__form').forEach(function(form){addTrapToForm(form);bindProtectedForm(form)})}
function observeForms(){setupTraps();if(!window.MutationObserver){return}
var queued=!1;new MutationObserver(function(){if(queued){return}
queued=!0;window.requestAnimationFrame(function(){queued=!1;setupTraps()})}).observe(document.body,{childList:!0,subtree:!0})}
function fetchChallenge(){if(!config.browserChallenge||state.writeInFlight||state.challengeLoading||state.ticketLoading||ticketIsFresh()||challengeIsFresh()){return}
var url=getAjaxUrl();if(!url){return}
clearTicketTimer();state.challengeLoading=!0;state.challenge='';state.challengeIssuedAt=0;$.ajax({url:url,type:'POST',dataType:'json',data:{action:'wdsfa_rsvp_challenge',post_id:parseInt(config.postId,10)}}).done(function(response){if(response&&response.success&&response.data&&response.data.challenge){state.challenge=String(response.data.challenge);state.challengeIssuedAt=parseInt(response.data.issuedAt||nowSeconds(),10)||nowSeconds();state.challengeMinAge=parseInt(response.data.minAge||state.challengeMinAge,10)||state.challengeMinAge;state.challengeExpiresIn=parseInt(response.data.expiresIn||state.challengeExpiresIn,10)||state.challengeExpiresIn;if(state.formIntent){scheduleTicketExchange(0)}}}).always(function(){state.challengeLoading=!1})}
function prefetchChallenge(){if(!config.browserChallenge||!state.viewportPrefetchAllowed||state.writeInFlight||ticketIsFresh()||challengeIsFresh()){return}
state.challenge='';state.challengeIssuedAt=0;fetchChallenge()}
function scheduleTicketExchange(extraDelayMs){if(!config.browserChallenge||ticketIsFresh()||state.ticketLoading||!state.formIntent||!challengeIsFresh()||state.interactions<1){return}
clearTicketTimer();var age=nowSeconds()-state.challengeIssuedAt;var waitSeconds=Math.max(0,state.challengeMinAge-age);var delay=Math.max(0,waitSeconds*1000+80+(extraDelayMs||0));state.ticketTimer=window.setTimeout(function(){state.ticketTimer=null;fetchTicket()},delay)}
function fetchTicket(){if(!config.browserChallenge||state.ticketLoading||ticketIsFresh()||!state.formIntent||!challengeIsFresh()||state.interactions<1){return}
var url=getAjaxUrl();if(!url){return}
var challenge=state.challenge;state.challenge='';state.ticketLoading=!0;$.ajax({url:url,type:'POST',dataType:'json',data:{action:'wdsfa_rsvp_ticket',post_id:parseInt(config.postId,10),challenge:challenge,js:1,interactions:state.interactions,webdriver:navigator.webdriver===!0?1:0}}).done(function(response){if(response&&response.success&&response.data&&response.data.ticket){state.ticket=String(response.data.ticket);state.ticketIssuedAt=parseInt(response.data.issuedAt||nowSeconds(),10)||nowSeconds();state.ticketExpiresIn=parseInt(response.data.expiresIn||state.ticketExpiresIn,10)||state.ticketExpiresIn;return}
state.ticket='';state.ticketIssuedAt=0;state.challengeIssuedAt=0;if(state.formIntent){window.setTimeout(fetchChallenge,700)}}).fail(function(){state.ticket='';state.ticketIssuedAt=0;state.challengeIssuedAt=0;if(state.formIntent){window.setTimeout(fetchChallenge,900)}}).always(function(){state.ticketLoading=!1})}
function resetSecurityMaterial(){clearTicketTimer();state.ticket='';state.ticketIssuedAt=0;state.challenge='';state.challengeIssuedAt=0;state.interactions=0;state.formIntent=!1;state.viewportPrefetchAllowed=!1}
function ensureSecurityMaterial(){if(!state.formIntent||ticketIsFresh()){return}
state.ticket='';state.ticketIssuedAt=0;if(challengeIsFresh()){scheduleTicketExchange(0)}else{state.challenge='';state.challengeIssuedAt=0;fetchChallenge()}}
function isProtectedForm(form){if(!form||typeof form.matches!=='function'){return!1}
return form.matches('.saic-container-form form, .wds-wishes__form, .wds-rsvp-only__form')}
function waitForTicket(callback,startedAt){if(ticketIsFresh()){callback(!0);return}
var started=startedAt||Date.now();if((Date.now()-started)>8000){callback(!1);return}
ensureSecurityMaterial();window.setTimeout(function(){waitForTicket(callback,started)},120)}
document.addEventListener('submit',function(event){var form=event.target;if(state.replayingSubmit||!isProtectedForm(form)||ticketIsFresh()){return}
event.preventDefault();event.stopImmediatePropagation();state.interactions=Math.max(1,state.interactions);state.formIntent=!0;ensureSecurityMaterial();var submitter=event.submitter||null;waitForTicket(function(ready){if(!ready||!document.contains(form)){return}
state.replayingSubmit=!0;try{if(typeof form.requestSubmit==='function'){form.requestSubmit(submitter||undefined)}else{form.dispatchEvent(new Event('submit',{bubbles:!0,cancelable:!0}))}}finally{window.setTimeout(function(){state.replayingSubmit=!1},0)}})},!0);function resetTurnstile(){if(!config.turnstileEnabled||!state.turnstileReady||state.turnstileWidget===null||!window.turnstile){return}
state.turnstileToken='';try{window.turnstile.reset(state.turnstileWidget)}catch(e){}}
function initTurnstile(){if(!config.turnstileEnabled||!config.turnstileSiteKey){return}
var attempts=0;var timer=window.setInterval(function(){attempts+=1;if(!window.turnstile||typeof window.turnstile.render!=='function'){if(attempts>80){window.clearInterval(timer)}
return}
window.clearInterval(timer);var container=document.createElement('div');container.id='wdsfa-turnstile-guard';container.style.position='fixed';container.style.right='12px';container.style.bottom='12px';container.style.zIndex='2147483000';document.body.appendChild(container);try{state.turnstileWidget=window.turnstile.render(container,{sitekey:String(config.turnstileSiteKey),appearance:'interaction-only',action:'wds_rsvp',callback:function(token){state.turnstileToken=String(token||'')},'expired-callback':function(){state.turnstileToken='';resetTurnstile()},'error-callback':function(){state.turnstileToken=''}});state.turnstileReady=!0}catch(e){state.turnstileReady=!1}},100)}
$.ajaxPrefilter(function(options,originalOptions,jqXHR){var data=originalOptions&&originalOptions.data?originalOptions.data:options.data;if(!isProtected(data)){return}
if(getPostId(data)!==parseInt(config.postId,10)){return}
if(!data.has('wdsfa_company')){data.set('wdsfa_company','')}
if(ticketIsFresh()){data.set('wdsfa_ticket',state.ticket);state.ticket='';state.ticketIssuedAt=0}else{data.set('wdsfa_ticket','')}
data.set('wdsfa_js','1');data.set('wdsfa_interactions',String(state.interactions));data.set('wdsfa_webdriver',navigator.webdriver===!0?'1':'0');if(state.turnstileToken){data.set('wdsfa_turnstile',state.turnstileToken)}
state.writeInFlight=!0;if(jqXHR&&typeof jqXHR.always==='function'){jqXHR.always(function(){state.writeInFlight=!1;resetSecurityMaterial();window.setTimeout(resetTurnstile,150)})}else{state.writeInFlight=!1}});observeForms();initLazySecurityActivation();initTurnstile()})(jQuery)
;