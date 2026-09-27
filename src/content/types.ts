export type ModuleId = 'orientation' | 'iss' | 'medicine' | 'eva' | 'robotics' | 't38' | 'emergency' | 'lunar' | 'mcc'
export type Locale = 'ja' | 'en'

export type SourceKind = 'web' | 'pdf' | 'ntrs' | 'podcast' | 'blog' | 'dataset'

export interface Source {
  id: string
  title: string
  url: string
  publisher: string
  year?: number
  kind: SourceKind
}

export interface Fact {
  label: string
  value: string
}

export interface Lesson {
  id: string
  title: string
  kicker: string
  summary: string
  body: string[]
  facts?: Fact[]
  deepDive?: { title: string; body: string[] }
  focus?: string
  imageQuery?: string
  sources: string[]
}

export interface QuizQuestion {
  id: string
  lessonId?: string
  prompt: string
  choices: [string, string, string, string]
  answer: 0 | 1 | 2 | 3
  explanation: string
  sources: string[]
  difficulty: 1 | 2 | 3
}

export interface GlossaryTerm {
  term: string
  en: string
  abbr?: string
  description: string
}

export interface ModuleContent {
  id: ModuleId
  intro: string
  lessons: Lesson[]
  quiz: QuizQuestion[]
  glossary: GlossaryTerm[]
  sources: Source[]
}

export interface ModuleMeta {
  id: ModuleId
  index: number
  title: string
  en: string
  tagline: string
  color: string
  requires: ModuleId[]
  focusKeys: string[]
  badge: { name: string; description: string }
  minigame: { title: string; description: string }
}
