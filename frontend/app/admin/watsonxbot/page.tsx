"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  Bot,
  User,
  Send,
  MessageCircle,
  Clock,
  Brain,
  Zap,
  FileText,
  Search,
  Settings,
  TrendingUp,
  Trash2,
  Download,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

interface ChatMessage {
  id: string
  type: "user" | "bot"
  message: string
  timestamp: string
  intent?: string
  confidence?: number
}

interface ChatHistory {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export default function WatsonXBotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeBot()
    loadChatHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const initializeBot = () => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      type: "bot",
      message:
        "Hello! I'm your CityCare AI Assistant powered by WatsonX. I can help you with:\n\n• Filing complaints\n• Checking complaint status\n• Finding city services\n• Getting resource information\n• Administrative tasks\n\nHow can I assist you today?",
      timestamp: new Date().toISOString(),
      intent: "greeting",
      confidence: 100,
    }
    setMessages([welcomeMessage])
    setLoading(false)
  }

  const loadChatHistory = () => {
    const savedHistory = localStorage.getItem("chatHistory")
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory))
    }
  }

  const saveChatHistory = (history: ChatHistory[]) => {
    localStorage.setItem("chatHistory", JSON.stringify(history))
    setChatHistory(history)
  }

  const startNewChat = () => {
    if (messages.length > 1) {
      // Save current chat if it has messages
      const chatTitle = messages.find((m) => m.type === "user")?.message.slice(0, 50) + "..." || "New Chat"
      const newChat: ChatHistory = {
        id: Date.now().toString(),
        title: chatTitle,
        messages: messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const updatedHistory = [newChat, ...chatHistory]
      saveChatHistory(updatedHistory)
    }

    setCurrentChatId(null)
    initializeBot()
  }

  const loadChat = (chat: ChatHistory) => {
    setCurrentChatId(chat.id)
    setMessages(chat.messages)
  }

  const deleteChat = (chatId: string) => {
    const updatedHistory = chatHistory.filter((chat) => chat.id !== chatId)
    saveChatHistory(updatedHistory)

    if (currentChatId === chatId) {
      initializeBot()
      setCurrentChatId(null)
    }
  }

  const clearAllHistory = () => {
    localStorage.removeItem("chatHistory")
    setChatHistory([])
    if (currentChatId) {
      initializeBot()
      setCurrentChatId(null)
    }
    toast({
      title: "Success",
      description: "All chat history has been cleared",
    })
  }

  const exportChatHistory = () => {
    const dataStr = JSON.stringify(chatHistory, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `chat-history-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      const response = await fetch("/api/bot/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          history: messages.slice(-5),
        }),
      })

      const data = await response.json()

      const botMessage: ChatMessage = {
        id: Date.now().toString() + "_bot",
        type: "bot",
        message: data.message,
        timestamp: new Date().toISOString(),
        intent: data.intent,
        confidence: Math.round(data.confidence * 100),
      }

      setMessages((prev) => [...prev, botMessage])

      // Auto-save current chat
      if (currentChatId) {
        const updatedHistory = chatHistory.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...messages, userMessage, botMessage], updatedAt: new Date().toISOString() }
            : chat,
        )
        saveChatHistory(updatedHistory)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "_error",
        type: "bot",
        message: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            WatsonX AI Assistant
          </h1>
          <p className="text-gray-600">Powered by IBM Watson • Your intelligent city services companion</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      {currentChatId ? "Chat History" : "New Chat"}
                    </CardTitle>
                    <CardDescription>
                      Ask questions about city services, file complaints, or get administrative help
                    </CardDescription>
                  </div>
                  <Button onClick={startNewChat} variant="outline" size="sm">
                    New Chat
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.type === "bot" && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                            {message.type === "user" && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                                {message.type === "bot" && message.confidence && (
                                  <div className="flex items-center gap-1">
                                    <Brain className="h-3 w-3" />
                                    <span className="text-xs opacity-70">{message.confidence}%</span>
                                  </div>
                                )}
                              </div>
                              {message.intent && message.type === "bot" && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {message.intent.replace("_", " ")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={isTyping}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => sendMessage(inputMessage)}
                      disabled={!inputMessage.trim() || isTyping}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => sendMessage("I want to file a new complaint")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  File Complaint
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => sendMessage("Check my complaint status")}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Check Status
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => sendMessage("What city services are available?")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  City Services
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => sendMessage("I need admin help")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Admin Help
                </Button>
              </CardContent>
            </Card>

            {/* Chat History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Chat History
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button onClick={exportChatHistory} variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button onClick={clearAllHistory} variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className={`p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          currentChatId === chat.id ? "bg-blue-50 border border-blue-200" : "border"
                        }`}
                        onClick={() => loadChat(chat)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium truncate">{chat.title}</h4>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteChat(chat.id)
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(chat.createdAt)}</p>
                        <p className="text-xs text-gray-400">{chat.messages.length} messages</p>
                      </div>
                    ))}
                    {chatHistory.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No chat history yet</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Session Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Connected to WatsonX</span>
                </div>
                <div className="text-xs text-gray-500">Messages: {messages.length}</div>
                <div className="text-xs text-gray-500">History: {chatHistory.length} chats</div>
                <Separator />
                <div className="text-xs text-gray-500">Powered by IBM Watson AI</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
