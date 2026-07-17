import request from '../utils/request'
import store from '../store'

const url = '/ai'

export const loadChatHistory = () => {
  return request({
    url: url + '/chat/history',
    method: 'get'
  })
}

export const loadDataScope = () => {
  return request({
    url: url + '/scope',
    method: 'get'
  })
}

export const clearChatHistory = () => {
  return request({
    url: url + '/chat/history',
    method: 'delete'
  })
}

/**
 * HR 智能助手对话（同步，Swagger 测试用）
 */
export const chat = (message) => {
  return request({
    url: url + '/chat',
    method: 'post',
    data: { message },
    timeout: 120000
  })
}

function flushSseBuffer (buffer, onDelta) {
  let remaining = buffer
  let separatorIndex
  while ((separatorIndex = remaining.indexOf('\n\n')) >= 0) {
    const block = remaining.slice(0, separatorIndex)
    remaining = remaining.slice(separatorIndex + 2)
    block.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('data:')) {
        const data = trimmed.slice(5).trim()
        if (data) {
          onDelta(data)
        }
      }
    })
  }
  return remaining
}

/**
 * HR 智能助手流式对话（SSE，上下文由 Redis 维护）
 * @returns {{ abort: Function }}
 */
export const chatStream = (message, { onDelta, onDone, onError }) => {
  const controller = new AbortController()

  fetch(`${process.env.VUE_APP_BASE_API}${url}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: 'Bearer ' + store.getters.token
    },
    body: JSON.stringify({ message }),
    signal: controller.signal
  }).then(async (response) => {
    const contentType = response.headers.get('content-type') || ''
    if (!response.ok) {
      let errorMessage = '请求失败，请稍后重试。'
      try {
        const json = await response.json()
        errorMessage = json.message || errorMessage
      } catch (e) {
        errorMessage = await response.text() || errorMessage
      }
      throw new Error(errorMessage)
    }
    if (!contentType.includes('text/event-stream')) {
      const json = await response.json()
      if (json.code === 200 && json.data && json.data.reply) {
        onDelta(json.data.reply)
        onDone()
        return
      }
      throw new Error(json.message || '请求失败，请稍后重试。')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      buffer = flushSseBuffer(buffer, onDelta)
    }
    if (buffer.trim()) {
      flushSseBuffer(buffer + '\n\n', onDelta)
    }
    onDone()
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      onError(err)
    }
  })

  return {
    abort: () => controller.abort()
  }
}
