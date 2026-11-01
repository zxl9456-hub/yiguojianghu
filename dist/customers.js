/* Stable customer identities; the original cat and chef atlas stays separate. */
(function(root){
 'use strict';
 const profiles=['老罗','小林','陈嬢嬢','阿青','张嬢嬢','小麦','阿川','小橘','严伯','小桃','大勇','阿穗','钱嬢嬢','阿哲','老余','小蓝'];
 const parties={luo:[0,12],movie:[1,9,10,11],aunt:[2,8,12],solo:[3,11,12,15],birthday:[4,8,10,15],student:[5,13,9,15,1],visitor:[6,14,11,10,8],catfan:[7,15,9,13]};
 function lead(g){return (parties[g.id]||[0])[0];}
 function assign(g,visit=0,occupied=[]){
  const preferred=parties[g.id]||[0,1,2,3];
  const other=Array.from({length:profiles.length},(_,i)=>(i+visit*3)%profiles.length);
  const result=[];
  for(let i=0;i<g.size;i++){
   const candidates=i===0?[preferred[0],...preferred,...other]:[...preferred.slice(1),...other,preferred[0]];
   let chosen=candidates.find(id=>!result.includes(id)&&!occupied.includes(id));
   if(chosen===undefined)chosen=candidates.find(id=>!result.includes(id));
   result.push(chosen);
  }
  return result;
 }
 function forTable(t){
  const saved=t.cast;
  if(Array.isArray(saved)&&saved.length===t.guest.size&&saved.every(id=>Number.isInteger(id)&&id>=0&&id<profiles.length)&&new Set(saved).size===saved.length)return saved;
  return assign(t.guest,t.visit||0);
 }
 const api={profiles,lead,assign,forTable};root.JianghuCustomers=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
