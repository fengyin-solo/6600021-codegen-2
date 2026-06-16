<template>
  <div class="min-h-screen p-4 flex flex-col gap-4 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-purple-400">盲文翻译与触觉学习器</h1>

    <div class="flex gap-2 flex-wrap">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="px-4 py-2 rounded text-sm"
        :class="activeTab === t.id ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- Translate -->
    <div v-if="activeTab === 'translate'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">文本输入</h3>
        <textarea v-model="store.inputText" @input="store.translate()"
          class="w-full h-32 bg-gray-800 rounded p-3 text-white resize-none" placeholder="输入英文文本..." />
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">盲文输出</h3>
        <div class="text-4xl tracking-wider text-purple-300 h-16">{{ store.brailleUnicode }}</div>
        <div class="flex flex-wrap gap-2 mt-3">
          <BrailleCell v-for="(dots, i) in store.brailleOutput" :key="i" :dots="dots" :size="40" />
        </div>
      </div>
    </div>

    <!-- Learn -->
    <div v-if="activeTab === 'learn'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
        <h3 class="text-purple-300 font-bold">猜盲文</h3>
        <div v-if="!store.quizChar">
          <button @click="store.generateQuiz()" class="bg-purple-500 px-6 py-3 rounded-lg text-lg hover:bg-purple-400">
            开始训练
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-3">
          <div class="text-7xl font-bold text-purple-400">{{ store.quizChar }}</div>
          <div class="text-sm text-gray-400">点击下方 6 点阵选择对应盲文</div>
          <div class="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-xl">
            <button v-for="d in 6" :key="d" @click="store.toggleDot(d)"
              class="w-14 h-14 rounded-full border-2 transition-all"
              :class="store.selectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
              <span class="text-xs">{{ d }}</span>
            </button>
          </div>
          <button @click="store.checkQuizAnswer()" class="bg-purple-500 px-6 py-2 rounded hover:bg-purple-400">确认</button>
        </div>
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <div class="flex justify-between mb-2">
          <h3 class="text-purple-300 font-bold">统计</h3>
          <button @click="store.resetScore()" class="text-red-400 text-xs hover:underline">重置</button>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center mb-3">
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-green-400">{{ store.score.correct }}</div>
            <div class="text-xs text-gray-400">正确</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
            <div class="text-xs text-gray-400">错误</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-purple-400">{{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%</div>
            <div class="text-xs text-gray-400">正确率</div>
          </div>
        </div>
        <div class="space-y-1 max-h-48 overflow-y-auto">
          <div v-for="(h, i) in store.history.slice(0, 20)" :key="i"
            class="flex justify-between bg-gray-800 rounded p-2 text-sm"
            :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <span>{{ h.input }}</span><span>{{ h.correct ? '✓' : '✗' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference -->
    <div v-if="activeTab === 'ref'" class="bg-gray-900 rounded-xl p-4">
      <h3 class="text-purple-300 font-bold mb-3">盲文速查表</h3>
      <div class="grid grid-cols-6 md:grid-cols-9 gap-3">
        <div v-for="(dots, char) in brailleMap" :key="char" class="flex flex-col items-center">
          <div class="text-xl font-bold text-purple-400">{{ char }}</div>
          <BrailleCell :dots="dots" :size="30" />
          <div class="text-xs text-gray-500">{{ dots.join(',') }}</div>
        </div>
      </div>
    </div>

    <!-- Number Training -->
    <div v-if="activeTab === 'number'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 开始/训练区域 -->
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
        <h3 class="text-purple-300 font-bold self-start">数字盲文训练</h3>

        <!-- 未开始：配置界面 -->
        <div v-if="!store.numTraining.isRunning && store.numTraining.answeredCount === 0" class="w-full flex flex-col gap-4">
          <div class="text-gray-400 text-sm text-center">
            通过限时答题训练数字 0-9 的盲文编码
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-gray-300 text-sm block mb-1">题目数量</label>
              <select v-model="setupQuestionCount" class="w-full bg-gray-800 text-white rounded p-2 border border-gray-700">
                <option :value="10">10 题</option>
                <option :value="20">20 题</option>
                <option :value="30">30 题</option>
                <option :value="50">50 题</option>
              </select>
            </div>
            <div>
              <label class="text-gray-300 text-sm block mb-1">每题限时 (秒)</label>
              <select v-model="setupTimeLimit" class="w-full bg-gray-800 text-white rounded p-2 border border-gray-700">
                <option :value="5">5 秒 (挑战)</option>
                <option :value="10">10 秒 (快速)</option>
                <option :value="15">15 秒 (标准)</option>
                <option :value="30">30 秒 (初学)</option>
              </select>
            </div>
          </div>
          <button @click="store.numStartTraining(setupQuestionCount, setupTimeLimit)"
            class="bg-purple-500 px-6 py-3 rounded-lg text-lg hover:bg-purple-400 w-full">
            开始训练
          </button>
        </div>

        <!-- 训练中 -->
        <div v-else-if="store.numTraining.isRunning" class="w-full flex flex-col items-center gap-3">
          <!-- 进度条和时间 -->
          <div class="w-full space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">进度 {{ store.numTraining.answeredCount }} / {{ store.numTraining.totalQuestions }}</span>
              <span :class="store.numTraining.timeRemaining <= 3 ? 'text-red-400 font-bold' : 'text-purple-300'">
                ⏱ {{ store.numTraining.timeRemaining }}s
              </span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-purple-500 h-2 rounded-full transition-all" :style="{ width: store.numProgress + '%' }"></div>
            </div>
          </div>

          <!-- 题目显示 -->
          <div class="text-8xl font-bold text-purple-400 my-4">{{ store.numTraining.currentQuestion }}</div>
          <div class="text-sm text-gray-400">点击下方 6 点阵选择对应盲文</div>

          <!-- 6 点阵 -->
          <div class="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-xl">
            <button v-for="d in 6" :key="d" @click="store.numToggleDot(d)"
              class="w-14 h-14 rounded-full border-2 transition-all"
              :class="store.numTraining.selectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
              <span class="text-xs">{{ d }}</span>
            </button>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-2">
            <button @click="store.numSubmitAnswer()" class="bg-purple-500 px-6 py-2 rounded hover:bg-purple-400">
              确认
            </button>
            <button v-if="!store.numTraining.isPaused" @click="store.numPauseTraining()"
              class="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-sm">
              暂停
            </button>
            <button v-else @click="store.numResumeTraining()"
              class="bg-green-600 px-4 py-2 rounded hover:bg-green-500 text-sm">
              继续
            </button>
            <button @click="store.numEndTraining()" class="bg-red-600 px-4 py-2 rounded hover:bg-red-500 text-sm">
              结束
            </button>
          </div>
        </div>

        <!-- 训练结束：结果 -->
        <div v-else class="w-full flex flex-col items-center gap-4">
          <h4 class="text-2xl font-bold text-purple-300">训练完成！</h4>
          <div class="grid grid-cols-3 gap-3 w-full text-center">
            <div class="bg-gray-800 rounded p-3">
              <div class="text-3xl font-bold text-purple-400">{{ store.numTraining.totalQuestions }}</div>
              <div class="text-xs text-gray-400">总题数</div>
            </div>
            <div class="bg-gray-800 rounded p-3">
              <div class="text-3xl font-bold text-green-400">{{ store.numTraining.correctCount }}</div>
              <div class="text-xs text-gray-400">正确</div>
            </div>
            <div class="bg-gray-800 rounded p-3">
              <div class="text-3xl font-bold" :class="store.numAccuracy >= 80 ? 'text-green-400' : store.numAccuracy >= 60 ? 'text-yellow-400' : 'text-red-400'">
                {{ store.numAccuracy }}%
              </div>
              <div class="text-xs text-gray-400">正确率</div>
            </div>
          </div>
          <div class="flex gap-2 flex-wrap justify-center">
            <button @click="store.numStartTraining(setupQuestionCount, setupTimeLimit)"
              class="bg-purple-500 px-5 py-2 rounded hover:bg-purple-400">
              再来一次
            </button>
            <button v-if="store.numTraining.wrongQuestions.length > 0" @click="store.numToggleWrongReview()"
              class="bg-orange-600 px-5 py-2 rounded hover:bg-orange-500">
              {{ store.numTraining.showWrongReview ? '隐藏错题' : `查看错题 (${store.numTraining.wrongQuestions.length})` }}
            </button>
            <button @click="store.numResetTraining()" class="bg-gray-700 px-5 py-2 rounded hover:bg-gray-600">
              重新配置
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：统计/错题回看 -->
      <div class="bg-gray-900 rounded-xl p-4">
        <div v-if="!store.numTraining.showWrongReview">
          <div class="flex justify-between mb-3">
            <h3 class="text-purple-300 font-bold">答题记录</h3>
            <button v-if="store.numTraining.wrongQuestions.length > 0" @click="store.numToggleWrongReview()"
              class="text-orange-400 text-xs hover:underline">
              只看错题
            </button>
          </div>
          <div v-if="store.numTraining.questions.length === 0" class="text-gray-500 text-sm text-center py-8">
            开始训练后，答题记录将显示在这里
          </div>
          <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <div v-for="q in [...store.numTraining.questions].reverse()" :key="q.id"
              class="flex items-center gap-3 bg-gray-800 rounded p-2"
              :class="q.isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
              <div class="text-2xl font-bold w-10 text-center" :class="q.isCorrect ? 'text-green-400' : 'text-red-400'">
                {{ q.number }}
              </div>
              <div class="flex-1">
                <div class="text-xs text-gray-400">你的答案</div>
                <BrailleCell :dots="q.userDots" :size="24" />
              </div>
              <div v-if="!q.isCorrect" class="flex-1">
                <div class="text-xs text-gray-400">正确答案</div>
                <BrailleCell :dots="q.correctDots" :size="24" />
              </div>
              <div class="text-lg" :class="q.isCorrect ? 'text-green-400' : 'text-red-400'">
                {{ q.isCorrect ? '✓' : '✗' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 错题回看 -->
        <div v-else>
          <div class="flex justify-between mb-3">
            <h3 class="text-orange-400 font-bold">错题回看 ({{ store.numTraining.wrongQuestions.length }})</h3>
            <button @click="store.numToggleWrongReview()" class="text-gray-400 text-xs hover:underline">
              返回全部
            </button>
          </div>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div v-for="q in store.numTraining.wrongQuestions" :key="q.id"
              class="bg-gray-800 rounded p-3 border-l-4 border-red-500">
              <div class="flex items-center gap-3 mb-2">
                <div class="text-4xl font-bold text-red-400">{{ q.number }}</div>
                <div class="text-sm text-gray-400">数字盲文编码</div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-gray-400 mb-1">你的答案</div>
                  <div class="flex items-center gap-2">
                    <BrailleCell :dots="q.userDots" :size="36" />
                    <span class="text-xs text-gray-500">{{ q.userDots.join(',') || '空' }}</span>
                  </div>
                </div>
                <div>
                  <div class="text-xs text-green-400 mb-1">正确答案</div>
                  <div class="flex items-center gap-2">
                    <BrailleCell :dots="q.correctDots" :size="36" />
                    <span class="text-xs text-gray-500">{{ q.correctDots.join(',') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button @click="doExport" class="bg-green-700 px-4 py-2 rounded self-start hover:bg-green-600 text-sm">
      导出翻译文本
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBrailleStore } from './store/braille'
import { BRAILLE_MAP } from './utils/braille'
import BrailleCell from './components/BrailleCell.vue'

const store = useBrailleStore()
const brailleMap = BRAILLE_MAP
const tabs = [
  { id: 'translate', label: '翻译模式' },
  { id: 'learn', label: '训练模式' },
  { id: 'number', label: '数字训练' },
  { id: 'ref', label: '速查表' },
]
const activeTab = ref('translate')
const setupQuestionCount = ref(20)
const setupTimeLimit = ref(15)

function doExport() {
  const text = store.exportPDF()
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'braille-output.txt'
  a.click()
}
</script>
