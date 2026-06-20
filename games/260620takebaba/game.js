let questions=[];

let player=[];
let cpu=[];
let deck=[];

let currentTurn="player";

let selectedCard=null;

let slotA=null;
let slotB=null;

const statusBox =
document.getElementById("status");

const playerHand =
document.getElementById("playerHand");

const cpuHand =
document.getElementById("cpuHand");

const previewBox =
document.getElementById("previewBox");

const questionBox =
document.getElementById("questionBox");

const turnBox =
document.getElementById("turnBox");

async function init(){

 try{

   const res =
   await fetch("./takken_v03_questions.json");

   questions =
   await res.json();

   alert(
     "JSON読込成功\n"+
     questions.length+
     "問"
   );

   startGame();

 }
 catch(e){

   alert(
    "JSON読込失敗\n\n"+
    e.message
   );

   statusBox.textContent=
   "JSON読込失敗";

 }

}

function startGame(){

 createDeck();

 dealCards();

 render();

}

function shuffle(arr){

 for(
   let i=arr.length-1;
   i>0;
   i--
 ){

   const j=
   Math.floor(
     Math.random()*(i+1)
   );

   [arr[i],arr[j]]
   =
   [arr[j],arr[i]];

 }

}

function createDeck(){

 deck=[];

 const picked=
 [...questions];

 shuffle(picked);

 const use=
 picked.slice(0,26);

 for(let i=0;i<13;i++){

   deck.push({
     suit:"♣",
     q:use[i]
   });

   deck.push({
     suit:"♠",
     q:use[i]
   });

 }

 for(let i=13;i<26;i++){

   deck.push({
     suit:"♥",
     q:use[i]
   });

   deck.push({
     suit:"♦",
     q:use[i]
   });

 }

 shuffle(deck);

}

function dealCards(){

 player=[];
 cpu=[];

 while(deck.length){

   if(deck.length)
     player.push(deck.pop());

   if(deck.length)
     cpu.push(deck.pop());

 }

}

function render(){

 renderCpu();

 renderPlayer();

 turnBox.textContent=
 currentTurn==="player"
 ? "あなたのターン"
 : "CPUのターン";

 statusBox.textContent=
 あなた:${player.length}枚 / CPU:${cpu.length}枚;

}

function renderCpu(){

 cpuHand.innerHTML="";

 cpu.forEach((card,index)=>{

   const wrap=
   document.createElement("div");

   wrap.innerHTML=
   cardHtml(card);

   wrap.onmouseenter=
   ()=>showPreview(card);

   wrap.onclick=
   ()=>drawFromCpu(index);

   cpuHand.appendChild(wrap);

 });

}

function renderPlayer(){

 playerHand.innerHTML="";

 player.forEach((card,index)=>{

   const wrap=
   document.createElement("div");

   wrap.innerHTML=
   cardHtml(card);

   const dom=
   wrap.firstElementChild;

   dom.draggable=true;

   dom.dataset.index=index;

   dom.addEventListener(
     "dragstart",
     dragStart
   );

   wrap.onmouseenter=
   ()=>showPreview(card);

   playerHand.appendChild(wrap);

 });

}

function cardHtml(card){

 const red=
 card.suit==="♥" ||
 card.suit==="♦";

 return 

<div class="
card
${red?"red":""}
">

<div class="top">
${card.suit}${card.q.id}
</div>

<div class="center">
宅建
</div>

<div class="bottom">
${card.q.id}${card.suit}
</div>

</div>

;

}

function showPreview(card){

 if(
   card.suit==="♣" ||
   card.suit==="♥"
 ){

   previewBox.innerHTML=

<h3>
問題${card.q.id}
</h3>

<p>
${card.q.question}
</p>

;

 }else{

   previewBox.innerHTML=

<h3>
選択肢
</h3>

<p>① ${card.q.choices[0]}</p>
<p>② ${card.q.choices[1]}</p>
<p>③ ${card.q.choices[2]}</p>
<p>④ ${card.q.choices[3]}</p>

;

 }

}

function drawFromCpu(index){

 if(
   currentTurn!=="player"
 ) return;

 player.push(
   cpu.splice(index,1)[0]
 );

 currentTurn="pair";

 turnBox.textContent=
 "ペアを作ってください";

 render();

}

