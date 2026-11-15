(function(){
// ---- no access code any more: the studio logo plays as soon as the page opens, then the title screen
var sp=document.getElementById('epsSplash');
var EVS=['keydown','keyup','pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click','wheel'];
// ---- logo sting: a rising whoosh and a deep hit as the symbol lands (no chime on the name)
var AC=null,OUT=null,muted=false;try{var o=JSON.parse(localStorage.getItem('f1tm.opt')||'{}');muted=o.sound===false;}catch(e){}
function noise(sec){var b=AC.createBuffer(1,Math.ceil(AC.sampleRate*sec),AC.sampleRate),d=b.getChannelData(0);for(var k=0;k<d.length;k++)d[k]=Math.random()*2-1;var s=AC.createBufferSource();s.buffer=b;return s;}
function env(gn,t,a,peak,rel){gn.gain.setValueAtTime(0.0001,t);gn.gain.exponentialRampToValueAtTime(peak,t+a);gn.gain.exponentialRampToValueAtTime(0.0001,t+a+rel);}
function audioStart(){if(muted)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();var cp=AC.createDynamicsCompressor();OUT=AC.createGain();OUT.gain.value=.8;OUT.connect(cp);cp.connect(AC.destination);
  var t=AC.currentTime;
  var w=noise(1.3),bp=AC.createBiquadFilter(),wg=AC.createGain();bp.type='bandpass';bp.Q.value=1.4;bp.frequency.setValueAtTime(260,t+.2);bp.frequency.exponentialRampToValueAtTime(2600,t+1.3);
  wg.gain.setValueAtTime(0.0001,t+.2);wg.gain.exponentialRampToValueAtTime(.16,t+1.22);wg.gain.exponentialRampToValueAtTime(0.0001,t+1.42);w.connect(bp);bp.connect(wg);wg.connect(OUT);w.start(t+.2);w.stop(t+1.5);
  var o=AC.createOscillator(),og=AC.createGain();o.type='sine';o.frequency.setValueAtTime(78,t+1.25);o.frequency.exponentialRampToValueAtTime(34,t+2.6);env(og,t+1.25,.015,.55,1.9);o.connect(og);og.connect(OUT);o.start(t+1.25);o.stop(t+3.3);
  var h=noise(.6),lp=AC.createBiquadFilter(),hg=AC.createGain();lp.type='lowpass';lp.frequency.value=900;env(hg,t+1.25,.01,.22,.45);h.connect(lp);lp.connect(hg);hg.connect(OUT);h.start(t+1.25);h.stop(t+1.9);
 }catch(e){AC=null;}}
function rumble(){if(!AC)return;try{var t=AC.currentTime,n=noise(1.8),lp=AC.createBiquadFilter(),ng=AC.createGain();lp.type='lowpass';lp.frequency.setValueAtTime(140,t);lp.frequency.linearRampToValueAtTime(320,t+1.1);
  ng.gain.setValueAtTime(0.0001,t);ng.gain.exponentialRampToValueAtTime(.3,t+.35);ng.gain.exponentialRampToValueAtTime(0.0001,t+1.7);n.connect(lp);lp.connect(ng);ng.connect(OUT);n.start(t);n.stop(t+1.8);
  setTimeout(function(){try{AC.close();}catch(e){}},2600);}catch(e){}}


// ---- timeline: the logo builds itself, then the black fades away quickly onto the title screen, whose animation starts right then
var T=[],phase=0;function at(ms,fn){T.push(setTimeout(fn,ms));}
function sblock(e){if(!sp.isConnected)return;e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();if((e.type==='pointerdown'||e.type==='keydown')&&phase===1)skip();}
function exitLogo(fast){phase=2;sp.classList.add('out');at(fast?260:480,reveal);}
function reveal(){phase=3;window.__gateOpen=true;if(window.__onGateOpen){var f=window.__onGateOpen;window.__onGateOpen=null;f();}
  try{if(typeof FRONT!=='undefined'&&FRONT.v==='title'&&typeof showFront==='function')showFront('title');}catch(e){}   // the title screen plays its entrance as the black fades
  sp.classList.add('fade');at(600,finish);}
function finish(){phase=4;if(AC)setTimeout(function(){try{AC.close();}catch(e){}},1500);sp.remove();EVS.forEach(function(t){removeEventListener(t,sblock,true);});}
function skip(){T.forEach(clearTimeout);T=[];exitLogo(true);}
function splash(){sp.hidden=false;EVS.forEach(function(t){addEventListener(t,sblock,{capture:true,passive:false});});audioStart();
  void sp.offsetWidth;sp.classList.add('es-go');phase=1;at(4600,function(){exitLogo(false);});}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',splash);else splash();})();
