/* Neighborhood systems. Pure simulation; UI and storage stay outside. */
(function(root){
'use strict';
let E;
const copy=x=>JSON.parse(JSON.stringify(x));
const active=t=>['waiting','eating'].includes(t.status);
const METHODS={boil:{name:'鲜切现涮',time:0,fee:0,markup:0},roast:{name:'先烤后涮',time:6,fee:2,markup:4},mini:{name:'迷你三拼',time:-3,fee:0,markup:-2}};
const SAUCES={oil:{name:'红油香碟',style:'social',fee:1},sesame:{name:'芝麻清香碟',style:'quiet',fee:1},citrus:{name:'柑橘清口碟',style:'student',fee:1}};
const CREW={sweet:{name:'小满',title:'嘴甜型',desc:'负责桌等餐耐心 +12 秒；熟练后会接老罗的面子局。',style:'social'},quick:{name:'阿川',title:'麻利型',desc:'负责桌用餐缩短 4 秒；熟练后会接赶电影局。',style:'rush'},careful:{name:'小穗',title:'细心型',desc:'生日压轴额外小费；熟练后会接生日与安静饭局。',style:'birthday'}};
const CHALLENGES=[
 {id:'clear',code:'JG-01-v1',name:'清汤也有江湖',desc:'三组客人，只用清汤类锅底，全部基本需求满足且餐食 80+。'},
 {id:'fifty',code:'JG-02-v1',name:'五十块的散伙饭',desc:'三位同学，餐费不超过 ¥50，至少四种食材、吃饱并和油碟完成合影。'},
 {id:'seats',code:'JG-03-v1',name:'四桌不够坐',desc:'六组同时到店，至少成功拼桌一次，90 秒内全部招待成功。'}
];
function ensure(s){
 s.city ||= {relationships:{},dishes:[],featured:null,researchDay:0,favors:[],crew:[],last:{state:'idle'},challengeBest:{}};
 const n=s.city;n.relationships ||= {};n.dishes ||= [];n.favors ||= [];n.crew ||= [];n.last ||= {state:'idle'};n.challengeBest ||= {};
 if(s.upgrades.staff&&!n.crew.length)n.crew.push({id:'sweet',xp:0,tables:[]});
 if(s.stats){s.stats.shared ||=0;s.stats.overtime ||=0;s.stats.lateServed ||=0;}
 return n;
}
function say(s,text){s.logs.unshift(text);s.logs=s.logs.slice(0,16);}
function unlocked(s){return !s.challenge;}
function guest(s,g,item){
 if(item?.guest)g=copy(item.guest);
 if(item?.requestDish){g.requestDish=item.requestDish;const d=ensure(s).dishes.find(d=>d.id===item.requestDish);if(d)g.quote='上次那个“'+d.name+'”还有没得？今天就为这口来的。';}
 if(item?.joint){g.joint=item.joint;g.quote='上回拼桌聊得投缘，这次我们约好一起来！';}
 if(item?.late){g.late=true;g.quote='嬢嬢，最后这锅给我们留一份！';}
 return g;
}
function dayGuests(s,ids){
 if((s.day===4||s.day>7&&s.day%3===1)&&!s.challenge){const i=ids.indexOf(2);if(i>=0){ids[i]=9;ids.splice(i+1,0,5);}}
 return ids;
}
function init(Eapi){
 E=Eapi;
 E.G.push({id:'master',name:'退休戏师傅',who:'严师傅',size:1,budget:75,patience:100,limit:100,tastes:['spicy'],meat:false,style:'social',quote:'愿意拼桌，碰到喜欢川剧的年轻人就多聊两句。',story:'师傅说，老街的好戏有人接着唱。',sprite:0});
}
function afterOpen(s){
 const n=ensure(s);n.last={state:'idle'};
 if(s.challenge){
  const g=i=>copy(E.G[i]);let guests;
  if(s.challenge.id==='clear')guests=[g(3),g(7),{...g(9),tastes:['clear']}];
  if(s.challenge.id==='fifty')guests=[{...g(5),budget:50,photoWish:true,quote:'五十块吃四样，吃完和油碟合个影，毕业也常来。'}];
  if(s.challenge.id==='seats')guests=[g(9),{...g(5),size:2},g(7),g(3),{...g(2),size:2},{...g(6),size:2}];
  s.tables=Array.from({length:4},(_,id)=>({id,status:'empty'}));s.nextGuest=0;s.stats.specialCount=0;
  s.schedule=guests.map((guest,i)=>({id:E.G.findIndex(g=>g.id===guest.id),guest,at:s.challenge.id==='seats'?0:i*18}));
  E.seat(s);return;
 }
 const teacher=s.schedule.findIndex(x=>x.id===9);if(teacher>=0&&s.schedule[teacher+1]?.id===5){s.schedule[teacher].at+=15;s.schedule[teacher].pairOffer=true;s.schedule[teacher+1].pairOffer=true;s.schedule[teacher+1].at=s.schedule[teacher].at+2;}
 let at=(s.schedule[s.schedule.length-1]?.at||0)+20;
 const add=(data)=>{s.schedule.push({...data,at});at+=20;};
 if(n.featured){const d=n.dishes.find(x=>x.id===n.featured);if(d&&s.day>d.day)add({id:d.taster==='solo'?3:d.taster==='student'?5:0,requestDish:d.id});}
 const rel=Object.values(n.relationships).find(r=>r.unlocked&&s.day>r.day&&r.lastBooking!==s.day);
 if(rel){const a=E.G.find(g=>g.id===rel.members[0]),b=E.G.find(g=>g.id===rel.members[1]);if(a&&b){const group=combine(a,b);group.id='friends-'+rel.key;group.name=rel.name+' · 联合预约';add({id:0,guest:group,joint:rel.key});rel.lastBooking=s.day;}}
 for(const f of n.favors.filter(f=>f.due<=s.day&&!f.delivered&&f.choice!=='decline')){
  f.delivered=true;
  if(f.id==='courier'){add({id:2,guest:{...copy(E.G[2]),id:'courier',name:'快递站同事来包桌',who:'快递小哥与同事',size:3,budget:120,quote:'嬢嬢上回热的那碗饭，今天带同事来还这份心意。'}});say(s,'人情回信：快递小哥带同事预约了一桌。');}
  if(f.id==='ice'){n.sweetHelp=(n.sweetHelp||0)+1;say(s,'冰粉摊送来一次生日助演：可给生日桌安排甜品惊喜。');}
 }
}
function seatAvailable(s,t){return !(t.id===0&&ensure(s).holdSeatUntil>s.elapsed);}
function onSeat(s,t,item){
 t.pairOffer=!!item?.pairOffer;if(t.pairOffer)t.message='愿意聊川剧的街坊来了，伙计留 18 秒给嬢嬢安排拼桌。';
 delete t.parties;delete t.shared;delete t.partnerBirthday;delete t.crewCharm;delete t.signature;
 const c=worker(s,t.id);if(c?.id==='sweet'){t.patience+=12;t.crewCharm=true;}
 if(item?.late){t.special=false;E.serve(s,t.id,copy(item.late));}
}
function clue(g){return {willing:g.style!=='quiet',interest:g.id==='master'||g.style==='student'?'川剧':g.style==='cat'?'猫咪':g.style==='rush'?'电影':'老街闲聊',note:g.style==='quiet'?'喜欢安静，不愿拼桌':g.style==='rush'?'愿意拼桌，但要赶电影':g.id==='master'?'愿意拼桌，想聊川剧':g.style==='student'?'愿意拼桌，对川剧感兴趣':'愿意拼桌，喜欢慢慢聊'};}
function pending(s){if(s.phase!=='service')return null;const item=s.schedule?.[s.nextGuest];return item&&item.at<=s.elapsed?{item,guest:guest(s,E.decorateGuest(s,copy(E.G[item.id])),item)}:null;}
function pairPreview(s,from,to){
 const a=s.tables[to],q=from==='queue'?pending(s):null,b=from==='queue'?q?.guest:s.tables[Number(from)]?.guest;
 const errors=[];if(!a||a.status!=='waiting'||a.parties)errors.push('接桌必须还没开锅，且未拼过桌');
 if(from!=='queue'&&(!s.tables[Number(from)]||s.tables[Number(from)].status!=='waiting'||s.tables[Number(from)].parties||Number(from)===to))errors.push('请选择另一组还没开锅的客人');
 if(!b)errors.push('这组客人还没到');
 if(!a||!b)return {errors};
 if(!clue(a.guest).willing||!clue(b).willing)errors.push('有客人不愿拼桌');
 if(a.guest.size+b.size>E.capacity(a.seat||E.seatType(s,to,s.tables.length)))errors.push('合起来坐不下，先考虑长桌');
 const clash=[a.guest,b].some(g=>g.style==='rush')&&[a.guest,b].some(g=>g.style==='social');
 const matched=clue(a.guest).interest===clue(b).interest;
 return {errors,clash,matched,delay:clash?8:0,group:combine(a.guest,b),description:clash?'聊天可能多耽误 8 秒；嬢嬢可花 ¥5 调解，缩到 2 秒':matched?'共同话题：'+clue(b).interest+'。吃满意后能解锁联合预约':'愿意同桌吃饭，招待满意后能留下邻里关系'};
}
function combine(a,b){
 const rush=[a,b].find(g=>g.style==='rush'),size=a.size+b.size;
 return {...copy(a),name:a.who+' × '+b.who,size,budget:Math.floor(Math.min(a.budget/a.size,b.budget/b.size)*size),patience:Math.min(a.patience,b.patience),limit:rush?rush.limit:Math.min(a.limit,b.limit),tastes:[...new Set([...a.tastes,...b.tastes])],meat:a.meat||b.meat,style:rush?'rush':a.style,quote:'拼桌一起吃：'+clue(a).note+'；'+clue(b).note};
}
function merge(s,from,to){
 if(s.phase!=='service')return '营业时再安排拼桌';const p=pairPreview(s,from,to);if(p.errors.length)return p.errors.join('，');
 const t=s.tables[to],other=from==='queue'?pending(s).guest:s.tables[Number(from)].guest;
 t.parties=[copy(t.guest),copy(other)];t.guest=p.group;t.shared={clash:p.clash,matched:p.matched,mediated:false};t.wait=Math.max(t.wait,from==='queue'?s.elapsed-s.schedule[s.nextGuest].at:s.tables[Number(from)].wait);t.patience=Math.min(t.patience,other.patience);t.special=true;t.mood+=(p.matched?4:p.clash?-4:1);
 if(from==='queue')s.nextGuest++;else{const src=s.tables[Number(from)];s.cats.forEach(c=>{if(c.table===src.id){c.table=null;c.remaining=0;c.cd=12;}});s.tables[src.id]={id:src.id,status:'empty',seat:src.seat};}
 t.cast=root.JianghuCustomers?root.JianghuCustomers.assign(t.guest,t.visit,[]):null;t.message='拼桌前先把两组需求照顾好。'+p.description;s.stats.shared++;say(s,'拼桌成功：'+t.guest.name+'，省下一张桌。');return null;
}
function mediate(s,id){const t=s.tables[id];if(!t?.shared?.clash||t.shared.mediated||t.status!=='waiting')return '这桌暂时不需要调解';if(s.cash<5)return '调解请茶需要 ¥5';s.cash-=5;s.stats.expense+=5;t.shared.mediated=true;t.mood+=4;say(s,'梅嬢嬢：“电影散场再摆龙门阵嘛！”聊天延时降到 2 秒。');return null;}
function research(s,input){
 const n=ensure(s);if(!unlocked(s)||s.phase!=='prep')return {error:'只在正常经营的开门前试锅'};if(n.researchDay===s.day)return {error:'今天试过锅了，明天再试'};
 const {base,method,sauce,taster}=input;if(!E.F[base]||E.F[base].day>s.day||!METHODS[method]||!SAUCES[sauce]||!['luo','solo','student'].includes(taster))return {error:'请选完整的研发组合'};
 if(method==='mini'&&!['tofu','mushroom','greens'].includes(base))return {error:'迷你三拼用豆腐、菌菇或莴笋作主角'};
 if(n.dishes.length>=9)return {error:'先把九道招牌经营好，研发本已经满啦'};
 if(s.cash<6||(s.stock[base]||0)<.5)return {error:'试锅需要 ¥6 和半份主食材'};
 s.cash-=6;s.stock[base]-=.5;n.researchDay=s.day;
 const ok=taster==='luo'?sauce==='oil':taster==='solo'?sauce==='sesame':method==='mini';
 const feedback=ok?'这味道有记忆点！起个名字，挂上招牌吧。':taster==='luo'?'老罗更喜欢红油香碟。明天换个蘸料再试。':taster==='solo'?'阿青想吃芝麻清香碟，太冲的味道不适合他。':'同学想尝迷你三拼，花样比排场重要。';
 n.lastResearch={day:s.day,ok,feedback};if(!ok)return {ok:false,feedback};
 const d={id:'dish-'+s.day,day:s.day,base,method,sauce,taster,name:METHODS[method].name+E.F[base].short,sold:0};n.dishes.push(d);n.featured=d.id;say(s,'研发新招牌：'+d.name);return {ok:true,dish:d,feedback};
}
function renameDish(s,id,name){const d=ensure(s).dishes.find(x=>x.id===id);const clean=String(name).trim().slice(0,12);if(!d||!clean)return '写一个 1—12 字的菜名';d.name=clean;return null;}
function feature(s,id){const n=ensure(s);if(!unlocked(s))return '挑战采用固定菜单';if(s.phase!=='prep')return '开门前换今日主打';if(id&&!n.dishes.some(d=>d.id===id))return '招牌不存在';n.featured=id||null;return null;}
function dishDescription(d){return METHODS[d.method].name+' · '+SAUCES[d.sauce].name+'；'+(d.method==='roast'?'用餐多 6 秒，售价多 ¥4':d.method==='mini'?'主菜换成菌菇、豆腐、莴笋各 0.35 份，快 3 秒':'沿用原菜节奏')+'；蘸料成本 ¥1';}
function worker(s,table){const n=ensure(s);if(!s.upgrades.staff||n.borrowUntil>s.elapsed)return null;return n.crew.find(c=>c.tables.includes(table))||n.crew[0]||null;}
function hire(s,id){const n=ensure(s);if(!unlocked(s)||s.phase==='service')return '开门前或收工后聘请伙计';if(!CREW[id]||n.crew.some(c=>c.id===id))return '这位伙计已经在店里';const cost=s.upgrades.staff?100:160;if(s.day<2||s.cash<cost)return '第二天起可以聘请，当前需要 ¥'+cost;s.cash-=cost;s.upgrades.staff=true;n.crew.push({id,xp:0,tables:[]});return null;}
function assign(s,id,table){const n=ensure(s);const c=n.crew.find(c=>c.id===id);if(!c||!Number.isInteger(table)||table<0||table>5)return '请选择伙计与桌号';n.crew.forEach(c=>c.tables=c.tables.filter(n=>n!==table));c.tables.push(table);const t=s.tables[table];if(t?.status==='waiting'&&id==='sweet'&&!t.crewCharm){t.patience+=12;t.crewCharm=true;}return null;}
function canAutoSpecial(s,t){const c=worker(s,t.id);return !!c&&c.xp>=3&&!t.parties&&(c.id==='quick'&&t.guest.style==='rush'||c.id==='sweet'&&t.guest.id==='luo'||c.id==='careful'&&['birthday','quiet'].includes(t.guest.style));}
function autoReady(s,t){return !!worker(s,t.id)&&!(t.pairOffer&&t.wait<18);}
function metrics(s,g,plan,m){
 const n=ensure(s),t=s.tables.find(t=>t.guest===g&&active(t));m.score=m.essentialOk?m.score:(m.potentialScore??m.score);
 const d=n.dishes.find(d=>d.id===plan.signature);
 if(plan.signature&&!d)m.errors.push('这道研发招牌已不可用，请重新选择');
 if(d){
  if(!m.rounds.flat().includes(d.base))m.errors.push('使用招牌前，先在上菜轮次加入'+E.F[d.base].name);
  else{
   let delta=0;const factor=m.small?.65:1;
   if(d.method==='mini'){
    m.use[d.base]-=factor;delta-=E.F[d.base].cost*factor;
    for(const id of ['mushroom','tofu','greens']){m.use[id]=(m.use[id]||0)+.35;delta+=E.F[id].cost*.35;}
    m.unique=Object.keys(m.use).filter(k=>m.use[k]>.001).length;
    const portions=Object.values(m.use).reduce((a,b)=>a+b,0),min=g.size>4?4:g.size===1?1.3:g.size===2?2:2.5;
    m.requirements.find(r=>r.label==='大家都吃得够').ok=portions>=min;
   }
   delta+=METHODS[d.method].fee+SAUCES[d.sauce].fee;m.cost+=delta;m.foodCost+=delta;m.duration=Math.max(8,m.duration+METHODS[d.method].time);m.price+=METHODS[d.method].markup;
   m.signature=d.id;m.reasons.push('本店招牌“'+d.name+'”：'+dishDescription(d));
   if(g.id===d.taster||g.style===SAUCES[d.sauce].style)m.score=Math.min(100,m.score+5);
   m.errors=m.errors.filter(x=>!x.includes('库存不足'));Object.entries(m.use).forEach(([id,num])=>{if((s.stock[id]||0)+.001<num)m.errors.push(E.F[id].name+'库存不足');});
  }
 }
 const c=t&&worker(s,t.id);if(c?.id==='quick'){m.duration=Math.max(8,m.duration-4);m.reasons.push('阿川负责这桌，上菜顺手，少等 4 秒');}
 if(t?.partnerBirthday){m.duration=Math.max(8,m.duration-6);m.reasons.push('冰粉摊搭把手，生日甜品另送，上菜少 6 秒');}
 if(t?.shared?.clash){const extra=t.shared.mediated?2:8;m.duration+=extra;m.reasons.push('拼桌聊天耽误 '+extra+' 秒');}
 if(g.late){m.price=Math.round(m.price*.75);m.reasons.push('最后一锅限量价 · 正常餐费 75%');}
 m.totalTime=(t?.wait||0)+m.duration;m.cost=Math.round(m.cost*100)/100;
 m.requirements=m.requirements.filter(r=>!r.label.startsWith('等餐与用餐'));
 if(g.style==='rush')m.requirements.push({label:'等餐与用餐合计不超过 '+g.limit+' 秒',ok:m.totalTime<=g.limit});
 if(g.requestDish)m.requirements.push({label:'端上预约的本店招牌',ok:m.signature===g.requestDish});
 if(t?.parties){m.requirements.push({label:'拼桌两组客人按人数分摊都不超预算',ok:t.parties.every(p=>m.price*p.size/g.size<=p.budget)});}
 m.errors=m.errors.filter(x=>x!=='超过整桌预算');if(m.price>g.budget)m.errors.push('超过整桌预算');
 m.essentialOk=m.requirements.every(r=>r.ok);if(!m.essentialOk)m.score=Math.min(69,m.score);
 return m;
}
function favorOffer(s){const n=ensure(s);if(!unlocked(s)||s.day<2)return null;const id=s.day%2?'courier':'ice';if(n.favors.some(f=>f.day===s.day))return null;return {id,name:id==='courier'?'小哥想热一热午饭':'冰粉摊想借个人',story:id==='courier'?'帮忙会占用一号桌 12 秒，消耗半份莴笋；或者花 ¥6 打包热汤。下个营业日，他会带三位同事来。':'借出跑堂 30 秒，期间员工停止接单；也可送一份糍粑。后天对门会帮一次生日惊喜。'};}
function favor(s,choice){const n=ensure(s),offer=favorOffer(s);if(!offer||!['prep','service'].includes(s.phase)||!['help','alternative','decline'].includes(choice))return '现在没有待办的人情请求';
 if(choice!=='decline'){
  if(offer.id==='courier'&&choice==='help'){if((s.stock.greens||0)<.5)return '需要半份莴笋';if(s.phase==='service'&&s.tables[0].status!=='empty')return '先给小哥腾出一号桌，或改送热汤';s.stock.greens-=.5;n.holdSeatUntil=(s.phase==='service'?s.elapsed:0)+12;if(s.stats&&s.phase==='service')s.stats.food+=2;}
  if(offer.id==='courier'&&choice==='alternative'){if(s.cash<6)return '热汤需要 ¥6';s.cash-=6;if(s.phase==='service')s.stats.expense+=6;}
  if(offer.id==='ice'&&choice==='help'){if(!s.upgrades.staff)return '还没聘跑堂，可以改送糍粑';n.borrowUntil=(s.phase==='service'?s.elapsed:0)+30;}
  if(offer.id==='ice'&&choice==='alternative'){if((s.stock.dessert||0)<1)return '需要一份糍粑';s.stock.dessert--;if(s.phase==='service')s.stats.food+=8;}
 }
 n.favors.push({id:offer.id,day:s.day,choice,due:s.day+(offer.id==='courier'?1:2),delivered:choice==='decline'});say(s,choice==='decline'?'今天忙不过来，和街坊说好了下次。':'人情记下了：'+offer.name+'，回报预约已写进账本。');return null;}
function birthdayHelp(s,id){const n=ensure(s),t=s.tables[id];if(!unlocked(s)||!n.sweetHelp||t?.status!=='waiting'||t.guest.style!=='birthday'||t.partnerBirthday)return '先选一桌待点单的生日客人';n.sweetHelp--;t.partnerBirthday=true;say(s,'对门准备好生日冰粉，嬢嬢专心开锅。');return null;}
function lateOptions(s){return [{id:'clear',name:'菌菇豆腐暖胃锅',plan:{pot:'single',broths:['clear'],rounds:[['mushroom'],['tofu']],choice:'late'}},{id:'beef',name:'肥牛收尾红汤锅',plan:{pot:'single',broths:['red'],rounds:[['mushroom'],['beef'],['tofu']],choice:'late'}}].map(x=>{const g=lateGuest(x.id);const m=E.metrics(s,g,x.plan);const max=Math.max(0,Math.min(3,...Object.entries(m.use).filter(x=>x[1]>0).map(([id,n])=>Math.floor((s.stock[id]||0)/n))));return {...x,m,max};});}
function lateGuest(id){return {...copy(E.G[7]),id:'late-'+id,name:id==='clear'?'清淡夜宵客':'收摊前吃肉客',who:'晚归街坊',style:'social',size:2,budget:70,patience:100,limit:100,tastes:[id==='clear'?'clear':'spicy'],meat:id==='beef',late:true};}
function late(s,id,count){const n=ensure(s);if(!unlocked(s)||n.last.state!=='offered')return '最后一锅还没到开售时段';if(id==='skip'){n.last.state='skipped';return null;}if(s.tables.some(t=>t.status!=='empty'))return '先把在座客人招待完、收好台，再开最后一锅';const opt=lateOptions(s).find(x=>x.id===id);if(!opt||![1,2,3].includes(count)||count>opt.max||opt.m.errors.length||s.cash<opt.m.potCost*count)return '库存或现金不够，减一份试试';n.last={state:'running',kind:id,count};s.stats.overtime+=count*6;for(let i=0;i<count;i++)s.schedule.push({id:7,guest:lateGuest(id),at:s.elapsed+i*12,late:copy(opt.plan)});say(s,'梅嬢嬢：“还有 '+count+' 份，吃完我就收摊！”加班工钱 ¥'+count*6);return null;}
function tick(s){
 const n=ensure(s);if(s.challenge)return;
 if(s.day>=3&&n.last.state==='idle'&&!s.closing&&s.nextGuest>=s.schedule.length&&s.tables.every(t=>t.status==='empty')){n.last={state:'offered',until:s.elapsed+18};say(s,'最后一锅？18 秒内决定要不要用余料留一盏灯。');}
 if(n.last.state==='offered'&&s.elapsed>=n.last.until)n.last.state='skipped';
}
function canClose(s){if(s.challenge)return true;const n=ensure(s);if(s.day<3||s.closing)return true;if(n.last.state==='idle'){tick(s);return false;}return n.last.state!=='offered';}
function wages(s){return (s.stats.overtime||0)+Math.max(0,ensure(s).crew.length-1)*16;}
function finish(s,t){
 const n=ensure(s),r=s.stats.records[s.stats.records.length-1],c=worker(s,t.id);
 if(t.partnerBirthday)t.wishes.birthday=true;
 if(c&&r.essentialOk){c.xp++;r.reasons.push(CREW[c.id].name+'熟练度 +1（'+c.xp+'/3）');if(c.id==='careful'&&t.wishes.birthday){s.cash+=4;s.stats.tips+=4;r.tips+=4;}}
 if(t.partnerBirthday){r.wishes.birthday=true;r.reasons.push('对门冰粉摊完成了生日惊喜');r.quote='这份冰粉是整条街一起藏的惊喜。';}
 if(t.m.signature){const d=n.dishes.find(d=>d.id===t.m.signature);if(d){d.sold++;r.signature=d.name;r.reasons.push('吃到了本店招牌“'+d.name+'”');if(r.essentialOk)r.quote='“'+d.name+'”记住了，下次还点这个！';}}
 if(t.parties){for(const p of t.parties.slice(1)){const reg=s.regulars[p.id]||{visits:0,best:0,name:p.who};reg.visits++;reg.best=Math.max(reg.best,r.score);reg.memory='在本店拼桌认识了新饭搭子：'+t.guest.name;reg.returnInterest=(reg.returnInterest||0)+(r.essentialOk?2:0);s.regulars[p.id]=reg;}r.parties=t.parties.map(p=>p.name);s.stats.served+=t.parties.length-1;const key=t.parties.map(p=>p.id).sort().join('+');
  if(r.essentialOk&&r.score>=80&&(!t.shared.clash||t.shared.mediated)){const known=n.relationships[key];if(!known){const name=key.includes('master')&&key.includes('student')?'一老一少的川剧约':'拼桌结识的老街饭搭子';n.relationships[key]={key,name,members:t.parties.map(p=>p.id),day:s.day,unlocked:true};s.stats.storyRewards.push(name+'：明天起会一起预约。');say(s,name+'，新关系已写入街坊簿。');}r.relationship=key;}
  else r.reasons.push('这回没聊成，下次可换一组，或先请嬢嬢调解。');
 }
 if(t.guest.late){s.stats.lateServed++;r.reasons.push('最后一锅，给晚归街坊留口热的。');}
 if(s.regulars[t.guest.id])s.regulars[t.guest.id].memory=r.quote;
}
function next(s){const n=ensure(s);n.holdSeatUntil=0;n.borrowUntil=0;n.last={state:'idle'};}
function createChallenge(id){if(!CHALLENGES.some(c=>c.id===id))return null;const s=E.fresh();s.day=6;s.cash=400;s.mode='warm';s.challenge={...copy(CHALLENGES.find(c=>c.id===id)),version:1};s.upgrades={};Object.keys(s.stock).forEach(k=>s.stock[k]=8);return s;}
function challengeGoal(s){const r=s.stats.records,good=r.filter(x=>x.essentialOk&&x.score>=80);if(s.stats.lost)return false;switch(s.challenge.id){case'clear':return good.length===3&&r.every(x=>x.broths?.every(b=>E.B[b].taste==='clear'));case'fifty':return r.length===1&&r[0].essentialOk&&r[0].price<=50&&r[0].unique>=4&&r[0].wishes.photo;case'seats':return s.stats.served===6&&r.every(x=>x.essentialOk)&&s.stats.shared>=1&&s.elapsed<=90;}}
function startChallenge(career,id){if(career.challenge)return null;const s=createChallenge(id);if(s)s.careerSave=E.serialize(career);return s;}
function resumeCareer(s){if(!s.challenge||!s.careerSave)return null;const career=E.restore(s.careerSave);if(!career||career.challenge)return null;if(s.phase==='settlement'){const n=ensure(career),old=n.challengeBest[s.challenge.id];const result={code:s.challenge.code,won:!!s.stats.goal,seconds:Math.ceil(s.elapsed),served:s.stats.served,shared:s.stats.shared};if(!old||result.won&&!old.won||result.won===old.won&&result.seconds<old.seconds)n.challengeBest[s.challenge.id]=result;}return career;}
const publicAPI={METHODS,SAUCES,CREW,CHALLENGES,pairPreview,merge,mediate,research,renameDish,feature,dishDescription,hire,assign,worker,favorOffer,favor,birthdayHelp,lateOptions,late,createChallenge,startChallenge,resumeCareer,clue,pending};
const api={init,ensure,guest,dayGuests,afterOpen,seatAvailable,onSeat,metrics,autoReady,canAutoSpecial,tick,canClose,wages,finish,next,challengeGoal,publicAPI};root.JianghuNeighborhood=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
