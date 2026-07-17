<template>
  <div class="ai-chat">
    <el-card class="chat-card" shadow="never">
      <div slot="header" class="chat-header">
        <span><i class="el-icon-chat-dot-round"></i> HRM 智能人事助手</span>
        <div class="header-right">
          <el-tag v-if="dataScope.description" size="mini" type="info">
            数据范围：{{ dataScope.description }}
          </el-tag>
          <el-button type="text" size="mini" @click="clearMessages">清空对话</el-button>
        </div>
      </div>

      <div ref="messageBox" class="message-box">
        <div
          v-for="(item, index) in messages"
          :key="index"
          :class="['message-row', item.role]"
        >
          <div class="avatar">
            <i :class="item.role === 'user' ? 'el-icon-user-solid' : 'el-icon-cpu'"></i>
          </div>
          <div class="bubble">
            <div class="name">{{ item.role === 'user' ? staffName : '智能助手' }}</div>
            <div class="content">
              {{ item.content || (item.streaming ? '正在思考…' : '') }}<span v-if="item.streaming" class="cursor">▋</span>
            </div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model.trim="input"
          type="textarea"
          :rows="3"
          resize="none"
          placeholder="例如：帮我查一下张三在哪个部门"
          :disabled="loading"
          @keyup.enter.native="handleEnter"
        />
        <div class="actions">
          <span class="hint">Enter 发送，Shift + Enter 换行</span>
          <el-button type="primary" :loading="loading" :disabled="!input" @click="send">
            发送
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { chatStream, loadChatHistory, clearChatHistory, loadDataScope } from '@/api/ai'
import { mapGetters } from 'vuex'

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: '你好，我是 HRM 智能人事助手。可以帮你查询员工信息、考勤统计和请假记录。'
}

const CLEARED_MESSAGE = {
  role: 'assistant',
  content: '对话已清空。可以继续提问，例如：帮我查一下张三在哪个部门。'
}

export default {
  name: 'AiAssistant',
  data () {
    return {
      input: '',
      loading: false,
      messages: [],
      streamController: null,
      dataScope: {}
    }
  },
  computed: {
    ...mapGetters(['staff']),
    staffName () {
      return this.staff && this.staff.name ? this.staff.name : '我'
    }
  },
  mounted () {
    this.loadHistoryFromServer()
    this.loadScope()
  },
  beforeDestroy () {
    this.abortStream()
  },
  methods: {
    handleEnter (event) {
      if (event.shiftKey) {
        return
      }
      event.preventDefault()
      this.send()
    },
    send () {
      const message = this.input
      if (!message || this.loading) {
        return
      }

      this.abortStream()
      this.messages.push({ role: 'user', content: message })
      this.input = ''
      this.loading = true

      const assistantIndex = this.messages.length
      this.messages.push({
        role: 'assistant',
        content: '',
        streaming: true
      })
      this.scrollToBottom()

      this.streamController = chatStream(message, {
        onDelta: (delta) => {
          this.messages[assistantIndex].content += delta
          this.scrollToBottom()
        },
        onDone: () => {
          this.loading = false
          this.messages[assistantIndex].streaming = false
          this.streamController = null
          if (!this.messages[assistantIndex].content) {
            this.messages[assistantIndex].content = '（无回复）'
          }
          this.scrollToBottom()
        },
        onError: (err) => {
          this.loading = false
          this.messages[assistantIndex].streaming = false
          this.streamController = null
          this.messages[assistantIndex].content = (err && err.message) || '流式请求失败，请确认后端已启动。'
          this.scrollToBottom()
        }
      })
    },
    abortStream () {
      if (this.streamController) {
        this.streamController.abort()
        this.streamController = null
      }
    },
    loadHistoryFromServer () {
      loadChatHistory().then(response => {
        if (response.code === 200 && Array.isArray(response.data) && response.data.length > 0) {
          this.messages = response.data
        } else {
          this.messages = [Object.assign({}, WELCOME_MESSAGE)]
        }
        this.scrollToBottom()
      }).catch(() => {
        this.messages = [Object.assign({}, WELCOME_MESSAGE)]
      })
    },
    loadScope () {
      loadDataScope().then(response => {
        if (response.code === 200 && response.data) {
          this.dataScope = response.data
        }
      }).catch(() => {})
    },
    clearMessages () {
      this.abortStream()
      this.loading = false
      clearChatHistory().finally(() => {
        this.messages = [Object.assign({}, CLEARED_MESSAGE)]
        this.scrollToBottom()
      })
    },
    scrollToBottom () {
      this.$nextTick(() => {
        const box = this.$refs.messageBox
        if (box) {
          box.scrollTop = box.scrollHeight
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.ai-chat {
  height: calc(100vh - 180px);
  min-height: 520px;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  /deep/ .el-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
  }
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;

  i {
    margin-right: 6px;
    color: #409eff;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-box {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background: #f5f7fa;
}

.message-row {
  display: flex;
  margin-bottom: 16px;

  &.user {
    flex-direction: row-reverse;

    .bubble {
      background: #409eff;
      color: #fff;
      margin-right: 12px;
      margin-left: 0;
    }

    .name {
      color: rgba(255, 255, 255, 0.85);
    }
  }

  &.assistant .bubble {
    background: #fff;
    margin-left: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    color: #606266;
    font-size: 18px;
  }
}

.bubble {
  max-width: 72%;
  padding: 10px 14px;
  border-radius: 10px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.name {
  font-size: 12px;
  margin-bottom: 4px;
  color: #909399;
}

.content {
  font-size: 14px;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.loading .content {
  color: #909399;
}

.input-area {
  border-top: 1px solid #ebeef5;
  padding: 12px 16px 16px;
  background: #fff;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.hint {
  font-size: 12px;
  color: #909399;
}
</style>
