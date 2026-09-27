import { describe, expect, it } from 'vitest'
import { ARM_LENGTHS, captureReady, distance, magnitude, solveArm, type V3 } from './robotics'
import { advanceHealth, decisionScore, healthScore, initialHealth, percentageScore, shuffled, validHealthPlan } from './scoring'
import { sampleScore } from './lunar'
import { EMERGENCY_DECISIONS, MCC_EVENTS } from './data/decisions'

describe('robotic arm', () => {
 it.each<V3>([[3,2,0],[-2,3,1],[0,.3,0],[5,3,1]])('reaches an accessible target while preserving every link: %j', (x,y,z) => {
  const target:V3=[x,y,z]; const joints=solveArm(target)
  expect(joints[0]).toEqual([0,0,0])
  ARM_LENGTHS.forEach((l,i)=>expect(distance(joints[i],joints[i+1])).toBeCloseTo(l,6))
  expect(distance(joints.at(-1)!,target)).toBeLessThan(.02)
 })
 it('extends toward an unreachable target without stretching',()=>{
  const j=solveArm([20,0,0]);expect(magnitude(j.at(-1)!)).toBeCloseTo(ARM_LENGTHS.reduce((a,b)=>a+b,0),6)
  ARM_LENGTHS.forEach((l,i)=>expect(distance(j[i],j[i+1])).toBeCloseTo(l,6))
 })
 it('requires position, speed, angle, dwell and reach to agree',()=>{
  expect(captureReady(.1,.1,3,1.5,4)).toBe(true)
  for(const args of [[.2,.1,3,1.5,4],[.1,.2,3,1.5,4],[.1,.1,7,1.5,4],[.1,.1,3,1,4],[.1,.1,3,1.5,7]]) expect(captureReady(...args as [number,number,number,number,number])).toBe(false)
 })
})
describe('health simulation',()=>{
 const balanced={resist:45,aerobic:40,rest:35,nutrition:'balanced' as const}
 it('enforces the activity budget',()=>{
  expect(validHealthPlan(balanced)).toBe(true)
  expect(validHealthPlan({...balanced,rest:40})).toBe(false)
  expect(validHealthPlan({...balanced,rest:NaN})).toBe(false)
 })
 it('rewards balanced planning over restriction through 180 days',()=>{
  let a=initialHealth(),b=initialHealth(),c=initialHealth()
  for(const challenge of [0,3,1,5,2,0]){
   a=advanceHealth(a,balanced,challenge)
   b=advanceHealth(b,{...balanced,nutrition:'restricted'},challenge)
   c=advanceHealth(c,{resist:0,aerobic:0,rest:0,nutrition:'restricted'},challenge)
  }
  expect(healthScore(a)).toBeGreaterThan(900)
  expect(healthScore(b)).toBeLessThan(healthScore(a))
  expect(healthScore(c)).toBeLessThan(600)
  for(const h of [a,b,c])for(const v of Object.values(h)){expect(v).toBeGreaterThanOrEqual(0);expect(v).toBeLessThanOrEqual(100)}
 })
})
describe('decision and observation scoring',()=>{
 it('prioritizes correctness over speed and bounds score',()=>{
  expect(decisionScore(false,60,60)).toBe(0)
  expect(decisionScore(true,0,60)).toBe(80)
  expect(decisionScore(true,90,60)).toBe(100)
  expect(percentageScore(120,100)).toBe(1000)
 })
 it('has unique and actionable scenarios for both exercises',()=>{
  for(const events of [EMERGENCY_DECISIONS,MCC_EVENTS]){
   expect(new Set(events.map(e=>e.id)).size).toBe(events.length)
   for(const e of events){expect(e.choices[e.correct]).toBeTruthy();expect(e.source).toMatch(/^https:\/\/.*nasa.gov\//)}
  }
  expect(MCC_EVENTS.every(e=>e.console)).toBe(true)
 })
 it('shuffles without changing the input',()=>{const a=[1,2,3,4];expect(shuffled(a,()=>0).sort()).toEqual(a);expect(a).toEqual([1,2,3,4])})
 it('values both a relevant sample and its context',()=>{
  expect(sampleScore('anorthosite','anorthosite',true)).toBe(350)
  expect(sampleScore('basalt','anorthosite',false)).toBe(0)
  expect(sampleScore('anorthosite','anorthosite',false)).toBe(250)
 })
})
