export interface BrailleChar {
  char: string
  dots: number[]  // 1-6 active dots
  unicode: string
}

export type LearnMode = 'charToBraille' | 'brailleToChar' | 'dictation'

export interface NumberQuizQuestion {
  id: number
  number: string
  correctDots: number[]
  userDots: number[]
  isCorrect: boolean
  answeredAt: number
}

export interface NumberTrainingState {
  isRunning: boolean
  isPaused: boolean
  currentQuestion: string
  selectedDots: number[]
  timeLimit: number
  timeRemaining: number
  totalQuestions: number
  answeredCount: number
  correctCount: number
  questions: NumberQuizQuestion[]
  wrongQuestions: NumberQuizQuestion[]
  showWrongReview: boolean
}
