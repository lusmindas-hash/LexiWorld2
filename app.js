(() => {
  "use strict";

  const C = {
    wolf:{name:"Agent Wolf",img:"assets/characters/wolf.webp"},
    raccoon:{name:"Ricky Raccoon",img:"assets/characters/raccoon.webp"},
    bunny:{name:"Bella Bunny",img:"assets/characters/bunny.webp"},
    lion:{name:"Leo Lion",img:"assets/characters/lion.webp"},
    fox:{name:"Max Fox",img:"assets/characters/fox.webp"},
    bear:{name:"Bruno Bear",img:"assets/characters/bear.webp"},
    panda:{name:"Panda Pete",img:"assets/characters/panda.webp"},
    cat:{name:"Luna Cat",img:"assets/characters/cat.webp"}
  };

  const missionNames = {
    sprint:"Syntax Surfer",
    detective:"The Lost Timeline",
    safari:"Sound Safari"
  };
  const missionStories = {
    sprint:{title:"The Clockwork Route", subtitle:"Rebuild the broken sentence lanes before the core overloads.", detail:"Quest: restore the city grid by solving six high-speed grammar puzzles."},
    detective:{title:"The Vanishing Timeline", subtitle:"Gather evidence, decode the truth, and rebuild the missing hours.", detail:"Quest: connect clues, grammar, and time to expose the real culprit."},
    safari:{title:"The Echo Hunt", subtitle:"Follow the sound clues across the city and recover the lost signal.", detail:"Quest: solve character, location, and sequence challenges under pressure."}
  };

  const rewardIcons = {
    wave:`<svg class="reward-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h3l2.2-6 3.6 12 2.5-8 1.7 2h5"/><path d="M4 19h16"/></svg>`,
    hero:`<svg class="reward-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.7 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.8 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
    core:`<svg class="reward-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.5 5.2L20 8l-4 4 .9 5.7L12 15l-4.9 2.7L8 12 4 8l5.5-.8L12 2Z"/><circle cx="12" cy="11" r="2.2"/></svg>`
  };
  const rewardCatalog = [
    {id:"glow", name:"Neon Wave", description:"A cinematic trail follows each correct answer.", unlockAt:3, icon:rewardIcons.wave},
    {id:"skin", name:"Hero Skin", description:"Unlock a premium hero look for the final boss.", unlockAt:6, icon:rewardIcons.hero},
    {id:"theme", name:"Core Theme", description:"Switch to a richer city theme for every mission.", unlockAt:9, icon:rewardIcons.core}
  ];

  const state = {
    sound: true,
    progress: JSON.parse(localStorage.getItem("lexi-wow-progress") || '{"sprint":false,"detective":false,"safari":false}'),
    campaign: JSON.parse(localStorage.getItem("lexi-wow-campaign") || '{"stars":0,"level":1,"bossUnlocked":false}'),
    rewards: JSON.parse(localStorage.getItem("lexi-wow-rewards") || "[]"),
    currentGame:null,
    cleanup:null,
    audioContext:null,
    speechUtterance:null,
    speechTimer:null
  };

  const overlay = document.getElementById("game-overlay");
  const stage = document.getElementById("game-stage");
  const title = document.getElementById("game-title");
  const modal = document.getElementById("info-dialog");
  const info = document.getElementById("info-content");
  const toast = document.getElementById("toast");
  const soundToggle = document.getElementById("sound-toggle");
  const gameSoundToggle = document.getElementById("game-sound-toggle");

  function spawnAmbientParticle(){
    const particle=document.createElement("span");
    particle.className="ambient-particle";
    const size=6+Math.random()*11;
    particle.style.width=`${size}px`;
    particle.style.height=`${size}px`;
    particle.style.left=`${Math.random()*100}vw`;
    particle.style.top=`${Math.random()*100}vh`;
    const colors=["#ffb448","#8d5cff","#45c9d8","#43a879","#ff4d8f"];
    particle.style.background=colors[Math.floor(Math.random()*colors.length)];
    particle.style.setProperty("--drift-x", `${(Math.random()-0.5)*220}px`);
    particle.style.setProperty("--drift-y", `${(Math.random()-0.5)*220}px`);
    document.body.appendChild(particle);
    setTimeout(()=>particle.remove(),4200);
  }
  function startAmbientParticles(){
    if(window.__ambientParticlesStarted) return;
    window.__ambientParticlesStarted=true;
    setInterval(()=>{
      for(let i=0;i<3;i++) spawnAmbientParticle();
    }, 480);
  }

  function showComboPopup(text,color="#ffb448"){
    const popup=document.createElement("div");
    popup.className="combo-popup";
    popup.style.setProperty("--combo-color", color);
    popup.innerHTML=`<span>${text}</span>`;
    document.body.appendChild(popup);
    requestAnimationFrame(()=>popup.classList.add("show"));
    setTimeout(()=>{
      popup.classList.remove("show");
      setTimeout(()=>popup.remove(),260);
    },900);
  }

  function triggerFlash(color="#ffb448"){
    const flash=document.createElement("div");
    flash.className="wow-flash";
    flash.style.background=`radial-gradient(circle, ${color} 0%, transparent 70%)`;
    document.body.appendChild(flash);
    setTimeout(()=>flash.remove(),700);
  }
  function triggerWowBurst(x=50,y=50,color="#ffb448"){
    const burst=document.createElement("div");
    burst.className="wow-burst";
    burst.style.setProperty("--burst-x", `${x}%`);
    burst.style.setProperty("--burst-y", `${y}%`);
    burst.style.setProperty("--burst-color", color);
    document.body.appendChild(burst);
    setTimeout(()=>burst.remove(),1400);
  }
  function triggerScreenShake(){
    const shell=document.querySelector(".game-shell");
    if(!shell) return;
    shell.classList.remove("shake");
    void shell.offsetWidth;
    shell.classList.add("shake");
    setTimeout(()=>shell.classList.remove("shake"),460);
  }
  function showMissionLaunch(titleText, subtitle, color="#ef7445", detail=""){
    const launch=document.createElement("div");
    launch.className="mission-launch";
    launch.innerHTML=`<div class="mission-launch-card" style="--accent:${color}"><div class="mission-launch-glow"></div><div class="mission-launch-rings"></div><p>Quest incoming</p><h3>${titleText}</h3><span>${subtitle}</span>${detail?`<small>${detail}</small>`:""}</div>`;
    document.body.appendChild(launch);
    requestAnimationFrame(()=>launch.classList.add("show"));
    setTimeout(()=>{
      launch.classList.remove("show");
      setTimeout(()=>launch.remove(),360);
    },1700);
  }
  function showVictoryOverlay(title, subtitle){
    const overlayEl=document.createElement("div");
    overlayEl.className="victory-overlay";
    overlayEl.innerHTML=`<div class="victory-card"><div class="victory-ring"></div><h3>${title}</h3><p>${subtitle}</p></div>`;
    document.body.appendChild(overlayEl);
    requestAnimationFrame(()=>overlayEl.classList.add("show"));
    setTimeout(()=>{
      overlayEl.classList.remove("show");
      setTimeout(()=>overlayEl.remove(),500);
    },1800);
  }

  const instructions = {
    story:`<div class="modal-content"><div class="eyebrow">The Glitch Attack</div><h2>The LexiWorld emergency</h2><p>The Glitch attacked three city systems at the same time. It mixed the word tracks, erased the Time Archive, and blocked the Echo Map.</p><p>English is your mission tool: grammar powers the route, clues rebuild the timeline, and listening finds the right hero.</p><div class="rule-box"><strong>Your goal:</strong> use English to restore all three systems and defeat The Glitch.</div></div>`,
    sprint:`<div class="modal-content"><div class="instruction-hero"><img src="${C.fox.img}" alt="Max Fox"><div><div class="eyebrow">Mission 01 · A1–A2</div><h2>Syntax Surfer</h2></div></div><p>Max is racing through the digital city. Each wave gives you three word choices, but only one continues the sentence correctly.</p><ol><li>Switch lanes with the arrow keys, A/D, a swipe, or the on-screen buttons.</li><li>Collect the sentence words in the correct order.</li><li>Use the safe lane to avoid Glitch barriers.</li><li>Correct answers charge Focus Mode. Press Space when the meter reaches 100%.</li><li>Complete six quest fragments and destroy the Glitch Core.</li></ol><div class="rule-box"><strong>Grammar:</strong> present continuous, have got, there are, and can. A wrong word or a collision costs energy.</div></div>`,
    detective:`<div class="modal-content"><div class="instruction-hero"><img src="${C.wolf.img}" alt="Agent Wolf"><div><div class="eyebrow">Mission 02 · A1–A2</div><h2>The Lost Timeline</h2></div></div><p>The investigation has four connected phases.</p><ol><li>Search the studio, workshop, and park for nine clues.</li><li>Decode six short grammar statements.</li><li>Place four events on the correct timeline.</li><li>Connect each clue to a conclusion and solve the case.</li></ol><div class="rule-box"><strong>Grammar:</strong> present continuous, have got, there are, can, past of be, and prepositions of place.</div></div>`,
    safari:`<div class="modal-content"><div class="instruction-hero"><img src="${C.lion.img}" alt="Leo Lion"><div><div class="eyebrow">Mission 03 · A1–A2</div><h2>Sound Safari</h2></div></div><p>Listen to a short English clue and choose the correct hero.</p><ol><li><strong>Character Hunt:</strong> listen for a hero and an object.</li><li><strong>Location Hunt:</strong> listen for both the hero and the place.</li><li><strong>Echo Sequence:</strong> click two heroes in the order you hear.</li></ol><p>You have a timer, three lives, replay controls, and an optional transcript that costs points.</p><div class="rule-box"><strong>Listening:</strong> clothes, objects, places, actions, first, and then.</div></div>`
  };

  function ensureAudio(){
    if(!state.audioContext){
      const A=window.AudioContext||window.webkitAudioContext;
      if(A) state.audioContext=new A();
    }
    if(state.audioContext?.state==="suspended") state.audioContext.resume();
  }
  function tone(kind="click"){
    if(!state.sound) return;
    ensureAudio();
    const ctx=state.audioContext;if(!ctx)return;
    const map={
      click:[[520,.04,0]],
      good:[[520,.07,0],[670,.08,.08],[850,.15,.17]],
      bad:[[210,.12,0],[155,.17,.13]],
      power:[[350,.06,0],[520,.07,.06],[760,.08,.13],[980,.17,.21]],
      win:[[440,.09,0],[550,.09,.09],[660,.09,.18],[880,.27,.28]]
    };
    (map[kind]||map.click).forEach(([f,d,t])=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type=kind==="bad"?"sawtooth":"sine";o.frequency.value=f;
      g.gain.setValueAtTime(.0001,ctx.currentTime+t);
      g.gain.exponentialRampToValueAtTime(.095,ctx.currentTime+t+.01);
      g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+t+d);
      o.connect(g).connect(ctx.destination);o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+d+.03);
    });
  }
  function playSpeech(text,rate=.78){
    if(!state.sound){showToast("Sound is off. Turn it on with the speaker button.");return false}
    if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){showToast("Speech audio is not supported in this browser.");return false}
    clearTimeout(state.speechTimer);
    speechSynthesis.cancel();
    const start=()=>{
      const utterance=new SpeechSynthesisUtterance(text);
      const voices=speechSynthesis.getVoices();
      const voice=voices.find(v=>/^en-US$/i.test(v.lang))||voices.find(v=>/^en[-_]/i.test(v.lang))||voices[0];
      if(voice)utterance.voice=voice;
      utterance.lang=voice?.lang||"en-US";utterance.rate=rate;utterance.pitch=1.01;utterance.volume=1;
      utterance.onerror=event=>{if(event.error!=="interrupted"&&event.error!=="canceled")showToast("Voice playback failed. Check browser audio permissions.")};
      utterance.onend=()=>{if(state.speechUtterance===utterance)state.speechUtterance=null};
      state.speechUtterance=utterance;
      speechSynthesis.resume();
      speechSynthesis.speak(utterance);
    };
    state.speechTimer=setTimeout(start,80);
    return true;
  }
  function speak(text){
    playSpeech(text,.78);
  }
  function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
  function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),2200)}
  function openInfo(type){info.innerHTML=instructions[type];modal.showModal();tone("click")}
  function updateSound(){
    [soundToggle,gameSoundToggle].forEach(button=>{if(!button)return;button.textContent=state.sound?"🔊":"🔇";button.setAttribute("aria-label",state.sound?"Turn sound off":"Turn sound on")});
  }
  function toggleSound(){state.sound=!state.sound;localStorage.setItem("lexi-wow-sound",state.sound?"on":"off");if(!state.sound){clearTimeout(state.speechTimer);state.speechUtterance=null;if("speechSynthesis"in window)speechSynthesis.cancel()}updateSound();if(state.sound)tone("good")}
  function saveProgress(){localStorage.setItem("lexi-wow-progress",JSON.stringify(state.progress));renderProgress();renderRewards()}
  function saveCampaign(){localStorage.setItem("lexi-wow-campaign",JSON.stringify(state.campaign));renderProgress();renderRewards()}
  function showRewardBanner(rewards){
    const banner=document.createElement("div");
    banner.className="reward-banner";
    banner.innerHTML=`<div class="reward-banner-card"><div class="eyebrow">Premium unlock</div><h3>${rewards.map(r=>r.name).join(" + ")}</h3><p>${rewards.map(r=>r.description).join(" ")}</p></div>`;
    document.body.appendChild(banner);
    requestAnimationFrame(()=>banner.classList.add("show"));
    setTimeout(()=>{
      banner.classList.remove("show");
      setTimeout(()=>banner.remove(),320);
    },2500);
  }
  function unlockRewardsIfNeeded(){
    const newlyUnlocked=rewardCatalog.filter(r=>!state.rewards.includes(r.id)&&state.campaign.stars>=r.unlockAt);
    if(!newlyUnlocked.length)return;
    state.rewards=[...new Set([...state.rewards,...newlyUnlocked.map(r=>r.id)])];
    localStorage.setItem("lexi-wow-rewards",JSON.stringify(state.rewards));
    renderRewards();
    showRewardBanner(newlyUnlocked);
  }
  function renderRewards(){
    const container=document.getElementById("reward-list");
    if(!container)return;
    const unlocked=new Set(state.rewards);
    container.innerHTML=rewardCatalog.map(r=>`<div class="reward-pill ${unlocked.has(r.id)?"unlocked":""}"><span>${r.icon}</span><div><strong>${r.name}</strong><small>${unlocked.has(r.id)?"Unlocked · "+r.description:`Unlock at ${r.unlockAt} stars · ${r.description}`}</small></div></div>`).join("");
    const title=document.getElementById("reward-title");
    const copy=document.getElementById("reward-copy");
    if(title)title.textContent=state.rewards.length?`${state.rewards.length}/${rewardCatalog.length} premium rewards unlocked`:"Premium rewards are waiting";
    if(copy){const next=rewardCatalog.find(r=>!unlocked.has(r.id));copy.textContent=next?`Collect more stars to unlock ${next.name.toLowerCase()} and push the campaign into full premium mode.`:"All premium rewards are now unlocked. The experience feels truly deluxe.";}
  }
  function awardCampaignReward(amount=1){
    state.campaign.stars=Math.min(9,state.campaign.stars+amount);
    state.campaign.level=Math.max(1,Math.min(4,Math.floor(state.campaign.stars/3)+1));
    state.campaign.bossUnlocked=Object.values(state.progress).filter(Boolean).length===3 || state.campaign.stars>=6;
    saveCampaign();
    unlockRewardsIfNeeded();
    showToast(`Campaign reward: +${amount} star${amount>1?"s":""}.`);
  }
  function getAdventureStatus(){
    const completed=Object.values(state.progress).filter(Boolean).length;
    const next=Object.entries(state.progress).find(([,done])=>!done);
    const stars=state.campaign.stars;
    if(completed===0){return {title:`Campaign ${state.campaign.level}/4 · ${stars}★`,copy:"Choose your first mission and begin the premium quest chain."};}
    if(completed===3){return {title:`Final boss unlocked · ${stars}/9★`,copy:"All three core missions are complete. The Glitch Core is now ready for a boss fight."};}
    return {title:`Campaign ${state.campaign.level}/4 · ${stars}★`,copy:`Continue with ${missionNames[next?.[0]] || "the next mission"} to unlock the final boss.`};
  }
  function updateMissionButtons(){
    document.querySelectorAll(".mission-card").forEach(card=>{
      const key=card.dataset.mission;
      const button=card.querySelector("[data-play]");
      if(!key||!button)return;
      const done=!!state.progress[key];
      button.textContent=done?"Replay":"Play";
      card.classList.toggle("completed",done);
    });
  }
  function renderProgress(){
    let n=0;
    Object.entries(state.progress).forEach(([key,on])=>{
      const el=document.querySelector(`[data-crystal="${key}"]`);if(!el)return;
      el.classList.toggle("online",on);el.querySelector("small").textContent=on?"online":"offline";if(on)n++;
    });
    const status=document.getElementById("adventure-status-title");
    const statusCopy=document.getElementById("adventure-status-copy");
    const msg=document.getElementById("progress-message");
    if(status){const summary=getAdventureStatus();status.textContent=summary.title;statusCopy.textContent=summary.copy;}
    msg.innerHTML=`Systems restored: ${n} of 3 · Campaign stars: ${state.campaign.stars}/9 · ${state.campaign.bossUnlocked?"<strong>Boss unlocked</strong>":"Boss locked"}`;
    updateMissionButtons();
  }
  function confetti(){
    const colors=["#ef7445","#ffb448","#8d5cff","#45c9d8","#43a879"];
    for(let i=0;i<45;i++){const p=document.createElement("i");p.className="confetti";p.style.left=`${Math.random()*100}vw`;p.style.background=colors[i%colors.length];p.style.setProperty("--drift",`${(Math.random()-.5)*230}px`);p.style.animationDelay=`${Math.random()*.4}s`;document.body.appendChild(p);setTimeout(()=>p.remove(),2400)}
  }
  function complete(game,score,total,copy,images){
    state.progress[game]=true;saveProgress();awardCampaignReward(1);tone("win");confetti();triggerFlash("#ffb448");triggerWowBurst(50,35,"#8d5cff");triggerScreenShake();showVictoryOverlay(game==="sprint"?"Core restored":game==="detective"?"Case solved":"Signal recovered", "The quest is complete and LexiWorld is glowing again.");
    const allCompleted=Object.values(state.progress).filter(Boolean).length===3;
    stage.innerHTML=`<section class="result-card"><div class="result-characters">${images.map(k=>`<img src="${C[k].img}" alt="${C[k].name}">`).join("")}</div><div class="eyebrow">Mission complete</div><h2>${game==="sprint"?"Glitch Core destroyed!":game==="detective"?"Case solved!":"Echo Map restored!"}</h2><p>${copy}</p><div class="result-stats"><span>Score: ${score}/${total}</span><span>${allCompleted?"Final boss unlock ready":"System online"}</span></div><button class="button primary" data-return type="button">${allCompleted?"Enter final boss":"Return to mission map"}</button></section>`;
    stage.querySelector("[data-return]").onclick=allCompleted?startFinalBoss:closeGame;
  }
  function openGame(game){
    if(state.cleanup){state.cleanup();state.cleanup=null}
    const titleText=missionNames[game]||"Mission";
    const story=missionStories[game]||{title:titleText,subtitle:"The city is lighting up with new energy...",detail:""};
    showMissionLaunch(titleText, story.subtitle, game==="sprint"?"#ef7445":game==="detective"?"#8d5cff":"#43a879", story.detail);
    setTimeout(()=>{
      state.currentGame=game;overlay.hidden=false;document.body.style.overflow="hidden";tone("power");
      if(game==="sprint")startSprint();
      if(game==="detective")startDetective();
      if(game==="safari")startSafari();
    },720);
  }
  function closeGame(){
    if(state.cleanup){state.cleanup();state.cleanup=null}
    clearTimeout(state.speechTimer);state.speechUtterance=null;
    if("speechSynthesis"in window)speechSynthesis.cancel();
    overlay.hidden=true;document.body.style.overflow="";state.currentGame=null;
    document.getElementById("missions").scrollIntoView({behavior:"smooth"});
  }

  function startFinalBoss(){
    title.textContent="The Glitch Core · Final Boss";
    stage.innerHTML=`<section class="game-layout"><aside class="game-guide dark"><img src="${C.wolf.img}" alt="Agent Wolf"><div class="guide-copy"><strong>Final boss</strong><span>“The Glitch Core is unstable. One mistake breaks the chain.”</span></div></aside><div class="boss-shell"><div class="boss-hud"><div class="hud-row"><span class="hud-pill danger" id="boss-lives">LIVES 3</span><span class="hud-pill good" id="boss-score">SCORE 0</span><span class="hud-spacer"></span><span class="hud-pill" id="boss-wave">WAVE 1/4</span></div><div class="boss-bar"><div id="boss-progress"></div></div><div class="boss-card" id="boss-card"></div></div></div></section>`;
    const bossChallenges=[
      {prompt:"Choose the sentence that shuts down the glitch.",options:["The team can save the city.","The team can saves the city.","The team saving the city."],correct:0,explanation:"After can, use the base verb."},
      {prompt:"Choose the correct form.",options:["Max is repairing the core.","Max are repairing the core.","Max repairing the core."],correct:0,explanation:"Use is with he / she / it."},
      {prompt:"Choose the correct sentence.",options:["There are three safe routes.","There is three safe routes.","There are a safe routes."],correct:0,explanation:"Use there are with a plural noun."},
      {prompt:"Choose the right sentence.",options:["Panda has got the key.","Panda have got the key.","Panda got has the key."],correct:0,explanation:"Use has got with he / she / it."}
    ];
    let wave=0,lives=3,score=0;
    function renderBoss(){
      if(lives<=0){
        stage.innerHTML=`<section class="result-card"><div class="result-characters"><img src="${C.wolf.img}" alt="Agent Wolf"><img src="${C.fox.img}" alt="Max Fox"></div><div class="eyebrow">Boss failed</div><h2>The Glitch Core broke free.</h2><p>Your timing was too late. Replay the boss and learn the correct language pattern.</p><div class="result-stats"><span>Score: ${score}</span><span>Try again</span></div><button class="button primary" id="retry-boss" type="button">Replay boss</button></section>`;
        stage.querySelector("#retry-boss").onclick=startFinalBoss;
        return;
      }
      if(wave>=bossChallenges.length){
        state.campaign.stars=Math.min(9,state.campaign.stars+2);state.campaign.level=4;state.campaign.bossUnlocked=true;saveCampaign();showVictoryOverlay("Glitch Core sealed", "The premium campaign is complete.");
        stage.innerHTML=`<section class="result-card"><div class="result-characters"><img src="${C.fox.img}" alt="Max Fox"><img src="${C.lion.img}" alt="Leo Lion"></div><div class="eyebrow">Campaign complete</div><h2>The city is safe again.</h2><p>You beat the final boss and earned the ultimate reward. Replay any mission or start a fresh campaign.</p><div class="result-stats"><span>Score: ${score}</span><span>+2 boss stars</span></div><button class="button primary" data-return type="button">Return to mission map</button></section>`;
        stage.querySelector("[data-return]").onclick=closeGame;
        return;
      }
      const current=bossChallenges[wave];
      stage.querySelector("#boss-lives").textContent=`LIVES ${lives}`;
      stage.querySelector("#boss-score").textContent=`SCORE ${score}`;
      stage.querySelector("#boss-wave").textContent=`WAVE ${wave+1}/${bossChallenges.length}`;
      stage.querySelector("#boss-progress").style.width=`${(wave/bossChallenges.length)*100}%`;
      stage.querySelector("#boss-card").innerHTML=`<div class="round-kicker">Boss phase ${wave+1}</div><h2 class="question-title">${current.prompt}</h2><p class="muted">${current.explanation}</p><div class="grammar-options">${current.options.map((option,i)=>`<button class="grammar-option boss-option" data-boss-option="${i}" type="button"><span>${String.fromCharCode(65+i)}</span>${option}</button>`).join("")}</div>`;
      stage.querySelectorAll("[data-boss-option]").forEach(button=>button.onclick=()=>handleChoice(Number(button.dataset.bossOption)));
    }
    function handleChoice(index){
      const current=bossChallenges[wave];
      if(index===current.correct){
        score+=140;wave++;tone("good");triggerFlash("#ffb448");showComboPopup("Boss hit!", "#8d5cff");
      }else{
        lives--;score=Math.max(0,score-60);tone("bad");triggerFlash("#ff4d8f");showToast("Wrong pattern. The Glitch regained ground.");
      }
      renderBoss();
    }
    renderBoss();
    state.cleanup=()=>{};
  }

  /* --------------------------- GAME 1: SYNTAX SURFER --------------------------- */
  const sprintMissions=[
    {
      label:"Quest 01 · Rescue the route",
      quest:"Rebuild the route by completing a full sentence under pressure.",
      prompt:"What is Max doing right now?",
      words:["Max","is","repairing","the","broken","route","now."],
      decoys:[["He","Max","Max's"],["is","are","am"],["repair","repairing","repairs"],["the","a","this"],["glitch","broken","silver"],["route","road","map"],["now.","soon.","today?"]]
    },
    {
      label:"Quest 02 · The stolen backpack",
      quest:"Find the missing item and build the full clue sentence.",
      prompt:"What does Bella have for the mission?",
      words:["Bella","has","got","a","silver","backpack","inside."],
      decoys:[["Bella","She","Bella's"],["have","has","had"],["get","got","gets"],["a","an","the"],["blue","silver","tiny"],["bag","backpack","box"],["inside.","outside.","later?"]]
    },
    {
      label:"Quest 03 · The glowing desk",
      quest:"Unlock the evidence chain by building a clear description.",
      prompt:"What can you see on the desk?",
      words:["There","are","three","glowing","clues","on","the","desk."],
      decoys:[["This","There","These"],["is","are","am"],["two","three","four"],["bright","glowing","hidden"],["clue","clues","clue's"],["under","on","in"],["a","the","—"],["desk.","desks.","desk?"]]
    },
    {
      label:"Quest 04 · The lost map",
      quest:"Recover the map by finishing the sentence in the right order.",
      prompt:"What can Leo do before sunrise?",
      words:["Leo","can","find","the","lost","map","before","sunrise."],
      decoys:[["Leo","He","Leo's"],["can","is","has"],["find","finds","finding"],["a","the","—"],["old","lost","tiny"],["map","maps","route"],["before","after","during"],["sunrise.","sunset.","midnight?"]]
    },
    {
      label:"Quest 05 · The portal pulse",
      quest:"Stabilize the portal by finishing the full sentence sequence.",
      prompt:"What is happening at the portal now?",
      words:["The","portal","is","opening","slowly","for","the","heroes."],
      decoys:[["The","This","Those"],["portal","portals","map"],["is","are","am"],["opening","opened","open"],["slowly","quickly","carefully"],["for","to","from"],["the","our","their"],["heroes.","hero.","city?"]]
    },
    {
      label:"Quest 06 · The final code",
      quest:"Complete the final code sequence and shut down the glitch core.",
      prompt:"What can the team do together?",
      words:["The","team","can","save","the","city","together","today."],
      decoys:[["The","These","Our"],["team","teams","city"],["can","is","has"],["save","saving","saves"],["the","a","our"],["city","world","tower"],["together","alone","soon"],["today.","tonight.","never?"]]
    }
  ];

  function startSprint(){
    title.textContent="Syntax Surfer · A1-A2 Grammar Runner";
    stage.innerHTML=`<section class="game-layout"><aside class="game-guide"><img src="${C.bear.img}" alt="Bruno Bear"><div class="guide-copy"><strong>Bruno Bear</strong><span>“Grammar keeps the engine alive.”</span></div></aside><div class="runner-shell"><div class="runner-hud"><div class="hud-row"><span class="hud-pill danger" id="run-hearts">ENERGY ♥♥♥♥</span><span class="hud-pill" id="run-score">SCORE 0</span><span class="hud-pill good" id="run-combo">COMBO x0</span><span class="hud-spacer"></span><span class="hud-pill" id="run-focus">FOCUS 0%</span></div><div class="runner-objective"><div><div class="round-kicker" id="run-round"></div><h2 id="run-prompt"></h2><p id="run-help"></p></div><span class="grammar-tag" id="run-tag"></span></div><div class="sentence-slots" id="run-slots"></div></div><div class="runner-canvas-wrap"><canvas class="runner-canvas" id="runner-canvas" width="960" height="540"></canvas><div id="run-callouts"></div></div><div class="runner-controls"><button class="runner-control" id="run-left" type="button">← LEFT</button><button class="runner-control" id="run-right" type="button">RIGHT →</button><button class="runner-control focus" id="run-focus-button" type="button" disabled>SPACE · FOCUS MODE</button></div></div></section>`;

    const canvas=stage.querySelector("#runner-canvas"),ctx=canvas.getContext("2d");
    const foxImg=new Image();foxImg.src=C.fox.img;
    let missionIndex=0,wordIndex=0,lane=1,hearts=3,score=0,combo=0,focus=0,slowUntil=0;
    let rows=[],last=performance.now(),spawnAt=650,running=true,raf=0,roadOffset=0,bossHealth=100;
    const lanes=[260,480,700],playerY=430;
    let pointerStart=null;

    function mission(){return sprintMissions[missionIndex]}
    function hud(){
      stage.querySelector("#run-hearts").textContent=`ENERGY ${"♥".repeat(Math.max(0,hearts))}${"♡".repeat(Math.max(0,4-hearts))}`;
      stage.querySelector("#run-score").textContent=`SCORE ${score}`;
      stage.querySelector("#run-combo").textContent=`COMBO x${combo}`;
      stage.querySelector("#run-focus").textContent=`FOCUS ${Math.floor(focus)}%`;
      stage.querySelector("#run-focus-button").disabled=focus<100;
      stage.querySelector("#run-round").textContent=`RUN ${missionIndex+1}/${sprintMissions.length} · GLITCH CORE ${Math.max(0,Math.round(bossHealth))}%`;
      stage.querySelector("#run-prompt").textContent=mission().prompt;
      stage.querySelector("#run-help").textContent=mission().quest;
      stage.querySelector("#run-tag").textContent=mission().label;
      stage.querySelector("#run-slots").innerHTML=mission().words.map((w,i)=>`<span class="sentence-slot ${i<wordIndex?"filled":""}">${i<wordIndex?w:"_"}</span>`).join("");
    }
    function callout(text){
      const el=document.createElement("div");el.className="runner-callout";el.textContent=text;stage.querySelector("#run-callouts").appendChild(el);setTimeout(()=>el.remove(),900);
    }
    function move(dir){lane=Math.max(0,Math.min(2,lane+dir));tone("click")}
    function focusMode(){
      if(focus<100)return;
      focus=0;slowUntil=performance.now()+2600;tone("power");triggerFlash("#45c9d8");triggerWowBurst(50,50,"#45c9d8");callout("FOCUS MODE · TIME SLOWED");hud();
    }
    function spawnChoice(){
      const m=mission(),correct=m.words[wordIndex],options=shuffle(m.decoys[wordIndex].map(v=>({word:v,correct:v===correct})));
      // Ensure the exact correct token is present even when punctuation variants exist.
      if(!options.some(o=>o.correct)){options[Math.floor(Math.random()*3)]={word:correct,correct:true}}
      rows.push({type:"choice",y:-65,items:options,resolved:false});
      if(wordIndex>0&&wordIndex%2===0)spawnAt=760-missionIndex*40;else spawnAt=620-missionIndex*30;
    }
    function spawnObstacle(){
      const safe=Math.floor(Math.random()*3);
      rows.push({type:"obstacle",y:-80,safe,resolved:false});
      spawnAt=520;
    }
    function spawnBonus(){
      const target=Math.floor(Math.random()*3);
      rows.push({type:"bonus",y:-55,target,resolved:false});
      spawnAt=560;
    }
    function nextSpawn(){
      if(rows.some(r=>!r.resolved&&r.y<250))return;
      if(wordIndex<mission().words.length){
        if(Math.random()<(.46 + Math.min(.18, missionIndex*.04)) && wordIndex>0)spawnObstacle();else spawnChoice();
      }
    }
    function hit(){
      hearts--;combo=0;tone("bad");triggerFlash("#ff4d8f");triggerScreenShake();callout("GLITCH HIT · ENERGY LOST");
      if(hearts<=0){gameOver();return false}
      hud();return true;
    }
    function correctWord(word){
      wordIndex++;combo++;focus=Math.min(100,focus+18+combo*2);score+=100+combo*20;bossHealth-=100/sprintMissions.reduce((s,m)=>s+m.words.length,0);
      tone("good");
      if(combo===3)showComboPopup("Perfect!", "#ffb448");
      if(combo===6)showComboPopup("Amazing!", "#8d5cff");
      triggerFlash(combo>=6?"#8d5cff":"#43a879");
      callout(`LOCKED: ${word}`);hud();
      if(wordIndex>=mission().words.length){
        running=false;tone("power");callout("SENTENCE COMPLETE");
        setTimeout(()=>{
          missionIndex++;wordIndex=0;rows=[];
          if(missionIndex>=sprintMissions.length){complete("sprint",score,7200,"Max completed all six quest fragments, escaped the traps, and destroyed the Glitch Core. The Sentence Engine is online again.",["fox","bear"]);return}
          running=true;last=performance.now();hud();raf=requestAnimationFrame(loop);
        },1150);
      }
    }
    function wrongWord(word){
      score=Math.max(0,score-80);
      if(hit()) callout(`WRONG PATH: ${word}`);
    }
    function gameOver(){
      running=false;cancelAnimationFrame(raf);
      stage.innerHTML=`<section class="result-card"><div class="result-characters"><img src="${C.fox.img}" alt="Max Fox"><img src="${C.bear.img}" alt="Bruno Bear"></div><div class="eyebrow">Run failed</div><h2>The Glitch caught Max.</h2><p>Watch the word order and save Focus Mode for the most dangerous part of the track.</p><div class="result-stats"><span>Score: ${score}</span><span>Reached run ${missionIndex+1}/${sprintMissions.length}</span></div><button class="button primary" id="retry-sprint" type="button">Retry the run</button></section>`;
      stage.querySelector("#retry-sprint").onclick=startSprint;
    }
    function roundedImage(image,x,y,w,h,r){
      ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();
      if(image.complete)ctx.drawImage(image,x,y,w,h);else{ctx.fillStyle="#ef7445";ctx.fillRect(x,y,w,h)}
      ctx.restore();
    }
    function draw(){
      const W=canvas.width,H=canvas.height;
      ctx.clearRect(0,0,W,H);
      // Skyline.
      const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#24172c");grad.addColorStop(.55,"#3f254b");grad.addColorStop(1,"#171317");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
      ctx.fillStyle="rgba(141,92,255,.18)";
      for(let i=0;i<13;i++){const x=i*82-(roadOffset*.12%82);const bh=90+(i%4)*33;ctx.fillRect(x,H-280-bh,65,bh)}
      // Glitch boss.
      ctx.save();ctx.translate(820,95);ctx.rotate(performance.now()/1200);ctx.strokeStyle="rgba(255,77,143,.7)";ctx.lineWidth=8;ctx.strokeRect(-42,-42,84,84);ctx.rotate(-performance.now()/580);ctx.strokeStyle="rgba(141,92,255,.75)";ctx.strokeRect(-29,-29,58,58);ctx.restore();
      ctx.fillStyle="rgba(255,255,255,.7)";ctx.font="800 14px system-ui";ctx.fillText("GLITCH CORE",760,158);
      // Road.
      ctx.fillStyle="#262128";ctx.beginPath();ctx.moveTo(150,H);ctx.lineTo(330,175);ctx.lineTo(630,175);ctx.lineTo(810,H);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=4;
      [370,590].forEach(x=>{ctx.beginPath();ctx.moveTo(x,H);ctx.lineTo(430+(x-480)*.18,175);ctx.stroke()});
      roadOffset=(roadOffset+7)%60;
      ctx.strokeStyle="rgba(255,180,72,.35)";ctx.lineWidth=5;
      for(let y=H-(roadOffset%60);y>185;y-=60){const p=(H-y)/(H-175),half=330*(1-p)+150*p;ctx.beginPath();ctx.moveTo(480-half,y);ctx.lineTo(480+half,y);ctx.stroke()}
      // Rows.
      rows.forEach(r=>{
        if(r.type==="choice"){
          r.items.forEach((it,i)=>{
            const x=lanes[i]-78,y=r.y,w=156,h=58;
            // Every answer uses the same neutral card style; correctness is revealed only after selection.
            ctx.fillStyle="rgba(245,240,255,.94)";
            ctx.shadowColor="rgba(36,16,64,.32)";ctx.shadowBlur=14;ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();ctx.shadowBlur=0;
            ctx.fillStyle="#231c25";ctx.font=`900 ${it.word.length>10?16:19}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(it.word,lanes[i],y+h/2);
          });
        }else if(r.type==="obstacle"){
          [0,1,2].filter(i=>i!==r.safe).forEach(i=>{
            const x=lanes[i]-58,y=r.y;ctx.fillStyle="#ff4d77";ctx.shadowColor="#ff4d77";ctx.shadowBlur=18;ctx.fillRect(x,y,116,62);ctx.shadowBlur=0;
            ctx.fillStyle="#fff";ctx.font="900 22px system-ui";ctx.textAlign="center";ctx.fillText("GLITCH",lanes[i],y+39);
          });
          ctx.strokeStyle="rgba(75,230,160,.75)";ctx.lineWidth=4;ctx.strokeRect(lanes[r.safe]-57,r.y,114,60);
        }else{
          const x=lanes[r.target]-30,y=r.y;ctx.fillStyle="#45c9d8";ctx.shadowColor="#45c9d8";ctx.shadowBlur=22;ctx.beginPath();ctx.arc(lanes[r.target],y+28,28,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="900 18px system-ui";ctx.textAlign="center";ctx.fillText("+",lanes[r.target],y+35);
        }
      });
      // Player and lane glow.
      ctx.fillStyle="rgba(255,180,72,.18)";ctx.beginPath();ctx.ellipse(lanes[lane],playerY+65,70,20,0,0,Math.PI*2);ctx.fill();
      roundedImage(foxImg,lanes[lane]-48,playerY-58,96,125,22);
      ctx.fillStyle="#ffb448";ctx.fillRect(lanes[lane]-54,playerY+63,108,10);
      // Focus overlay.
      if(performance.now()<slowUntil){ctx.fillStyle="rgba(69,201,216,.10)";ctx.fillRect(0,0,W,H);ctx.strokeStyle="rgba(69,201,216,.55)";ctx.lineWidth=8;ctx.strokeRect(4,4,W-8,H-8)}
    }
    function update(dt,now){
      const focusMultiplier=now<slowUntil?0.46:1;
      const speed=(165+missionIndex*20)*focusMultiplier;
      rows.forEach(r=>r.y+=speed*dt);
      rows.forEach(r=>{
        if(r.resolved)return;
        if(r.y>playerY-25&&r.y<playerY+70){
          r.resolved=true;
          if(r.type==="choice"){
            const item=r.items[lane];item.correct?correctWord(item.word):wrongWord(item.word);
          }else if(r.type==="obstacle"){
            if(lane!==r.safe)hit();else{score+=35;combo++;tone("click");callout("CLEAN DODGE");hud()}
          }else{
            if(lane===r.target){focus=Math.min(100,focus+30);score+=50;tone("power");callout("FOCUS CELL");hud()}
          }
        }
      });
      rows=rows.filter(r=>r.y<610&&!r.resolved);
      spawnAt-=speed*dt;
      if(spawnAt<=0&&running){
        if(wordIndex<mission().words.length){
          if(Math.random()<.12+Math.min(.12, missionIndex*.03)&&focus<85)spawnBonus();
          else nextSpawn();
          spawnAt=600 - missionIndex*20;
        }
      }
    }
    function loop(now){
      if(!running)return;
      const dt=Math.min(.035,(now-last)/1000);last=now;update(dt,now);draw();raf=requestAnimationFrame(loop);
    }
    const key=e=>{if(["ArrowLeft","a","A"].includes(e.key))move(-1);if(["ArrowRight","d","D"].includes(e.key))move(1);if(e.code==="Space"){e.preventDefault();focusMode()}};
    document.addEventListener("keydown",key);
    stage.querySelector("#run-left").onpointerdown=()=>move(-1);stage.querySelector("#run-right").onpointerdown=()=>move(1);stage.querySelector("#run-focus-button").onpointerdown=focusMode;
    canvas.addEventListener("pointerdown",e=>pointerStart=e.clientX);canvas.addEventListener("pointerup",e=>{if(pointerStart===null)return;const dx=e.clientX-pointerStart;if(Math.abs(dx)>32)move(dx>0?1:-1);pointerStart=null});
    state.cleanup=()=>{running=false;cancelAnimationFrame(raf);document.removeEventListener("keydown",key)};
    hud();spawnAt=250;raf=requestAnimationFrame(loop);
  }


  /* --------------------------- GAME 2: DETECTIVE --------------------------- */
  const clues={
    camera:{icon:"🎥",title:"Camera memory card",text:"The video started at 5:30 PM. Max had the skateboard in the studio.",room:"studio"},
    message:{icon:"📱",title:"Recovered voice message",text:"Panda said: “You can use my skateboard. Bring it back before six.”",room:"studio"},
    marks:{icon:"🛞",title:"Orange wheel marks",text:"There are wheel marks from the street to the studio.",room:"studio"},
    poster:{icon:"🎬",title:"Shooting schedule",text:"The music video was planned for 5:30 PM.",room:"studio"},
    chalkboard:{icon:"📝",title:"Chalkboard note",text:"The rehearsal started at 5:15 PM and the team was already moving.",room:"studio"},
    scooter:{icon:"🛴",title:"Tiny scooter scratch",text:"A small scooter mark was left near the studio entrance.",room:"studio"},
    log:{icon:"📋",title:"Workshop repair log",text:"The skateboard is not in the repair log.",room:"workshop"},
    tools:{icon:"🧰",title:"Clean toolkit",text:"Bruno's tools are clean and unused.",room:"workshop"},
    wrench:{icon:"🔧",title:"Grease-stained wrench",text:"The wrench is too dirty to be from the latest repair session.",room:"workshop"},
    rain:{icon:"🌧️",title:"Weather terminal",text:"The rain stopped at 5:10.",room:"park"},
    ticket:{icon:"🎟️",title:"Park exit ticket",text:"Panda left the park at 4:45 PM.",room:"park"},
    train:{icon:"🚆",title:"Ricky’s train ticket",text:"Ricky’s ticket is for tomorrow.",room:"park"},
    receipt:{icon:"🧾",title:"Cafe receipt",text:"The receipt shows the team met at 4:35 PM.",room:"park"}
  };
  const roomHotspots={
    studio:[["camera",62,27],["message",75,62],["marks",31,73],["poster",45,20],["chalkboard",18,16],["scooter",70,18]],
    workshop:[["log",63,28],["tools",35,68],["wrench",50,15]],
    park:[["rain",20,28],["ticket",53,70],["train",78,38],["receipt",35,18]]
  };
  const grammarTasks=[
    {
      evidence:"camera",label:"Present Continuous",
      prompt:"Choose the correct sentence.",
      options:["Max is filming a video.","Max filming a video.","Max are filming a video."],
      correct:0,explanation:"We use is + verb-ing with he / she / it."
    },
    {
      evidence:"message",label:"Have got",
      prompt:"Choose the correct sentence.",
      options:["Panda has got a skateboard.","Panda have got a skateboard.","Panda got has a skateboard."],
      correct:0,explanation:"With he / she / it, we use has got."
    },
    {
      evidence:"marks",label:"There are",
      prompt:"Choose the correct sentence.",
      options:["There are two wheel marks.","There is two wheel marks.","There are a wheel marks."],
      correct:0,explanation:"We use there are with plural nouns."
    },
    {
      evidence:"tools",label:"Can",
      prompt:"Choose the correct sentence.",
      options:["Bruno can fix the wheel.","Bruno can fixes the wheel.","Bruno cans fix the wheel."],
      correct:0,explanation:"After can, we use the base verb: can fix."
    },
    {
      evidence:"ticket",label:"Past of be",
      prompt:"Choose the correct sentence.",
      options:["Panda was in the park at 4:45.","Panda were in the park at 4:45.","Panda is in the park at 4:45 yesterday."],
      correct:0,explanation:"For one person in the past, we use was."
    },
    {
      evidence:"train",label:"Prepositions of place",
      prompt:"Choose the correct sentence.",
      options:["Ricky is at the station.","Ricky is on the station.","Ricky is in the station gate in tomorrow."],
      correct:0,explanation:"We usually say at the station."
    },
    {
      evidence:"poster",label:"Present Continuous",
      prompt:"Choose the correct sentence.",
      options:["The schedule is changing now.","The schedule are changing now.","The schedule changing now."],
      correct:0,explanation:"We use is + verb-ing for one thing in the present."
    },
    {
      evidence:"rain",label:"Past of be",
      prompt:"Choose the correct sentence.",
      options:["The rain was heavy earlier.","The rain were heavy earlier.","The rain is heavy earlier."],
      correct:0,explanation:"We use was for one thing in the past."
    },
    {
      evidence:"chalkboard",label:"Past of be",
      prompt:"Choose the correct sentence.",
      options:["The rehearsal was on time.","The rehearsal were on time.","The rehearsal is on time yesterday."],
      correct:0,explanation:"We use was for one thing in the past."
    },
    {
      evidence:"scooter",label:"There is",
      prompt:"Choose the correct sentence.",
      options:["There is a scooter outside.","There are a scooter outside.","There is scooters outside."],
      correct:0,explanation:"We use there is with singular nouns."
    },
    {
      evidence:"wrench",label:"Can",
      prompt:"Choose the correct sentence.",
      options:["Bruno can help with the repair.","Bruno can helps with the repair.","Bruno cans help with the repair."],
      correct:0,explanation:"After can, we use the base verb."
    },
    {
      evidence:"receipt",label:"Have got",
      prompt:"Choose the correct sentence.",
      options:["The team has got a plan.","The team have got a plan.","The team got has a plan."],
      correct:0,explanation:"With the team, we use has got in this structure."
    }
  ];

  function startDetective(){
    title.textContent="The Lost Timeline · A1-A2 Detective Game";
    let found=new Set(),room="studio",scanner=false,timelinePlaced={},selectedEvent=null,selectedEvidence=null,links={};
    let grammarIndex=0,grammarScore=0,grammarLives=3;
    const required=Object.keys(clues).length;

    function base(){
      stage.innerHTML=`<section class="game-layout"><aside class="game-guide dark"><img src="${C.wolf.img}" alt="Agent Wolf"><div class="guide-copy"><strong>Agent Wolf</strong><span id="wolf-line">“Evidence first. Grammar reveals the timeline.”</span></div></aside><div class="game-board" id="detective-board"></div></section>`;
    }

    function renderSearch(){
      const board=stage.querySelector("#detective-board");
      board.innerHTML=`<div class="hud-row"><span class="hud-pill">PHASE 1/4 · SEARCH</span><span class="hud-pill good">CLUES ${found.size}/${required}</span><span class="hud-spacer"></span><button class="button ghost compact" id="scanner" type="button">${scanner?"Wide beam ON":"Wide beam"}</button></div><div class="detective-shell"><div><div class="case-toolbar">${["studio","workshop","park"].map(r=>`<button class="location-button ${room===r?"active":""}" data-room="${r}" type="button">${r==="studio"?"🎬 Studio":r==="workshop"?"🔧 Workshop":"🌳 Park"}</button>`).join("")}</div><div class="case-scene ${scanner?"scanner":""}" id="case-scene"><span class="scene-title">${room}</span><div class="scene-floor"></div>${sceneProps(room)}${roomHotspots[room].map(([id,x,y])=>`<button class="clue-hotspot ${found.has(id)?"found":""}" style="left:${x}%;top:${y}%" data-clue="${id}" type="button" aria-label="${clues[id].title}" disabled>${clues[id].icon}</button>`).join("")}</div></div><aside class="case-sidebar"><div class="case-status"><h3>Case progress</h3><div class="case-meter"><div style="width:${found.size/required*100}%"></div></div><p class="muted">${found.size<required?"Search all three locations. The flashlight follows your pointer.":"All evidence collected. The Grammar Decoder is unlocked."}</p><button class="button primary case-action" id="grammar-next" type="button" ${found.size<required?"disabled":""}>Open Grammar Decoder →</button></div><div class="inventory"><h3>Evidence inventory</h3><div class="inventory-list">${[...found].map(id=>`<div class="inventory-item"><span>${clues[id].icon}</span>${clues[id].title}</div>`).join("")||'<p class="muted">No evidence yet.</p>'}</div></div></aside></div>`;
      board.querySelectorAll("[data-room]").forEach(b=>b.onclick=()=>{room=b.dataset.room;renderSearch()});
      const scene=board.querySelector("#case-scene");
      const hotspots=[...board.querySelectorAll("[data-clue]")];
      const moveFlash=e=>{
        const r=scene.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,beam=scanner?170:108;
        scene.style.setProperty("--fx",`${x}px`);scene.style.setProperty("--fy",`${y}px`);
        hotspots.forEach(button=>{const dx=x-(button.offsetLeft+button.offsetWidth/2),dy=y-(button.offsetTop+button.offsetHeight/2),lit=Math.hypot(dx,dy)<beam;button.disabled=!lit;button.classList.toggle("lit",lit)});
      };
      scene.onpointermove=moveFlash;
      scene.onpointerdown=moveFlash;
      scene.onpointerleave=()=>hotspots.forEach(button=>{button.disabled=true;button.classList.remove("lit")});
      board.querySelector("#scanner").onclick=()=>{scanner=!scanner;tone("power");renderSearch()};
      hotspots.forEach(b=>b.onclick=()=>openClue(b.dataset.clue));
      board.querySelector("#grammar-next").onclick=renderGrammar;
    }

    function sceneProps(r){
      if(r==="studio")return`<div class="scene-prop prop-screen">🎞️</div><div class="scene-prop prop-table"></div><div class="scene-prop prop-door">🚪</div><div class="scene-prop prop-lamp">💡</div>`;
      if(r==="workshop")return`<div class="scene-prop prop-screen" style="background:#24323c">⚙️</div><div class="scene-prop prop-table" style="background:#594837"></div><div class="scene-prop prop-door">🔩</div><div class="scene-prop prop-lamp">🔧</div>`;
      return`<div class="scene-prop prop-screen" style="background:#284b3e">🌧️</div><div class="scene-prop prop-table" style="background:#4f7249"></div><div class="scene-prop prop-door">🌲</div><div class="scene-prop prop-lamp">🕰️</div>`;
    }

    function openClue(id){
      const c=clues[id],was=found.has(id);found.add(id);tone(was?"click":"good");
      info.innerHTML=`<div class="modal-content"><div class="clue-dialog"><div class="clue-icon">${c.icon}</div><div><div class="eyebrow">${was?"Evidence review":"New evidence"}</div><h3>${c.title}</h3><p>${c.text}</p></div></div><div class="rule-box">${was?"This clue is already in the inventory.":"Clue added to Agent Wolf’s inventory."}</div></div>`;
      modal.showModal();modal.addEventListener("close",renderSearch,{once:true});
    }

    function renderGrammar(){
      const board=stage.querySelector("#detective-board");
      if(grammarLives<=0){
        board.innerHTML=`<div class="grammar-console grammar-reboot"><div class="instruction-hero"><img src="${C.wolf.img}" alt="Agent Wolf"><div><div class="eyebrow">Decoder locked</div><h2>Grammar code rejected</h2></div></div><p>Three wrong answers overloaded the decoder. Your clues are safe, so only the grammar phase will restart.</p><div class="result-stats"><span>Decoded: ${grammarScore}/${grammarTasks.length}</span><span>Clues saved</span></div><button class="button primary" id="retry-grammar" type="button">Restart Grammar Decoder</button></div>`;
        board.querySelector("#retry-grammar").onclick=()=>{grammarIndex=0;grammarScore=0;grammarLives=3;renderGrammar()};
        return;
      }
      if(grammarIndex>=grammarTasks.length){tone("power");renderTimeline();return}
      const q=grammarTasks[grammarIndex],evidence=clues[q.evidence];
      board.innerHTML=`<div class="hud-row"><span class="hud-pill">PHASE 2/4 · GRAMMAR DECODER</span><span class="hud-pill good">CODE ${grammarIndex}/${grammarTasks.length}</span><span class="hud-spacer"></span><span class="hud-pill danger grammar-lives">TOKENS ${"◆".repeat(grammarLives)}${"◇".repeat(3-grammarLives)}</span></div><div class="grammar-console"><div class="grammar-evidence"><div class="clue-icon">${evidence.icon}</div><div><div class="eyebrow">${q.label}</div><h3>${evidence.title}</h3><p>${evidence.text}</p></div></div><div class="grammar-question"><div class="round-kicker">Statement ${grammarIndex+1} of ${grammarTasks.length}</div><h2 class="question-title">${q.prompt}</h2><div class="grammar-options">${q.options.map((o,i)=>`<button class="grammar-option" data-grammar-option="${i}" type="button"><span>${String.fromCharCode(65+i)}</span>${o}</button>`).join("")}</div><div class="grammar-explanation" id="grammar-feedback">Choose the statement that keeps the evidence grammatically accurate.</div></div></div>`;
      const buttons=[...board.querySelectorAll("[data-grammar-option]")],feedback=board.querySelector("#grammar-feedback");
      buttons.forEach(button=>button.onclick=()=>{
        buttons.forEach(b=>b.disabled=true);
        const chosen=Number(button.dataset.grammarOption);
        if(chosen===q.correct){
          grammarScore++;button.classList.add("correct");tone("good");
          if(grammarScore%2===0)showComboPopup(grammarScore>=4?"Amazing!":"Perfect!", grammarScore>=4?"#8d5cff":"#ffb448");
          feedback.className="grammar-explanation success";feedback.innerHTML=`<strong>Code accepted.</strong> ${q.explanation}`;
        }else{
          grammarLives--;button.classList.add("wrong");buttons[q.correct].classList.add("correct");tone("bad");
          feedback.className="grammar-explanation error";feedback.innerHTML=`<strong>Code rejected.</strong> ${q.explanation}`;
        }
        setTimeout(()=>{grammarIndex++;renderGrammar()},1400);
      });
    }

    const events=[
      {id:"park",text:"Panda was in the park at 4:45.",time:"4:45"},
      {id:"rain",text:"The rain stopped at 5:10.",time:"5:10"},
      {id:"studio",text:"Max was in the studio at 5:30.",time:"5:30"},
      {id:"back",text:"Panda got the skateboard back at 6:00.",time:"6:00"}
    ];

    function renderTimeline(){
      const board=stage.querySelector("#detective-board");
      board.innerHTML=`<div class="hud-row"><span class="hud-pill">PHASE 3/4 · TIMELINE</span><span class="hud-pill good">GRAMMAR CODE ${grammarScore}/${grammarTasks.length}</span></div><div class="phase-panel"><div class="round-kicker">Time Archive</div><h2 class="question-title">Place each event on the correct time.</h2><p class="muted">Click an event card and then a time slot, or drag the card into place.</p><div class="timeline-grid">${["4:45","5:10","5:30","6:00"].map(t=>`<div class="timeline-slot" data-time="${t}"><strong>${t} PM</strong>${timelinePlaced[t]?eventHTML(timelinePlaced[t]):""}</div>`).join("")}</div><div class="event-bank">${events.filter(e=>!Object.values(timelinePlaced).includes(e.id)).map(eventHTML).join("")}</div><div class="hud-row" style="margin-top:18px"><span id="timeline-feedback" class="muted">Arrange all four events.</span><span class="hud-spacer"></span><button class="button primary" id="check-timeline" type="button">Check timeline</button></div></div>`;
      bindTimeline();board.querySelector("#check-timeline").onclick=checkTimeline;
    }

    function eventHTML(idOrEvent){
      const e=typeof idOrEvent==="string"?events.find(x=>x.id===idOrEvent):idOrEvent;
      return`<div class="event-card ${selectedEvent===e.id?"selected":""}" draggable="true" data-event="${e.id}">${e.text}</div>`;
    }

    function bindTimeline(){
      const board=stage.querySelector("#detective-board");
      board.querySelectorAll("[data-event]").forEach(card=>{
        card.onclick=()=>{selectedEvent=card.dataset.event;renderTimeline()};
        card.ondragstart=e=>e.dataTransfer.setData("text/plain",card.dataset.event);
      });
      board.querySelectorAll("[data-time]").forEach(slot=>{
        slot.onclick=()=>{
          if(!selectedEvent)return;
          const incoming=selectedEvent;
          Object.keys(timelinePlaced).forEach(k=>{if(timelinePlaced[k]===incoming)delete timelinePlaced[k]});
          timelinePlaced[slot.dataset.time]=incoming;selectedEvent=null;tone("click");renderTimeline();
        };
        slot.ondragover=e=>e.preventDefault();
        slot.ondrop=e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");Object.keys(timelinePlaced).forEach(k=>{if(timelinePlaced[k]===id)delete timelinePlaced[k]});timelinePlaced[slot.dataset.time]=id;tone("click");renderTimeline()};
      });
    }

    function checkTimeline(){
      const ok=events.every(e=>timelinePlaced[e.time]===e.id),f=stage.querySelector("#timeline-feedback");
      if(ok){tone("good");f.textContent="Timeline restored. Evidence board unlocked.";f.style.color="#247650";setTimeout(renderBoard,900)}
      else{tone("bad");f.textContent="The timeline is not correct. Try again.";f.style.color="#a83f52"}
    }

    const pairs={camera:"claimStudio",message:"claimPermission",train:"claimRicky",poster:"claimSchedule",chalkboard:"claimRehearsal",receipt:"claimCafe",scooter:"claimScooter",wrench:"claimWorkshop"};

    function renderBoard(){
      const board=stage.querySelector("#detective-board"),evidence=["camera","message","train","poster","chalkboard","receipt","scooter","wrench"];
      board.innerHTML=`<div class="hud-row"><span class="hud-pill">PHASE 4/4 · EVIDENCE BOARD</span><span class="hud-pill good">LINK ${Object.keys(links).length}/8</span></div><div class="phase-panel"><div class="round-kicker">Deduction wall</div><h2 class="question-title">Connect evidence to the correct conclusion.</h2><p class="muted">Choose one clue on the left, then choose the matching conclusion on the right.</p><div class="board-links"><div class="evidence-bank">${evidence.map(id=>`<button class="evidence-token ${selectedEvidence===id?"selected":""}" data-evidence="${id}" type="button">${clues[id].icon} ${clues[id].title}</button>`).join("")}</div><div class="claim-bank"><button class="claim-node ${links.claimStudio?"linked":""}" data-claim="claimStudio" type="button">Max was at the studio at 5:30.${links.claimStudio?`<span class="link-line">↳ ${clues[links.claimStudio].title}</span>`:""}</button><button class="claim-node ${links.claimPermission?"linked":""}" data-claim="claimPermission" type="button">Panda gave Max permission.${links.claimPermission?`<span class="link-line">↳ ${clues[links.claimPermission].title}</span>`:""}</button><button class="claim-node ${links.claimRicky?"linked":""}" data-claim="claimRicky" type="button">Ricky’s ticket is for tomorrow.${links.claimRicky?`<span class="link-line">↳ ${clues[links.claimRicky].title}</span>`:""}</button><button class="claim-node ${links.claimSchedule?"linked":""}" data-claim="claimSchedule" type="button">The shooting schedule changed.${links.claimSchedule?`<span class="link-line">↳ ${clues[links.claimSchedule].title}</span>`:""}</button><button class="claim-node ${links.claimRehearsal?"linked":""}" data-claim="claimRehearsal" type="button">The rehearsal started before the ride.${links.claimRehearsal?`<span class="link-line">↳ ${clues[links.claimRehearsal].title}</span>`:""}</button><button class="claim-node ${links.claimCafe?"linked":""}" data-claim="claimCafe" type="button">The meetup happened before the park exit.${links.claimCafe?`<span class="link-line">↳ ${clues[links.claimCafe].title}</span>`:""}</button><button class="claim-node ${links.claimScooter?"linked":""}" data-claim="claimScooter" type="button">A scooter mark points to the studio.${links.claimScooter?`<span class="link-line">↳ ${clues[links.claimScooter].title}</span>`:""}</button><button class="claim-node ${links.claimWorkshop?"linked":""}" data-claim="claimWorkshop" type="button">The wrench suggests a hurried repair.${links.claimWorkshop?`<span class="link-line">↳ ${clues[links.claimWorkshop].title}</span>`:""}</button></div></div><div id="link-feedback" class="muted" style="margin-top:15px">Build all eight links.</div>${Object.keys(links).length===8?`<button class="button primary" id="final-deduction" style="margin-top:14px" type="button">Make final deduction →</button>`:""}</div>`;
      board.querySelectorAll("[data-evidence]").forEach(b=>b.onclick=()=>{selectedEvidence=b.dataset.evidence;tone("click");renderBoard()});
      board.querySelectorAll("[data-claim]").forEach(b=>b.onclick=()=>{
        if(!selectedEvidence){showToast("Choose a clue first.");return}
        const claim=b.dataset.claim;
        if(pairs[selectedEvidence]===claim){links[claim]=selectedEvidence;selectedEvidence=null;tone("good");renderBoard()}
        else{tone("bad");stage.querySelector("#link-feedback").textContent="This clue does not support that conclusion."}
      });
      const final=board.querySelector("#final-deduction");if(final)final.onclick=renderDeduction;
    }

    function renderDeduction(){
      const board=stage.querySelector("#detective-board");
      board.innerHTML=`<div class="hud-row"><span class="hud-pill">FINAL DEDUCTION</span><span class="hud-pill good">GRAMMAR ${grammarScore}/${grammarTasks.length}</span></div><div class="phase-panel"><div class="round-kicker">Case theory</div><h2 class="question-title">What really happened?</h2><p class="muted">Build the complete case theory from four parts.</p><div class="deduction-grid"><div class="deduction-field"><label>Who used the skateboard?</label><select id="d-who"><option>Bruno Bear</option><option>Ricky Raccoon</option><option>Max Fox</option></select></div><div class="deduction-field"><label>Why?</label><select id="d-why"><option>to repair it</option><option>to film a music video</option><option>to leave the city</option></select></div><div class="deduction-field"><label>Permission?</label><select id="d-permission"><option>He stole it.</option><option>Panda allowed him to borrow it.</option><option>No one knows.</option></select></div><div class="deduction-field"><label>What happened next?</label><select id="d-next"><option>It was returned before six.</option><option>It disappeared forever.</option><option>Bruno sold it.</option></select></div></div><div id="deduction-feedback" class="muted">Use the full chain of evidence.</div><button class="button primary" id="solve-case" style="margin-top:14px" type="button">Solve the case</button></div>`;
      board.querySelector("#solve-case").onclick=()=>{
        const ok=board.querySelector("#d-who").value==="Max Fox"&&board.querySelector("#d-why").value==="to film a music video"&&board.querySelector("#d-permission").value==="Panda allowed him to borrow it."&&board.querySelector("#d-next").value==="It was returned before six.";
        if(ok){
          const earned=required+grammarScore+4+3+2,total=required+grammarTasks.length+4+3+2;
          complete("detective",earned,total,"You found the clues, completed the advanced grammar decoder, restored the timeline, and proved that Max borrowed Panda’s skateboard to film a music video.",["wolf","panda","fox"]);
        }else{
          tone("bad");board.querySelector("#deduction-feedback").textContent="One or more choices do not match the evidence.";board.querySelector("#deduction-feedback").style.color="#a83f52";
        }
      };
    }

    base();renderSearch();
    state.cleanup=()=>{};
  }


  /* --------------------------- GAME 3: SOUND SAFARI --------------------------- */
  const echoRounds=[
    {mode:"identity",label:"Character Hunt",prompt:"Find the panda with a skateboard.",answers:["panda"],pool:["panda","bear","fox","raccoon"]},
    {mode:"identity",label:"Character Hunt",prompt:"Find the rabbit in a dot dress.",answers:["bunny"],pool:["bunny","cat","wolf","lion"]},
    {mode:"identity",label:"Character Hunt",prompt:"Find the bear with a wrench.",answers:["bear"],pool:["bear","raccoon","panda","fox"]},
    {mode:"location",label:"Location Hunt",prompt:"Find the fox at the music studio.",answers:["fox"],pool:["fox","cat","lion","wolf","bunny","raccoon"],places:{fox:"🎵 Music studio",cat:"🎭 Theatre",lion:"🌳 Park",wolf:"🕰 Clock tower",bunny:"☕ Café",raccoon:"🚉 Station"}},
    {mode:"location",label:"Location Hunt",prompt:"Find the cat at the theatre.",answers:["cat"],pool:["cat","panda","bear","bunny","lion","fox"],places:{cat:"🎭 Theatre",panda:"🛹 Skate park",bear:"🔧 Garage",bunny:"☕ Café",lion:"🌳 Park",fox:"🎵 Studio"}},
    {mode:"location",label:"Location Hunt",prompt:"Find the raccoon at the station.",answers:["raccoon"],pool:["raccoon","wolf","bunny","panda","bear","lion"],places:{raccoon:"🚉 Station",wolf:"🕰 Clock tower",bunny:"☕ Café",panda:"🛹 Skate park",bear:"🔧 Garage",lion:"🌳 Park"}},
    {mode:"sequence",label:"Echo Sequence",prompt:"First click the lion. Then click the wolf.",answers:["lion","wolf"],pool:["lion","wolf","fox","cat","bunny","panda","bear","raccoon"]},
    {mode:"sequence",label:"Echo Sequence",prompt:"First click the bear. Then click the panda.",answers:["bear","panda"],pool:["bear","panda","raccoon","fox","lion","cat","wolf","bunny"]},
    {mode:"identity",label:"Character Hunt",prompt:"Find the wolf by the clock tower.",answers:["wolf"],pool:["wolf","lion","cat","bunny"]},
    {mode:"location",label:"Location Hunt",prompt:"Find the lion in the park.",answers:["lion"],pool:["lion","panda","raccoon","bear","fox","cat"],places:{lion:"🌳 Park",panda:"🛹 Skate park",raccoon:"🚉 Station",bear:"🔧 Garage",fox:"🎵 Studio",cat:"🎭 Theatre"}},
    {mode:"sequence",label:"Echo Sequence",prompt:"First click the panda. Then click the bunny.",answers:["panda","bunny"],pool:["panda","bunny","fox","wolf","cat","lion","bear","raccoon"]},
    {mode:"location",label:"Location Hunt",prompt:"Find the bunny near the café.",answers:["bunny"],pool:["bunny","fox","panda","bear","lion","cat"],places:{bunny:"☕ Café",fox:"🎵 Studio",panda:"🛹 Skate park",bear:"🔧 Garage",lion:"🌳 Park",cat:"🎭 Theatre"}},
    {mode:"identity",label:"Character Hunt",prompt:"Find the fox at the studio gate.",answers:["fox"],pool:["fox","cat","wolf","panda"]},
    {mode:"location",label:"Location Hunt",prompt:"Find the cat in the theatre hall.",answers:["cat"],pool:["cat","lion","wolf","bear","fox","raccoon"],places:{cat:"🎭 Theatre",lion:"🌳 Park",wolf:"🕰 Clock tower",bear:"🔧 Garage",fox:"🎵 Studio",raccoon:"🚉 Station"}}
  ];

  function startSafari(){
    title.textContent="Sound Safari · A1-A2 Listening Game";
    let round=0,score=0,hearts=3,combo=0,timeLeft=12,timer=null,locked=false,ended=false,sequenceStep=0,transcriptShown=false;
    let current=null;

    stage.innerHTML=`<section class="game-layout"><aside class="game-guide green"><img src="${C.lion.img}" alt="Leo Lion"><div class="guide-copy"><strong>Leo Lion</strong><span>“Listen. Find. Click.”</span></div></aside><div class="echo-shell"><div class="echo-hud"><div class="hud-row"><span class="hud-pill" id="e-round">ROUND 1/${echoRounds.length}</span><span class="hud-pill danger" id="e-hearts">♥♥♥</span><span class="hud-pill good" id="e-score">SCORE 0</span><span class="hud-spacer"></span><span class="hud-pill" id="e-combo">COMBO x0</span></div><div class="echo-command"><button class="echo-play" id="e-play" type="button">▶</button><div><div class="round-kicker" id="e-mode">Character Hunt</div><h2 id="e-instruction">Listen and choose one hero.</h2><div class="echo-transcript" id="e-transcript"></div></div><button class="echo-replay" id="e-slow" type="button">🐢 Slow</button></div><div class="timer-bar echo-timer"><div id="e-timer"></div></div></div><div class="echo-arena"><div class="echo-step" id="e-step"></div><div class="echo-grid" id="echo-grid"></div><div class="echo-feedback" id="e-feedback">Press play or listen to the automatic clue.</div></div><div class="echo-footer"><span>Wrong choice costs one life. Transcript costs 75 points.</span><button class="button glass compact" id="e-show-text" type="button">Show transcript</button></div></div></section>`;

    const grid=stage.querySelector("#echo-grid");

    function say(rate=.84){
      playSpeech(current.prompt,rate);
    }

    function hud(){
      stage.querySelector("#e-round").textContent=`ROUND ${round+1}/${echoRounds.length}`;
      stage.querySelector("#e-hearts").textContent=`${"♥".repeat(hearts)}${"♡".repeat(3-hearts)}`;
      stage.querySelector("#e-score").textContent=`SCORE ${score}`;
      stage.querySelector("#e-combo").textContent=`COMBO x${combo}`;
    }

    function renderRound(){
      if(round>=echoRounds.length){
        ended=true;clearInterval(timer);
        complete("safari",score,6400,"You completed all three A1–A2 listening modes: character clues, location clues, and first/then sequences.",["lion","cat","panda"]);
        return;
      }
      current=echoRounds[round];locked=false;sequenceStep=0;transcriptShown=false;timeLeft=12;hud();
      stage.querySelector("#e-mode").textContent=current.label;
      stage.querySelector("#e-instruction").textContent=current.mode==="sequence"?"Listen and click two heroes in the correct order.":current.mode==="location"?"Listen for the hero and the place.":"Listen and choose the correct hero.";
      stage.querySelector("#e-transcript").textContent="";
      stage.querySelector("#e-feedback").textContent="The clue will play automatically.";
      stage.querySelector("#e-feedback").className="echo-feedback";
      stage.querySelector("#e-step").textContent=current.mode==="sequence"?"STEP 1 OF 2":"";
      const order=shuffle(current.pool);
      grid.className=`echo-grid ${current.mode==="sequence"?"wide":""}`;
      grid.innerHTML=order.map(key=>`<button class="echo-card" data-echo-character="${key}" type="button"><div class="echo-image"><img src="${C[key].img}" alt="${C[key].name}"></div>${current.mode==="location"?`<span class="echo-place">${current.places[key]}</span>`:""}<span class="echo-card-name">${current.mode==="location"?"Choose by sound":"?"}</span></button>`).join("");
      grid.querySelectorAll("[data-echo-character]").forEach(card=>card.onclick=()=>choose(card));
      clearInterval(timer);startTimer();setTimeout(()=>say(),350);
    }

    function roundSuccess(card){
      locked=true;card.classList.add("correct");clearInterval(timer);combo++;
      score+=650+combo*80+Math.round(timeLeft*10);tone("good");
      if(combo===2)showComboPopup("Perfect!", "#ffb448");
      if(combo===4)showComboPopup("Amazing!", "#8d5cff");
      triggerFlash(combo>=4?"#8d5cff":"#43a879");
      hud();
      stage.querySelector("#e-feedback").className="echo-feedback success";
      stage.querySelector("#e-feedback").textContent="Correct signal locked!";
      setTimeout(()=>{round++;renderRound()},900);
    }

    function loseLife(message){
      hearts--;combo=0;score=Math.max(0,score-100);tone("bad");hud();
      stage.querySelector("#e-feedback").className="echo-feedback error";
      stage.querySelector("#e-feedback").textContent=message;
      if(hearts<=0)gameOver();
    }

    function choose(card){
      if(locked||ended)return;
      const key=card.dataset.echoCharacter;
      if(current.mode==="sequence"){
        const expected=current.answers[sequenceStep];
        if(key===expected){
          card.classList.add("sequence-correct");card.disabled=true;tone("good");sequenceStep++;
          stage.querySelector("#e-step").textContent=sequenceStep===1?"STEP 2 OF 2":"SEQUENCE COMPLETE";
          stage.querySelector("#e-feedback").className="echo-feedback success";
          stage.querySelector("#e-feedback").textContent=sequenceStep===1?"Good. Now choose the second hero.":"Correct order!";
          if(sequenceStep>=current.answers.length)roundSuccess(card);
        }else{
          card.classList.add("wrong");setTimeout(()=>card.classList.remove("wrong"),500);
          grid.querySelectorAll(".sequence-correct").forEach(c=>{c.classList.remove("sequence-correct");c.disabled=false});
          sequenceStep=0;stage.querySelector("#e-step").textContent="STEP 1 OF 2";
          loseLife("Wrong order. The sequence has restarted.");
        }
      }else if(key===current.answers[0]){
        roundSuccess(card);
      }else{
        card.classList.add("wrong");setTimeout(()=>card.classList.remove("wrong"),500);
        loseLife("That character does not match the audio clue.");
      }
    }

    function startTimer(){
      stage.querySelector("#e-timer").style.transform="scaleX(1)";
      timer=setInterval(()=>{
        if(locked||ended)return;
        timeLeft-=.1;
        const bar=stage.querySelector("#e-timer");if(bar)bar.style.transform=`scaleX(${Math.max(0,timeLeft/12)})`;
        if(timeLeft<=0){
          clearInterval(timer);locked=true;loseLife("Time is up. Listen for the key description.");
          if(hearts>0)setTimeout(renderRound,750);
        }
      },100);
    }

    function gameOver(){
      ended=true;locked=true;clearInterval(timer);
      stage.innerHTML=`<section class="result-card"><div class="result-characters"><img src="${C.lion.img}" alt="Leo Lion"><img src="${C.cat.img}" alt="Luna Cat"></div><div class="eyebrow">Signal lost</div><h2>Echo Challenge failed.</h2><p>Listen for key words, place names, and the sequence words <strong>first</strong> and <strong>then</strong>.</p><div class="result-stats"><span>Score: ${score}</span><span>Round ${round+1}/${echoRounds.length}</span></div><button class="button primary" id="retry-safari" type="button">Retry the audio mission</button></section>`;
      stage.querySelector("#retry-safari").onclick=startSafari;
    }

    stage.querySelector("#e-play").onclick=()=>{tone("click");say()};
    stage.querySelector("#e-slow").onclick=()=>{tone("click");say(.67)};
    stage.querySelector("#e-show-text").onclick=()=>{
      if(!transcriptShown){score=Math.max(0,score-75);transcriptShown=true;hud()}
      stage.querySelector("#e-transcript").textContent=current.prompt;tone("click");
    };
    state.cleanup=()=>{ended=true;clearInterval(timer);clearTimeout(state.speechTimer);state.speechUtterance=null;if("speechSynthesis"in window)speechSynthesis.cancel()};
    renderRound();
  }



  /* --------------------------- HOMEPAGE NEON FX --------------------------- */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cursorGlow = document.getElementById("cursor-glow");
  const liveStatusText = document.getElementById("live-status-text");
  startAmbientParticles();

  if (!prefersReducedMotion) {
    // Cursor glow.
    document.addEventListener("pointermove", event => {
      if (!cursorGlow) return;
      cursorGlow.style.transform = `translate(${event.clientX - 120}px, ${event.clientY - 120}px)`;
    });


    // Soft 3D tilt for the cover and mission cards.
    document.querySelectorAll("[data-tilt]").forEach(element => {
      element.addEventListener("pointermove", event => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        const rotateY = x * 7;
        const rotateX = -y * 7;
        const baseRotation = element.classList.contains("cover-frame") ? -2 : 0;
        element.style.transform = `perspective(950px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${baseRotation}deg) translateY(-3px)`;
      });
      element.addEventListener("pointerleave", () => {
        element.style.transform = "";
      });
    });
  }

  // Button ripple.
  document.querySelectorAll(".fx-button").forEach(button => {
    button.addEventListener("pointerdown", event => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty("--ripple-x", `${event.clientX - rect.left}px`);
      button.style.setProperty("--ripple-y", `${event.clientY - rect.top}px`);
      button.classList.remove("ripple");
      void button.offsetWidth;
      button.classList.add("ripple");
      setTimeout(() => button.classList.remove("ripple"), 600);
    });
  });

  // Rotating live system messages.
  if (liveStatusText) {
    const statusMessages = [
      "Portals online · Audio ready · Glitch detected",
      "Focus charged · Scanner active · Echo connected",
      "Combo boost ready · Missions waiting",
      "Language Core unstable · Player needed"
    ];
    let statusIndex = 0;
    setInterval(() => {
      statusIndex = (statusIndex + 1) % statusMessages.length;
      liveStatusText.animate(
        [{opacity: 0, transform: "translateY(5px)"}, {opacity: 1, transform: "translateY(0)"}],
        {duration: 320, easing: "ease-out"}
      );
      liveStatusText.textContent = statusMessages[statusIndex];
    }, 3100);
  }


  document.addEventListener("click",e=>{
    const p=e.target.closest("[data-play]"),i=e.target.closest("[data-instructions]");
    if(p)openGame(p.dataset.play);if(i)openInfo(i.dataset.instructions);if(e.target.closest("[data-open-story]"))openInfo("story");if(e.target.closest("[data-close-dialog]"))modal.close();
  });
  modal.addEventListener("click",e=>{const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()});
  document.getElementById("game-back").onclick=closeGame;
  document.getElementById("game-help").onclick=()=>openInfo(state.currentGame);
  const briefing=document.getElementById("briefing");
  const introVideo=document.getElementById("intro-video");
  const introPlay=document.getElementById("intro-play");
  const introProgressBar=document.getElementById("intro-progress-bar");
  function closeBriefing(){
    introVideo.pause();
    briefing.classList.add("hidden");
    document.body.classList.remove("intro-open");
    tone("power");
  }
  introPlay.onclick=async()=>{
    introVideo.currentTime=0;
    introVideo.muted=false;
    try{
      await introVideo.play();
      briefing.classList.add("is-playing");
    }catch(error){
      showToast("Press play again to start the intro with sound.");
    }
  };
  introVideo.addEventListener("timeupdate",()=>{
    const progress=introVideo.duration?introVideo.currentTime/introVideo.duration:0;
    introProgressBar.style.transform=`scaleX(${Math.max(0,Math.min(1,progress))})`;
  });
  introVideo.addEventListener("ended",closeBriefing);
  introVideo.addEventListener("error",()=>showToast("The intro video could not be loaded. You can enter the game now."));
  document.getElementById("enter-world").onclick=closeBriefing;
  document.getElementById("skip-briefing").onclick=closeBriefing;
  document.getElementById("reset-progress").onclick=()=>{state.progress={sprint:false,detective:false,safari:false};state.rewards=[];localStorage.setItem("lexi-wow-rewards","[]");saveProgress();showToast("Progress reset.")};
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden&&!modal.open)closeGame()});
  updateSound();renderProgress();renderRewards();
})();
