/* 一锅江湖 — deterministic, dependency-free simulation. */
(function(root){
'use strict';
const C=root.JianghuCustomers||(typeof module!=='undefined'?require('./customers.js'):null);
const F={
 mushroom:{name:'山珍菌菇',short:'菌菇',icon:'🍄',cost:6,price:14,kind:'fresh',day:1,desc:'鲜味 +2 · 先下更香'},
 beef:{name:'卷卷肥牛',short:'肥牛',icon:'🥩',cost:12,price:28,kind:'rich',day:1,desc:'浓度 +2 · 吃肉党的心头好'},
 tofu:{name:'吸汁豆腐',short:'豆腐',icon:'◧',cost:5,price:12,kind:'absorb',day:1,desc:'吸收鲜味与浓香 · 适合收尾'},
 greens:{name:'清口莴笋',short:'莴笋',icon:'🥬',cost:4,price:9,kind:'light',day:1,desc:'浓度 −1 · 清爽解腻'},
 balls:{name:'弹弹虾丸',short:'虾丸',icon:'🍡',cost:10,price:24,kind:'protein',day:2,desc:'在鲜汤里更好吃'},
 dessert:{name:'红糖糍粑',short:'糍粑',icon:'🍮',cost:8,price:18,kind:'sweet',day:2,desc:'生日局的压轴惊喜'},
 potato:{name:'薄切土豆',short:'土豆',icon:'🥔',cost:4,price:10,kind:'absorb',day:3,desc:'低价吸味 · 学生局很喜欢'},
 blood:{name:'嫩鸭血',short:'鸭血',icon:'▰',cost:7,price:16,kind:'rich',day:4,desc:'浓度 +2 · 实惠的浓香选择'}
};
const B={red:{name:'牛油红汤',color:'#ba4934',taste:'spicy',fresh:0,rich:1,day:1},clear:{name:'清爽骨汤',color:'#f0d99c',taste:'clear',fresh:1,rich:0,day:1},mushroom:{name:'山珍菌汤',color:'#aaba82',taste:'clear',fresh:2,rich:0,day:2},tomato:{name:'酸甜番茄',color:'#e79954',taste:'clear',fresh:1,rich:0,day:4}};
const P={single:{name:'单锅',n:1,cost:4,price:10,prep:3,day:1,desc:'备锅快 · 同口味更划算'},dual:{name:'鸳鸯锅',n:2,cost:10,price:20,prep:7,day:1,desc:'红白分区 · 照顾不同口味'},four:{name:'四格锅',n:4,cost:18,price:34,prep:12,day:5,desc:'四种风味 · 备锅稍慢'}};
const G=[
 {id:'luo',name:'老罗的嘴硬局',who:'老罗',size:2,budget:100,patience:65,limit:60,tastes:['spicy','clear'],meat:true,quote:'我当然能吃辣……也留一半清汤嘛。',story:'给老罗留一半清汤，是我们心照不宣的默契。',style:'social',sprite:0},
 {id:'movie',name:'赶电影的朋友',who:'小林与朋友',size:4,budget:145,patience:45,limit:38,tastes:['spicy','clear'],meat:true,quote:'一半要辣、一半清淡。电影快开场啦！',story:'电影前也能吃好一锅，下次还约这里。',style:'rush',sprite:0},
 {id:'aunt',name:'街坊慢悠悠',who:'陈嬢嬢',size:3,budget:130,patience:90,limit:90,tastes:['spicy'],meat:false,quote:'先烫点菌菇，最后那口豆腐才入味。',story:'陈嬢嬢说，这锅汤有老街的味道。',style:'social',sprite:1},
 {id:'solo',name:'一人食也巴适',who:'阿青',size:1,budget:65,patience:80,limit:80,tastes:['clear'],meat:false,quote:'少量多样，坐安静点。猫可以过来。',story:'阿青有了自己的靠窗老位置。',style:'quiet',sprite:0},
 {id:'birthday',name:'嬢嬢生日局',who:'张嬢嬢一家',size:4,budget:160,patience:90,limit:90,tastes:['spicy','clear'],meat:true,quote:'最后悄悄端份糍粑，今天她过生日。',story:'那份压轴糍粑，成了全家记得的生日惊喜。',style:'birthday',sprite:1},
 {id:'student',name:'大学生抢锅局',who:'山城同学会',size:3,budget:88,patience:85,limit:85,tastes:['spicy','clear'],meat:false,quote:'预算不多，想尝四样！小份也可以。',story:'同学们给店里画了一张手写招牌。',style:'student',sprite:0},
 {id:'visitor',name:'千里赶锅游客',who:'外地吃货团',size:4,budget:170,patience:70,limit:85,tastes:['spicy','clear'],meat:true,quote:'坐了好久的车，就是想吃这口山城味。',story:'一张热腾腾的小票，带着山城的记忆。',style:'social',sprite:1},
 {id:'catfan',name:'猫掌柜粉丝团',who:'油碟后援会',size:2,budget:110,patience:80,limit:80,tastes:['clear'],meat:false,quote:'猫猫营业吗？吃完还想摸摸小肚皮。',story:'油碟把小爪子搭上来，大家都舍不得走。',style:'cat',sprite:1}
];
const EVENTS=[
 {name:'四张桌，开锅啦',kicker:'街坊新店 · 第一回',story:'包租婆梅嬢嬢收起租本，拿起汤勺：“房租可以晚点交，火锅必须趁热吃！”先把第一批街坊招呼好。',modes:[['warm','街坊慢慢吃','每桌耐心 +15 秒'],['quick','开张快涮局','每桌用餐 −4 秒']],goal:'完成 3 桌，至少 2 桌评价 80+',reward:80,badge:'第一锅人情',source:'原创开张事件'},
 {name:'猫掌柜上热榜',kicker:'毛茸茸的流量 · 第二回',story:'油碟趴在收银台打哈欠的视频火了。粉丝说：老板可以不在，猫掌柜必须在！',modes:[['appointment','预约撸猫','粉丝预约；猫咪互动额外 +3 评价'],['busy','敞开门迎客','多来 2 桌粉丝，收入机会更多']],goal:'让 3 桌客人撸到猫，完成 3 桌好评',reward:100,badge:'猫掌柜认证',source:'宠物友好消费报道，2025'},
 {name:'全城来赶锅',kicker:'山城出圈 · 第三回',story:'一段茶壶屋冒汽的视频把游客带到了这条坡坡路。流量来了，锅底和备货接得住吗？',modes:[['steady','分时预约','按预约慢慢来；完成 4 桌好评'],['busy','加开热闹场','加来 2 桌；完成 5 桌好评，奖金 +60']],goal:'接住客流，让游客带着好评离开',reward:140,badge:'山城必吃一锅',source:'淄博烧烤、天水麻辣烫出圈报道，2023—2024'},
 {name:'锅边有好戏',kicker:'川剧变脸之夜 · 第四回',story:'变脸师傅踩着鼓点登台，包租婆在台下挥汤勺打拍子。有人爱热闹，也有人只想安静吃饭。',modes:[['stage','热闹堂会','表演对热闹桌效果翻倍，安静桌 −6 评价'],['quiet','雅座小戏','隔开热闹与安静桌；所有人都能自在看戏']],goal:'表演命中至少 2 拍，完成 3 桌好评',reward:130,badge:'满堂彩',source:'餐饮情绪价值与表演服务热议；川剧为原创改编'},
 {name:'高校抢锅夜',kicker:'为一口手艺跑半座城 · 第五回',story:'三个学校的同学都来问：“梅嬢嬢，今晚在哪边开锅？”钱不多、胃口大、花样还想多一点。',modes:[['small','学生小份局','小份售价与用料 65%；学生多样奖励 +8'],['classic','招牌拼盘局','学生整桌预算 +25；更适合大份分享']],goal:'招待 3 桌学生，每桌至少尝 4 种食材',reward:120,badge:'大学生的食堂',source:'“鹅腿阿姨”受到高校学生欢迎的报道，2023'},
 {name:'一个人，也好好吃',kicker:'小份大满足 · 第六回',story:'老街发起“一人食地图”。阿青把你的店画进地图，还画上了蜷在椅子边的猫。',modes:[['small','半份百味','小份拼出更多花样；少量多样奖励 +8'],['calm','安静猫猫席','安静客人评价 +6；撸猫耐心额外 +8 秒']],goal:'完成 3 桌独食好评，不超预算',reward:130,badge:'一人食老地方',source:'重庆餐厅小份菜、半份菜实践报道，2020'},
 {name:'一街人，开锅节',kicker:'七日终章 · 老街的饭局',story:'老罗、阿青、同学们和三位猫掌柜都来了。师傅换好戏服，锅里的汤也熬好了。这条街，终于被你养熟了。',modes:[['feast','热热闹闹过节','多 2 桌街坊，完成 6 桌好评'],['family','熟客团圆饭','完成 5 桌好评，给 3 桌安排撸猫']],goal:'用招牌锅与猫咪，招待一路认识的人',reward:200,badge:'一锅江湖',source:'原创终章，由前六天关系和经营结果汇合'}
];
const UP={staff:{name:'聘请跑堂小满',cost:160,day:2,desc:'等待 8 秒后，按保存套餐自动接单；工钱 20 / 天'},station:{name:'添一张备菜台',cost:120,day:2,desc:'每桌备锅 −3 秒、每轮上菜 −2 秒'},cat:{name:'猫猫靠窗软垫',cost:90,day:2,desc:'撸猫额外 +3 评价，猫咪恢复更快'},tables:{name:'扩成六张桌',cost:240,day:4,desc:'增加 2 桌；大客流更从容'}};
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function baseFresh(){return {version:1,day:1,phase:'prep',cash:420,rep:35,stock:{mushroom:8,beef:8,tofu:8,greens:8,balls:0,dessert:0,potato:0,blood:0},upgrades:{},cats:[{name:'油碟',bond:0,cd:0},{name:'糍粑',bond:0,cd:0},{name:'煤球',bond:0,cd:0}],regulars:{},recipes:[],badges:[],history:[],tables:[],elapsed:0,mode:'warm',muted:false,stats:null,logs:[],finished:false};}
function log(s,message){s.logs.unshift(message);s.logs=s.logs.slice(0,16);}
function baseEvent(s){return EVENTS[Math.min(6,s.day-1)];}
function unlocked(s){return Object.keys(F).filter(id=>F[id].day<=s.day);}
function baseDayGuests(s){let ids=[[0,2,1,3],[7,4,0,7,2],[6,1,6,2,6,3],[4,3,2,0,7,1],[5,5,3,5,0,2],[3,3,7,3,4,2],[0,3,5,4,7,6,2,1]][Math.min(6,s.day-1)].slice();if(['busy','feast'].includes(s.mode))ids.push(s.day===2?7:6,s.day===2?7:6);return ids;}
function baseOpen(s){if(s.phase!=='prep')return false;let ids=dayGuests(s);s.phase='service';s.elapsed=0;s.nextGuest=0;s.schedule=ids.map((id,i)=>({id,at:i===0?0:14+i*15}));s.tables=Array.from({length:s.upgrades.tables?6:4},(_,i)=>({id:i,status:'empty'}));s.stats={revenue:0,tips:0,food:0,pots:0,expense:0,served:0,lost:0,pets:0,petTables:[],records:[],showHits:0,showDone:false,reward:0,startCash:s.cash,goal:false};s.closing=false;log(s,`第 ${s.day} 天开门：${event(s).name}`);seat(s);return true;}
function baseMetrics(s,g,plan){let errors=[];const pot=P[plan.pot];if(!pot)return {errors:['请选择锅型']};if(pot.day>s.day)errors.push('锅型还未解锁');let broths=(plan.broths||[]).slice(0,pot.n);if(broths.length!==pot.n||broths.some(id=>!B[id]||B[id].day>s.day))errors.push('请选择已解锁的锅底');let rounds=(plan.rounds||[]).filter(r=>r.length);let foods=rounds.flat();if(!foods.length)errors.push('至少安排一道菜');if(rounds.length>3||rounds.some(r=>r.length>2))errors.push('最多三轮，每轮两盘');if(foods.some(id=>!F[id]||F[id].day>s.day))return {errors:['食材还未解锁']};const small=!!plan.small&&s.day>=3;const factor=small?.65:1;const use={};foods.forEach(id=>use[id]=(use[id]||0)+factor);Object.entries(use).forEach(([id,n])=>{if((s.stock[id]||0)+.001<n)errors.push(F[id].name+'库存不足');});const price=pot.price+Math.round(foods.reduce((a,id)=>a+F[id].price*factor,0));const cost=pot.cost+foods.reduce((a,id)=>a+F[id].cost*factor,0);if(price>g.budget)errors.push('超过整桌预算');if(s.cash<pot.cost)errors.push('现金不足以准备锅底');let coverage=g.tastes.filter(t=>broths.some(id=>B[id]?.taste===t)).length/g.tastes.length;
 let score=46+Math.round(coverage*20);let reasons=[coverage===1?'锅底照顾了每种口味':'有客人没有合适的锅底'];if(coverage<1)score-=10;const unique=new Set(foods).size;const portions=foods.length*factor;let min=g.size===1?1.3:g.size===2?2:2.5;if(portions>=min){score+=8;reasons.push('份量合适');}else{score-=10;reasons.push('份量偏少');}if(g.meat){if(foods.some(id=>['beef','blood'].includes(id))){score+=8;reasons.push('吃肉的愿望满足了');}else{score-=9;reasons.push('想吃肉的客人有点遗憾');}}
 let f=Math.max(0,...broths.map(id=>B[id]?.fresh||0)),r=Math.max(0,...broths.map(id=>B[id]?.rich||0)),sequence=0,states=[];
 rounds.forEach((round,i)=>{let gain=0;round.forEach(id=>{let kind=F[id].kind;if(kind==='absorb')gain+=Math.min(7,f+r);if(['rich','protein'].includes(kind)&&f>=2)gain+=3;if(kind==='sweet'&&i===rounds.length-1&&g.style==='birthday')gain+=10;});sequence+=gain;round.forEach(id=>{let kind=F[id].kind;if(kind==='fresh')f=clamp(f+2,0,3);if(kind==='rich')r=clamp(r+2,0,3);if(kind==='light')r=clamp(r-1,0,3);});states.push({fresh:f,rich:r,gain});});score+=Math.min(16,sequence);if(sequence>=7)reasons.push('先养汤再吸味，顺序很妙');if(g.style==='birthday'&&foods[foods.length-1]==='dessert')reasons.push('压轴糍粑，生日惊喜');if(g.style==='student'&&unique>=4){score+=8;reasons.push('学生吃到了四种花样');}if(g.style==='quiet'&&small){score+=6;reasons.push('小份多样，一个人刚刚好');}if(s.mode==='small'&&small&&unique>=3)score+=8;if(s.mode==='calm'&&g.style==='quiet')score+=6;if(s.badges.includes('一人食老地方')&&g.style==='quiet')score+=3;
 const perRound=Math.max(8,13-(s.upgrades.station?2:0));const duration=Math.max(1,pot.prep-(s.upgrades.station?3:0))+rounds.length*perRound-(s.mode==='quick'?4:0);if(duration>g.limit){score-=15;reasons.push('轮次太多，可能耽误行程');}else if(g.style==='rush'){score+=5;reasons.push('两轮快涮，赶得上电影');}return {errors,price,cost:Math.round(cost*10)/10,use,rounds,broths,coverage,score:clamp(Math.round(score),0,100),reasons,states,duration,perRound,unique,small};}
function baseServe(s,id,plan){let t=s.tables[id];if(!t||t.status!=='waiting')return {errors:['这桌现在不需要点单']};let m=metrics(s,t.guest,plan);if(m.errors.length)return m;Object.entries(m.use).forEach(([k,n])=>s.stock[k]=Math.round((s.stock[k]-n)*100)/100);s.cash-=P[plan.pot].cost;s.stats.pots+=P[plan.pot].cost;s.stats.food+=m.cost-P[plan.pot].cost;t.status='eating';t.plan=clone(plan);t.m=m;const waitPenalty=t.wait>25?Math.floor((t.wait-25)/6):0;t.score=clamp(m.score+t.petBonus-waitPenalty,0,100);if(waitPenalty>0)m.reasons.push('等位较久，评价 −'+waitPenalty);t.progress=0;t.round=-1;t.added=false;t.addOffer=false;t.message='锅底备好，马上开涮！';log(s,`${id+1} 桌开锅：${P[plan.pot].name} · ¥${m.price}`);return m;}
function baseDefaultPlan(s,g){const pot=g.tastes.length>1?'dual':'single';let broths=pot==='dual'?['red',s.day>=2?'mushroom':'clear']:[g.tastes[0]==='spicy'?'red':s.day>=2?'mushroom':'clear'];if(g.style==='rush')return {pot,broths,rounds:[['mushroom','greens'],['beef','tofu']],small:false};if(g.style==='quiet')return {pot,broths,rounds:[['mushroom'],['tofu','greens']],small:s.day>=3};if(g.style==='student')return {pot,broths,rounds:[['mushroom','greens'],['tofu','potato']],small:s.day>=3};return {pot,broths,rounds:[['mushroom'],[g.meat?'beef':'greens'],[g.style==='birthday'?'dessert':'tofu']],small:false};}
function baseAutoServe(s,t){let candidates=s.recipes.map(r=>r.plan).concat([defaultPlan(s,t.guest)]);let suitable=candidates.map(plan=>({plan,m:metrics(s,t.guest,plan)})).filter(x=>!x.m.errors.length).sort((a,b)=>b.m.score-a.m.score);if(suitable.length){t.stockIssue=false;serve(s,t.id,suitable[0].plan);log(s,`小满照菜单接好了 ${t.id+1} 桌`);}else{let errors=candidates.flatMap(plan=>metrics(s,t.guest,plan).errors);let missing=[...new Set(errors.filter(e=>e.includes('库存不足')))];t.stockIssue=missing.length>0;t.message=missing.length?'小满：'+missing.join('、')+'，先补一点菜嘛。':'小满：现有套餐不适合这桌，请嬢嬢亲自配锅。';}}
function baseFinish(s,t){const score=clamp(Math.round(t.score),0,100);let tips=score>=80?Math.floor(t.m.price*(score-70)/150):0;let revenue=t.m.price+tips;s.cash+=revenue;s.stats.revenue+=t.m.price;s.stats.tips+=tips;s.stats.served++;s.rep=clamp(s.rep+(score>=80?3:score>=60?1:-3),0,100);let record={guest:t.guest.name,id:t.guest.id,style:t.guest.style,score,price:t.m.price,tips,rounds:clone(t.m.rounds),pot:t.plan.pot,small:t.m.small,unique:t.m.unique,pets:t.petCount,reasons:t.m.reasons.concat(t.petCount?['猫咪陪伴 '+t.petCount+' 回，心情变好了']:[]),quote:score>=80?(t.petCount?'锅巴适，猫也巴适！':t.guest.story):'下次再把口味和时间照顾一下嘛。'};s.stats.records.push(record);let prev=s.regulars[t.guest.id]||{visits:0,best:0,name:t.guest.who};prev.visits++;prev.best=Math.max(prev.best,score);prev.memory=record.quote;s.regulars[t.guest.id]=prev;t.status='dirty';t.cleanTime=s.upgrades.staff?4:9;t.message=`${score} 分 · 入账 ¥${revenue}`;t.receipt=record;log(s,`${t.guest.name}：${score} 分，入账 ¥${revenue}`);}
function baseTick(s,dt){if(s.phase!=='service')return;dt=Math.min(dt,2);s.elapsed+=dt;s.cats.forEach(c=>c.cd=Math.max(0,c.cd-dt));for(let t of s.tables){if(t.status==='waiting'){t.wait+=dt;if(s.upgrades.staff&&t.wait>=8)autoServe(s,t);if(t.status==='waiting'&&t.wait>=t.patience){s.stats.lost++;if(t.stockIssue)s.stats.stockLost=(s.stats.stockLost||0)+1;s.rep=Math.max(0,s.rep-2);log(s,`${t.guest.name}等久了，改天再来`);t.status='empty';}}else if(t.status==='eating'){t.progress+=dt;let prep=Math.max(1,P[t.plan.pot].prep-(s.upgrades.station?3:0));let current=Math.min(t.m.rounds.length-1,Math.floor(Math.max(0,t.progress-prep)/t.m.perRound));if(t.progress>=prep&&current!==t.round){t.round=current;let st=t.m.states[current];t.fresh=st.fresh;t.rich=st.rich;t.message=st.gain>=4?'这个顺序，越吃越香！':`第 ${current+1} 轮 · ${t.m.rounds[current].map(id=>F[id].short).join('、')}`;if(current===1&&t.score>=80&&t.guest.style!=='rush'&&!t.added)t.addOffer=true;}
 if(t.progress>=t.m.duration)finish(s,t);
 }else if(t.status==='dirty'){t.cleanTime-=dt;if(t.cleanTime<=0)t.status='empty';}}
 seat(s);if(s.nextGuest>=s.schedule.length&&s.tables.every(t=>t.status==='empty'))closeDay(s);}
function baseAddDish(s,id){let t=s.tables[id];if(!t||t.status!=='eating'||!t.addOffer)return '暂时没有加单';const f=F.beef;if(s.stock.beef<1)return '肥牛库存不足';if(t.m.price+f.price>t.guest.budget)return '这桌剩余预算不够，先不加啦';s.stock.beef--;s.stats.food+=f.cost;t.m.price+=f.price;t.m.duration+=4;t.score=clamp(t.score+4,0,100);t.addOffer=false;t.added=true;t.message='再来一盘！这个汤底越涮越香。';return null;}
function buy(s,id,n=4){if(!F[id]||F[id].day>s.day)return false;let cost=F[id].cost*n;if(s.cash<cost)return false;s.cash-=cost;s.stock[id]=Math.round((s.stock[id]+n)*100)/100;return true;}
function upgrade(s,id){let u=UP[id];if(!u||u.day>s.day||s.upgrades[id]||s.cash<u.cost||s.phase==='service')return false;s.cash-=u.cost;s.upgrades[id]=true;return true;}
function rewardText(day){return ['存入街坊招牌套餐','免费猫猫软垫','菌菇、肥牛各补 4 份','以后表演费减半','学生四味套餐存入招牌','独食客人永久 +3 评价','庆典彩旗与日常经营'][Math.min(6,day-1)];}
function baseGoal(s){let a=s.stats,good=a.records.filter(r=>r.score>=80);switch(Math.min(s.day,7)){case 1:return a.served>=3&&good.length>=2;case 2:return a.petTables.length>=3&&good.length>=3;case 3:return good.length>=(s.mode==='busy'?5:4);case 4:return a.showHits>=2&&good.length>=3;case 5:return a.records.filter(r=>r.style==='student'&&r.unique>=4).length>=3;case 6:return good.filter(r=>r.style==='quiet').length>=3;case 7:return good.length>=(s.mode==='feast'?6:5)&&(s.mode==='feast'||a.petTables.length>=3);}}
function baseCloseDay(s){if(s.phase!=='service')return;let a=s.stats;a.goal=goal(s);a.reward=a.goal?event(s).reward+(s.mode==='busy'&&s.day===3?60:0):0;if(a.goal&&!s.badges.includes(event(s).badge)){s.badges.push(event(s).badge);if(s.day===1&&s.recipes.length<6)s.recipes.push({name:'街坊第一锅',plan:defaultPlan(s,G[0])});if(s.day===2)s.upgrades.cat=true;if(s.day===3){s.stock.mushroom+=4;s.stock.beef+=4;}if(s.day===5&&s.recipes.length<6)s.recipes.push({name:'同学会四味拼盘',plan:defaultPlan(s,G[5])});}let waste=0;for(let id of unlocked(s)){let n=Math.max(0,Math.floor((s.stock[id]-8)*.12));s.stock[id]-=n;waste+=n*F[id].cost;}a.waste=waste;a.wages=25+(s.upgrades.staff?20:0);s.cash+=a.reward-a.wages;a.profit=Math.round(a.revenue+a.tips-a.food-a.pots-a.expense-a.waste-a.wages);a.endCash=s.cash;s.history.push({day:s.day,profit:a.profit,served:a.served,goal:a.goal});s.phase='settlement';log(s,`打烊啦！营业净收益 ¥${a.profit}`);}
function baseNext(s){if(s.phase!=='settlement')return false;s.day++;s.phase='prep';s.mode=event(s).modes[0][0];s.tables=[];s.stats=null;s.cats.forEach(c=>c.cd=0);if(s.cash<100){s.cash+=180;log(s,'街坊预付订餐款 +180，帮你继续开锅。');}if(s.day===2){s.stock.balls+=4;s.stock.dessert+=4;}if(s.day===3)s.stock.potato+=4;if(s.day===4)s.stock.blood+=4;return true;}
function serialize(s){return JSON.stringify(s);}
function baseRestore(data){try{let s=JSON.parse(data);if(s.version!==1||!['prep','service','settlement'].includes(s.phase)||!Number.isFinite(s.cash)||!Array.isArray(s.tables)||!s.stock||!s.cats||s.day<1)return null;return s;}catch{return null;}}
// Second edition: clear needs, distinct companions and continuing neighborhood stories.
const CAT_ROLES=[
 {name:'油碟',role:'合影掌柜',desc:'陪猫粉合影，完成心愿并获得额外小费。',duration:24,rest:16},
 {name:'糍粑',role:'等位安抚员',desc:'为正在等餐的客人增加耐心，不延长电影等行程时限。',duration:16,rest:12},
 {name:'煤球',role:'安静陪伴员',desc:'最适合安静客人；在窗边陪伴效果更好。',duration:28,rest:18}
];
Object.assign(UP,{bar:{name:'单人快涮吧台',cost:130,day:2,desc:'一号位改为两人吧台；独食用餐缩短 4 秒'},long:{name:'街坊拼接长桌',cost:180,day:3,desc:'末号位改为六人长桌；解锁六人团圆预约'},window:{name:'安静窗边席',cost:150,day:3,desc:'倒数第二席改为安静双人位；隔开表演，照顾阿青'}});
G.push({id:'banquet',name:'六人团圆长桌',who:'临江坡大家庭',size:6,budget:230,patience:110,limit:100,tastes:['spicy','clear'],meat:true,quote:'一家六口坐一起，四样菜也要吃得够！',story:'一家人围在长桌边，谁也没落下。',style:'social',sprite:0});
const DAILY=[
 {key:'rain',name:'雨夜留一盏灯',kicker:'老街日常 · 晚归的客人',story:'雨把街坊留在了坡坡路上。留一口热汤，也留一个安静的位子。',modes:[['warm','慢慢吃热汤','等餐耐心 +15 秒'],['calm','安静猫猫席','煤球照顾安静客人']],goal:'完成 3 桌好评，安排 1 桌猫咪陪伴',reward:100,badge:'雨夜的灯'},
 {key:'student',name:'社团散伙饭',kicker:'老街日常 · 便宜又丰富',story:'毕业生带着手写菜单回来，想把学校里的故事再讲一遍。',modes:[['small','小份百味','小份多样奖励'],['classic','同学大拼盘','学生整桌预算 +25']],goal:'完成 2 桌学生好评，每桌至少 4 种菜',reward:110,badge:'毕业也常来'},
 {key:'tourist',name:'末班车前这一锅',kicker:'老街日常 · 山城来客',story:'游客带来新的预约：有的赶车，有的愿意慢慢尝三种锅味。',modes:[['steady','分时预约','平稳接待'],['busy','接下旅行团','密集到店，多 2 桌']],goal:'完成 4 桌好评，并照顾好赶时间的朋友',reward:130,badge:'山城不虚此行'},
 {key:'cat',name:'猫掌柜见面会',kicker:'老街日常 · 油碟的粉丝',story:'油碟的老朋友带着新朋友来拍合影。一次陪好一桌，猫猫也要歇歇。',modes:[['appointment','预约合影','猫粉心愿优先'],['calm','安静见面会','让每桌慢慢相处']],goal:'完成 3 桌好评，留下 2 张油碟合影',reward:110,badge:'猫掌柜合影册'},
 {key:'opera',name:'戏班回到老街',kicker:'老街日常 · 再看一场好戏',story:'师傅带来短场与压轴两套节目。先看预约，再决定何时开演。',modes:[['quiet','雅座小戏','照顾安静桌'],['stage','热闹堂会','聚会喝彩更热烈']],goal:'完成一场演出，至少 2 桌看完，完成 3 桌好评',reward:130,badge:'老街戏票'},
 {key:'neighbors',name:'街坊带新朋友',kicker:'老街日常 · 熟悉的老位置',story:'熟客把店当成了约朋友的地方。今天的好招待，会写进下次的预约。',modes:[['warm','街坊慢慢聊','等餐耐心 +15 秒'],['quick','街坊快涮','每桌用餐 −4 秒']],goal:'完成 4 桌好评',reward:110,badge:'老位置见'}
];
EVENTS[1].modes[0][2]='猫粉分时到店，油碟有空拍合影';
EVENTS[3].modes[0][2]='压轴聚会心情更多；安静桌建议靠窗';
EVENTS[3].modes[1][2]='适合安排短场；安静客人也能自在看戏';
EVENTS[5].modes[1][2]='清静的氛围，安静客人餐食评价 +6';
UP.cat.desc='猫咪专用软垫，陪伴后的休息缩短 4 秒';
EVENTS[3].goal='完成一场变脸演出，至少 2 桌看完，完成 3 桌好评';
function ensure(s){
 s.unlocks ||= {};s.showPlan ||= {type:'short',at:null};
 if(s.stats){s.stats.photos ||=0;s.stats.storyRewards ||= [];s.stats.showRemaining ||=0;s.stats.showAudience ||= [];s.stats.showWatched ||=0;if(s.stats.showFinished===undefined)s.stats.showFinished=!!s.stats.showDone;}
 s.tables.forEach(t=>{t.wishes ||= {};t.mood ||=0;t.catTip ||=0;t.seat ||=seatType(s,t.id,s.tables.length);if(t.catActive===undefined)t.catActive=false;if(t.status==='eating'&&t.m&&t.m.essentialOk===undefined){const check=metrics(s,t.guest,t.plan);t.m.essentialOk=check.essentialOk;t.m.requirements=check.requirements;}});
 s.cats.forEach(c=>{if(c.remaining===undefined)c.remaining=0;if(c.table===undefined)c.table=null;if(c.auto===undefined)c.auto=true;});
 return s;
}
function fresh(){return ensure(baseFresh());}
function restore(data){const s=baseRestore(data);return s?ensure(s):null;}
function event(s){return s.day<=7?baseEvent(s):DAILY[(s.day-8)%DAILY.length];}
function dayGuests(s){
 let ids=s.day<=7?baseDayGuests(s):[[3,0,3,4,2],[5,5,0,5,3],[6,1,6,2,6,3],[7,3,7,0,7],[4,3,6,0,2,7],[0,3,2,4,5,7]][(s.day-8)%6].slice();
 if(s.day>7&&s.mode==='busy')ids.push(6,6);
 if(s.upgrades.long)ids.push(8);
 if(s.unlocks.aqingReservation&&!ids.includes(3))ids.push(3);
 if(s.day>7){const returning=G.map((g,i)=>({g,i})).filter(x=>(s.regulars[x.g.id]?.returnInterest||0)>=10&&ids.filter(n=>n===x.i).length<2);if(returning.length)ids.push(returning[(s.day-8)%returning.length].i);}
 if(s.cats[0].bond>=40&&ids.filter(x=>x===7).length<2)ids.push(7);
 return ids;
}
function seatType(s,id,n){return s.upgrades.bar&&id===0?'bar':s.upgrades.long&&id===n-1?'long':s.upgrades.window&&id===n-2?'window':'normal';}
function seatName(type){return {bar:'快涮吧台',long:'拼接长桌',window:'安静窗边',normal:'街坊方桌'}[type||'normal'];}
function capacity(type){return type==='long'?6:type==='bar'||type==='window'?2:4;}
function storyStep(s,id){return Math.min(3,s.regulars[id]?.storyStep||0);}
function decorateGuest(s,g){
 const step=storyStep(s,g.id);g.storyStep=step;
 if(g.id==='luo'){
  g.quote=step===0?G[0].quote:step===1?'今天带朋友来，清汤悄悄留，莫当众拆穿我嘛。':step===2?'这次还给我留清汤，吃满意了，把私房蘸碟教给你。':'老规矩！带朋友来尝尝你调的江湖蘸碟。';
  if(step===1){g.size=3;g.budget=125;g.name='老罗带朋友的面子局';}
 }else if(g.id==='solo'){
  g.quote=step===0?G[3].quote:step===1?'带了位同样怕吵的朋友，找个安静的位置坐嘛。':step===2?'还是想坐安静的老位置，以后提前给你留预约。':'我又来老位置了，今天也想见见煤球。';
  if(step===1){g.size=2;g.budget=95;g.name='阿青与朋友的安静局';}
 }
 if((s.day===5||event(s).key==='student')&&s.mode==='classic'&&g.style==='student')g.budget+=25;
 return g;
}
function open(s){
 ensure(s);const ok=baseOpen(s);if(!ok)return false;
 Object.assign(s.stats,{photos:0,storyRewards:[],showFinished:false,showRemaining:0,showAudience:[],showWatched:0});
 s.stats.specialCount=s.tables.filter(t=>t.special).length;
 if(['busy','feast'].includes(s.mode))s.schedule.forEach((v,i)=>v.at=i===0?0:14+Math.floor((i-1)/3)*32+(i-1)%3*5);
 return true;
}
function seat(s){
 if(s.closing||s.nextGuest>=s.schedule.length)return;
 const item=s.schedule[s.nextGuest];if(item.at>s.elapsed)return;
 const g=decorateGuest(s,clone(G[item.id]));
 let free=s.tables.filter(t=>t.status==='empty'&&capacity(seatType(s,t.id,s.tables.length))>=g.size);
 free.sort((a,b)=>{const rank=t=>{const k=seatType(s,t.id,s.tables.length);return g.style==='quiet'&&k==='window'?0:g.size===1&&k==='bar'?1:g.size>4&&k==='long'?0:k==='normal'?2:3;};return rank(a)-rank(b);});
 if(!free.length){if(s.elapsed-item.at>55){s.nextGuest++;s.stats.lost++;log(s,g.name+'等位太久，改天再来。');}return;}
 const t=free[0],prior=s.regulars[g.id];
 const special=['luo','movie','birthday','solo'].includes(g.id)&&(s.stats.specialCount||0)<2;
 if(special)s.stats.specialCount=(s.stats.specialCount||0)+1;
 Object.assign(t,{status:'waiting',guest:g,plan:null,m:null,progress:0,round:-1,score:0,added:false,addOffer:false,photoPending:false,stockIssue:false,receipt:null,wait:0,patience:g.patience+(s.mode==='warm'?15:0),petBonus:0,petCount:0,cat:(t.id+s.nextGuest)%3,visit:s.nextGuest,fresh:0,rich:0,mood:0,catTip:0,wishes:{},catActive:false,seat:seatType(s,t.id,s.tables.length),special});
 t.cast=C.assign(g,s.nextGuest,s.tables.filter(x=>x!==t&&['waiting','eating'].includes(x.status)).flatMap(x=>C.forTable(x)));
 t.message=special?'重点饭局 · '+g.quote:prior?'又见面啦！'+g.quote:g.quote;
 s.nextGuest++;log(s,`${t.id+1} 桌 · ${g.name}${special?'（需要嬢嬢拿主意）':''}`);
}
function metrics(s,g,plan){
 const m=baseMetrics(s,g,plan);if(!m.rounds)return m;
 const t=s.tables?.find(t=>t.guest===g&&['waiting','eating'].includes(t.status)),seat=t?.seat||'normal';
 const brothCost=(plan.broths||[]).reduce((n,b)=>n+(b==='mushroom'?3:b==='tomato'?2:0),0);
 m.serviceCost=plan.fast?12:0;m.potCost=P[plan.pot].cost+brothCost;m.foodCost=m.cost-P[plan.pot].cost;
 m.cost+=brothCost+m.serviceCost;
 if(s.cash<m.potCost+m.serviceCost&&!m.errors.includes('现金不足以准备锅底'))m.errors.push('现金不足以准备锅底与快涮服务');
 if(plan.fast){m.perRound=Math.max(7,m.perRound-4);m.duration-=4*m.rounds.length;m.reasons.push('快熟精切服务：备餐支出 +12，少等 '+4*m.rounds.length+' 秒');}
 if(seat==='bar'&&g.size===1){m.duration=Math.max(1,m.duration-4);m.reasons.push('单人吧台，上菜更顺手');}
 m.score=clamp(m.score+4,0,100);
 if(g.style==='quiet'&&(plan.broths||[]).includes('clear')){m.score=clamp(m.score+3,0,100);m.reasons.push('清口骨汤正合安静客人的口味');}
 if(['birthday','cat'].includes(g.style)&&(plan.broths||[]).includes('tomato')){m.score=clamp(m.score+4,0,100);m.reasons.push('酸甜番茄正合这桌心意');}
 if(s.unlocks?.luoSauce&&plan.sauce==='luo'&&(plan.broths||[]).includes('red')){m.score=clamp(m.score+4,0,100);m.reasons.push('老罗的江湖蘸碟，红汤好搭档');}
 m.totalTime=(t?.wait||0)+m.duration;
 if(g.style==='rush'){m.reasons=m.reasons.filter(x=>!x.includes('赶得上电影')&&!x.includes('耽误行程'));m.reasons.push(m.totalTime<=g.limit?'等餐和用餐合计能赶上电影':'等餐和用餐合计超时，会耽误电影');}
 const foods=m.rounds.flat(),min=g.size>4?4:g.size===1?1.3:g.size===2?2:2.5;
 m.requirements=[{label:'每种口味都有合适锅底',ok:m.coverage===1},{label:'大家都吃得够',ok:foods.length*(m.small?.65:1)>=min}];
 if(g.meat)m.requirements.push({label:'想吃肉的客人有肉吃',ok:foods.some(id=>['beef','blood'].includes(id))});
 if(g.style==='rush')m.requirements.push({label:'等餐与用餐合计不超过 '+g.limit+' 秒',ok:m.totalTime<=g.limit});
 if(g.id==='luo'&&g.storyStep===1)m.requirements.push({label:'体面地给老罗留清汤',ok:plan.discreet===true});
 m.essentialOk=m.requirements.every(x=>x.ok);
 if(!m.essentialOk)m.score=Math.min(69,m.score);
 if(m.essentialOk&&g.style==='social'&&g.id==='visitor'&&new Set(plan.broths).size>=3){m.score=clamp(m.score+7,0,100);m.reasons.push('游客尝到三种锅味，四格锅派上用场');}
 if(t?.special&&!plan.choice)m.errors.push('先选一种招待方案，也可以选择自己搭配');
 return m;
}
function defaultPlan(s,g){
 let p=baseDefaultPlan(s,g);p.discreet=true;
 if(g.size>4)p={pot:'dual',broths:['red',s.day>=2?'mushroom':'clear'],rounds:[['mushroom','greens'],['beef','balls'],['tofu','potato']],small:false,discreet:true};
 if(g.style==='quiet'&&g.size===2)p.small=false;
 return p;
}
function planChoices(s,t){
 const g=t.guest,p=defaultPlan(s,g),a=clone(p),b=clone(p);a.choice='steady';b.choice='alternative';
 let names=['街坊招牌锅','多尝一味'],desc=['照顾口味，按熟悉的顺序上菜','多占一点预算，换来更多花样'];
 if(g.id==='movie'){
  names=['两轮快涮','精切快熟拼盘'];desc=['正常备餐，毛利更高；先确认剩余时间','额外支出 ¥12，缩短 8 秒；需要虾丸库存'];
  b.rounds=[['mushroom',s.day>=2?'balls':'greens'],['beef','tofu']];b.fast=true;
 }else if(g.id==='luo'){
  names=['悄悄留半锅清汤','借新招牌照顾口味'];desc=['三轮慢慢养味，保住老罗的面子','两轮双味拼盘，更多菜、更快吃完'];
  a.broths=['red','clear'];a.discreet=true;b.rounds=[['mushroom','greens'],['beef','tofu']];b.discreet=true;
 }else if(g.style==='birthday'){
  names=['最后端生日惊喜','先吃甜，再快涮'];desc=['三轮最后上糍粑，完成生日心愿','两轮吃完，翻台更快；没有压轴惊喜'];
  b.rounds=[['dessert','mushroom'],['beef','tofu']];
 }else if(g.style==='quiet'){
  names=['清口小份慢慢吃','安静品味三道菜'];desc=['少量多样，留出聊天和陪猫时间','菌汤搭虾丸，预算更高，尝新鲜味'];
  a.broths=['clear'];b.broths=[s.day>=2?'mushroom':'clear'];b.rounds=[['mushroom'],[s.day>=2?'balls':'tofu','greens']];b.small=s.day>=3&&g.size===1;
 }
 return [{id:'steady',name:names[0],desc:desc[0],plan:a},{id:'alternative',name:names[1],desc:desc[1],plan:b}];
}
function serve(s,id,plan){
 const t=s.tables[id],m=baseServe(s,id,plan);if(m.errors.length)return m;
 const extra=m.potCost-P[plan.pot].cost;
 s.cash-=extra+m.serviceCost;s.stats.pots+=extra;s.stats.expense+=m.serviceCost;s.stats.food-=extra+m.serviceCost;
 t.essentialOk=m.essentialOk;t.mealScore=t.score;t.mood ||=0;t.wishes ||= {};
 if(!t.essentialOk)t.score=Math.min(69,t.score);
 t.wishes.birthday=t.guest.style==='birthday'&&m.rounds[m.rounds.length-1].includes('dessert');
 return m;
}
function autoServe(s,t){if(t.special){t.message='重点饭局：请嬢嬢选一种招待方案。';return;}const candidates=s.recipes.map(r=>r.plan).concat([defaultPlan(s,t.guest)]);if(t.guest.style==='rush')candidates.push({...defaultPlan(s,t.guest),fast:true});const best=candidates.map(plan=>({plan,m:metrics(s,t.guest,plan)})).filter(x=>!x.m.errors.length&&x.m.essentialOk).sort((a,b)=>b.m.score-a.m.score||a.m.cost-b.m.cost)[0];if(best){t.stockIssue=false;serve(s,t.id,best.plan);}else{const missing=[...new Set(candidates.flatMap(p=>metrics(s,t.guest,p).errors).filter(x=>x.includes('库存不足')))];t.stockIssue=missing.length>0;t.message=missing.length?'小满：'+missing.join('、')+'，请补货。':'小满：现有菜单没照顾好基本需求，请嬢嬢亲自拿主意。';}}
function releaseCat(s,c){const t=s.tables[c.table];if(t){t.catActive=false;t.photoPending=false;}c.table=null;c.remaining=0;c.cd=s.upgrades.cat?Math.max(8,CAT_ROLES[s.cats.indexOf(c)].rest-4):CAT_ROLES[s.cats.indexOf(c)].rest;}
function pet(s,id,catId){
 ensure(s);const t=s.tables[id];if(!t||!['waiting','eating'].includes(t.status))return '先选一桌正在等餐或用餐的客人';
 const idx=catId===undefined?t.cat:Number(catId),c=s.cats[idx];if(!c)return '请选择一位猫掌柜';
 if(c.remaining>0)return c.name+'正在陪 '+(c.table+1)+' 桌，还要 '+Math.ceil(c.remaining)+' 秒';
 if(c.cd>0)return c.name+'休息中，再等 '+Math.ceil(c.cd)+' 秒';
 if(t.petCount>=1)return '这一桌已经安排过陪伴啦，让猫猫照顾下一桌';
 t.cat=idx;t.petCount=1;t.catActive=true;c.table=id;c.remaining=CAT_ROLES[idx].duration;c.bond+=4;
 t.mood ||=0;t.catTip ||=0;t.wishes ||= {};
 if(idx===0){t.mood+=t.guest.style==='cat'?8:3;t.catTip+=t.guest.style==='cat'?8:2;t.photoPending=t.guest.style==='cat';}
 if(idx===1){const waiting=t.status==='waiting';t.patience+=waiting?20:0;t.mood+=waiting?6:3;t.catTip+=waiting?3:1;}
 if(idx===2){const quiet=t.guest.style==='quiet';t.mood+=quiet?(t.seat==='window'?10:7):2;t.catTip+=quiet?5:1;t.wishes.quietCat=quiet;}
 s.stats.pets++;if(!s.stats.petTables.includes(t.visit))s.stats.petTables.push(t.visit);
 t.message=c.name+'会陪这一桌 '+c.remaining+' 秒，'+(idx===1?'等餐耐心增加，行程时限不变。':'开心归开心，口味和行程也要照顾好。');
 log(s,c.name+'开始陪 '+(id+1)+' 桌 · '+CAT_ROLES[idx].role);return null;
}
function catStatus(s,i){const c=s.cats[i];return c.remaining>0?'陪 '+(c.table+1)+' 桌 · '+Math.ceil(c.remaining)+' 秒':c.cd>0?'休息 '+Math.ceil(c.cd)+' 秒':'可以陪客人';}
function showFee(s,type){return (type||s.showPlan?.type||'short')==='finale'?(s.badges.includes('满堂彩')?18:30):(s.badges.includes('满堂彩')?10:20);}
function showPreview(s,type){
 const duration=type==='finale'?20:10;
 return s.tables.filter(t=>['waiting','eating'].includes(t.status)).map(t=>{
  const remain=t.status==='eating'?t.m.duration-t.progress:defaultPlan(s,t.guest).rounds.length*13+7;
  const hurry=remain<duration||(t.guest.style==='rush'&&t.guest.limit-t.wait-(t.progress||0)<duration);
  const noisy=t.guest.style==='quiet'&&t.seat!=='window'&&type==='finale';
  return {id:t.id,visit:t.visit,name:t.guest.name,benefit:hurry?0:noisy?-6:type==='finale'?(t.guest.id==='visitor'?12:8)+(s.mode==='stage'?4:0):4,note:hurry?'快离店了，可能看不完':noisy?'喜欢安静，建议换到窗边':t.seat==='window'?'窗边隔开热闹，自在观演':'愿意留下看完',willWatch:!hurry};
 });
}
function scheduleShow(s,type,at){ensure(s);if(s.phase==='settlement'||s.stats?.showDone)return false;s.showPlan={type:type==='finale'?'finale':'short',at:at===null?null:Number(at)};log(s,at===null?'今晚的演出改为手动开场。':'已约好 '+at+' 秒开演 · '+(type==='finale'?'压轴场':'短场'));return true;}
function show(s,hits=0,type){
 ensure(s);type=type||s.showPlan.type;
 if(s.phase!=='service'||s.stats.showDone||s.day<2||s.cash<showFee(s,type))return false;
 const fee=showFee(s,type);s.cash-=fee;s.stats.expense+=fee;s.stats.showDone=true;s.stats.showHits=clamp(hits,0,3);s.stats.showType=type;s.stats.showRemaining=type==='finale'?20:10;s.stats.showAudience=showPreview(s,type);s.stats.showFinished=false;s.showPlan.at=null;
 if(hits===3&&!s.badges.includes('三连绝活'))s.badges.push('三连绝活');log(s,'川剧'+(type==='finale'?'压轴场':'短场')+'开演，客人照常吃饭。');return true;
}
function moveTable(s,from,to){
 const t=s.tables[from],dest=s.tables[to];if(!t||!dest||dest.status!=='empty'||!['waiting','eating'].includes(t.status))return '请选择一张空桌';
 const kind=seatType(s,to,s.tables.length);if(capacity(kind)<t.guest.size)return '这张桌坐不下这组客人';
 const old=t.id;t.id=to;t.seat=kind;s.tables[to]=t;s.tables[from]={id:from,status:'empty',seat:seatType(s,from,s.tables.length)};
 s.cats.forEach(c=>{if(c.table===old)c.table=to;});log(s,t.guest.name+'换到 '+seatName(kind));return null;
}
function tick(s,dt){
 if(s.phase!=='service')return;ensure(s);dt=Math.min(dt,2);
 s.cats.forEach(c=>{if(c.remaining>0){c.remaining=Math.max(0,c.remaining-dt);const t=s.tables[c.table];if(c.remaining===0||!t||!['waiting','eating'].includes(t.status)){if(t?.photoPending&&c.remaining===0&&['waiting','eating'].includes(t.status)){t.wishes.photo=true;t.photoPending=false;s.stats.photos++;t.message='油碟合影留念，猫掌柜心愿完成！';}releaseCat(s,c);}}});
 if(s.stats.showRemaining>0){s.stats.showRemaining=Math.max(0,s.stats.showRemaining-dt);if(s.stats.showRemaining===0){s.stats.showFinished=true;s.stats.showWatched=0;for(const a of s.stats.showAudience){const t=s.tables.find(x=>x.visit===a.visit);if(t?.visit===a.visit&&['waiting','eating'].includes(t.status)&&a.willWatch){t.mood=(t.mood||0)+a.benefit+(s.stats.showHits||0);t.wishes ||= {};t.wishes.show=a.benefit>0;if(a.benefit>0)s.stats.showWatched++;t.message=a.benefit<0?'这场太热闹，下次想坐安静窗边。':'好戏看完啦，这顿饭又多一个念想。';}}log(s,'师傅谢幕，'+s.stats.showWatched+' 桌看完了好戏。');}}
 baseTick(s,dt);
 if(s.phase!=='service')return;
 if(s.showPlan.at!==null&&!s.stats.showDone&&s.elapsed>=s.showPlan.at){if(!show(s,0,s.showPlan.type)){s.showPlan.at=null;log(s,'演出费暂时不够，场次改为手动，请检查账本。');}}
 s.cats.forEach((c,i)=>{if(c.bond<40||!c.auto||c.remaining>0||c.cd>0)return;const list=s.tables.filter(t=>['waiting','eating'].includes(t.status)&&!t.petCount);const t=i===0?list.find(t=>t.guest.style==='cat'):i===1?list.filter(t=>t.status==='waiting'&&t.wait>=10).sort((a,b)=>(a.patience-a.wait)-(b.patience-b.wait))[0]:list.find(t=>t.guest.style==='quiet');if(t)pet(s,t.id,i);});
}
function finish(s,t){
 t.essentialOk=t.m.essentialOk!==false;
 if(t.guest.style==='rush'&&t.wait+t.m.duration>t.guest.limit){t.essentialOk=false;t.m.reasons.push('等餐与用餐合计 '+Math.ceil(t.wait+t.m.duration)+' 秒，没赶上行程');}
 if(!t.essentialOk)t.score=Math.min(69,t.score);
 baseFinish(s,t);const r=s.stats.records[s.stats.records.length-1];r.essentialOk=t.essentialOk;r.mood=t.mood||0;r.wishes=clone(t.wishes||{});r.seat=t.seat;r.special=!!t.special;r.wait=Math.round(t.wait);r.duration=t.m.duration;
 if(!t.essentialOk)s.rep=Math.max(0,s.rep-2);
 r.reasons=r.reasons.filter(x=>!x.startsWith('猫咪陪伴'));if(t.petCount)r.reasons.push(CAT_ROLES[t.cat].name+'持续陪伴，心情 '+t.mood+'；基本需求独立结算');
 const extra=t.essentialOk?Math.max(0,(t.catTip||0)+Math.floor(Math.max(0,t.mood||0)/3)):0;
 r.tips+=extra;s.cash+=extra;s.stats.tips+=extra;
 if(!t.essentialOk){r.quote=t.guest.style==='rush'?'锅和猫都好，可惜电影赶迟了。下次早点上两轮快涮吧。':'饭局的基本需要还没照顾好，下次换个安排嘛。';}
 else if(t.wishes.photo)r.quote='和油碟拍到合影啦！下回带朋友来。';
 else if(t.wishes.birthday)r.quote='最后这份糍粑，才是真正的生日惊喜。';
 const regular=s.regulars[t.guest.id];regular.memory=r.quote;regular.returnInterest=clamp((regular.returnInterest||0)+(t.essentialOk?2+Math.floor(Math.max(0,t.mood||0)/3):-3),0,100);
 t.message=`${r.score} 分 · 心情 ${r.mood} · 入账 ¥${r.price+r.tips}`;
 if(['luo','solo'].includes(t.guest.id)&&r.essentialOk&&r.score>=80&&regular.lastStoryDay!==s.day&&(regular.storyStep||0)<3){
  const stage=(regular.storyStep||0)+1;regular.storyStep=stage;regular.lastStoryDay=s.day;
  let message=t.guest.id==='luo'?['老罗记住了你悄悄留的清汤，下次带朋友来。','老罗的面子照顾好了，下次要教你私房蘸碟。','老罗把江湖蘸碟教给你：红汤套餐可选专属蘸料。'][stage-1]:['阿青下次想带一位怕吵的朋友来。','阿青和朋友吃得自在，下次要认定这个老位置。','阿青认定老位置：获得安静窗边席与固定预约。'][stage-1];
  if(stage===3){if(t.guest.id==='luo')s.unlocks.luoSauce=true;else{s.upgrades.window=true;s.unlocks.aqingReservation=true;}}
  s.stats.storyRewards ||= [];s.stats.storyRewards.push(message);regular.memory=message;log(s,message);
 }
}
function goodRecords(s){return s.stats.records.filter(r=>r.score>=80&&r.essentialOk!==false);}
function goal(s){
 const a=s.stats,good=goodRecords(s);
 if(s.day<=7){if(s.day===4)return a.showFinished&&a.showWatched>=2&&good.length>=3;if(s.day===5)return good.filter(r=>r.style==='student'&&r.unique>=4).length>=3;return baseGoal(s);}
 switch(event(s).key){case'rain':return good.length>=3&&a.petTables.length>=1;case'student':return good.filter(r=>r.style==='student'&&r.unique>=4).length>=2;case'tourist':return good.length>=4&&good.some(r=>r.id==='movie');case'cat':return good.length>=3&&a.photos>=2;case'opera':return a.showFinished&&a.showWatched>=2&&good.length>=3;default:return good.length>=4;}
}
function closeDay(s){if(s.stats?.showRemaining>0)return;baseCloseDay(s);}
function next(s){const ok=baseNext(s);if(ok){ensure(s);s.showPlan={type:'short',at:null};s.cats.forEach(c=>{c.remaining=0;c.table=null;c.cd=0;});}return ok;}
function addDish(s,id){const msg=baseAddDish(s,id);const t=s.tables[id];if(!msg&&t?.m.essentialOk===false)t.score=Math.min(69,t.score);return msg;}

function hostTea(s){
 if(s.phase!=='service')return '开门后再请街坊喝茶嘛。';
 if(s.stats.teaServed)return '今天已经请过茶啦，给下一锅留点钱。';
 const tables=s.tables.filter(t=>['waiting','eating'].includes(t.status));
 if(!tables.length)return '街坊还没坐下，先把茶温着。';
 if(s.cash<8)return '一壶茶需要 ¥8。';
 s.cash-=8;s.stats.expense+=8;s.stats.teaServed=true;
 tables.forEach(t=>{t.mood=(t.mood||0)+3;if(t.status==='waiting')t.patience+=12;t.message='嬢嬢请了壶茶，嗓子和心情都润了。';});
 log(s,'梅嬢嬢请 '+tables.length+' 桌街坊喝茶：心情 +3，等餐耐心 +12 秒。');return null;
}
const api={hostTea,CAT_ROLES,DAILY,dayGuests,decorateGuest,planChoices,seatName,seatType,capacity,storyStep,catStatus,showPreview,scheduleShow,moveTable,F,B,P,G,EVENTS,UP,fresh,event,unlocked,open,seat,metrics,serve,defaultPlan,tick,pet,addDish,buy,upgrade,showFee,rewardText,show,goal,closeDay,next,serialize,restore,clone};root.Hotpot=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
