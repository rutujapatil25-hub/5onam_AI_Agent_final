"use client";
import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { supabase } from "@/src/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import {
  LogOut,
  Sun,
  Moon,
  Paperclip,
  Plus,
  Image as ImageIcon,
  MoreVertical,
  Pin,
  Edit2,
  Trash2,
  MessageSquare,
  Bot,
  Wrench,
  Book,
  X,
  ImagePlus,
  Share2,
  Flag,
  Copy,
  Check,
  Save,
  FileText,
  UploadCloud,
} from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:7860";

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  isTyping?: boolean;
  sources?: string[];

};
type Chat = {
  id: number;
  title: string;
  isPinned?: boolean;
  messages: Message[];
};

export default function ZenTechOS() {
  const router = useRouter();
  const params = useParams();

  const idParam = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : null;
  const parsedId = idParam ? parseInt(idParam as string, 10) : null;
  const urlChatId = parsedId && !isNaN(parsedId) ? parsedId : null;

  // Global App State
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("Commander");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [theme, setTheme] = useState<string>("light");

  // Navigation & UI State
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [currentMode, setCurrentMode] = useState<string>("5onam");
  const [currentView, setCurrentView] = useState<string>("chat");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Chat State
  const [inputText, setInputText] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(urlChatId);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Knowledge Base & Onboarding State
  const [knowledgeText, setKnowledgeText] = useState<string>("");
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardName, setOnboardName] = useState("");
  const [onboardBio, setOnboardBio] = useState("");
  const [onboardAvatar, setOnboardAvatar] = useState("");

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
      const savedName = localStorage.getItem("zt_username");
      const savedAvatar = localStorage.getItem("zt_avatar");
      if (savedName) setUserName(savedName);
      if (savedAvatar) setAvatarUrl(savedAvatar);

      const savedTheme = localStorage.getItem("zt_theme") || "light";
      setTheme(savedTheme);
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "admin@zen-tech.com");

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const finalName =
          profile?.full_name ||
          user.user_metadata?.full_name ||
          savedName ||
          "Commander";
        const finalAvatar =
          profile?.avatar_url ||
          user.user_metadata?.avatar_url ||
          savedAvatar ||
          "";

        setUserName(finalName);
        setAvatarUrl(finalAvatar);

        if (finalName !== "Commander")
          localStorage.setItem("zt_username", finalName);
        if (finalAvatar) localStorage.setItem("zt_avatar", finalAvatar);

        const { data: knowledge } = await supabase
          .from("user_knowledge")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (knowledge) {
          setKnowledgeText(knowledge.context_text);
        } else {
          setOnboardName(finalName !== "Commander" ? finalName : "");
          setShowOnboarding(true);
        }
      }
    };
    initApp();
  }, []);

  // --- ONBOARDING LOGIC ---
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !onboardName.trim()) return;

    setIsProcessing(true);
    const compiledKnowledge = `My name is ${onboardName.trim()}.\n${onboardBio.trim()}`;

    await supabase
      .from("user_knowledge")
      .upsert(
        { user_id: userId, context_text: compiledKnowledge },
        { onConflict: "user_id" },
      );

    await supabase
      .from("profiles")
      .upsert(
        { id: userId, full_name: onboardName, avatar_url: onboardAvatar },
        { onConflict: "id" },
      );

    setUserName(onboardName);
    setAvatarUrl(onboardAvatar);
    setKnowledgeText(compiledKnowledge);

    localStorage.setItem("zt_username", onboardName);
    if (onboardAvatar) localStorage.setItem("zt_avatar", onboardAvatar);

    setIsProcessing(false);
    setShowOnboarding(false);
  };

  const saveKnowledge = async () => {
    if (!userId) return;
    setIsSavingKnowledge(true);
    const { error } = await supabase
      .from("user_knowledge")
      .upsert(
        { user_id: userId, context_text: knowledgeText },
        { onConflict: "user_id" },
      );
    setIsSavingKnowledge(false);
    if (!error) {
      Swal.fire({
        icon: "success",
        title: "Knowledge Saved",
        text: "5onam AI will now remember this context.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        background: theme === "dark" ? "#374151" : "#ffffff",
        color: theme === "dark" ? "#fff" : "#000",
      });
    }
  };

  // --- AVATAR UPLOAD LOGIC ---
  const handleChangeAvatar = () => {
    setShowProfileMenu(false);
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File too large",
        text: "Please upload an image smaller than 2MB.",
        background: theme === "dark" ? "#374151" : "#ffffff",
        color: theme === "dark" ? "#fff" : "#000",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      if (showOnboarding) {
        setOnboardAvatar(base64String);
      } else {
        setAvatarUrl(base64String);
        localStorage.setItem("zt_avatar", base64String);
        if (userId) {
          await supabase
            .from("profiles")
            .upsert(
              { id: userId, avatar_url: base64String },
              { onConflict: "id" },
            );
          Swal.fire({
            icon: "success",
            title: "Profile Photo Updated",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 2000,
            background: theme === "dark" ? "#374151" : "#ffffff",
            color: theme === "dark" ? "#fff" : "#000",
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // --- USER PROFILE ACTIONS ---
  const handleToggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("zt_theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    setShowProfileMenu(false);
  };

  const handleSignOut = () => {
    setShowProfileMenu(false);
    Swal.fire({
      title: "Sign Out?",
      text: "Are you sure you want to end this session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, Sign Out",
      background: theme === "dark" ? "#1f2937" : "#ffffff",
      color: theme === "dark" ? "#ffffff" : "#000000",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        localStorage.removeItem("zt_username");
        localStorage.removeItem("zt_avatar");
        router.push("/login");
      }
    });
  };

  // --- FETCH SHARED CHAT ---
  useEffect(() => {
    const fetchSharedChat = async () => {
      if (urlChatId) {
        setIsProcessing(true);
        const { data, error } = await supabase
          .from("chat_history")
          .select("*")
          .eq("chat_id", urlChatId)
          .order("id", { ascending: true });
        if (data && data.length > 0) {
          const reconstructedMessages: Message[] = [];
          data.forEach((row, index) => {
            reconstructedMessages.push({
              id: `prompt-${index}`,
              text: row.prompt,
              isUser: true,
            });
            reconstructedMessages.push({
              id: `resp-${index}`,
              text: row.response,
              isUser: false,
            });
          });
          setChatHistory((prev) => {
            if (prev.find((c) => c.id === urlChatId)) return prev;
            return [
              ...prev,
              {
                id: urlChatId,
                title: generateSmartTitle(data[0].prompt),
                messages: reconstructedMessages,
                isPinned: false,
              },
            ];
          });
          setCurrentChatId(urlChatId);
          setCurrentView("chat");
        }
        setIsProcessing(false);
      }
    };
    fetchSharedChat();
  }, [urlChatId]);

  useEffect(() => {
    if (chatBoxRef.current)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatHistory, currentChatId, currentView]);

  // --- CHAT MANAGEMENT ---
  const createNewChat = () => {
    setCurrentChatId(null);
    setInputText("");
    setCurrentView("chat");
    router.push("/chat");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleShareChat = () => {
    if (!currentChatId) return;
    const shareUrl = `${window.location.origin}/chat/${currentChatId}`;
    navigator.clipboard.writeText(shareUrl);
    Swal.fire({
      icon: "success",
      title: "Link Copied",
      text: "Anyone with this link can view this chat.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2500,
      background: theme === "dark" ? "#374151" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
    });
  };

  const renameChat = (id: number) => {
    setActiveMenuId(null);
    Swal.fire({
      title: "Rename Chat",
      input: "text",
      showCancelButton: true,
      confirmButtonText: "Save",
      background: theme === "dark" ? "#1f2937" : "#ffffff",
      color: theme === "dark" ? "#ffffff" : "#000000",
    }).then((result) => {
      if (result.isConfirmed && result.value)
        setChatHistory((prev) =>
          prev.map((chat) =>
            chat.id === id ? { ...chat, title: result.value } : chat,
          ),
        );
    });
  };

  const deleteChat = (id: number) => {
    setActiveMenuId(null);
    setChatHistory((prev) => prev.filter((chat) => chat.id !== id));
    if (currentChatId === id) createNewChat();
  };

  const togglePinChat = (id: number) => {
    setActiveMenuId(null);
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, isPinned: !chat.isPinned } : chat,
      ),
    );
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const insertImagePrompt = () => {
    setInputText((prev) => `/image ${prev}`);
    setShowPlusMenu(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Swal.fire({
        title: "File Attached",
        text: `${file.name} ready for upload.`,
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        background: theme === "dark" ? "#374151" : "#ffffff",
        color: theme === "dark" ? "#fff" : "#000",
      });
    }
  };

  const generateSmartTitle = (text: string) => {
    let cleanText = text
      .replace(
        /^(can you|please|tell me about|how to|what is|write a|create a|give me|explain|generate)\s+/i,
        "",
      )
      .trim();
    if (!cleanText) cleanText = text;
    const words = cleanText.split(" ").slice(0, 5).join(" ");
    const title = words.charAt(0).toUpperCase() + words.slice(1);
    return title.length > 28 ? title.substring(0, 28) + "..." : title;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const currentText = inputText.trim();
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsProcessing(true);

    let activeChatId = currentChatId;
    let updatedHistory = [...chatHistory];

    let chatIndex = updatedHistory.findIndex((c) => c.id === activeChatId);

    if (!activeChatId || chatIndex === -1) {
      activeChatId = activeChatId || Date.now();
      window.history.pushState(null, "", `/chat/${activeChatId}`);

      updatedHistory.push({
        id: activeChatId,
        title: generateSmartTitle(currentText),
        messages: [],
        isPinned: false,
      });

      chatIndex = updatedHistory.length - 1;
    }

    updatedHistory[chatIndex].messages.push({
      id: Date.now().toString(),
      text: currentText,
      isUser: true,
    });

    setChatHistory([...updatedHistory]);
    setCurrentChatId(activeChatId);

    const isImagePrompt = currentText.startsWith("/image");

    updatedHistory[chatIndex].messages.push({
      id: "loading",
      text: "Processing...",
      isUser: false,
      isTyping: true,
    });
    setChatHistory([...updatedHistory]);

    try {
      if (isImagePrompt) {
        const promptStr = currentText.replace(/^\/image\s*/i, "");
        const encodedPrompt = encodeURIComponent(promptStr);
        const randomSeed = Math.floor(Math.random() * 100000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${randomSeed}`;

        const now = new Date();
        const formattedDateTime = now
          .toISOString()
          .split(".")[0]
          .replace("T", "_")
          .replace(/:/g, "-");
        const trackingLabel = `${userEmail}_${formattedDateTime}`;

        if (userId) {
          await supabase.from("ai_images").insert([
            {
              user_id: userId,
              prompt: promptStr,
              image_url: imageUrl,
              label: trackingLabel,
            },
          ]);
        }

        const markdownImage = `![${promptStr}](${imageUrl})`;

        await supabase.from("chat_history").insert({
          user_id: userId,
          chat_id: activeChatId,
          prompt: currentText,
          response: markdownImage,
        });

        updatedHistory[chatIndex].messages.pop();
        updatedHistory[chatIndex].messages.push({
          id: Date.now().toString(),
          text: markdownImage,
          isUser: false,
        });

        setChatHistory([...updatedHistory]);
        setIsProcessing(false);
        if (textareaRef.current) textareaRef.current.focus();
        return;
      }

      // --- STANDARD CHAT LOGIC ---
      const backendMode =
        currentMode === "3ena" ? "Zimage Generation" : "Gemini 2.5 Flash";
      const payloadText = knowledgeText
        ? `System Memory/Context: [${knowledgeText}]\n\nUser Request: ${currentText}`
        : currentText;

      // GET AUTH TOKEN FOR BACKEND
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authToken = session?.access_token || "";

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`, // Fixed header authorization
        },
        body: JSON.stringify({
          message: payloadText,
          mode: backendMode,
          user_id: userId,
        }),
      });
      const data = await response.json();

      updatedHistory[chatIndex].messages.pop();

      if (response.ok) {
        await supabase.from("chat_history").insert({
          user_id: userId,
          chat_id: activeChatId,
          prompt: currentText,
          response: data.response,
        });
        updatedHistory[chatIndex].messages.push({
          id: Date.now().toString(),
          text: data.response,
          isUser: false,
          sources: data.sources || [],
        });
      }
    } catch (err) {
      updatedHistory[chatIndex].messages.pop();
      updatedHistory[chatIndex].messages.push({
        id: Date.now().toString(),
        text: "**Connection Failure:** Unable to reach server.",
        isUser: false,
      });
    }

    setChatHistory([...updatedHistory]);
    setIsProcessing(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseMarkdown = (text: string) => {
    let html = text.replace(
      /!\[([^\]]*)\]\((.*?)\)/g,
      '<div class="mt-4 mb-2 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm inline-block w-full"><img src="$2" alt="$1" class="w-full h-auto object-cover" /></div>',
    );
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(
      /```([\s\S]*?)```/g,
      "<pre><code class='bg-gray-100 dark:bg-gray-800 p-4 rounded-xl block overflow-x-auto text-sm my-2'>$1</code></pre>",
    );
    html = html.replace(/\n/g, "<br>");
    return html;
  };

  const activeChat = chatHistory.find((c) => c.id === currentChatId);
  const pinnedChats = chatHistory.filter((c) => c.isPinned);
  const recentChats = chatHistory.filter((c) => !c.isPinned);
  const defaultAvatar = `https://ui-avatars.com/api/?name=${userName}&background=random`;

  return (
    <div
      className={`h-screen w-full flex text-gray-900 font-sans overflow-hidden transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}
    >
      <input
        type="file"
        accept="image/*"
        ref={avatarInputRef}
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* ONBOARDING MODAL */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in ${theme === "dark" ? "bg-gray-900 border border-gray-800" : "bg-white"}`}
          >
            <div className="p-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-6">
                5
              </div>
              <h2 className="text-2xl font-bold mb-2">Initialize System</h2>
              <p className="text-gray-500 text-sm mb-6">
                Setup your profile and knowledge base so the AI agent knows
                exactly who you are.
              </p>

              <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Designation / Name
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardName}
                    onChange={(e) => setOnboardName(e.target.value)}
                    placeholder="e.g. Commander, Tejas..."
                    className={`w-full h-11 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 ${theme === "dark" ? "bg-gray-800 text-white placeholder-gray-600" : "bg-gray-100 text-gray-900"}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Profile Photo (Optional)
                  </label>
                  <div className="flex gap-4 items-center">
                    <img
                      src={
                        onboardAvatar ||
                        `https://ui-avatars.com/api/?name=${onboardName || "U"}&background=random`
                      }
                      alt="preview"
                      className="w-14 h-14 rounded-full bg-gray-200 object-cover shrink-0 shadow-sm border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${theme === "dark" ? "border-gray-700 hover:bg-gray-800 text-gray-300" : "border-gray-200 hover:bg-gray-50 text-gray-700"}`}
                    >
                      Upload Photo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Bio / Knowledge Base
                  </label>
                  <textarea
                    required
                    value={onboardBio}
                    onChange={(e) => setOnboardBio(e.target.value)}
                    placeholder="I am the founder of Zen-Tech. My main interests are..."
                    rows={3}
                    className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none ${theme === "dark" ? "bg-gray-800 text-white placeholder-gray-600" : "bg-gray-100 text-gray-900"}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-11 mt-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Complete Setup"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`border-r flex flex-col transition-all duration-300 shrink-0 h-full ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-gray-50/50 border-gray-200"} ${sidebarOpen ? "w-64" : "w-[72px] items-center"}`}
      >
        <div
          className={`p-4 flex flex-col h-full relative ${!sidebarOpen && "items-center px-2"}`}
        >
          <div
            className={`flex items-center gap-2 mb-6 ${!sidebarOpen && "justify-center w-full"}`}
          >
            <div className="w-8 h-8 shrink-0 bg-indigo-600 text-white rounded text-sm flex items-center justify-center font-bold">
              5
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-sm tracking-tight">
                5onam AI
              </span>
            )}
          </div>

          <button
            onClick={createNewChat}
            className={`flex items-center justify-center border shadow-sm transition rounded-lg mb-6 ${sidebarOpen ? "w-full px-3 py-2 justify-start" : "w-10 h-10"} ${theme === "dark" ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"}`}
          >
            <Plus size={18} />
            {sidebarOpen && (
              <span className="ml-2 text-sm font-medium">New Chat</span>
            )}
          </button>

          <nav
            className={`flex flex-col gap-2 mb-6 ${!sidebarOpen && "w-full items-center"}`}
          >
            <button
              onClick={() => setCurrentView("chat")}
              className={`flex items-center gap-3 rounded-lg transition ${sidebarOpen ? "px-3 py-2 w-full text-sm" : "w-10 h-10 justify-center"} ${currentView === "chat" ? (theme === "dark" ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-50 text-indigo-700") : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <MessageSquare size={18} />{" "}
              {sidebarOpen && <span className="font-medium">Chat</span>}
            </button>
            <button
              onClick={() => setCurrentView("agents")}
              className={`flex items-center gap-3 rounded-lg transition ${sidebarOpen ? "px-3 py-2 w-full text-sm" : "w-10 h-10 justify-center"} ${currentView === "agents" ? (theme === "dark" ? "bg-gray-800" : "bg-gray-100") : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <Bot size={18} />{" "}
              {sidebarOpen && <span className="font-medium">Explore</span>}
            </button>
            <button
              onClick={() => setCurrentView("tools")}
              className={`flex items-center gap-3 rounded-lg transition ${sidebarOpen ? "px-3 py-2 w-full text-sm" : "w-10 h-10 justify-center"} ${currentView === "tools" ? (theme === "dark" ? "bg-gray-800" : "bg-gray-100") : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <Wrench size={18} />{" "}
              {sidebarOpen && <span className="font-medium">Tools</span>}
            </button>
            <button
              onClick={() => setCurrentView("knowledge")}
              className={`flex items-center gap-3 rounded-lg transition ${sidebarOpen ? "px-3 py-2 w-full text-sm" : "w-10 h-10 justify-center"} ${currentView === "knowledge" ? (theme === "dark" ? "bg-gray-800" : "bg-gray-100") : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <Book size={18} />{" "}
              {sidebarOpen && <span className="font-medium">Knowledge</span>}
            </button>
          </nav>

          <div
            className={`flex-1 overflow-y-auto no-scrollbar pb-4 ${!sidebarOpen && "hidden"}`}
          >
            {pinnedChats.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-2 px-2 flex items-center gap-1">
                  <Pin size={12} /> Pinned
                </h3>
                <div className="flex flex-col gap-1">
                  {pinnedChats.map((chat) => (
                    <div key={chat.id} className="relative group">
                      <div
                        onClick={() => {
                          setCurrentChatId(chat.id);
                          setCurrentView("chat");
                          router.push(`/chat/${chat.id}`);
                        }}
                        className={`cursor-pointer px-3 py-2 rounded-lg text-sm flex justify-between items-center transition ${currentChatId === chat.id ? (theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black") : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                      >
                        <span className="truncate w-full pr-6">
                          {chat.title}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setActiveMenuId(
                            activeMenuId === chat.id ? null : chat.id,
                          )
                        }
                        className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === chat.id && (
                        <div
                          className={`absolute right-0 top-8 w-32 rounded-md shadow-lg border z-50 text-xs py-1 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                        >
                          <button
                            onClick={() => togglePinChat(chat.id)}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Pin size={12} /> Unpin
                          </button>
                          <button
                            onClick={() => renameChat(chat.id)}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit2 size={12} /> Rename
                          </button>
                          <button
                            onClick={() => deleteChat(chat.id)}
                            className="w-full text-left px-3 py-1.5 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h3 className="text-xs font-semibold text-gray-500 mb-2 px-2">
              Recent Chats
            </h3>
            <div className="flex flex-col gap-1">
              {[...recentChats].reverse().map((chat) => (
                <div key={chat.id} className="relative group">
                  <div
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      setCurrentView("chat");
                      router.push(`/chat/${chat.id}`);
                    }}
                    className={`cursor-pointer px-3 py-2 rounded-lg text-sm flex justify-between items-center transition ${currentChatId === chat.id ? (theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black") : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                  >
                    <span className="truncate w-full pr-6">{chat.title}</span>
                  </div>
                  <button
                    onClick={() =>
                      setActiveMenuId(activeMenuId === chat.id ? null : chat.id)
                    }
                    className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {activeMenuId === chat.id && (
                    <div
                      className={`absolute right-0 top-8 w-32 rounded-md shadow-lg border z-50 text-xs py-1 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <button
                        onClick={() => togglePinChat(chat.id)}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Pin size={12} /> Pin Chat
                      </button>
                      <button
                        onClick={() => renameChat(chat.id)}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Edit2 size={12} /> Rename
                      </button>
                      <button
                        onClick={() => deleteChat(chat.id)}
                        className="w-full text-left px-3 py-1.5 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            className={`mt-auto pt-4 border-t ${theme === "dark" ? "border-gray-800" : "border-gray-200"} flex flex-col w-full relative`}
          >
            {showProfileMenu && (
              <div
                className={`absolute bottom-[110%] left-0 w-full min-w-[200px] rounded-lg shadow-xl border z-50 py-1 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <button
                  onClick={handleChangeAvatar}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                >
                  <ImagePlus size={14} /> Change Photo
                </button>
                <button
                  onClick={handleToggleTheme}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                >
                  {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}{" "}
                  Theme: {theme === "light" ? "Light" : "Dark"}
                </button>
                <div
                  className={`h-px w-full my-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
                ></div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-3 p-2 rounded-lg w-full transition ${!sidebarOpen && "justify-center"} ${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-400/30">
                <img
                  src={avatarUrl || defaultAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {sidebarOpen && (
                <span className="text-sm font-medium truncate flex-1 text-left">
                  {userName}
                </span>
              )}
              {sidebarOpen && (
                <MoreVertical size={14} className="text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-14 flex items-center justify-between px-6 shrink-0 w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-1 rounded transition ${theme === "dark" ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                ></path>
              </svg>
            </button>
            <span className="font-medium text-sm capitalize">
              {currentView.replace("-", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentChatId && currentView === "chat" && (
              <button
                onClick={handleShareChat}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition border shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"}`}
              >
                <Share2 size={14} /> Share
              </button>
            )}
          </div>
        </header>

        {currentView === "agents" && (
          <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col items-center">
            <Bot size={48} className="text-indigo-500 mb-4 opacity-80" />
            <h2 className="text-2xl font-semibold mb-2">Explore Agents</h2>
            <p className="text-gray-500 text-sm mb-8 text-center max-w-md">
              Discover specialized AI agents tuned for programming, creative
              writing, and data analysis.
            </p>
          </div>
        )}

        {currentView === "tools" && (
          <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col items-center">
            <Wrench size={48} className="text-orange-500 mb-4 opacity-80" />
            <h2 className="text-2xl font-semibold mb-2">Workspace Tools</h2>
            <p className="text-gray-500 text-sm mb-8 text-center max-w-md">
              Connect your API keys, manage integrations, and configure
              automation workflows.
            </p>
          </div>
        )}

        {currentView === "knowledge" && (
          <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-32 py-10 w-full scroll-smooth">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-5 mb-10">
                <div
                  className={`p-4 rounded-2xl shrink-0 ${theme === "dark" ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"}`}
                >
                  <Book size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">
                    Knowledge Base
                  </h2>
                  <p
                    className={`text-sm leading-relaxed max-w-2xl ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Information provided here is continuously injected into your
                    chats. Use this space to define your identity, preferences,
                    and essential facts the AI should memorize.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div
                  className={`relative overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md ${theme === "dark" ? "bg-gray-800/50 border-gray-700/80" : "bg-white border-gray-200/80"}`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500`}
                  ></div>
                  <div
                    className={`px-6 py-5 border-b flex items-center justify-between ${theme === "dark" ? "border-gray-700/80" : "border-gray-100"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${theme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px]">
                          Custom Instructions
                        </h3>
                        <p
                          className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                        >
                          What would you like 5onam AI to know about you?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <textarea
                      value={knowledgeText}
                      onChange={(e) => setKnowledgeText(e.target.value)}
                      placeholder="e.g., My name is Tejas Shinde. I am the founder of Zen-Tech International..."
                      className={`w-full h-48 rounded-xl p-5 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-shadow ${theme === "dark" ? "bg-gray-900/50 text-gray-100 placeholder-gray-600 border border-gray-700" : "bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200"}`}
                    />
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={saveKnowledge}
                        disabled={isSavingKnowledge}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <Save size={16} />{" "}
                        {isSavingKnowledge ? "Saving..." : "Save Instructions"}
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border shadow-sm transition-all hover:shadow-md ${theme === "dark" ? "bg-gray-800/50 border-gray-700/80" : "bg-white border-gray-200/80"}`}
                >
                  <div
                    className={`px-6 py-5 border-b flex items-center justify-between ${theme === "dark" ? "border-gray-700/80" : "border-gray-100"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${theme === "dark" ? "bg-green-500/20 text-green-400" : "bg-green-50 text-green-600"}`}
                      >
                        <UploadCloud size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px]">
                          Upload Documents
                        </h3>
                        <p
                          className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                        >
                          PDF, CSV, or TXT
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                    >
                      Pro Feature
                    </span>
                  </div>
                  <div className="p-6">
                    <div
                      className={`group relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all cursor-pointer ${theme === "dark" ? "border-gray-600 bg-gray-900/30 hover:border-green-500/50 hover:bg-gray-900/60" : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50"}`}
                    >
                      <div
                        className={`p-4 rounded-full mb-3 transition-transform group-hover:scale-110 ${theme === "dark" ? "bg-gray-800 text-gray-400" : "bg-white text-gray-400 shadow-sm"}`}
                      >
                        <UploadCloud size={28} />
                      </div>
                      <p
                        className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}
                      >
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Maximum file size 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === "chat" && (
          <>
            <div
              ref={chatBoxRef}
              className="flex-1 overflow-y-auto px-4 md:px-20 lg:px-40 pb-36 pt-4 scroll-smooth w-full"
            >
              {!activeChat ? (
                <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto -mt-10">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-xl text-3xl flex items-center justify-center font-bold mb-6 shadow-lg shadow-indigo-500/20">
                    5
                  </div>
                  <h2 className="text-2xl font-semibold mb-2 tracking-tight">
                    Welcome back, {userName}
                  </h2>
                  <p className="text-gray-500 mb-10 text-sm">
                    Your intelligent AI assistant for coding, research, and
                    automation.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                    {[
                      {
                        icon: "💡",
                        title: "Explain a concept",
                        desc: "Explain quantum computing in simple terms",
                      },
                      {
                        icon: "🎨",
                        title: "Create Graphic",
                        desc: "/image A futuristic cyberpunk city landscape",
                      },
                      {
                        icon: "📊",
                        title: "Analyze data",
                        desc: "Help me analyze this dataset",
                      },
                      {
                        icon: "🎯",
                        title: "Brainstorm ideas",
                        desc: "Suggest AI project ideas for automation",
                      },
                    ].map((card, i) => (
                      <div
                        key={i}
                        onClick={() => setInputText(card.desc)}
                        className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${theme === "dark" ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <div className="text-2xl mb-3 drop-shadow-sm">
                          {card.icon}
                        </div>
                        <h4 className="font-semibold text-sm mb-1">
                          {card.title}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-8 w-full max-w-3xl mx-auto">
                  {activeChat.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex w-full animate-fade-in ${msg.isUser ? "justify-end" : "justify-start"}`}
                    >
                      {msg.isUser ? (
                        <div
                          className={`px-5 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${theme === "dark" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"}`}
                        >
                          {msg.text}
                        </div>
                      ) : msg.isTyping ? (
                        <div className="flex items-start gap-4 w-full">
                          <div className="flex items-center h-8 pl-2">
                            <div className="flex gap-1.5 items-center">
                              <div
                                className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 w-full group">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-md">
                            5
                          </div>
                          <div className="flex-1 flex flex-col pt-1">
                            <div
                              className={`text-[15px] leading-relaxed markdown-body ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                              dangerouslySetInnerHTML={{
                                __html: parseMarkdown(msg.text),
                              }}
                            />
                            {msg.sources && msg.sources.length > 0 && (
                             <div className="mt-4">
                               <p
                                 className={`text-xs font-semibold mb-2 ${
                                   theme === "dark" ? "text-gray-400" : "text-gray-500"
                                  }`}
                               >
                                  Sources
                               </p>

                               <div className="flex flex-wrap gap-2">
                                {msg.sources.map((source, index) => (
                                  <a
                                    key={`${msg.id}-source-${index}`}
                                    href={source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                                      theme === "dark"
                                        ? "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300"
                                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                  <div className="flex flex-col">
                                    <span className="font-semibold">
                                      📖{" "}
                                      {decodeURIComponent(
                                        new URL(source).pathname
                                          .split("/")
                                          .pop()
                                          ?.replace(/_/g, " ") || "Source"
                                      )}
                                    </span>

                                    <span className="text-[11px] opacity-70 break-all mt-1">
                                      {source}
                                    </span>
                                   </div> 
                                 </a>
                                ))}
                            </div>
                          </div>
                         )}
                            <div className="flex items-center gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  copyToClipboard(msg.text, msg.id)
                                }
                                className="text-gray-400 hover:text-indigo-500 flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check
                                      size={12}
                                      className="text-green-500"
                                    />{" "}
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} /> Copy
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  Swal.fire({
                                    title: "Report Sent",
                                    icon: "success",
                                    toast: true,
                                    position: "top-end",
                                    showConfirmButton: false,
                                    timer: 2500,
                                    background:
                                      theme === "dark" ? "#374151" : "#ffffff",
                                    color: theme === "dark" ? "#fff" : "#000",
                                  })
                                }
                                className="text-gray-400 hover:text-red-500 flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                              >
                                <Flag size={12} /> Report incorrect info
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`absolute bottom-0 left-0 right-0 pt-6 pb-6 px-4 md:px-20 lg:px-40 bg-gradient-to-t ${theme === "dark" ? "from-gray-900 via-gray-900 to-transparent" : "from-white via-white to-transparent"}`}
            >
              <div className="max-w-3xl mx-auto relative">
                {showPlusMenu && (
                  <div
                    className={`absolute bottom-16 left-0 rounded-lg shadow-xl border p-2 z-50 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                  >
                    <button
                      onClick={insertImagePrompt}
                      className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded text-sm transition font-medium ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                    >
                      <ImageIcon size={16} className="text-indigo-500" />{" "}
                      Generate Image (/image)
                    </button>
                  </div>
                )}

                <div
                  className={`border shadow-md rounded-[24px] flex items-end px-2 py-2 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all w-full ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className="flex gap-1 items-center pb-1.5 pl-1">
                    <button
                      onClick={() => setShowPlusMenu(!showPlusMenu)}
                      className={`p-2 rounded-full transition ${theme === "dark" ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
                    >
                      {showPlusMenu ? <X size={18} /> : <Plus size={18} />}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 rounded-full transition ${theme === "dark" ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
                    >
                      <Paperclip size={18} />
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Message 5onam AI Agent..."
                    className={`flex-1 bg-transparent placeholder-gray-400 focus:outline-none py-2.5 px-2 text-[15px] max-h-[200px] resize-none border-none ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                  />
                  <div className="flex gap-2 items-center pb-1.5 pr-1">
                    <button
                      onClick={sendMessage}
                      disabled={!inputText.trim() || isProcessing}
                      className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-full transition-all disabled:opacity-30 disabled:bg-gray-400 hover:bg-indigo-700 active:scale-95 shadow-md"
                    >
                      <svg
                        className="w-4 h-4 ml-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M12 19V5m0 0l-7 7m7-7l7 7"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-center mt-3 text-[11px] text-gray-400 font-medium tracking-wide">
                  5onam AI Agent can make mistakes. Please verify important
                  information.
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
