"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  User,
  Send,
  MessageCircle,
  Brain,
  Zap,
  TrendingUp,
  Scale,
  Users,
  BookOpen,
  Award,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { watsonxService } from "@/services/bot.service";
import { MessageFormatter } from "@/components/message-formatter";

interface ChatMessage {
  id: string;
  type: "user" | "bot";
  message: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
}

export default function CitizenRightsAgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeBot();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeBot = () => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      type: "bot",
      message:
        "Hello! I'm your Citizen Rights & Schemes AI Agent. I'm here to help you understand your rights and discover government benefits available to you.\n\nI can assist you with:\n\n• Understanding your fundamental rights as a citizen\n• Finding government schemes and benefits you're eligible for\n• Learning about social welfare programs\n• Accessing information about public services\n• Understanding legal procedures and documentation\n• Connecting you with relevant government departments\n\nWhat would you like to know about your rights or available schemes today?",
      timestamp: new Date().toISOString(),
      intent: "greeting",
      confidence: 100,
    };
    setMessages([welcomeMessage]);
    setLoading(false);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const data = await watsonxService.chatWithRightsAgent(
        message.trim(),
        messages.slice(-5),
      );

      const botMessage: ChatMessage = {
        id: Date.now().toString() + "_bot",
        type: "bot",
        message: data.message,
        timestamp: new Date().toISOString(),
        intent: data.intent,
        confidence: Math.round(data.confidence * 100),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "_error",
        type: "bot",
        message:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Scale className="h-8 w-8 text-blue-600" />
              Citizen Rights & Schemes AI Agent
            </h1>
            <p className="text-gray-600">
              Your guide to understanding rights and accessing government
              benefits
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Chat with Rights Agent
                      </CardTitle>
                      <CardDescription>
                        Ask about your rights, government schemes, benefits, and
                        public services
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                  <ScrollArea className="flex-1 px-4 min-h-0">
                    <div className="space-y-4 py-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 break-words ${
                              message.type === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                            style={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                            }}
                          >
                            <div className="flex items-start gap-2">
                              {message.type === "bot" && (
                                <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              )}
                              {message.type === "user" && (
                                <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                {message.type === "bot" ? (
                                  <MessageFormatter
                                    message={message.message}
                                    className="text-gray-900"
                                  />
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap break-words overflow-hidden text-white">
                                    {message.message}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-xs opacity-70">
                                    {formatTime(message.timestamp)}
                                  </span>
                                  {message.type === "bot" &&
                                    message.confidence && (
                                      <div className="flex items-center gap-1">
                                        <Brain className="h-3 w-3" />
                                        <span className="text-xs opacity-70">
                                          {message.confidence}%
                                        </span>
                                      </div>
                                    )}
                                </div>
                                {message.intent && message.type === "bot" && (
                                  <Badge
                                    variant="outline"
                                    className="mt-2 text-xs"
                                  >
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
                  <div className="p-4 border-t flex-shrink-0">
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
                    Rights & Schemes Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() =>
                      sendMessage(
                        "What are my fundamental rights as a citizen?",
                      )
                    }
                  >
                    <Scale className="h-4 w-4 mr-2" />
                    My Rights
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() =>
                      sendMessage("What government schemes am I eligible for?")
                    }
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Eligible Schemes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() =>
                      sendMessage("How do I access social welfare programs?")
                    }
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Welfare Programs
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() =>
                      sendMessage(
                        "What documents do I need for government services?",
                      )
                    }
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documentation Help
                  </Button>
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
                    <span className="text-sm">Connected to Rights Agent</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Messages: {messages.length}
                  </div>
                  <Separator />
                  <div className="text-xs text-gray-500">
                    Powered by CityCare AI
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