function dragStart(e){

 selectedCard=
 Number(
   e.target.dataset.index
 );

}
// ===== 場 =====

const zoneA =
document.getElementById("slotA");

const zoneB =
document.getElementById("slotB");

zoneA.addEventListener(
 "dragover",
 e=>e.preventDefault()
);

zoneB.addEventListener(
 "dragover",
 e=>e.preventDefault()
);

zoneA.addEventListener(
 "drop",
 ()=>dropCard("A")
);

zoneB.addEventListener(
 "drop",
 ()=>dropCard("B")
);

function dropCard(slot){

 if(currentTurn!=="pair")
 return;

 if(selectedCard===null)
 return;

 const card=
 player[selectedCard];

 if(slot==="A"){

   slotA=selectedCard;

   zoneA.innerHTML=
   cardHtml(card);

 }

 if(slot==="B"){

   slotB=selectedCard;

   zoneB.innerHTML=
   cardHtml(card);

 }

 selectedCard=null;

 if(
   slotA!==null &&
   slotB!==null
 ){

   checkPair();

 }

}

// ===== ペア判定 =====

function checkPair(){

 const cardA=
 player[slotA];

 const cardB=
 player[slotB];

 if(
   !isPair(cardA,cardB)
 ){

   questionBox.innerHTML=
   "<h2>ペアではありません</h2>";

   resetBoard();

   return;
 }

 showQuestion(
   cardA.q,
   slotA,
   slotB
 );

}

function isPair(a,b){

 if(a.q.id!==b.q.id)
 return false;

 return (

   (
     a.suit==="♣" &&
     b.suit==="♠"
   )

   ||

   (
     a.suit==="♠" &&
     b.suit==="♣"
   )

   ||

   (
     a.suit==="♥" &&
     b.suit==="♦"
   )

   ||

   (
     a.suit==="♦" &&
     b.suit==="♥"
   )

 );

}

// ===== 問題 =====

function showQuestion(
 q,
 idxA,
 idxB
){

 let html=

<h2>
問題${q.id}
</h2>

<p>
${q.question}
</p>

;

 q.choices.forEach(
 (c,i)=>{

 html+=

<button
onclick="
answerQuestion(
${i+1},
${idxA},
${idxB},
${q.answer}
)
">

${i+1}
.
${c}

</button>

;

 });

 questionBox.innerHTML=
 html;

}

function answerQuestion(
 answer,
 idxA,
 idxB,
 correct
){

 if(answer===correct){

   removePair(
    idxA,
    idxB
   );

   questionBox.innerHTML=
   "<h2>〇 正解！</h2>";

 }
 else{

   questionBox.innerHTML=
   "<h2>✕ 不正解！</h2>";

 }

 resetBoard();

 setTimeout(
  cpuTurn,
  1000
 );

}

// ===== ペア削除 =====

function removePair(a,b){

 const max=
 Math.max(a,b);

 const min=
 Math.min(a,b);

 player.splice(max,1);
 player.splice(min,1);

 render();

}

// ===== 場リセット =====

function resetBoard(){

 slotA=null;
 slotB=null;

 zoneA.innerHTML=
 "カード①";

 zoneB.innerHTML=
 "カード②";

 render();

}

// ===== CPU =====

function cpuTurn(){

 currentTurn="cpu";

 render();

 setTimeout(()=>{

   cpuAutoPlay();

   currentTurn=
   "player";

   render();

   checkWin();

 },1000);

}

function cpuAutoPlay(){

 let removed=true;

 while(removed){

   removed=false;

   for(
     let i=0;
     i<cpu.length;
     i++
   ){

     for(
       let j=i+1;
       j<cpu.length;
       j++
     ){

       if(
        isPair(
         cpu[i],
         cpu[j]
        )
       ){

         cpu.splice(j,1);
         cpu.splice(i,1);

         removed=true;

         break;

       }

     }

     if(removed)
     break;

   }

 }

}

// ===== 勝敗 =====

function checkWin(){

 const result=
 document.getElementById(
 "resultBox"
 );

 if(player.length===0){

   result.innerHTML=
   "あなたの勝ち！";

   currentTurn="end";

 }

 if(cpu.length===0){

   result.innerHTML=
   "CPUの勝ち！";

   currentTurn="end";

 }

}

// ===== 開始 =====

init();