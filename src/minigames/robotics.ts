import { create } from 'zustand'
export type V3 = [number,number,number]
export const ARM_LENGTHS = [.35,.35,2.4,2.4,.35,.35,.4]
export const magnitude=(v:V3)=>Math.hypot(...v)
export const distance=(a:V3,b:V3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])
function atDistance(a:V3,b:V3,d:number):V3{const len=distance(a,b)||1;return a.map((x,i)=>x+(b[i]-x)/len*d) as V3}
export function solveArm(target:V3,lengths=ARM_LENGTHS,seed?:V3[]):V3[]{
 const base:V3=[0,0,0];const reach=lengths.reduce((a,b)=>a+b,0)
 const joints:V3[]=seed?.map(p=>[...p])??[base,...lengths.map((_,i)=>[Math.sin(i*.8)*.5,lengths.slice(0,i+1).reduce((a,b)=>a+b,0),.2] as V3)]
 if(magnitude(target)>=reach){joints[0]=base;lengths.forEach((l,i)=>joints[i+1]=atDistance(joints[i],target,l));return joints}
 for(let iteration=0;iteration<60;iteration++){
  joints[lengths.length]=[...target]
  for(let i=lengths.length-1;i>=0;i--)joints[i]=atDistance(joints[i+1],joints[i],lengths[i])
  joints[0]=base
  for(let i=0;i<lengths.length;i++)joints[i+1]=atDistance(joints[i],joints[i+1],lengths[i])
  if(distance(joints.at(-1)!,target)<.002)break
 }
 return joints
}
export function captureReady(error:number,speed:number,angle:number,stable:number,reach:number){return error<=.14&&speed<=.18&&Math.abs(angle)<=6&&stable>=1.2&&reach<.97*ARM_LENGTHS.reduce((a,b)=>a+b,0)}
export const useRobotics=create<{
 command:V3;hand:V3;target:V3;roll:number;error:number;speed:number;stable:number;running:boolean;captured:boolean;misses:number;
 set:(p:Partial<{command:V3;hand:V3;target:V3;roll:number;error:number;speed:number;stable:number;running:boolean;captured:boolean;misses:number}>)=>void;reset:()=>void
}>()(set=>({command:[2,1,1],hand:[2,1,1],target:[3,2,0],roll:25,error:2,speed:0,stable:0,running:false,captured:false,misses:0,set,reset:()=>set({command:[2,1,1],hand:[2,1,1],target:[3,2,0],roll:25,error:2,speed:0,stable:0,running:true,captured:false,misses:0})}))
