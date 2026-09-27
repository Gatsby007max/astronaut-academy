export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
export const percentageScore = (earned: number, possible: number) => possible > 0 ? Math.round(clamp(earned / possible, 0, 1) * 1000) : 0
export interface Health { bone: number; muscle: number; cardio: number; recovery: number }
export interface HealthPlan { resist: number; aerobic: number; rest: number; nutrition: 'balanced' | 'restricted' | 'supplements' }
export const initialHealth = (): Health => ({ bone: 100, muscle: 100, cardio: 100, recovery: 100 })
export const validHealthPlan = (p: HealthPlan) => [p.resist, p.aerobic, p.rest].every(n => Number.isFinite(n) && n >= 0) && p.resist + p.aerobic + p.rest <= 120
// Educational, dimensionless indices; not a physiological model or a clinical prescription.
export function advanceHealth(h: Health, p: HealthPlan, challenge: number): Health {
 if (!validHealthPlan(p)) return h
 const fuel = p.nutrition === 'balanced' ? 1 : p.nutrition === 'supplements' ? .65 : .35
 const overload = Math.max(0, p.resist + p.aerobic - 90) / 5
 return {
 bone: clamp(h.bone - 6 + Math.min(6, p.resist / 7.5) * fuel),
 muscle: clamp(h.muscle - 8 + Math.min(8, p.resist / 6) * fuel - overload),
 cardio: clamp(h.cardio - 7 + Math.min(7, p.aerobic / 5.7) - overload),
 recovery: clamp(h.recovery - 5 - challenge + p.rest / 3 + (fuel === 1 ? 2 : -3) - overload),
 }
}
export const healthScore = (h: Health) => Math.round((h.bone + h.muscle + h.cardio + h.recovery) * 2.5)
export interface Decision { id: string; focus: string; title: string; situation: string; choices: string[]; correct: number; explanation: string; source: string; console?: string }
export function decisionScore(correct: boolean, remaining: number, duration: number) { return correct ? 80 + 20 * clamp(remaining / duration, 0, 1) : 0 }
export function shuffled<T>(values: T[], random = Math.random): T[] {
 const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a
}
