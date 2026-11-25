(function(){"use strict";function initBreathPacer(root){
  /* Guided breathing: 4 counts in, 6 counts out, 6 breaths. Ring sizes follow the stage width, so it fits any screen. */
  var box=root.querySelector("[data-cm-breath]");if(!box||box.dataset.cmReady==="true")return;box.dataset.cmReady="true";
  var q=function(s){return box.querySelector(s)};
  var startBtn=q("[data-cm-breath-start]"),stopBtn=q("[data-cm-breath-stop]"),resetBtn=q("[data-cm-breath-reset]"),
      phaseNode=q("[data-cm-breath-phase]"),countNode=q("[data-cm-breath-count]"),cyclesNode=q("[data-cm-breath-cycles]"),
      elapsedNode=q("[data-cm-breath-elapsed]"),goalNode=q("[data-cm-breath-goal]"),stage=q("[data-cm-breath-stage]"),
      rings=Array.prototype.slice.call(box.querySelectorAll("[data-cm-breath-ring]"));
  if(!startBtn||!stopBtn||!resetBtn||!stage||!rings.length)return;
  var IN=4,OUT=6,CYCLE=IN+OUT,GOAL=6,BORDERS=[14,11,8,5,2];
  var state={running:false,t:0,cycles:0,elapsed:0},raf=null,last=0;
  function render(){
    var w=stage.clientWidth||520,k=w/520,inhaling=state.t<IN;
    var progress=Math.max(0,Math.min(1,inhaling?state.t/IN:(state.t-IN)/OUT));
    var done=state.cycles>=GOAL&&!state.running;
    startBtn.disabled=state.running;stopBtn.disabled=!state.running;
    startBtn.textContent=done?"Again":state.cycles>0||state.t>0?"Resume":"Start";
    phaseNode.textContent=state.running?(inhaling?"Inhale":"Exhale"):done?"Done":state.cycles>0||state.t>0?"Paused":"Ready";
    countNode.textContent=state.running?String(Math.max(1,Math.ceil(inhaling?IN-state.t:CYCLE-state.t))):"4 in · 6 out";
    cyclesNode.textContent=String(state.cycles);elapsedNode.textContent=String(Math.floor(state.elapsed));
    goalNode.textContent=state.cycles>=GOAL?"Done":(GOAL-state.cycles)+" left";
    rings.forEach(function(ring,i){
      var lag=Math.min(1,Math.max(0,progress-i*.13)),eased=.5-.5*Math.cos(Math.PI*lag);
      var scale=state.running?(inhaling?.55+.45*eased:1-.45*eased):.55;
      var small=w<440,sc=small?.55+(scale-.55)*.6:scale,d=Math.round((small?546+i*24:300+i*52)*sc*k);
      ring.style.width=d+"px";ring.style.height=d+"px";
      ring.style.borderWidth=Math.max(1,Math.round(BORDERS[i]*k))+"px";
      ring.style.borderColor=state.running&&inhaling&&i<2?"#e3261f":i===0?"#0a0a0a":"rgba(10,10,10,"+(.55-i*.1).toFixed(2)+")";
    });
  }
  function frame(now){
    var dt=Math.min(.25,(now-last)/1000);last=now;
    state.t+=dt;state.elapsed+=dt;
    if(state.t>=CYCLE){state.t=0;state.cycles+=1;if(state.cycles>=GOAL){stop();return}}
    render();raf=window.requestAnimationFrame(frame);
  }
  function start(){if(state.running)return;if(state.cycles>=GOAL)state={running:false,t:0,cycles:0,elapsed:0};state.running=true;last=performance.now();render();raf=window.requestAnimationFrame(frame)}
  function stop(){state.running=false;if(raf)window.cancelAnimationFrame(raf);raf=null;render()}
  function reset(){stop();state={running:false,t:0,cycles:0,elapsed:0};render()}
  startBtn.addEventListener("click",start);stopBtn.addEventListener("click",stop);resetBtn.addEventListener("click",reset);
  window.addEventListener("resize",render);
  document.addEventListener("visibilitychange",function(){if(document.hidden&&state.running)stop()});
  window.addEventListener("pagehide",stop,{once:true});
  box.cmCleanup=stop;
  render();
}function initClassFilters(root){var classesPage=root.matches("[data-cm-classes]")?root:root.querySelector("[data-cm-classes]");if(!classesPage||classesPage.dataset.cmReady==="true")return;classesPage.dataset.cmReady="true";var filterButtons=Array.prototype.slice.call(classesPage.querySelectorAll("[data-cm-filter]")),cards=Array.prototype.slice.call(classesPage.querySelectorAll("[data-cm-class-card]")),count=classesPage.querySelector("[data-cm-filter-count]"),dayButtons=Array.prototype.slice.call(classesPage.querySelectorAll("[data-cm-day]")),dayPanels=Array.prototype.slice.call(classesPage.querySelectorAll("[data-cm-day-panel]")),scheduleTabs=Array.prototype.slice.call(classesPage.querySelectorAll("[data-cm-schedule-tab]")),scheduleRows=Array.prototype.slice.call(classesPage.querySelectorAll("[data-cm-schedule-group]"));function selectFilter(filter){var visible=0;filterButtons.forEach(function(button){var active=button.dataset.cmFilter===filter;button.classList.toggle("is-active",active),button.setAttribute("aria-pressed",String(active))}),cards.forEach(function(card){var tags=(card.dataset.cmTags||"").split("|"),show=filter==="All classes"||tags.indexOf(filter)!==-1;card.hidden=!show,show&&(visible+=1)}),count&&(count.textContent=visible===cards.length?cards.length+" classes":visible+" of "+cards.length+" classes")}function selectDay(day){dayButtons.forEach(function(button){var active=button.dataset.cmDay===day;button.classList.toggle("is-active",active),button.setAttribute("aria-selected",String(active)),button.tabIndex=active?0:-1}),dayPanels.forEach(function(panel){panel.hidden=panel.dataset.cmDayPanel!==day})}function selectScheduleTab(group){scheduleTabs.forEach(function(button){var active=button.dataset.cmScheduleTab===group;button.classList.toggle("is-active",active),button.setAttribute("aria-pressed",String(active))}),scheduleRows.forEach(function(row){row.hidden=group!=="all"&&row.dataset.cmScheduleGroup!==group})}filterButtons.forEach(function(button){button.addEventListener("click",function(){selectFilter(button.dataset.cmFilter)})}),scheduleTabs.forEach(function(button){button.addEventListener("click",function(){selectScheduleTab(button.dataset.cmScheduleTab)})}),dayButtons.forEach(function(button,index){button.addEventListener("click",function(){selectDay(button.dataset.cmDay)}),button.addEventListener("keydown",function(event){if(!(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")){event.preventDefault();var direction=event.key==="ArrowRight"?1:-1,nextIndex=(index+direction+dayButtons.length)%dayButtons.length;dayButtons[nextIndex].focus(),selectDay(dayButtons[nextIndex].dataset.cmDay)}})}),selectFilter("All classes"),selectDay("Sat")}function initJoinPage(root){var joinPage=root.matches("[data-cm-join]")?root:root.querySelector("[data-cm-join]");if(!joinPage||joinPage.dataset.cmReady==="true")return;joinPage.dataset.cmReady="true";var planButtons=Array.prototype.slice.call(joinPage.querySelectorAll("[data-cm-plan-select]")),planChips=Array.prototype.slice.call(joinPage.querySelectorAll("[data-cm-plan-chip]")),planInput=joinPage.querySelector("[data-cm-plan-input]"),formAnchor=joinPage.querySelector("#cm-form-check"),status=joinPage.querySelector("[data-cm-form-status]"),submit=joinPage.querySelector("[data-cm-form-submit]");function selectPlan(plan,shouldScroll,preserveStatus){planInput&&(planInput.value=plan),planChips.forEach(function(chip){var active=chip.dataset.cmPlanSelect===plan;chip.classList.toggle("is-active",active),chip.setAttribute("aria-pressed",String(active))}),status&&!preserveStatus&&(delete status.dataset.cmFormFeedback,status.textContent="Selected plan: "+plan+". We\u2019ll confirm on WhatsApp within one working day."),submit&&!preserveStatus&&(submit.textContent="Send request"),shouldScroll&&formAnchor&&formAnchor.scrollIntoView({behavior:"smooth",block:"start"})}planButtons.forEach(function(button){button.addEventListener("click",function(){selectPlan(button.dataset.cmPlanSelect,button.hasAttribute("data-cm-scroll-form"),!1)})});var faqButtons=Array.prototype.slice.call(joinPage.querySelectorAll("[data-cm-faq-button]"));function setFaq(button,open){var item=button.closest(".cm-faq__item"),panel=document.getElementById(button.getAttribute("aria-controls"));button.setAttribute("aria-expanded",String(open)),item.classList.toggle("is-open",open),panel&&(panel.hidden=!open)}faqButtons.forEach(function(button){button.addEventListener("click",function(){var shouldOpen=button.getAttribute("aria-expanded")!=="true";faqButtons.forEach(function(other){setFaq(other,other===button&&shouldOpen)})})}),faqButtons.forEach(function(button){setFaq(button,button.getAttribute("aria-expanded")==="true")}),selectPlan(planInput&&planInput.value||"Premium",!1,status&&status.dataset.cmFormFeedback==="true")}function init(root){!root||!root.matches||!root.matches(".cm-site")||(initBreathPacer(root),initClassFilters(root),initJoinPage(root))}function initAll(scope){scope.matches&&scope.matches(".cm-site")&&init(scope),scope.querySelectorAll(".cm-site").forEach(init)}initAll(document),document.addEventListener("shopify:section:load",function(event){initAll(event.target)}),document.addEventListener("shopify:section:unload",function(event){var pacer=event.target.querySelector("[data-cm-breath]");pacer&&typeof pacer.cmCleanup=="function"&&pacer.cmCleanup()})})();

