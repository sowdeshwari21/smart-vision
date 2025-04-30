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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/"
                className="flex items-center text-xl font-bold text-gray-800 hover:text-gray-600"
              >
                OCR Speech
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                Home
              </Link>
              <Link
                to="/converter"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 font-semibold"
              >
                Converter
              </Link>
              <Link
                to="/about"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Choose Image
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <span className="text-gray-600">
              {image ? image.name : "No file selected"}
            </span>
          </div>

          <button
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUpload}
            disabled={!image || isLoading}
          >
            {isLoading
              ? "Processing... (This may take a minute)"
              : "Extract Text"}
          </button>
        </section>

        {/* Latest Image Section */}
        {latestImageData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Latest Processed Image</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <img
                  src={latestImageData.imageUrl}
                  alt="Latest uploaded"
                  className="w-full h-auto rounded-lg shadow-sm"
                />
                <div className="space-y-2">
                  <p className="text-gray-600">
                    Confidence: {latestImageData.confidence.toFixed(2)}%
                  </p>
                  <p className="text-gray-600">
                    Uploaded:{" "}
                    {new Date(latestImageData.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Extracted Text:</h3>
                  <p className="bg-gray-50 p-4 rounded-lg">
                    {latestImageData.extractedText}
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <label className="text-gray-700">Voice selection:</label>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {voices.map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-4">
                      {!isSpeaking ? (
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                          onClick={() =>
                            playText(latestImageData.extractedText)
                          }
                          title="Start speaking"
                        >
                          <span className="mr-2">▶️</span> Play
                        </button>
                      ) : (
                        <>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
                            onClick={stopAllSpeech}
                            title="Stop speaking"
                          >
                            <span className="mr-2">⏹️</span> Stop
                          </button>

                          {isPaused ? (
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
                              onClick={() => {
                                if (window.responsiveVoice) {
                                  // Resume with the last used voice
                                  window.responsiveVoice.resume();
                                  setIsPaused(false);
                                }
                              }}
                              title="Resume speaking"
                            >
                              <span className="mr-2">▶️</span> Resume
                            </button>
                          ) : (
                            <button
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors"
                              onClick={() => {
                                if (window.responsiveVoice) {
                                  window.responsiveVoice.pause();
                                  setIsPaused(true);
                                }
                              }}
                              title="Pause speaking"
                            >
                              <span className="mr-2">⏸️</span> Pause
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Translation</h3>
                  <div className="flex space-x-4">
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleTranslate(targetLanguage)}
                      disabled={isTranslating}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTranslating ? "Translating..." : "Translate & Speak"}
                    </button>
                  </div>
                  {translatedText && (
                    <div className="space-y-4">
                      <p className="bg-gray-50 p-4 rounded-lg">
                        {translatedText}
                      </p>
                      <div className="flex space-x-4">
                        {!isSpeaking ? (
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                            onClick={() =>
                              playText(translatedText, targetLanguage)
                            }
                            title="Play translated text"
                          >
                            <span className="mr-2">▶️</span> Play Translation
                          </button>
                        ) : (
                          <>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
                              onClick={stopAllSpeech}
                              title="Stop speaking"
                            >
                              <span className="mr-2">⏹️</span> Stop
                            </button>

                            {isPaused ? (
                              <button
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
                                onClick={() => {
                                  if (window.responsiveVoice) {
                                    window.responsiveVoice.resume();
                                  }
                                  setIsPaused(false);
                                }}
                                title="Resume speaking"
                              >
                                <span className="mr-2">▶️</span> Resume
                              </button>
                            ) : (
                              <button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors"
                                onClick={() => {
                                  if (window.responsiveVoice) {
                                    window.responsiveVoice.pause();
                                  }
                                  setIsPaused(true);
                                }}
                                title="Pause speaking"
                              >
                                <span className="mr-2">⏸️</span> Pause
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Summary</h3>
                  <button
                    onClick={() => handleSummarize(targetLanguage)}
                    disabled={isSummarizing}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSummarizing ? "Summarizing..." : "Summarize"}
                  </button>
                  {summary && (
                    <div className="space-y-4">
                      <p className="bg-gray-50 p-4 rounded-lg">{summary}</p>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                        onClick={() => playText(summary)}
                        title="Play summary"
                      >
                        <span className="mr-2">▶️</span> Play Summary
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Voice Commands</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <label className="text-gray-700">
                        Voice command language:
                      </label>
                      <select
                        value={voiceCommandLanguage}
                        onChange={(e) =>
                          setVoiceCommandLanguage(e.target.value)
                        }
                        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isListening}
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Development Mode Voice Command Input */}
                    <div className="space-y-2">
                      <label className="text-gray-700 block">
                        Development Mode - Test Voice Commands:
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Type voice command here..."
                          className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleVoiceCommand(e.target.value);
                              e.target.value = "";
                            }
                          }}
                        />
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            handleVoiceCommand(input.value);
                            input.value = "";
                          }}
                        >
                          Test Command
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Press Enter or click "Test Command" to simulate voice
                        commands
                      </p>
                    </div>

                    {/* Available Commands Display */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold text-gray-800">
                        Available Commands:
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-700">
                            To Read Text:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(
                              voiceCommands[voiceCommandLanguage]?.read ||
                              voiceCommands["en"].read
                            ).map((cmd, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                              >
                                "{cmd}"
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            To Stop:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(
                              voiceCommands[voiceCommandLanguage]?.stop ||
                              voiceCommands["en"].stop
                            ).map((cmd, index) => (
                              <span
                                key={index}
                                className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm"
                              >
                                "{cmd}"
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            To Pause:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(
                              voiceCommands[voiceCommandLanguage]?.pause ||
                              voiceCommands["en"].pause
                            ).map((cmd, index) => (
                              <span
                                key={index}
                                className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm"
                              >
                                "{cmd}"
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            To Continue:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(
                              voiceCommands[voiceCommandLanguage]?.continue ||
                              voiceCommands["en"].continue
                            ).map((cmd, index) => (
                              <span
                                key={index}
                                className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                              >
                                "{cmd}"
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            To Translate:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(
                              voiceCommands[voiceCommandLanguage]
                                ?.translateTo || voiceCommands["en"].translateTo
                            ).map((cmd, index) => (
                              <span
                                key={index}
                                className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm"
                              >
                                "{cmd} [language]"
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            To Summarize:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(
                              voiceCommands[voiceCommandLanguage]?.summarize ||
                              voiceCommands["en"].summarize
                            ).map((cmd, index) => (
                              <span
                                key={index}
                                className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm"
                              >
                                "{cmd}"
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Note: Commands will update based on the selected voice
                        command language. If a language is not supported,
                        English commands will be shown.
                      </p>
                    </div>

                    <button
                      className={`w-full px-4 py-2 rounded-md transition-colors ${
                        isListening
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      } text-white flex items-center justify-center space-x-2`}
                      onClick={toggleVoiceCommands}
                      title={
                        isListening
                          ? "Disable voice commands"
                          : "Enable voice commands"
                      }
                      disabled={Boolean(recognitionError) && !isListening}
                    >
                      <span>
                        {isListening
                          ? "Listening for commands... (Click to stop)"
                          : "Enable voice commands"}
                      </span>
                      <span className={`${isListening ? "animate-pulse" : ""}`}>
                        🎤
                      </span>
                    </button>

                    {recognitionError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {recognitionError}
                      </div>
                    )}

                    {isListening && (
                      <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <p>
                          Say "{voiceCommands[voiceCommandLanguage].read[0]}" to
                          read the text
                        </p>
                        <p>
                          Say "
                          {voiceCommands[voiceCommandLanguage].translateTo[0]}{" "}
                          Tamil" to translate and read in Tamil
                        </p>
                        <p>
                          Say "
                          {voiceCommands[voiceCommandLanguage].summarize[0]}" to
                          summarize the text
                        </p>
                        <p>
                          Say "{voiceCommands[voiceCommandLanguage].pause[0]}"
                          to pause
                        </p>
                        <p>
                          Say "{voiceCommands[voiceCommandLanguage].continue[0]}
                          " to resume
                        </p>
                        <p>
                          Say "{voiceCommands[voiceCommandLanguage].stop[0]}" to
                          stop
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {preview && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    Current Image Preview
                  </h3>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Extracted Text</h3>
              {isLoading && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  OCR processing in progress... Please wait.
                </div>
              )}
              {confidence !== null && (
                <div className="text-gray-600">
                  Confidence: {confidence.toFixed(2)}%
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
                {text ||
                  (isLoading
                    ? "Processing..."
                    : "Extracted text will appear here")}
              </div>
            </div>
          </div>
        </div>

        {/* Add voice selection dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Select Voice:
          </label>
          <select
            value={selectedResponsiveVoice}
            onChange={(e) => setSelectedResponsiveVoice(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Default Voice</option>
            {responsiveVoices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
      </main>

      <footer className="bg-white shadow-md mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600">
            © 2025 OCR Text-to-Speech Tool
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Converter;
