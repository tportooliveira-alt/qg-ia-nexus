import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  provider?: string
}

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  addUserMessage: (content: string) => void
  startAssistantMessage: () => string
  appendChunk: (id: string, chunk: string) => void
  finalizeMessage: (id: string, provider?: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,

  addUserMessage: (content) =>
    set((s) => ({
      messages: [...s.messages, { id: crypto.randomUUID(), role: 'user', content }],
    })),

  startAssistantMessage: () => {
    const id = crypto.randomUUID()
    set((s) => ({
      isStreaming: true,
      messages: [...s.messages, { id, role: 'assistant', content: '', streaming: true }],
    }))
    return id
  },

  appendChunk: (id, chunk) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + chunk } : m
      ),
    })),

  finalizeMessage: (id, provider) =>
    set((s) => ({
      isStreaming: false,
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, streaming: false, provider } : m
      ),
    })),

  clearMessages: () => set({ messages: [] }),
}))
