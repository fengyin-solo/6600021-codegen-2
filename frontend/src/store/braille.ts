import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BRAILLE_MAP, textToBraille, brailleToText, dotsToUnicode } from '../utils/braille'
import type { LearnMode, NumberQuizQuestion } from '../types'

export const useBrailleStore = defineStore('braille', () => {
  const inputText = ref('')
  const brailleOutput = ref<number[][]>([])
  const learnMode = ref<LearnMode>('charToBraille')
  const quizChar = ref('')
  const selectedDots = ref<number[]>([])
  const score = ref({ correct: 0, total: 0 })
  const history = ref<{ input: string; correct: boolean }[]>([])

  const NUMBER_CHARS = '0123456789'

  const numTraining = ref({
    isRunning: false,
    isPaused: false,
    currentQuestion: '',
    selectedDots: [] as number[],
    timeLimit: 15,
    timeRemaining: 15,
    totalQuestions: 20,
    answeredCount: 0,
    correctCount: 0,
    questions: [] as NumberQuizQuestion[],
    wrongQuestions: [] as NumberQuizQuestion[],
    showWrongReview: false,
  })

  let numTimer: ReturnType<typeof setInterval> | null = null

  const numProgress = computed(() =>
    numTraining.value.totalQuestions > 0
      ? Math.round((numTraining.value.answeredCount / numTraining.value.totalQuestions) * 100)
      : 0
  )

  const numAccuracy = computed(() =>
    numTraining.value.answeredCount > 0
      ? Math.round((numTraining.value.correctCount / numTraining.value.answeredCount) * 100)
      : 0
  )

  const brailleUnicode = computed(() =>
    brailleOutput.value.map(d => dotsToUnicode(d)).join('')
  )

  function translate() {
    brailleOutput.value = textToBraille(inputText.value)
  }

  function reverseTranslate() {
    // Simple: take selectedDots and find matching char
    return brailleToText(selectedDots.value)
  }

  function generateQuiz() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    quizChar.value = chars[Math.floor(Math.random() * chars.length)]
    selectedDots.value = []
  }

  function toggleDot(dot: number) {
    const idx = selectedDots.value.indexOf(dot)
    if (idx >= 0) selectedDots.value.splice(idx, 1)
    else selectedDots.value.push(dot)
  }

  function checkQuizAnswer() {
    const correct = JSON.stringify([...selectedDots.value].sort()) === JSON.stringify([...(BRAILLE_MAP[quizChar.value] || [])].sort())
    score.value.total++
    if (correct) score.value.correct++
    history.value.unshift({ input: quizChar.value, correct })
    if (navigator.vibrate) navigator.vibrate(correct ? 100 : [100, 50, 100])
    generateQuiz()
  }

  function resetScore() {
    score.value = { correct: 0, total: 0 }
    history.value = []
  }

  function exportPDF(): string {
    const lines = inputText.value.toUpperCase().split('')
    let out = '盲文翻译输出\n\n'
    for (const ch of lines) {
      const dots = BRAILLE_MAP[ch] || []
      out += `${ch} → [${dots.join(',')}] ${dotsToUnicode(dots)}\n`
    }
    return out
  }

  function numStartTraining(questionCount = 20, timeLimit = 15) {
    numStopTimer()
    numTraining.value = {
      isRunning: true,
      isPaused: false,
      currentQuestion: '',
      selectedDots: [],
      timeLimit,
      timeRemaining: timeLimit,
      totalQuestions: questionCount,
      answeredCount: 0,
      correctCount: 0,
      questions: [],
      wrongQuestions: [],
      showWrongReview: false,
    }
    numGenerateQuestion()
    numStartTimer()
  }

  function numGenerateQuestion() {
    const randomNum = NUMBER_CHARS[Math.floor(Math.random() * NUMBER_CHARS.length)]
    numTraining.value.currentQuestion = randomNum
    numTraining.value.selectedDots = []
    numTraining.value.timeRemaining = numTraining.value.timeLimit
  }

  function numStartTimer() {
    numStopTimer()
    numTimer = setInterval(() => {
      if (numTraining.value.isPaused || !numTraining.value.isRunning) return
      numTraining.value.timeRemaining--
      if (numTraining.value.timeRemaining <= 0) {
        numSubmitAnswer(true)
      }
    }, 1000)
  }

  function numStopTimer() {
    if (numTimer) {
      clearInterval(numTimer)
      numTimer = null
    }
  }

  function numPauseTraining() {
    numTraining.value.isPaused = true
  }

  function numResumeTraining() {
    numTraining.value.isPaused = false
  }

  function numToggleDot(dot: number) {
    const idx = numTraining.value.selectedDots.indexOf(dot)
    if (idx >= 0) numTraining.value.selectedDots.splice(idx, 1)
    else numTraining.value.selectedDots.push(dot)
  }

  function numSubmitAnswer(isTimeout = false) {
    const question = numTraining.value.currentQuestion
    const userDots = [...numTraining.value.selectedDots]
    const correctDots = BRAILLE_MAP[question] || []
    const isCorrect =
      JSON.stringify([...userDots].sort()) === JSON.stringify([...correctDots].sort())

    const record: NumberQuizQuestion = {
      id: Date.now() + Math.random(),
      number: question,
      correctDots,
      userDots,
      isCorrect: isTimeout ? false : isCorrect,
      answeredAt: Date.now(),
    }

    numTraining.value.questions.push(record)
    numTraining.value.answeredCount++
    if (record.isCorrect) {
      numTraining.value.correctCount++
    } else {
      numTraining.value.wrongQuestions.push(record)
    }

    if (navigator.vibrate) {
      navigator.vibrate(record.isCorrect ? 100 : [100, 50, 100])
    }

    if (numTraining.value.answeredCount >= numTraining.value.totalQuestions) {
      numTraining.value.isRunning = false
      numStopTimer()
      return
    }

    numGenerateQuestion()
  }

  function numEndTraining() {
    numTraining.value.isRunning = false
    numStopTimer()
  }

  function numToggleWrongReview() {
    numTraining.value.showWrongReview = !numTraining.value.showWrongReview
  }

  function numResetTraining() {
    numStopTimer()
    numTraining.value = {
      isRunning: false,
      isPaused: false,
      currentQuestion: '',
      selectedDots: [],
      timeLimit: 15,
      timeRemaining: 15,
      totalQuestions: 20,
      answeredCount: 0,
      correctCount: 0,
      questions: [],
      wrongQuestions: [],
      showWrongReview: false,
    }
  }

  return {
    inputText, brailleOutput, learnMode, quizChar, selectedDots, score, history,
    brailleUnicode, translate, reverseTranslate, generateQuiz, toggleDot,
    checkQuizAnswer, resetScore, exportPDF,
    numTraining, numProgress, numAccuracy,
    numStartTraining, numPauseTraining, numResumeTraining,
    numToggleDot, numSubmitAnswer, numEndTraining,
    numToggleWrongReview, numResetTraining,
  }
})
