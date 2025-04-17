"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera,
  Upload,
  Mic,
  MicOff,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  ImportIcon as Translate,
  FileText,
  ChevronUp,
  Volume2,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  ImageIcon,
  Sparkles,
  RotateCcw,
  Zap,
  Layers,
  Clock,
  Check,
  AlertCircle,
  Globe,
  Cpu,
  Info,
} from "lucide-react"

function Converter() {
  // State management
  const [image, setImage] = useState(null)
  const [text, setText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [confidence, setConfidence] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState("")
  const [targetLanguage, setTargetLanguage] = useState("en")
  const [isListening, setIsListening] = useState(false)
  const [voiceCommandLanguage, setVoiceCommandLanguage] = useState("en")
  const recognitionRef = useRef(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const currentUtteranceRef = useRef(null)
  const [recognitionError, setRecognitionError] = useState(null)
  const [summary, setSummary] = useState("")
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [latestImageData, setLatestImageData] = useState(null)
  const [activeTab, setActiveTab] = useState("original")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showVoiceHints, setShowVoiceHints] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationType, setNotificationType] = useState("success")
  const fileInputRef = useRef(null)
  const [showFeatures, setShowFeatures] = useState(false)

  // Enhanced languages array with more options
  const languages = [
    { code: "en", name: "English", voiceCode: "en" },
    { code: "ta", name: "Tamil", voiceCode: "ta" },
    { code: "hi", name: "Hindi", voiceCode: "hi" },
    { code: "es", name: "Spanish", voiceCode: "es" },
    { code: "fr", name: "French", voiceCode: "fr" },
    { code: "de", name: "German", voiceCode: "de" },
    { code: "zh", name: "Chinese", voiceCode: "zh" },
    { code: "ja", name: "Japanese", voiceCode: "ja" },
    { code: "ar", name: "Arabic", voiceCode: "ar" },
  ]

  // Enhanced voice command phrases with more languages
  const voiceCommands = {
    en: {
      read: ["read", "speak", "play", "start"],
      stop: ["stop", "end"],
      pause: ["pause", "wait", "hold"],
      continue: ["continue", "resume", "go on"],
      translateTo: ["translate to", "read in", "speak in", "convert to"],
      summarize: ["summarize", "summary", "make it short", "brief"],
    },
    ta: {
      read: ["படி", "வாசி", "பேசு", "ஒலிபரப்பு", "தொடங்கு"],
      stop: ["நிறுத்து", "முடி"],
      pause: ["இடைநிறுத்து", "பாஸ்", "காத்திரு"],
      continue: ["தொடர்", "தொடரவும்", "மீண்டும் தொடங்கு"],
      translateTo: ["மொழிபெயர்", "மொழியில் படி", "மொழியில் பேசு"],
      summarize: ["சுருக்கு", "சுருக்கம்", "சுருக்கமாக"],
    },
    hi: {
      read: ["पढ़ो", "बोलो", "शुरू करो", "चालू करो"],
      stop: ["रुको", "बंद करो", "समाप्त"],
      pause: ["ठहरो", "रुक जाओ", "पॉज़"],
      continue: ["जारी रखो", "फिर से शुरू करो", "चालू करो"],
      translateTo: ["अनुवाद करो", "भाषा में पढ़ो", "भाषा में बोलो"],
      summarize: ["सारांश", "संक्षेप में बताओ", "छोटा करो"],
    },
    es: {
      read: ["leer", "hablar", "reproducir", "iniciar"],
      stop: ["parar", "terminar"],
      pause: ["pausar", "esperar", "detener"],
      continue: ["continuar", "reanudar", "seguir"],
      translateTo: ["traducir a", "leer en", "hablar en", "convertir a"],
      summarize: ["resumir", "resumen", "hacerlo corto", "breve"],
    },
    fr: {
      read: ["lire", "parler", "jouer", "commencer"],
      stop: ["arrêter", "terminer"],
      pause: ["pause", "attendre", "suspendre"],
      continue: ["continuer", "reprendre", "poursuivre"],
      translateTo: ["traduire en", "lire en", "parler en", "convertir en"],
      summarize: ["résumer", "résumé", "rendre court", "bref"],
    },
  }

  // Pexels images for the UI
  const pexelsImages = {
    hero: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
    features: [
      "https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg",
      "https://images.pexels.com/photos/3183154/pexels-photo-3183154.jpeg",
      "https://images.pexels.com/photos/3183155/pexels-photo-3183155.jpeg"
    ],
    background: "https://images.pexels.com/photos/3183156/pexels-photo-3183156.jpeg",
    placeholder: "https://images.pexels.com/photos/3183157/pexels-photo-3183157.jpeg"
  }

  // Fetch latest image data
  const fetchLatestImage = async () => {
    try {
      const response = await axios.get("http://localhost:3000/latest-image")
      setLatestImageData(response.data)
      showNotificationMessage("Latest image data loaded", "success")
    } catch (err) {
      console.error("Error fetching latest image:", err)
      showNotificationMessage("Failed to fetch latest image", "error")
    }
  }

  useEffect(() => {
    fetchLatestImage()
  }, [])

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
      showNotificationMessage("Image selected", "success")
    }
  }

  // Handle file upload and text extraction
  const handleUpload = async () => {
    if (!image) {
      showNotificationMessage("Please select an image first", "error")
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("image", image)

    try {
      const response = await axios.post("http://localhost:3000/upload", formData)
      setText(response.data.text)
      setConfidence(response.data.confidence)
      fetchLatestImage() // Refresh latest image data
      showNotificationMessage("Text extracted successfully", "success")
    } catch (error) {
      console.error("Error extracting text:", error)
      setText("Error extracting text from image. Please try again.")
      showNotificationMessage("Failed to extract text", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced playText function with better language-specific voice selection
  const playText = (textToPlay, lang = "en") => {
    if (!textToPlay) {
      showNotificationMessage("No text to play", "error")
      return
    }

    const utterance = new SpeechSynthesisUtterance(textToPlay)

    // Try to find a matching voice for the target language
    let matchedVoice = null

    // First try: exact match for language code
    const exactMatches = voices.filter((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase()))

    if (exactMatches.length > 0) {
      matchedVoice = exactMatches[0]
    } else {
      // Second try: for languages like Tamil that might not have exact matches
      if (lang === "ta" || lang === "hi") {
        const indianVoices = voices.filter((voice) => voice.lang.includes("IN") || voice.name.includes("Indian"))
        if (indianVoices.length > 0) {
          matchedVoice = indianVoices[0]
        }
      }
    }

    // If still no match, use the user-selected voice
    if (!matchedVoice) {
      matchedVoice = voices.find((v) => v.name === selectedVoice)
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice
      utterance.lang = matchedVoice.lang
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onpause = () => setIsPaused(true)
    utterance.onresume = () => setIsPaused(false)

    currentUtteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    showNotificationMessage("Started speaking", "success")
  }

  const stopSpeech = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    showNotificationMessage("Speech stopped", "info")
  }

  const pauseSpeech = () => {
    window.speechSynthesis.pause()
    showNotificationMessage("Speech paused", "info")
  }

  const resumeSpeech = () => {
    window.speechSynthesis.resume()
    showNotificationMessage("Speech resumed", "info")
  }

  // Enhanced handleTranslate function
  const handleTranslate = async () => {
    if (!text) {
      showNotificationMessage("No text to translate", "error")
      return
    }

    if (targetLanguage === "en") {
      setTranslatedText(text)
      setActiveTab("translated")
      return
    }

    setIsTranslating(true)
    try {
      const response = await axios.post("http://localhost:3000/translate", {
        targetLang: targetLanguage,
      })

      if (response.data && response.data.translatedText) {
        setTranslatedText(response.data.translatedText)
        setActiveTab("translated")
        showNotificationMessage(`Translated to ${languages.find((l) => l.code === targetLanguage)?.name}`, "success")
      }
    } catch (error) {
      console.error("Error translating text:", error)
      setTranslatedText("Error translating text. Please try again.")
      showNotificationMessage("Translation failed", "error")
    } finally {
      setIsTranslating(false)
    }
  }

  // Enhanced voice command handling
  const handleVoiceCommand = (command) => {
    const commands = voiceCommands[voiceCommandLanguage]
    if (!commands) return

    // Check for translation commands first
    if (commands.translateTo.some((cmd) => command.includes(cmd))) {
      const lang = findLanguageInCommand(command)
      if (lang) {
        setTargetLanguage(lang.code)
        handleTranslate()
        return
      }
    }

    // Check other commands
    if (commands.read.some((cmd) => command.includes(cmd))) {
      playText(text)
    } else if (commands.stop.some((cmd) => command.includes(cmd))) {
      stopSpeech()
    } else if (commands.pause.some((cmd) => command.includes(cmd))) {
      pauseSpeech()
    } else if (commands.continue.some((cmd) => command.includes(cmd))) {
      resumeSpeech()
    } else if (commands.summarize.some((cmd) => command.includes(cmd))) {
      handleSummarize()
    }
  }

  // Helper function to find language in voice command
  const findLanguageInCommand = (transcript) => {
    for (const lang of languages) {
      if (transcript.toLowerCase().includes(lang.name.toLowerCase())) {
        return lang
      }

      // Additional checks for common language variations
      if (lang.code === "es" && transcript.includes("spanish")) return lang
      if (lang.code === "fr" && transcript.includes("french")) return lang
      if (lang.code === "de" && transcript.includes("german")) return lang
      if (lang.code === "hi" && (transcript.includes("hindi") || transcript.includes("indian"))) return lang
      if (lang.code === "ta" && (transcript.includes("tamil") || transcript.includes("tamizh"))) return lang
      if (lang.code === "zh" && (transcript.includes("chinese") || transcript.includes("mandarin"))) return lang
      if (lang.code === "ja" && transcript.includes("japanese")) return lang
      if (lang.code === "ar" && transcript.includes("arabic")) return lang
    }
    return null
  }

  // Handle text summarization
  const handleSummarize = async () => {
    if (!text) {
      showNotificationMessage("No text to summarize", "error")
      return
    }

    setIsSummarizing(true)
    try {
      const response = await axios.post("http://localhost:3000/summarize")
      setSummary(response.data.summary)
      setActiveTab("summary")
      showNotificationMessage("Text summarized successfully", "success")
    } catch (error) {
      console.error("Error summarizing text:", error)
      setSummary("Error creating summary. Please try again.")
      showNotificationMessage("Summarization failed", "error")
    } finally {
      setIsSummarizing(false)
    }
  }

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)
      if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name)
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  // Add toggleVoiceCommands function
  const toggleVoiceCommands = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      showNotificationMessage("Voice commands disabled", "info")
    } else {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      recognition.lang = voiceCommandLanguage
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase()
        handleVoiceCommand(command)
      }

      recognition.onerror = (event) => {
        setRecognitionError(`Error: ${event.error}`)
        showNotificationMessage(`Voice recognition error: ${event.error}`, "error")
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
      showNotificationMessage("Voice commands enabled", "success")
    }
  }

  // Add speech recognition initialization effect
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser")
      setRecognitionError("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.")
      return
    }

    // Create a single recognition instance that we can reuse
    let recognition = null

    const startRecognition = () => {
      // If recognition is already running, stop it first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.warn("Error stopping previous recognition instance:", error)
        }
      }

      // Create new instance
      recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // Configure the recognition
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      // Set language with better formatting
      try {
        const langMap = {
          en: "en-US",
          ta: "ta-IN",
          hi: "hi-IN",
          es: "es-ES",
          fr: "fr-FR",
          de: "de-DE",
          zh: "zh-CN",
          ja: "ja-JP",
          ar: "ar-SA",
        }

        recognition.lang = langMap[voiceCommandLanguage] || "en-US"
        console.log(`Speech recognition language set to: ${recognition.lang}`)
        setRecognitionError(null)
      } catch (error) {
        console.error("Error setting speech recognition language:", error)
        recognition.lang = "en-US" // Fallback to English
      }

      // Result handler
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase()
        console.log(`Voice command detected: "${transcript}" (${voiceCommandLanguage})`)
        handleVoiceCommand(transcript)
      }

      // Error handler
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)

        if (event.error === "not-allowed") {
          setRecognitionError("Microphone access denied. Please allow microphone access in your browser settings.")
          setIsListening(false)
        } else if (event.error === "audio-capture") {
          setRecognitionError("No microphone found. Please connect a microphone and try again.")
          setIsListening(false)
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          setRecognitionError(`Recognition error: ${event.error}`)
          setIsListening(false)
        }
      }

      // Handle end event
      recognition.onend = () => {
        console.log("Speech recognition session ended")

        // Only restart if we're still in listening mode
        if (isListening && recognitionRef.current === recognition) {
          console.log("Preparing to restart recognition...")

          // Use a timer to delay restart and prevent CPU hogging
          setTimeout(() => {
            if (isListening) {
              try {
                recognition.start()
                console.log("Recognition restarted")
              } catch (error) {
                console.error("Failed to restart recognition:", error)
                setIsListening(false)
                setRecognitionError("Failed to restart recognition. Please try again.")
              }
            }
          }, 1000)
        }
      }

      // Start recognition
      try {
        recognition.start()
        console.log("Speech recognition started successfully")
      } catch (error) {
        console.error("Failed to start speech recognition:", error)
        setIsListening(false)
        setRecognitionError("Failed to start speech recognition. Please refresh the page and try again.")
      }
    }

    // Start or stop recognition based on isListening state
    if (isListening) {
      startRecognition()
    } else {
      // Stop recognition if it's running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current = null
          console.log("Recognition stopped")
        } catch (error) {
          console.error("Error stopping recognition:", error)
        }
      }
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current = null
          console.log("Recognition cleaned up")
        } catch (error) {
          console.error("Error cleaning up recognition:", error)
        }
      }
    }
  }, [isListening, voiceCommandLanguage])

  // Notification helper
  const showNotificationMessage = (message, type = "success") => {
    setNotificationMessage(message)
    setNotificationType(type)
    setShowNotification(true)

    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  const tabVariants = {
    inactive: { opacity: 0.7, y: 5 },
    active: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
  }

  const featureItems = [
    {
      icon: <ImageIcon className="w-6 h-6 text-blue-600" />,
      title: "Image Text Extraction",
      description: "Extract text from any image with high accuracy using advanced OCR technology.",
    },
    {
      icon: <Globe className="w-6 h-6 text-green-600" />,
      title: "Multi-language Translation",
      description: "Translate extracted text into multiple languages instantly.",
    },
    {
      icon: <Mic className="w-6 h-6 text-red-600" />,
      title: "Voice Commands",
      description: "Control the application using voice commands in multiple languages.",
    },
    {
      icon: <Volume2 className="w-6 h-6 text-purple-600" />,
      title: "Text-to-Speech",
      description: "Listen to extracted text and translations with natural-sounding voices.",
    },
    {
      icon: <Layers className="w-6 h-6 text-amber-600" />,
      title: "Text Summarization",
      description: "Generate concise summaries of longer texts automatically.",
    },
    {
      icon: <Cpu className="w-6 h-6 text-indigo-600" />,
      title: "ESP32 Integration",
      description: "Seamlessly connects with ESP32 hardware for real-time processing.",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              notificationType === "success"
                ? "bg-green-500 text-white"
                : notificationType === "error"
                  ? "bg-red-500 text-white"
                  : "bg-blue-500 text-white"
            }`}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {notificationType === "success" ? (
              <Check size={18} />
            ) : notificationType === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <Zap size={18} />
            )}
            <span>{notificationMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                  <Camera className="h-8 w-8 text-blue-600" />
                </motion.div>
                <motion.span
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
                  whileHover={{ scale: 1.05 }}
                >
                  VisionVoice AI
                </motion.span>
              </Link>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-all"
                >
                  Home
                </Link>
                <Link to="/converter" className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white">
                  Converter
                </Link>
                <Link
                  to="/about"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-all"
                >
                  About
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-md">
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/converter"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Converter
                </Link>
                <Link
                  to="/about"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <motion.div
        className="relative bg-cover bg-center py-20 mb-12 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated background overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85)), url(${pexelsImages.hero})`,
            backgroundAttachment: "fixed",
          }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Image Text Extractor & Voice Commander
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Extract text from images, translate to multiple languages, and control with voice commands using ESP32
              technology
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-8 rounded-xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={24} />
                <span>Upload Image</span>
              </motion.button>
              <motion.button
                className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 font-medium py-4 px-8 rounded-xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFeatures(!showFeatures)}
              >
                <Info size={24} />
                <span>Learn More</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Floating elements */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-500 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <AnimatePresence>
        {showFeatures && (
          <motion.section
            className="py-16 bg-gradient-to-br from-gray-50 to-white mb-12"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.h2
                  className="text-4xl font-bold text-gray-900 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Powerful Features
                </motion.h2>
                <motion.p
                  className="text-xl text-gray-600 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Our ESP32-powered solution combines advanced image processing with voice technology
                </motion.p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featureItems.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="rounded-full w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 mb-6"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-2xl">{feature.icon}</div>
                    </motion.div>
                    <motion.h3
                      className="text-2xl font-semibold mb-4 text-gray-900"
                      whileHover={{ color: "#3B82F6" }}
                    >
                      {feature.title}
                    </motion.h3>
                    <motion.p
                      className="text-gray-600 leading-relaxed"
                      whileHover={{ color: "#4B5563" }}
                    >
                      {feature.description}
                    </motion.p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-16 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <motion.button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowFeatures(false)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronUp size={20} />
                  <span>Hide Features</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {latestImageData && (
          <motion.section
            className="mb-12 bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Latest Processed Image
                </h2>
                <motion.button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                  onClick={fetchLatestImage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw size={16} />
                  <span>Refresh</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md"
                  variants={fadeVariants}
                >
                  <img
                    src={latestImageData.imageUrl || pexelsImages.placeholder}
                    alt="Latest processed"
                    className="w-full h-64 object-contain p-4"
                  />
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Processed: {new Date(latestImageData.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
                        <Sparkles size={14} className="text-yellow-500" />
                        <span>Confidence: {latestImageData.confidence?.toFixed(2) || 0}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-md"
                  variants={fadeVariants}
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Extracted Text</h3>
                  <div className="h-48 overflow-y-auto bg-gray-50 rounded-lg p-4 text-gray-700 mb-4 border border-gray-200">
                    {latestImageData.extractedText || "No text extracted"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg flex items-center gap-1 shadow-sm"
                      onClick={() => {
                        setText(latestImageData.extractedText)
                        setPreview(latestImageData.imageUrl)
                        setConfidence(latestImageData.confidence)
                        setTranslatedText("")
                        setSummary("")
                        setActiveTab("original")
                        showNotificationMessage("Loaded latest image data", "success")
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Layers size={16} />
                      <span>Load to Editor</span>
                    </motion.button>

                    <motion.button
                      className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded-lg flex items-center gap-1 shadow-sm"
                      onClick={() => playText(latestImageData.extractedText)}
                      disabled={isSpeaking}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Volume2 size={16} />
                      <span>Read Text</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.section>
        )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.section
          className="mb-12 bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex flex-col md:flex-row gap-6 items-center" variants={itemVariants}>
            <div className="w-full md:w-1/2">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                onClick={() => fileInputRef.current.click()}
              >
                {preview ? (
                  <motion.img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg object-contain"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon size={48} className="mb-4 text-gray-400" />
                    <p className="mb-2">Click or drag to upload an image</p>
                    <p className="text-xs text-gray-400">Supports JPG, PNG, GIF</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>

              <div className="mt-4 flex justify-center">
                <motion.button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  onClick={handleUpload}
                  disabled={!image || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Extract Text</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <motion.div
                className="bg-white rounded-xl p-4 h-full border border-gray-200 shadow-md"
                variants={itemVariants}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <FileText size={18} className="text-blue-600" />
                    Extracted Text
                  </h3>
                  {confidence !== null && (
                    <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
                      <Sparkles size={14} className="text-yellow-500" />
                      <span>Confidence: {confidence.toFixed(2)}%</span>
                    </div>
                  )}
                </div>

                <div className="h-64 overflow-y-auto bg-gray-50 rounded-lg p-4 text-gray-700 mb-4 border border-gray-200">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <RefreshCw size={24} className="animate-spin text-blue-600 mr-2" />
                      <span>Processing image...</span>
                    </div>
                  ) : text ? (
                    <p>{text}</p>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <p>Extracted text will appear here</p>
                    </div>
                  )}
                </div>

                {text && (
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg flex items-center gap-1 disabled:opacity-50 shadow-sm"
                      onClick={() => playText(text)}
                      disabled={isSpeaking}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Volume2 size={16} />
                      <span>Read Text</span>
                    </motion.button>

                    <motion.button
                      className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg flex items-center gap-1 disabled:opacity-50 shadow-sm"
                      onClick={handleTranslate}
                      disabled={isTranslating || !text}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isTranslating ? <RefreshCw size={16} className="animate-spin" /> : <Translate size={16} />}
                      <span>Translate</span>
                    </motion.button>

                    <motion.button
                      className="bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 px-4 rounded-lg flex items-center gap-1 disabled:opacity-50 shadow-sm"
                      onClick={handleSummarize}
                      disabled={isSummarizing || !text}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isSummarizing ? <RefreshCw size={16} className="animate-spin" /> : <Layers size={16} />}
                      <span>Summarize</span>
                    </motion.button>

                    <motion.div className="relative ml-auto">
                      <motion.button
                        className={`${isListening ? "bg-red-600 hover:bg-red-700" : "bg-gray-200 hover:bg-gray-300"} ${isListening ? "text-white" : "text-gray-800"} text-sm py-2 px-4 rounded-lg flex items-center gap-1 shadow-sm`}
                        onClick={toggleVoiceCommands}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isListening ? (
                          <>
                            <MicOff size={16} />
                            <span>Stop Listening</span>
                          </>
                        ) : (
                          <>
                            <Mic size={16} />
                            <span>Voice Commands</span>
                          </>
                        )}
                      </motion.button>

                      {isListening && (
                        <motion.div
                          className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl p-3 border border-gray-200 z-10"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="text-xs text-gray-500 mb-2">Available commands:</div>
                          <ul className="text-xs space-y-1 text-gray-700">
                            <li>• "Read" - read the text</li>
                            <li>• "Translate to [language]" - translate text</li>
                            <li>• "Summarize" - create summary</li>
                            <li>• "Pause/Resume" - control playback</li>
                            <li>• "Stop" - stop speaking</li>
                          </ul>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.section>

        {(text || translatedText || summary) && (
          <motion.section
            className="mb-12 bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="flex border-b border-gray-200 mb-6">
                <motion.button
                  className={`px-4 py-2 font-medium text-sm ${activeTab === "original" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setActiveTab("original")}
                  variants={tabVariants}
                  animate={activeTab === "original" ? "active" : "inactive"}
                >
                  Original Text
                </motion.button>

                {translatedText && (
                  <motion.button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "translated" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("translated")}
                    variants={tabVariants}
                    animate={activeTab === "translated" ? "active" : "inactive"}
                  >
                    Translation
                  </motion.button>
                )}

                {summary && (
                  <motion.button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "summary" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("summary")}
                    variants={tabVariants}
                    animate={activeTab === "summary" ? "active" : "inactive"}
                  >
                    Summary
                  </motion.button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="bg-white text-gray-700 text-sm rounded-lg px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-white text-gray-700 text-sm rounded-lg px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name.length > 20 ? voice.name.substring(0, 20) + "..." : voice.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 min-h-[200px] shadow-sm">
                <AnimatePresence mode="wait">
                  {activeTab === "original" && (
                    <motion.div
                      key="original"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Original Text</h3>
                        <div className="flex gap-2">
                          {isSpeaking ? (
                            <>
                              <motion.button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                onClick={stopSpeech}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <StopCircle size={16} />
                                <span>Stop</span>
                              </motion.button>

                              {isPaused ? (
                                <motion.button
                                  className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                  onClick={resumeSpeech}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Play size={16} />
                                  <span>Resume</span>
                                </motion.button>
                              ) : (
                                <motion.button
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                  onClick={pauseSpeech}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Pause size={16} />
                                  <span>Pause</span>
                                </motion.button>
                              )}
                            </>
                          ) : (
                            <motion.button
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                              onClick={() => playText(text)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Play size={16} />
                              <span>Play</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700">{text}</p>
                    </motion.div>
                  )}

                  {activeTab === "translated" && (
                    <motion.div
                      key="translated"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Translated to {languages.find((l) => l.code === targetLanguage)?.name}
                        </h3>
                        <div className="flex gap-2">
                          {isSpeaking ? (
                            <>
                              <motion.button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                onClick={stopSpeech}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <StopCircle size={16} />
                                <span>Stop</span>
                              </motion.button>

                              {isPaused ? (
                                <motion.button
                                  className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                  onClick={resumeSpeech}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Play size={16} />
                                  <span>Resume</span>
                                </motion.button>
                              ) : (
                                <motion.button
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                  onClick={pauseSpeech}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Pause size={16} />
                                  <span>Pause</span>
                                </motion.button>
                              )}
                            </>
                          ) : (
                            <motion.button
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                              onClick={() => playText(translatedText, targetLanguage)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Play size={16} />
                              <span>Play</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700">{translatedText}</p>
                    </motion.div>
                  )}

                  {activeTab === "summary" && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                        <div className="flex gap-2">
                          {isSpeaking ? (
                            <>
                              <motion.button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                onClick={stopSpeech}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <StopCircle size={16} />
                                <span>Stop</span>
                              </motion.button>

                              {isPaused ? (
                                <motion.button
                                  className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                  onClick={resumeSpeech}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Play size={16} />
                                  <span>Resume</span>
                                </motion.button>
                              ) : (
                                <motion.button
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                  onClick={pauseSpeech}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Pause size={16} />
                                  <span>Pause</span>
                                </motion.button>
                              )}
                            </>
                          ) : (
                            <motion.button
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                              onClick={() => playText(summary)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Play size={16} />
                              <span>Play</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700">{summary}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.section>
        )}

       
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">VisionVoice AI</h3>
              <p className="text-gray-600 text-sm">
                Advanced image text extraction and voice command system powered by ESP32. Extract text from images,
                translate to multiple languages, and control with voice.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/converter" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Converter
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
              <div className="flex space-x-4">
                <motion.a
                  href="#"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  whileHover={{ scale: 1.2 }}
                >
                  <Github size={20} />
                </motion.a>
                <motion.a
                  href="#"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  whileHover={{ scale: 1.2 }}
                >
                  <Twitter size={20} />
                </motion.a>
                <motion.a
                  href="#"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  whileHover={{ scale: 1.2 }}
                >
                  <Linkedin size={20} />
                </motion.a>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                © {new Date().getFullYear()} VisionVoice AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Converter

