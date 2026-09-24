(function($){'use strict';var config=window.WDSFAPublicPerformanceGuard||null;if(!config||!config.enabled){return}
var selector='a.saic-link.auto-load-true, a.saic-link.wdsfa-rsvp-lazy';var observed=[];var observer=null;var fallbackQueued=!1;var infiniteObserver=null;var hasUserScrolled=!1;var lastWindowScrollY=window.pageYOffset||document.documentElement.scrollTop||0;var nativeAjax=$.ajax;var modernLookupEntries={};var modernLookupObserver=null;var modernLookupFallbackBound=!1;var modernLookupFallbackQueued=!1;function prepareLegacyLinks(){if(!config.legacyLazy){return}
document.querySelectorAll('a.saic-link.auto-load-true').forEach(function(link){link.classList.remove('auto-load-true');link.classList.add('wdsfa-rsvp-lazy')})}
prepareLegacyLinks();function modernLookupRequestData(options){if(!options||!options.data){return null}
var data=parseAjaxData(options.data);if(String(data.action||'')!=='run_wds'||String(data.name||'')!=='rsvp_lookup'){return null}
var postId=parseInt(data.post_id||0,10)||0;var guestKey=String(data.guest_key||'').trim();if(!postId||!guestKey||postId!==(parseInt(config.postId||0,10)||0)){return null}
data.post_id=postId;data.guest_key=guestKey;return data}
function findModernRsvpBlock(data){var postId=parseInt(data&&data.post_id?data.post_id:0,10)||0;var guestKey=String(data&&data.guest_key?data.guest_key:'').trim();if(!postId||!guestKey){return null}
var blocks=document.querySelectorAll('.wds-rsvp-only[data-post-id="'+postId+'"]');var fallback=null;for(var i=0;i<blocks.length;i+=1){var block=blocks[i];if(!block||block.classList.contains('is-editor-preview')){continue}
fallback=fallback||block;if(String(block.getAttribute('data-guest-key')||'').trim()===guestKey){return block}}
return blocks.length===1?fallback:null}
function modernLookupKey(data){return String(parseInt(data.post_id||0,10)||0)+'|'+String(data.guest_key||'')}
function modernLookupNearViewport(block){if(!block||!block.isConnected){return!1}
var margin=parseInt(config.modernMarginPx||720,10)||720;var rect=block.getBoundingClientRect();return rect.bottom>=-margin&&rect.top<=window.innerHeight+margin}
function invokeModernCallback(options,name,context,args){if(!options||typeof options[name]!=='function'){return}
try{options[name].apply(context||options.context||options,args||[])}catch(e){window.setTimeout(function(){throw e},0)}}
function createModernWaiter(entry,options,primary){var deferred=$.Deferred();var promise=deferred.promise();var waiter={deferred:deferred,promise:promise,options:options||{},primary:!!primary,aborted:!1};promise.abort=function(){waiter.aborted=!0;if(entry&&entry.xhr&&typeof entry.xhr.abort==='function'&&waiter.primary){entry.xhr.abort()}else if(deferred.state()==='pending'){deferred.reject(null,'abort','abort')}
return promise};entry.waiters.push(waiter);return waiter}
function settleModernWaiter(waiter,success,context,args){if(!waiter||waiter.aborted||waiter.deferred.state()!=='pending'){return}
if(success){waiter.deferred.resolveWith(context,args);if(!waiter.primary){invokeModernCallback(waiter.options,'success',context,args);invokeModernCallback(waiter.options,'complete',context,[args[2]||null,args[1]||'success'])}}else{waiter.deferred.rejectWith(context,args);if(!waiter.primary){invokeModernCallback(waiter.options,'error',context,args);invokeModernCallback(waiter.options,'complete',context,[args[0]||null,args[1]||'error'])}}}
function cleanupModernObservation(entry){if(!entry||!entry.block){return}
if(modernLookupObserver){try{modernLookupObserver.unobserve(entry.block)}catch(e){}}
if(entry.interactionHandler){entry.block.removeEventListener('focusin',entry.interactionHandler,!0);entry.block.removeEventListener('pointerdown',entry.interactionHandler,!0);entry.block.removeEventListener('touchstart',entry.interactionHandler,!0);entry.block.removeEventListener('keydown',entry.interactionHandler,!0);entry.interactionHandler=null}}
function executeModernLookup(entry){if(!entry||entry.state!=='queued'){return}
entry.state='running';if(entry.block){entry.block.setAttribute('data-wdsfa-rsvp-lookup-state','running')}
cleanupModernObservation(entry);var xhr;try{xhr=nativeAjax.apply(entry.context,entry.args);entry.xhr=xhr}catch(error){entry.state='done';entry.success=!1;entry.resultContext=entry.context;entry.resultArgs=[null,'error',error];entry.waiters.forEach(function(waiter){settleModernWaiter(waiter,!1,entry.resultContext,entry.resultArgs)});return}
if(!xhr||typeof xhr.done!=='function'||typeof xhr.fail!=='function'){entry.state='done';return}
xhr.done(function(){entry.state='done';entry.success=!0;entry.resultContext=this;entry.resultArgs=Array.prototype.slice.call(arguments);if(entry.block){entry.block.setAttribute('data-wdsfa-rsvp-lookup-state','done')}
entry.waiters.forEach(function(waiter){settleModernWaiter(waiter,!0,entry.resultContext,entry.resultArgs)})});xhr.fail(function(){entry.state='done';entry.success=!1;entry.resultContext=this;entry.resultArgs=Array.prototype.slice.call(arguments);if(entry.block){entry.block.setAttribute('data-wdsfa-rsvp-lookup-state','done')}
entry.waiters.forEach(function(waiter){settleModernWaiter(waiter,!1,entry.resultContext,entry.resultArgs)})})}
function setupModernLookupObserver(){if(modernLookupObserver||!('IntersectionObserver' in window)){return}
modernLookupObserver=new IntersectionObserver(function(entries){entries.forEach(function(observedEntry){if(!observedEntry.isIntersecting){return}
var entry=observedEntry.target.__wdsfaModernLookupEntry;if(entry){executeModernLookup(entry)}})},{root:null,rootMargin:String(config.modernRootMargin||'720px 0px'),threshold:0.01})}
function checkModernLookupFallback(){modernLookupFallbackQueued=!1;Object.keys(modernLookupEntries).forEach(function(key){var entry=modernLookupEntries[key];if(entry&&entry.state==='queued'&&modernLookupNearViewport(entry.block)){executeModernLookup(entry)}})}
function queueModernLookupFallbackCheck(){if(modernLookupFallbackQueued){return}
modernLookupFallbackQueued=!0;window.requestAnimationFrame(checkModernLookupFallback)}
function bindModernLookupFallback(){if(modernLookupFallbackBound){return}
modernLookupFallbackBound=!0;window.addEventListener('scroll',queueModernLookupFallbackCheck,{passive:!0});window.addEventListener('resize',queueModernLookupFallbackCheck,{passive:!0});window.addEventListener('orientationchange',queueModernLookupFallbackCheck,{passive:!0})}
function observeModernLookup(entry){if(!entry||!entry.block){executeModernLookup(entry);return}
entry.block.__wdsfaModernLookupEntry=entry;entry.block.setAttribute('data-wdsfa-rsvp-lookup-state','queued');entry.interactionHandler=function(){executeModernLookup(entry)};entry.block.addEventListener('focusin',entry.interactionHandler,!0);entry.block.addEventListener('pointerdown',entry.interactionHandler,!0);entry.block.addEventListener('touchstart',entry.interactionHandler,{passive:!0,capture:!0});entry.block.addEventListener('keydown',entry.interactionHandler,!0);if('IntersectionObserver' in window){setupModernLookupObserver();if(modernLookupObserver){modernLookupObserver.observe(entry.block)}}else{bindModernLookupFallback()}
window.requestAnimationFrame(function(){if(entry.state==='queued'&&modernLookupNearViewport(entry.block)){executeModernLookup(entry)}})}
function queueModernLookup(context,args,options,data){var key=modernLookupKey(data);var existing=modernLookupEntries[key];if(existing){var duplicateWaiter=createModernWaiter(existing,options,!1);if(existing.state==='done'&&existing.resultArgs){window.setTimeout(function(){settleModernWaiter(duplicateWaiter,existing.success,existing.resultContext,existing.resultArgs)},0)}
return duplicateWaiter.promise}
var block=findModernRsvpBlock(data);if(!block){return nativeAjax.apply(context,args)}
var entry={key:key,block:block,context:context,args:args,options:options,state:'queued',waiters:[],xhr:null,success:!1,resultContext:null,resultArgs:null,interactionHandler:null};modernLookupEntries[key]=entry;var waiter=createModernWaiter(entry,options,!0);observeModernLookup(entry);return waiter.promise}
function installModernRsvpLookupInterceptor(){if(!config.modernRsvpLazy||!nativeAjax||$.ajax.__wdsfaModernLookupInterceptor){return}
var wrappedAjax=function(){var args=Array.prototype.slice.call(arguments);var options=null;if(args.length===1&&args[0]&&typeof args[0]==='object'){options=args[0]}else if(args.length>1&&args[1]&&typeof args[1]==='object'){options=args[1]}
var data=modernLookupRequestData(options);if(!data){return nativeAjax.apply(this,args)}
return queueModernLookup(this,args,options,data)};wrappedAjax.__wdsfaModernLookupInterceptor=!0;$.ajax=wrappedAjax}
installModernRsvpLookupInterceptor();function targetFor(link){return link.closest('.saic-wrapper')||link.closest('.elementor-widget')||link}
function markManualClick(link){if(!link){return}
link.setAttribute('data-wdsfa-lazy-loaded','1');if(observer){try{observer.unobserve(link.__wdsfaObserveTarget||link)}catch(e){}}}
function loadLink(link){if(!link||link.getAttribute('data-wdsfa-lazy-loaded')==='1'){return}
markManualClick(link);$(link).trigger('click')}
function setupIntersectionObserver(links){observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting){return}
loadLink(entry.target.__wdsfaLazyLink||entry.target)})},{root:null,rootMargin:String(config.rootMargin||'320px 0px'),threshold:0.01});links.forEach(function(link){var target=targetFor(link);link.__wdsfaObserveTarget=target;target.__wdsfaLazyLink=link;observer.observe(target)})}
function fallbackCheck(){fallbackQueued=!1;var margin=320;observed.forEach(function(link){if(!link||link.getAttribute('data-wdsfa-lazy-loaded')==='1'){return}
var rect=targetFor(link).getBoundingClientRect();if(rect.bottom>=-margin&&rect.top<=window.innerHeight+margin){loadLink(link)}})}
function queueFallbackCheck(){if(fallbackQueued){return}
fallbackQueued=!0;window.requestAnimationFrame(fallbackCheck)}
function parseAjaxData(data){var result={};if(!data){return result}
if(typeof data==='string'){data.split('&').forEach(function(part){var pair=part.split('=');if(!pair[0]){return}
try{result[decodeURIComponent(pair[0])]=decodeURIComponent((pair[1]||'').replace(/\+/g,' '))}catch(e){result[pair[0]]=pair[1]||''}});return result}
if(typeof FormData!=='undefined'&&data instanceof FormData){data.forEach(function(value,key){result[key]=value});return result}
if(typeof data==='object'){return data}
return result}
function removeLegacyPager(postId){var list=$('#saic-container-comment-'+postId);var holder=$('div.saic-holder-'+postId);if(holder.length&&typeof $.fn.jPages==='function'){try{if(holder.data('jPages')){holder.jPages('destroy')}}catch(e){}}
if(holder.length){holder.empty().hide()}
if(list.length){list.children().removeClass('animated jp-hidden jp-invisible fadeIn').css('opacity','')}}
function spinnerNode(postId){var wrap=document.createElement('li');wrap.id='wdsfa-rsvp-infinite-'+postId;wrap.className='wdsfa-rsvp-infinite';wrap.setAttribute('aria-live','polite');wrap.setAttribute('aria-busy','false');var spinner=document.createElement('span');spinner.className='wdsfa-rsvp-infinite__spinner';spinner.setAttribute('aria-hidden','true');wrap.appendChild(spinner);var text=document.createElement('span');text.className='wdsfa-rsvp-infinite__text';text.textContent=String(config.loadingLabel||'Memuat ucapan berikutnya...');wrap.appendChild(text);return wrap}
function isIndependentScrollRoot(list){if(!list||!list.isConnected){return!1}
var style=window.getComputedStyle?window.getComputedStyle(list):null;var overflowY=style?String(style.overflowY||style.overflow||''):'';var canScroll=/(auto|scroll|overlay)/i.test(overflowY);return canScroll&&list.scrollHeight>list.clientHeight+2}
function detachInfiniteScrollRoot(wrap){if(!wrap||!wrap.__wdsfaScrollRoot){return}
if(wrap.__wdsfaScrollHandler){wrap.__wdsfaScrollRoot.removeEventListener('scroll',wrap.__wdsfaScrollHandler,!1)}
if(wrap.__wdsfaGestureHandler){wrap.__wdsfaScrollRoot.removeEventListener('wheel',wrap.__wdsfaGestureHandler,!1);wrap.__wdsfaScrollRoot.removeEventListener('touchmove',wrap.__wdsfaGestureHandler,!1);wrap.__wdsfaScrollRoot.removeEventListener('pointerdown',wrap.__wdsfaGestureHandler,!1)}
wrap.__wdsfaScrollRoot=null;wrap.__wdsfaScrollHandler=null;wrap.__wdsfaGestureHandler=null}
function removeInfinite(postId){var wrap=document.getElementById('wdsfa-rsvp-infinite-'+postId);if(!wrap){return}
detachInfiniteScrollRoot(wrap);if(infiniteObserver){try{infiniteObserver.unobserve(wrap)}catch(e){}}
if(wrap.parentNode){wrap.parentNode.removeChild(wrap)}}
function infiniteNearViewport(wrap){if(!wrap||!wrap.isConnected){return!1}
var margin=parseInt(config.infiniteMargin||64,10)||64;var list=wrap.__wdsfaScrollRoot||wrap.parentNode;if(isIndependentScrollRoot(list)){var remaining=list.scrollHeight-(list.scrollTop+list.clientHeight);return remaining<=margin}
var rect=wrap.getBoundingClientRect();return rect.bottom>=-margin&&rect.top<=window.innerHeight+margin}
function setInfiniteLoading(wrap,loading){if(!wrap){return}
wrap.__wdsfaLoading=!!loading;wrap.setAttribute('aria-busy',loading?'true':'false');if(loading){wrap.classList.add('is-loading')}else{wrap.classList.remove('is-loading')}}
function appendUniqueLegacyComments(list,html){if(!list||!html){return 0}
var staging=document.createElement('div');staging.innerHTML=html;var added=0;var sentinel=list.querySelector('.wdsfa-rsvp-infinite');Array.prototype.slice.call(staging.children).forEach(function(node){if(!node||node.nodeType!==1){return}
if(node.id&&document.getElementById(node.id)){return}
if(sentinel&&sentinel.parentNode===list){list.insertBefore(node,sentinel)}else{list.appendChild(node)}
added+=1});return added}
function updateInfiniteState(wrap,nextOffset,hasMore,order){if(!wrap){return}
wrap.setAttribute('data-next-offset',String(parseInt(nextOffset||0,10)||0));wrap.setAttribute('data-order',String(order||'DESC').toUpperCase());wrap.setAttribute('data-has-more',hasMore?'1':'0')}
function loadNextLegacy(postId,wrap){if(!window.WDS_RSVP||!WDS_RSVP.ajaxurl||!WDS_RSVP.nonce||!wrap||!wrap.isConnected){return}
if(wrap.__wdsfaLoading||wrap.getAttribute('data-has-more')!=='1'){return}
if(!wrap.__wdsfaUserEngaged||!infiniteNearViewport(wrap)){return}
var offset=parseInt(wrap.getAttribute('data-next-offset')||'0',10)||0;var order=String(wrap.getAttribute('data-order')||'DESC').toUpperCase();var list=document.getElementById('saic-container-comment-'+postId);if(!list){removeInfinite(postId);return}
wrap.__wdsfaUserEngaged=!1;setInfiniteLoading(wrap,!0);$.ajax({type:'POST',dataType:'html',url:WDS_RSVP.ajaxurl,data:{action:'get_comments',post_id:postId,get:parseInt(config.legacyLimit||20,10)||20,offset:offset,order:order,nonce:WDS_RSVP.nonce,wdsfa_infinite:1}}).done(function(html,textStatus,xhr){appendUniqueLegacyComments(list,html);removeLegacyPager(postId);var nextOffset=xhr.getResponseHeader('X-WDSFA-Next-Offset');var hasMoreHeader=xhr.getResponseHeader('X-WDSFA-Has-More');if(nextOffset===null||hasMoreHeader===null){removeInfinite(postId);return}
if(hasMoreHeader!=='1'){removeInfinite(postId);return}
updateInfiniteState(wrap,nextOffset,!0,order)}).always(function(){if(wrap&&wrap.isConnected){setInfiniteLoading(wrap,!1)}})}
function maybeLoadInfinite(wrap){if(!wrap||!wrap.isConnected){return}
var postId=parseInt(wrap.getAttribute('data-post-id')||'0',10)||0;if(!postId){return}
loadNextLegacy(postId,wrap)}
function setupInfiniteObserver(){if(infiniteObserver||!('IntersectionObserver' in window)){return}
infiniteObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){maybeLoadInfinite(entry.target)}})},{root:null,rootMargin:String(parseInt(config.infiniteMargin||64,10)||64)+'px 0px',threshold:0.01})}
function bindInfiniteScrollRoot(wrap,list){if(!wrap||!list||!isIndependentScrollRoot(list)){return!1}
if(wrap.__wdsfaScrollRoot===list&&wrap.__wdsfaScrollHandler){return!0}
detachInfiniteScrollRoot(wrap);wrap.__wdsfaScrollRoot=list;wrap.__wdsfaLastScrollTop=list.scrollTop||0;wrap.__wdsfaGestureHandler=function(){wrap.__wdsfaUserEngaged=!0};wrap.__wdsfaScrollHandler=function(){var current=list.scrollTop||0;if(current>(wrap.__wdsfaLastScrollTop||0)+2){maybeLoadInfinite(wrap)}
wrap.__wdsfaLastScrollTop=current};list.addEventListener('wheel',wrap.__wdsfaGestureHandler,{passive:!0});list.addEventListener('touchmove',wrap.__wdsfaGestureHandler,{passive:!0});list.addEventListener('pointerdown',wrap.__wdsfaGestureHandler,{passive:!0});list.addEventListener('scroll',wrap.__wdsfaScrollHandler,{passive:!0});return!0}
function ensureInfinite(postId,nextOffset,hasMore,order){postId=parseInt(postId||0,10)||0;nextOffset=parseInt(nextOffset||0,10)||0;if(!postId){return}
removeLegacyPager(postId);if(!hasMore){removeInfinite(postId);return}
var list=document.getElementById('saic-container-comment-'+postId);if(!list||!list.parentNode){return}
var wrap=document.getElementById('wdsfa-rsvp-infinite-'+postId);if(!wrap){wrap=spinnerNode(postId);wrap.setAttribute('data-post-id',String(postId));wrap.__wdsfaUserEngaged=!1;list.appendChild(wrap)}
if(bindInfiniteScrollRoot(wrap,list)){if(infiniteObserver){try{infiniteObserver.unobserve(wrap)}catch(e){}}}else{setupInfiniteObserver();if(infiniteObserver){infiniteObserver.observe(wrap)}
wrap.__wdsfaUserEngaged=hasUserScrolled}
updateInfiniteState(wrap,nextOffset,!0,order);maybeLoadInfinite(wrap)}
function markInfiniteUserEngaged(){hasUserScrolled=!0;document.querySelectorAll('.wdsfa-rsvp-infinite').forEach(function(wrap){var list=wrap.__wdsfaScrollRoot||wrap.parentNode;if(isIndependentScrollRoot(list)){return}
wrap.__wdsfaUserEngaged=!0;maybeLoadInfinite(wrap)})}
function handleWindowScroll(){var current=window.pageYOffset||document.documentElement.scrollTop||0;if(current>lastWindowScrollY+2){markInfiniteUserEngaged()}
lastWindowScrollY=current}
function handleInfiniteKey(event){var key=event&&event.key?event.key:'';if(key==='ArrowDown'||key==='PageDown'||key==='End'||key===' '){markInfiniteUserEngaged()}}
function setupInfiniteInputTracking(){window.addEventListener('scroll',handleWindowScroll,{passive:!0});document.addEventListener('keydown',handleInfiniteKey,!1)}
function adjustOffsetAfterInsert(data,xhr){if(!xhr||xhr.status<200||xhr.status>=300){return}
if(String(xhr.responseText||'').indexOf('error-')===0){return}
var postId=parseInt(data.comment_post_ID||data.post_id||0,10)||0;if(!postId){return}
var wrap=document.getElementById('wdsfa-rsvp-infinite-'+postId);if(!wrap){return}
removeLegacyPager(postId);if(String(wrap.getAttribute('data-order')||'DESC').toUpperCase()!=='DESC'){return}
var offset=parseInt(wrap.getAttribute('data-next-offset')||'0',10)||0;wrap.setAttribute('data-next-offset',String(offset+1))}
function setupAjaxPaginationBridge(){$(document).ajaxComplete(function(event,xhr,settings){var data=parseAjaxData(settings&&settings.data?settings.data:null);var action=String(data.action||'');if(action==='insert_comment'){adjustOffsetAfterInsert(data,xhr);return}
if(action!=='get_comments'||String(data.wdsfa_infinite||'')==='1'){return}
var nextOffset=xhr.getResponseHeader('X-WDSFA-Next-Offset');var hasMoreHeader=xhr.getResponseHeader('X-WDSFA-Has-More');if(nextOffset===null||hasMoreHeader===null){return}
ensureInfinite(data.post_id,nextOffset,hasMoreHeader==='1',data.order||'DESC')})}
function setup(){if(!config.legacyLazy){return}
prepareLegacyLinks();setupInfiniteInputTracking();setupAjaxPaginationBridge();observed=Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function(link){return link.classList.contains('wdsfa-rsvp-lazy')});if(!observed.length){return}
observed.forEach(function(link){link.addEventListener('click',function(){markManualClick(link)},!0)});if('IntersectionObserver' in window){setupIntersectionObserver(observed);return}
window.addEventListener('scroll',queueFallbackCheck,{passive:!0});window.addEventListener('resize',queueFallbackCheck,{passive:!0});window.addEventListener('orientationchange',queueFallbackCheck,{passive:!0});queueFallbackCheck()}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',setup,{once:!0})}else{setup()}}(jQuery))
;