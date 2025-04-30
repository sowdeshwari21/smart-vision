import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Converter() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const [voiceCommandLanguage, setVoiceCommandLanguage] = useState("en");
  const recognitionRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentUtteranceRef = useRef(null);
  const [recognitionError, setRecognitionError] = useState(null);
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [latestImageData, setLatestImageData] = useState(null);
  const [error, setError] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(null);
  const [selectedResponsiveVoice, setSelectedResponsiveVoice] = useState(null);
  const [summarizedText, setSummarizedText] = useState("");
  const [responsiveVoices, setResponsiveVoices] = useState([]);

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
  ];

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
  };

  // Add language map for voice commands
  const languageMap = {
    english: "en",
    tamil: "ta",
    hindi: "hi",
    telugu: "te",
    malayalam: "ml",
    kannada: "kn",
    bengali: "bn",
    gujarati: "gu",
    marathi: "mr",
    punjabi: "pa",
    urdu: "ur",
    arabic: "ar",
    french: "fr",
    german: "de",
    spanish: "es",
    italian: "it",
    portuguese: "pt",
    russian: "ru",
    japanese: "ja",
    korean: "ko",
    chinese: "zh",
  };

  // Update the voice map to use ResponsiveVoice voice names
  const voiceMap = {
    en: "UK English Female",
    ta: "Tamil Female",
    hi: "Hindi Female",
    te: "Telugu Female",
    ml: "Malayalam Female",
    kn: "Kannada Female",
    bn: "Bengali Female",
    gu: "Gujarati Female",
    mr: "Marathi Female",
    pa: "Punjabi Female",
    ur: "Urdu Female",
    ar: "Arabic Female",
    fr: "French Female",
    de: "German Female",
    es: "Spanish Female",
    it: "Italian Female",
    pt: "Portuguese Female",
    ru: "Russian Female",
    ja: "Japanese Female",
    ko: "Korean Female",
    zh: "Chinese Female",
  };

  // Fetch latest image data
  const fetchLatestImage = async () => {
    try {
      const response = await axios.get("http://localhost:3000/latest-image");
      console.log("Latest image data:", response.data);

      setLatestImageData(response.data);
    } catch (err) {
      console.error("Error fetching latest image:", err);
    }
  };

  useEffect(() => {
    fetchLatestImage();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload and text extraction
  const handleUpload = async () => {
    if (!image) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData
      );
      setText(response.data.text);
      setConfidence(response.data.confidence);
      fetchLatestImage(); // Refresh latest image data
    } catch (error) {
      console.error("Error extracting text:", error);
      setText("Error extracting text from image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to stop all speech
  const stopAllSpeech = () => {
    if (window.responsiveVoice) {
      window.responsiveVoice.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Update handleSummarize function
  const handleSummarize = async (targetLang = currentLanguage) => {
    // Stop any ongoing speech
    stopAllSpeech();

    // Get text from either the current text state or latestImageData
    const textToSummarize = text || latestImageData?.extractedText;

    if (!textToSummarize) {
      console.error("No text available to summarize");
      setError("No text available to summarize");
      return;
    }

    try {
      console.log("Starting summarization");
      setIsSummarizing(true);
      setError(null);

      // First translate the text if a target language is specified
      let textToProcess = textToSummarize;
      if (targetLang) {
        try {
          console.log("Translating text to:", targetLang);
          const translationResponse = await axios.post(
            "http://localhost:3000/translate",
            {
              from_text: textToSummarize,
              to_text: targetLang,
            }
          );

          if (translationResponse.data.translated_text) {
            console.log("Text translated successfully");
            textToProcess = translationResponse.data.translated_text;
          }
        } catch (err) {
          console.error("Translation error:", err);
          setError("Translation failed. Please try again.");
          return;
        }
      }

      // Now summarize the (possibly translated) text
      const response = await axios.post("http://localhost:3000/summarize", {
        text: textToProcess,
      });

      console.log("Summarization response:", response.data);

      if (response.data.error) {
        console.error("Summarization error from server:", response.data.error);
        setError(response.data.error);
        return;
      }

      const { summary, originalLength, summaryLength, reductionPercentage } =
        response.data;
      console.log("Summary generated:", {
        originalLength,
        summaryLength,
        reductionPercentage,
      });

      setSummary(summary);
      setSummarizedText(summary);

      // Use ResponsiveVoice for speech synthesis
      if (window.responsiveVoice) {
        // Get the voice name from the voiceMap using the language code
        const voiceName = voiceMap[targetLang] || "UK English Female";
        console.log(
          "Using ResponsiveVoice:",
          voiceName,
          "for language:",
          targetLang
        );

        await new Promise((resolve, reject) => {
          window.responsiveVoice.speak(summary, voiceName, {
            rate: 0.9,
            pitch: 1.0,
            volume: 1.0,
            onstart: () => {
              console.log("Started speaking summary with voice:", voiceName);
              setIsSpeaking(true);
            },
            onend: () => {
              console.log("Finished speaking summary");
              setIsSpeaking(false);
              resolve();
            },
            onerror: (error) => {
              console.error("Speech error:", error);
              setError("Error reading the summary. Please try again.");
              setIsSpeaking(false);
              reject(error);
            },
          });
        });
      } else {
        console.error("ResponsiveVoice not available");
        setError("Text-to-speech not available. Please try again.");
      }
    } catch (err) {
      console.error("Summarization error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to summarize text. Please try again."
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  // Update handleTranslate function
  const handleTranslate = async (targetLang = targetLanguage) => {
    // Stop any ongoing speech
    stopAllSpeech();

    // Get text from either the current text state or latestImageData
    const textToTranslate = text || latestImageData?.extractedText;

    if (!textToTranslate) {
      console.error("No text available for translation");
      setError("No text available for translation");
      return;
    }

    try {
      console.log("Starting translation to:", targetLang);
      setIsTranslating(true);
      setError(null);

      const response = await axios.post("http://localhost:3000/translate", {
        from_text: textToTranslate,
        to_text: targetLang,
      });

      console.log("Translation response:", response.data);

      if (response.data.error) {
        console.error("Translation error from server:", response.data.error);
        setError(response.data.error);
        return;
      }

      const { translated_text } = response.data;
      console.log("Translated text:", translated_text);

      setTranslatedText(translated_text);

      // Read the translated text using ResponsiveVoice
      if (window.responsiveVoice) {
        // Get the voice name from the voiceMap using the language code
        const voiceName = voiceMap[targetLang] || "UK English Female";
        console.log(
          "Using ResponsiveVoice:",
          voiceName,
          "for language:",
          targetLang
        );

        await new Promise((resolve, reject) => {
          window.responsiveVoice.speak(translated_text, voiceName, {
            rate: 0.9,
            pitch: 1.0,
            volume: 1.0,
            onstart: () => {
              console.log("Started speaking with voice:", voiceName);
              setIsSpeaking(true);
            },
            onend: () => {
              console.log("Finished speaking");
              setIsSpeaking(false);
              resolve();
            },
            onerror: (error) => {
              console.error("Speech error:", error);
              setError("Error reading the text. Please try again.");
              setIsSpeaking(false);
              reject(error);
            },
          });
        });
      } else {
        console.error("ResponsiveVoice not available");
        setError("Text-to-speech not available. Please try again.");
      }
    } catch (err) {
      console.error("Translation error:", err);
      setError("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Update playText function to store the current language and voice
  const playText = (textToPlay, lang = "en") => {
    // Stop any ongoing speech
    stopAllSpeech();

    const textToSpeak = textToPlay || latestImageData?.extractedText;

    if (!textToSpeak) {
      console.error("No text available to play");
      setError("No text available to play");
      return;
    }

    if (window.responsiveVoice) {
      const voiceName = voiceMap[lang] || "UK English Female";
      console.log("Using ResponsiveVoice:", voiceName, "for language:", lang);

      // Store current language and voice
      window.lastUsedVoice = voiceName;
      window.lastUsedLang = lang;

      window.responsiveVoice.speak(textToSpeak, voiceName, {
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        onstart: () => {
          console.log("Started speaking with voice:", voiceName);
          setIsSpeaking(true);
        },
        onend: () => {
          console.log("Finished speaking");
          setIsSpeaking(false);
        },
        onerror: (error) => {
          console.error("Speech error:", error);
          setError("Error reading the text. Please try again.");
          setIsSpeaking(false);
        },
      });
    } else {
      console.error("ResponsiveVoice not available");
      setError("Text-to-speech not available. Please try again.");
    }
  };

  // Update handleVoiceCommand to use stored language info
  const handleVoiceCommand = async (command) => {
    // Stop any ongoing speech when a new command is received
    stopAllSpeech();
    command = command.trim().replace(/[.,!?;:]$/, "");
    console.log("Received voice command:", command);
    const commands = voiceCommands[voiceCommandLanguage];
    if (!commands) {
      console.error("No commands found for language:", voiceCommandLanguage);
      return;
    }

    // Check for pause command first
    if (commands.pause.some((cmd) => command.toLowerCase().includes(cmd))) {
      console.log("Pause command detected");
      if (window.responsiveVoice) {
        window.responsiveVoice.pause();
        setIsPaused(true);
      }
      return;
    }

    // Check for continue/resume command
    if (commands.continue.some((cmd) => command.toLowerCase().includes(cmd))) {
      console.log("Continue command detected");
      if (window.responsiveVoice) {
        // Resume with the last used voice and language
        const voiceName =
          window.lastUsedVoice ||
          voiceMap[currentLanguage] ||
          "UK English Female";
        window.responsiveVoice.resume();
        setIsPaused(false);
      }
      return;
    }

    // Check for summarize command first
    if (commands.summarize.some((cmd) => command.toLowerCase().includes(cmd))) {
      console.log("Summarize command detected");
      await handleSummarize(currentLanguage || "en");
      return;
    }

    // Extract the last word from the command
    const words = command.toLowerCase().split(" ");
    const lastWord = words[words.length - 1];
    console.log("Last word from command:", lastWord);

    // Get the language code from the last word
    const langCode = languageMap[lastWord] || lastWord;
    console.log("Language code:", langCode);

    // Check for translation/read in language commands
    if (commands.translateTo.some((cmd) => command.includes(cmd))) {
      console.log("Translation command detected");
      if (langCode) {
        console.log("Setting target language to:", langCode);
        setTargetLanguage(langCode);
        setCurrentLanguage(langCode);
        await handleTranslate(langCode);
        return;
      } else {
        console.error("Could not determine target language from command");
        setError("Could not determine the target language. Please try again.");
        return;
      }
    }

    // Check other commands
    if (commands.read.some((cmd) => command.includes(cmd))) {
      console.log("Read command detected");
      playText(text, langCode);
    } else if (commands.stop.some((cmd) => command.includes(cmd))) {
      console.log("Stop command detected");
      stopAllSpeech();
    } else if (commands.pause.some((cmd) => command.includes(cmd))) {
      console.log("Pause command detected");
      if (window.responsiveVoice) {
        window.responsiveVoice.pause();
        setIsPaused(true);
      }
    } else if (commands.continue.some((cmd) => command.includes(cmd))) {
      console.log("Continue command detected");
      if (window.responsiveVoice) {
        // Resume with the last used voice
        window.responsiveVoice.resume();
        setIsPaused(false);
      }
    }
  };

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Add toggleVoiceCommands function
  const toggleVoiceCommands = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      recognition.lang = voiceCommandLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const command =
          event.results[event.results.length - 1][0].transcript.toLowerCase();
        handleVoiceCommand(command);
      };

      recognition.onerror = (event) => {
        setRecognitionError(`Error: ${event.error}`);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  // Add speech recognition initialization effect
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      setRecognitionError(
        "Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari."
      );
      return;
    }

    // Create a single recognition instance that we can reuse
    let recognition = null;

    const startRecognition = () => {
      // If recognition is already running, stop it first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.warn("Error stopping previous recognition instance:", error);
        }
      }

      // Create new instance
      recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure the recognition
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

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
        };

        recognition.lang = langMap[voiceCommandLanguage] || "en-US";
        console.log(`Speech recognition language set to: ${recognition.lang}`);
        setRecognitionError(null);
      } catch (error) {
        console.error("Error setting speech recognition language:", error);
        recognition.lang = "en-US"; // Fallback to English
      }

      // Result handler
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log(
          `Voice command detected: "${transcript}" (${voiceCommandLanguage})`
        );
        handleVoiceCommand(transcript);
      };

      // Error handler
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "not-allowed") {
          setRecognitionError(
            "Microphone access denied. Please allow microphone access in your browser settings."
          );
          setIsListening(false);
        } else if (event.error === "audio-capture") {
          setRecognitionError(
            "No microphone found. Please connect a microphone and try again."
          );
          setIsListening(false);
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          setRecognitionError(`Recognition error: ${event.error}`);
          setIsListening(false);
        }
      };

      // Handle end event
      recognition.onend = () => {
        console.log("Speech recognition session ended");

        // Only restart if we're still in listening mode
        if (isListening && recognitionRef.current === recognition) {
          console.log("Preparing to restart recognition...");

          // Use a timer to delay restart and prevent CPU hogging
          setTimeout(() => {
            if (isListening) {
              try {
                recognition.start();
                console.log("Recognition restarted");
              } catch (error) {
                console.error("Failed to restart recognition:", error);
                setIsListening(false);
                setRecognitionError(
                  "Failed to restart recognition. Please try again."
                );
              }
            }
          }, 1000);
        }
      };

      // Start recognition
      try {
        recognition.start();
        console.log("Speech recognition started successfully");
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setIsListening(false);
        setRecognitionError(
          "Failed to start speech recognition. Please refresh the page and try again."
        );
      }
    };

    // Start or stop recognition based on isListening state
    if (isListening) {
      startRecognition();
    } else {
      // Stop recognition if it's running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
          console.log("Recognition stopped");
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
          console.log("Recognition cleaned up");
        } catch (error) {
          console.error("Error cleaning up recognition:", error);
        }
      }
    };
  }, [isListening, voiceCommandLanguage]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header with high contrast for accessibility */}
      <header className="bg-teal-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex">
              <Link
                to="/"
                className="flex items-center text-2xl font-bold hover:text-teal-100 transition-colors"
                aria-label="OCR Speech Home"
              >
                <span aria-hidden="true" className="mr-2">
                  🔊
                </span>
                OCR Speech
              </Link>
            </div>
            <nav className="flex space-x-1">
              <Link
                to="/"
                className="flex items-center px-4 py-2 text-white hover:bg-teal-600 rounded-lg transition-colors"
                aria-label="Go to home page"
              >
                Home
              </Link>
              <Link
                to="/converter"
                className="flex items-center px-4 py-2 bg-teal-800 text-white rounded-lg font-semibold"
                aria-current="page"
                aria-label="Current page: Converter"
              >
                Converter
              </Link>
              <Link
                to="/about"
                className="flex items-center px-4 py-2 text-white hover:bg-teal-600 rounded-lg transition-colors"
                aria-label="Go to about page"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Voice Command Status Banner - Always visible for accessibility */}
        <div
          className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            isListening
              ? "bg-teal-100 border-2 border-teal-500"
              : "bg-gray-100 border-2 border-gray-300"
          }`}
        >
          <div className="flex items-center">
            <span
              className={`text-2xl mr-3 ${isListening ? "animate-pulse" : ""}`}
              aria-hidden="true"
            >
              🎤
            </span>
            <div>
              <h2 className="text-lg font-bold">Voice Commands</h2>
              <p>
                {isListening
                  ? "Listening for voice commands"
                  : "Voice commands are disabled"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleVoiceCommands}
            className={`px-6 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-4 ${
              isListening
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-300"
                : "bg-teal-600 hover:bg-teal-700 focus:ring-teal-300"
            }`}
            aria-label={
              isListening ? "Stop voice commands" : "Start voice commands"
            }
          >
            {isListening ? "Stop Listening" : "Start Voice Commands"}
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Section - Spans full width on mobile, 1 column on desktop */}
          <div className="bg-white rounded-xl shadow-md p-6 md:col-span-1 border-2 border-teal-100">
            <h2 className="text-2xl font-bold mb-4 text-teal-800">
              Upload Image
            </h2>
            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-teal-300"
                >
                  <span aria-hidden="true" className="mr-2">
                    📷
                  </span>
                  Choose Image
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload an image for text extraction"
                />
                <div className="text-gray-600 text-center">
                  {image ? image.name : "No file selected"}
                </div>
              </div>

              {/* Current Preview Section */}
              {preview && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Current Preview:
                  </h3>
                  <img
                    src={preview}
                    alt="Current image preview"
                    className="w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Latest Processed Image Section */}
              {latestImageData && latestImageData.imageUrl && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Latest Processed Image:
                  </h3>
                  <img
                    src={latestImageData.imageUrl}
                    alt="Latest processed image"
                    className="w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}

              <button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-teal-300"
                onClick={handleUpload}
                disabled={!image || isLoading}
                aria-label="Extract text from image"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2" aria-hidden="true">
                      ⏳
                    </span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" className="mr-2">
                      🔍
                    </span>
                    Extract Text
                  </>
                )}
              </button>

              {confidence !== null && (
                <div className="text-gray-700 text-center">
                  Confidence:{" "}
                  <span className="font-semibold">
                    {confidence.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Language Controls - Spans full width on mobile, 2 columns on desktop */}
          <div className="bg-white rounded-xl shadow-md p-6 md:col-span-2 border-2 border-purple-100">
            <h2 className="text-2xl font-bold mb-4 text-purple-800">
              Language Settings
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Voice Command Language
                </h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={voiceCommandLanguage}
                    onChange={(e) => setVoiceCommandLanguage(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    aria-label="Select voice command language"
                    disabled={isListening}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="font-medium">
                    Voice commands will be recognized in{" "}
                    {languages.find((l) => l.code === voiceCommandLanguage)
                      ?.name || "English"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Translation Language</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    aria-label="Select translation target language"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleTranslate(targetLanguage)}
                  disabled={
                    isTranslating || (!text && !latestImageData?.extractedText)
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-300"
                  aria-label="Translate and speak text"
                >
                  {isTranslating ? (
                    <>
                      <span className="animate-spin mr-2" aria-hidden="true">
                        ⏳
                      </span>
                      Translating...
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true" className="mr-2">
                        🌐
                      </span>
                      Translate & Speak
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Extracted Text Section - Spans full width */}
          <div className="bg-white rounded-xl shadow-md p-6 md:col-span-3 border-2 border-blue-100">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">
              Extracted Text
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg min-h-[200px] border border-gray-200 text-lg">
              {text ||
                latestImageData?.extractedText ||
                "No text has been extracted yet. Upload an image to get started."}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => playText(text || latestImageData?.extractedText)}
                disabled={
                  isSpeaking || (!text && !latestImageData?.extractedText)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Read extracted text aloud"
              >
                <span aria-hidden="true" className="mr-2">
                  🔊
                </span>
                Read Aloud
              </button>

              <button
                onClick={() => handleSummarize()}
                disabled={
                  isSummarizing || (!text && !latestImageData?.extractedText)
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-300"
                aria-label="Summarize extracted text"
              >
                <span aria-hidden="true" className="mr-2">
                  📝
                </span>
                Summarize
              </button>

              {isSpeaking && (
                <div className="flex space-x-2">
                  <button
                    onClick={stopAllSpeech}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-red-300"
                    aria-label="Stop speaking"
                  >
                    <span aria-hidden="true" className="mr-2">
                      ⏹️
                    </span>
                    Stop
                  </button>

                  {isPaused ? (
                    <button
                      onClick={() => {
                        if (window.responsiveVoice) {
                          window.responsiveVoice.resume();
                          setIsPaused(false);
                        }
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-green-300"
                      aria-label="Resume speaking"
                    >
                      <span aria-hidden="true" className="mr-2">
                        ▶️
                      </span>
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (window.responsiveVoice) {
                          window.responsiveVoice.pause();
                          setIsPaused(true);
                        }
                      }}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-yellow-300"
                      aria-label="Pause speaking"
                    >
                      <span aria-hidden="true" className="mr-2">
                        ⏸️
                      </span>
                      Pause
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Translation Results - Spans half width on desktop */}
          <div className="bg-white rounded-xl shadow-md p-6 md:col-span-3 lg:col-span-2 border-2 border-purple-100">
            <h2 className="text-2xl font-bold mb-4 text-purple-800">
              Translation Results
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg min-h-[150px] border border-gray-200">
              {translatedText ||
                "Translated text will appear here after translation."}
            </div>

            {translatedText && (
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => playText(translatedText, targetLanguage)}
                  disabled={isSpeaking}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-300"
                  aria-label="Play translated text"
                >
                  <span aria-hidden="true" className="mr-2">
                    🔊
                  </span>
                  Play Translation
                </button>
              </div>
            )}
          </div>

          {/* Summary Results - Spans half width on desktop */}
          <div className="bg-white rounded-xl shadow-md p-6 md:col-span-3 lg:col-span-1 border-2 border-indigo-100">
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">Summary</h2>
            <div className="bg-gray-50 p-6 rounded-lg min-h-[150px] border border-gray-200">
              {summary || "Summary will appear here after summarization."}
            </div>

            {summary && (
              <div className="mt-4">
                <button
                  onClick={() => playText(summary, targetLanguage)}
                  disabled={isSpeaking}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-300"
                  aria-label="Play summary"
                >
                  <span aria-hidden="true" className="mr-2">
                    🔊
                  </span>
                  Play Summary
                </button>
              </div>
            )}
          </div>

          {/* Voice Commands Help - Spans full width */}
          <div className="bg-white rounded-xl shadow-md p-6 md:col-span-3 border-2 border-amber-100">
            <h2 className="text-2xl font-bold mb-4 text-amber-800">
              Voice Commands Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-amber-700">
                  Reading Commands
                </h3>
                <div className="space-y-2">
                  {(
                    voiceCommands[voiceCommandLanguage]?.read ||
                    voiceCommands["en"].read
                  ).map((cmd, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border border-amber-200 flex items-center"
                    >
                      <span className="mr-2" aria-hidden="true">
                        🔊
                      </span>
                      <span className="font-medium">"{cmd}"</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-amber-700">
                  Control Commands
                </h3>
                <div className="space-y-2">
                  {(
                    voiceCommands[voiceCommandLanguage]?.stop ||
                    voiceCommands["en"].stop
                  ).map((cmd, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border border-amber-200 flex items-center"
                    >
                      <span className="mr-2" aria-hidden="true">
                        ⏹️
                      </span>
                      <span className="font-medium">"{cmd}"</span>
                    </div>
                  ))}
                  {(
                    voiceCommands[voiceCommandLanguage]?.pause ||
                    voiceCommands["en"].pause
                  ).map((cmd, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border border-amber-200 flex items-center"
                    >
                      <span className="mr-2" aria-hidden="true">
                        ⏸️
                      </span>
                      <span className="font-medium">"{cmd}"</span>
                    </div>
                  ))}
                  {(
                    voiceCommands[voiceCommandLanguage]?.continue ||
                    voiceCommands["en"].continue
                  ).map((cmd, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border border-amber-200 flex items-center"
                    >
                      <span className="mr-2" aria-hidden="true">
                        ▶️
                      </span>
                      <span className="font-medium">"{cmd}"</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-amber-700">
                  Advanced Commands
                </h3>
                <div className="space-y-2">
                  {(
                    voiceCommands[voiceCommandLanguage]?.translateTo ||
                    voiceCommands["en"].translateTo
                  ).map((cmd, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border border-amber-200 flex items-center"
                    >
                      <span className="mr-2" aria-hidden="true">
                        🌐
                      </span>
                      <span className="font-medium">"{cmd} [language]"</span>
                    </div>
                  ))}
                  {(
                    voiceCommands[voiceCommandLanguage]?.summarize ||
                    voiceCommands["en"].summarize
                  ).map((cmd, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border border-amber-200 flex items-center"
                    >
                      <span className="mr-2" aria-hidden="true">
                        📝
                      </span>
                      <span className="font-medium">"{cmd}"</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Voice Commands Input */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-bold text-lg mb-2">Test Voice Commands</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a voice command to test..."
                  className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleVoiceCommand(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  aria-label="Test voice command input"
                />
                <button
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-amber-300"
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    handleVoiceCommand(input.value);
                    input.value = "";
                  }}
                  aria-label="Test voice command"
                >
                  <span aria-hidden="true" className="mr-2">
                    🎤
                  </span>
                  Test
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Example: "read", "translate to spanish", "summarize"
              </p>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div
            className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {recognitionError && (
          <div
            className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
            role="alert"
          >
            <p className="font-bold">Speech Recognition Error</p>
            <p>{recognitionError}</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">OCR Text-to-Speech</h3>
              <p>
                A powerful tool designed for blind and visually impaired users
                to extract and interact with text from images.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Accessibility Features</h3>
              <ul className="space-y-2">
                <li>• Voice commands in multiple languages</li>
                <li>• High contrast interface</li>
                <li>• Screen reader optimized</li>
                <li>• Text-to-speech in multiple languages</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <p>For support or feedback, please contact us at:</p>
              <p className="mt-2">support@ocrspeech.com</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p>© 2025 OCR Text-to-Speech Tool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Converter;
