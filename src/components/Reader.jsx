import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

import "./Reader.css";

const API_BASE_URL = "http://localhost:5000";

const SPEECH_LANGUAGE_CODES = {
  English: "en-IN",
  Hindi: "hi-IN",
  Malayalam: "ml-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Bengali: "bn-IN",
  Marathi: "mr-IN",
  Kannada: "kn-IN",
  Gujarati: "gu-IN",
  Punjabi: "pa-IN",
  Urdu: "ur-IN",
  Spanish: "es-ES",
  French: "fr-FR",
  German: "de-DE",
  Arabic: "ar-SA",
  Chinese: "zh-CN",
  Japanese: "ja-JP",
  Portuguese: "pt-BR",
  Italian: "it-IT",
  Korean: "ko-KR",
  Russian: "ru-RU",
};

function Reader({ documentId }) {
  // =========================================================
  // USER
  // =========================================================

  const userName =
    localStorage.getItem("userName") || "Student";

  // =========================================================
  // DOCUMENT STATE
  // =========================================================

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(Boolean(documentId));
  const [error, setError] = useState(
    documentId ? "" : "No document was selected."
  );

  // =========================================================
  // SEARCH
  // =========================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // =========================================================
  // READER CONTROLS
  // =========================================================

  const [zoom, setZoom] = useState(100);
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const selectionInfoRef = useRef(null);
  const [selectionHighlightPosition, setSelectionHighlightPosition] =
    useState(null);
  const [bookmarkError, setBookmarkError] = useState("");

  useEffect(() => {
    const dismissSelectionHighlight = (event) => {
      if (
        event?.target?.closest?.(
          ".reader-selection-highlight-action, .reader-highlight-button"
        )
      ) {
        return;
      }

      selectionInfoRef.current = null;
      setSelectionHighlightPosition(null);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (
        !selection ||
        selection.isCollapsed ||
        !selection.toString().trim()
      ) {
        setSelectionHighlightPosition(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        dismissSelectionHighlight();
      }
    };

    document.addEventListener(
      "pointerdown",
      dismissSelectionHighlight
    );

    document.addEventListener(
      "selectionchange",
      handleSelectionChange
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        dismissSelectionHighlight
      );

      document.removeEventListener(
        "selectionchange",
        handleSelectionChange
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // =========================================================
  // TTS STATE
  // =========================================================

  const speechSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speechRate, setSpeechRate] = useState(1);
  const [speechStatus, setSpeechStatus] = useState("idle");
  const [speechLanguageError, setSpeechLanguageError] = useState("");
  const [speechSource, setSpeechSource] = useState("");
  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  // =========================================================
  // TRANSLATION STATE
  // =========================================================

  const [translationLanguage, setTranslationLanguage] =
    useState("English");

  const [translationResultLanguage, setTranslationResultLanguage] =
    useState("English");

  const [translation, setTranslation] = useState("");

  const [selectedTranslationPages, setSelectedTranslationPages] =
    useState([]);

  const [translationSource, setTranslationSource] = useState("");

  const [translationLoading, setTranslationLoading] =
    useState(false);

  const [translationError, setTranslationError] =
    useState("");

  const [translationProgress, setTranslationProgress] =
    useState("");

  const [showTranslationResult, setShowTranslationResult] =
    useState(false);

  // =========================================================
  // REFS
  // =========================================================

  const speechQueueRef = useRef([]);
  const speechIndexRef = useRef(0);
  const speechActiveRef = useRef(false);
  const speechRateRef = useRef(1);
  const selectedVoiceRef = useRef("");
  const speechLanguageRef = useRef("");

  const generatedAudioRef = useRef(null);
  const generatedAudioUrlRef = useRef("");
  const generatedSpeechRef = useRef(false);

  // =========================================================
  // GET DOCUMENT PAGES
  // =========================================================

  const pages = useMemo(() => {
    if (!documentData) {
      return [];
    }

    if (Array.isArray(documentData.pages)) {
      return documentData.pages;
    }

    if (
      documentData.document &&
      Array.isArray(documentData.document.pages)
    ) {
      return documentData.document.pages;
    }

    if (
      documentData.data &&
      Array.isArray(documentData.data.pages)
    ) {
      return documentData.data.pages;
    }

    return [];
  }, [documentData]);

  // =========================================================
  // GET PAGE TEXT
  // =========================================================

  const getPageText = (page) => {
    if (!page) {
      return "";
    }

    if (typeof page === "string") {
      return page;
    }

    return (
      page.text ||
      page.content ||
      page.extractedText ||
      page.rawText ||
      ""
    );
  };

  // =========================================================
  // GET PAGE NUMBER
  // =========================================================

  const getPageNumber = (page, index) => {
    if (!page || typeof page === "string") {
      return index + 1;
    }

    return (
      page.pageNumber ||
      page.page ||
      page.number ||
      index + 1
    );
  };

  // =========================================================
  // GET DOCUMENT TITLE
  // =========================================================

  const documentTitle =
    documentData?.originalName ||
    documentData?.fileName ||
    documentData?.filename ||
    documentData?.name ||
    documentData?.title ||
    documentData?.document?.originalName ||
    documentData?.document?.fileName ||
    documentData?.document?.filename ||
    documentData?.document?.name ||
    documentData?.document?.title ||
    documentData?.data?.originalName ||
    documentData?.data?.fileName ||
    documentData?.data?.filename ||
    documentData?.data?.name ||
    documentData?.data?.title ||
    "Untitled Document";

  // =========================================================
  // GET FILE TYPE
  // =========================================================

  const getFileType = (fileName = "") => {
    const parts = fileName.split(".");

    if (parts.length < 2) {
      return "FILE";
    }

    return parts.pop().toUpperCase();
  };

  // =========================================================
  // LOAD DOCUMENT
  // =========================================================

  useEffect(() => {
    if (!documentId) {
      return;
    }

    let cancelled = false;

    const loadDocument = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/documents/${documentId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load document (${response.status})`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setDocumentData(data);

          const loadedBookmarks =
            data.bookmarks ||
            data.document?.bookmarks ||
            data.data?.bookmarks ||
            [];

          const loadedHighlights =
            data.highlights ||
            data.document?.highlights ||
            data.data?.highlights ||
            [];

          setBookmarks(
            Array.isArray(loadedBookmarks)
              ? loadedBookmarks
              : []
          );

          setHighlights(
            Array.isArray(loadedHighlights)
              ? loadedHighlights
              : []
          );
        }
      } catch (err) {
        console.error("Reader load error:", err);

        if (!cancelled) {
          setError(
            "Unable to load this document. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // =========================================================
  // LOAD TTS VOICES
  // =========================================================

  useEffect(() => {
    if (!speechSupported) {
      return;
    }

    const loadVoices = () => {
      const availableVoices =
        window.speechSynthesis.getVoices();

      setVoices(availableVoices);

      if (
        availableVoices.length > 0 &&
        !selectedVoiceRef.current
      ) {
        const preferredVoice =
          availableVoices.find((voice) =>
            voice.lang
              ?.toLowerCase()
              .startsWith("en")
          ) || availableVoices[0];

        if (preferredVoice) {
          selectedVoiceRef.current =
            preferredVoice.name;

          setSelectedVoice(
            preferredVoice.name
          );
        }
      }
    };

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );
    };
  }, [speechSupported]);

  // =========================================================
  // CLEANUP SPEECH
  // =========================================================

  useEffect(() => {
    return () => {
      if (speechSupported) {
        window.speechSynthesis.cancel();
      }

      generatedAudioRef.current?.pause();

      if (generatedAudioUrlRef.current) {
        URL.revokeObjectURL(
          generatedAudioUrlRef.current
        );
      }

      generatedAudioUrlRef.current = "";
      generatedSpeechRef.current = false;

      speechActiveRef.current = false;
      speechQueueRef.current = [];
    };
  }, [speechSupported]);

  // =========================================================
  // TRACK VISIBLE PAGE
  // =========================================================

  useEffect(() => {
    if (!pages.length) {
      return;
    }

    const pageElements =
      document.querySelectorAll(
        ".reader-page-card"
      );

    if (!pageElements.length) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          let mostVisible = null;
          let highestVisibility = 0;

          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              entry.intersectionRatio >
                highestVisibility
            ) {
              highestVisibility =
                entry.intersectionRatio;

              mostVisible = entry.target;
            }
          });

          if (mostVisible) {
            const pageNumber =
              mostVisible.getAttribute(
                "data-page-number"
              );

            if (pageNumber) {
              setCurrentPageNumber(
                Number(pageNumber)
              );
            }
          }
        },
        {
          threshold: [
            0.25,
            0.5,
            0.75,
          ],
        }
      );

    pageElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [pages]);

  // =========================================================
  // TEXT CHUNKING
  // =========================================================

  const splitTextIntoChunks = (
    text,
    maxLength = 220
  ) => {
    if (!text) {
      return [];
    }

    const cleanText = text
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      return [];
    }

    const sentences =
      cleanText.match(
        /[^.!?]+[.!?]+|[^.!?]+$/g
      ) || [cleanText];

    const chunks = [];
    let currentChunk = "";

    sentences.forEach((sentence) => {
      const trimmedSentence =
        sentence.trim();

      if (!trimmedSentence) {
        return;
      }

      if (
        (
          currentChunk +
          " " +
          trimmedSentence
        ).trim().length <= maxLength
      ) {
        currentChunk = (
          currentChunk +
          " " +
          trimmedSentence
        ).trim();
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        currentChunk = trimmedSentence;
      }
    });

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  };

  // =========================================================
  // SPEAK NEXT CHUNK
  // =========================================================

  const speakNextChunk = () => {
    if (!speechSupported) {
      return;
    }

    if (!speechActiveRef.current) {
      return;
    }

    const queue =
      speechQueueRef.current;

    const index =
      speechIndexRef.current;

    if (index >= queue.length) {
      speechActiveRef.current = false;
      setSpeechStatus("idle");
      setSpeechSource("");
      speechLanguageRef.current = "";
      return;
    }

    const text = queue[index];

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate =
      speechRateRef.current;

    const requestedLanguage =
      speechLanguageRef.current;

    if (requestedLanguage) {
      utterance.lang =
        requestedLanguage;

      const baseLanguage =
        requestedLanguage
          .split("-")[0]
          .toLowerCase();

      const matchingVoice =
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase() ===
            requestedLanguage.toLowerCase()
        ) ||
        voices.find((voice) => {
          const voiceLanguage =
            voice.lang?.toLowerCase();

          return (
            voiceLanguage === baseLanguage ||
            voiceLanguage?.startsWith(
              `${baseLanguage}-`
            )
          );
        });

      if (matchingVoice) {
        utterance.voice =
          matchingVoice;
      }
    } else {
      const voiceName =
        selectedVoiceRef.current;

      const voice = voices.find(
        (item) => item.name === voiceName
      );

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
    }

    utterance.onstart = () => {
      setSpeechStatus("speaking");
    };

    utterance.onend = () => {
      if (!speechActiveRef.current) {
        return;
      }

      speechIndexRef.current += 1;
      speakNextChunk();
    };

    utterance.onerror = (event) => {
      console.error(
        "Speech synthesis error:",
        event
      );

      speechActiveRef.current = false;
      setSpeechStatus("idle");
      setSpeechSource("");
      speechLanguageRef.current = "";
    };

    window.speechSynthesis.speak(
      utterance
    );
  };

  // =========================================================
  // GENERATED MALAYALAM SPEECH
  // =========================================================

  const playGeneratedMalayalamChunk =
    async (chunks, index) => {
      if (!speechActiveRef.current) {
        return;
      }

      if (index >= chunks.length) {
        speechActiveRef.current = false;
        generatedSpeechRef.current = false;
        setSpeechStatus("idle");
        setSpeechSource("");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/reader/speech`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              text: chunks[index],
              language: "Malayalam",
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not generate Malayalam speech."
          );
        }

        if (!speechActiveRef.current) {
          return;
        }

        const audioBytes =
          Uint8Array.from(
            atob(data.audioBase64),
            (char) =>
              char.charCodeAt(0)
          );

        const audioBlob =
          new Blob(
            [audioBytes],
            {
              type:
                data.mimeType ||
                "audio/wav",
            }
          );

        if (generatedAudioUrlRef.current) {
          URL.revokeObjectURL(
            generatedAudioUrlRef.current
          );
        }

        generatedAudioUrlRef.current =
          URL.createObjectURL(
            audioBlob
          );

        const audio =
          new Audio(
            generatedAudioUrlRef.current
          );

        generatedAudioRef.current =
          audio;

        audio.onended = () =>
          playGeneratedMalayalamChunk(
            chunks,
            index + 1
          );

        audio.onerror = () => {
          speechActiveRef.current = false;
          generatedSpeechRef.current = false;
          setSpeechStatus("idle");

          setSpeechLanguageError(
            "Generated Malayalam audio could not be played by this browser."
          );
        };

        await audio.play();

        setSpeechStatus("speaking");
      } catch (error) {
        speechActiveRef.current = false;
        generatedSpeechRef.current = false;
        setSpeechStatus("idle");
        setSpeechSource("");

        setSpeechLanguageError(
          error.message ||
            "Could not generate Malayalam speech."
        );
      }
    };

  const startGeneratedMalayalamSpeech =
    (text, source) => {
      const chunks =
        splitTextIntoChunks(text).flatMap(
          (chunk) => {
            const parts = [];

            for (
              let offset = 0;
              offset < chunk.length;
              offset += 2600
            ) {
              parts.push(
                chunk.slice(
                  offset,
                  offset + 2600
                )
              );
            }

            return parts;
          }
        );

      if (!chunks.length) {
        return;
      }

      window.speechSynthesis.cancel();

      generatedAudioRef.current?.pause();

      if (generatedAudioUrlRef.current) {
        URL.revokeObjectURL(
          generatedAudioUrlRef.current
        );
      }

      speechActiveRef.current = true;
      generatedSpeechRef.current = true;

      setSpeechLanguageError("");
      setSpeechSource(source);
      setSpeechStatus("speaking");

      playGeneratedMalayalamChunk(
        chunks,
        0
      );
    };

  // =========================================================
  // START SPEECH
  // =========================================================

  const startSpeech = (
    text,
    source = "document",
    language = ""
  ) => {
    if (!speechSupported) {
      return;
    }

    if (!text || !text.trim()) {
      return;
    }

    generatedAudioRef.current?.pause();

    if (generatedAudioUrlRef.current) {
      URL.revokeObjectURL(
        generatedAudioUrlRef.current
      );
    }

    generatedAudioUrlRef.current = "";
    generatedSpeechRef.current = false;

    const requestedLanguage =
      SPEECH_LANGUAGE_CODES[language] ||
      "";

    if (requestedLanguage) {
      const baseLanguage =
        requestedLanguage
          .split("-")[0]
          .toLowerCase();

      const matchingVoice =
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase() ===
            requestedLanguage.toLowerCase()
        ) ||
        voices.find((voice) => {
          const voiceLanguage =
            voice.lang?.toLowerCase();

          return (
            voiceLanguage === baseLanguage ||
            voiceLanguage?.startsWith(
              `${baseLanguage}-`
            )
          );
        });

      if (
        !matchingVoice &&
        language === "Malayalam"
      ) {
        startGeneratedMalayalamSpeech(
          text,
          source
        );
        return;
      }

      if (!matchingVoice) {
        setSpeechLanguageError(
          `No ${language} speech voice is available in this browser or on this device. Add a ${language} text-to-speech voice in your device settings, then reload the reader.`
        );

        return;
      }
    }

    window.speechSynthesis.cancel();

    setSpeechLanguageError("");

    const chunks =
      splitTextIntoChunks(text);

    if (!chunks.length) {
      return;
    }

    speechQueueRef.current =
      chunks;

    speechIndexRef.current = 0;
    speechActiveRef.current = true;

    speechLanguageRef.current =
      SPEECH_LANGUAGE_CODES[language] ||
      "";

    setSpeechSource(source);
    setSpeechStatus("speaking");

    window.setTimeout(() => {
      speakNextChunk();
    }, 50);
  };

  // =========================================================
  // READ CURRENT PAGE
  // =========================================================

  const readCurrentPage = () => {
    const page = pages.find(
      (item, index) =>
        Number(
          getPageNumber(item, index)
        ) ===
        Number(currentPageNumber)
    );

    if (!page) {
      return;
    }

    const text =
      getPageText(page);

    startSpeech(
      text,
      `page ${currentPageNumber}`
    );
  };

  // =========================================================
  // READ SELECTED TEXT
  // =========================================================

  const readSelectedText = () => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const selection =
      window.getSelection();

    if (!selection) {
      return;
    }

    const text =
      selection.toString().trim();

    if (!text) {
      return;
    }

    startSpeech(
      text,
      "selection"
    );
  };

  // =========================================================
  // READ TRANSLATED TEXT
  // =========================================================

  const readTranslatedText = () => {
    if (
      !translation ||
      !speechSupported
    ) {
      return;
    }

    const container =
      document.createElement("div");

    container.innerHTML =
      DOMPurify.sanitize(
        marked.parse(translation)
      );

    startSpeech(
      container.textContent ||
        container.innerText ||
        "",
      `translation in ${translationResultLanguage}`,
      translationResultLanguage
    );
  };

  // =========================================================
  // TRANSLATE
  // =========================================================

  const translateText = async (
    source
  ) => {
    const targetLanguage =
      translationLanguage;

    let text;
    let sourceLabel;
    let sections = [];

    // -------------------------------------------------------
    // SELECTED TEXT
    // -------------------------------------------------------

    if (source === "selection") {
      text =
        window
          .getSelection()
          ?.toString()
          .trim() || "";

      sourceLabel = "Selected text";

      if (text) {
        const chunks = [];

        for (
          let offset = 0;
          offset < text.length;
          offset += 2500
        ) {
          chunks.push(
            text.slice(
              offset,
              offset + 2500
            )
          );
        }

        sections = chunks.map(
          (chunk, index) => ({
            label:
              chunks.length > 1
                ? `${sourceLabel} (part ${
                    index + 1
                  }/${chunks.length})`
                : sourceLabel,
            text: chunk,
          })
        );
      }
    }

    // -------------------------------------------------------
    // ENTIRE DOCUMENT
    // -------------------------------------------------------

    else if (source === "document") {
      sourceLabel =
        "Entire document";

      sections = [
        {
          label: "Document title",
          text: documentTitle,
        },

        ...pages.flatMap(
          (page, index) => {
            const pageNumber =
              getPageNumber(
                page,
                index
              );

            const pageText =
              getPageText(
                page
              ).trim();

            if (!pageText) {
              return [];
            }

            const chunks = [];

            for (
              let offset = 0;
              offset < pageText.length;
              offset += 2500
            ) {
              chunks.push(
                pageText.slice(
                  offset,
                  offset + 2500
                )
              );
            }

            return chunks.map(
              (
                chunk,
                chunkIndex
              ) => ({
                label:
                  chunks.length > 1
                    ? `Page ${pageNumber} (part ${
                        chunkIndex + 1
                      }/${chunks.length})`
                    : `Page ${pageNumber}`,

                text: chunk,
              })
            );
          }
        ),
      ];
    }

    // -------------------------------------------------------
    // SELECTED PAGES
    // -------------------------------------------------------

    else if (source === "pages") {
      const selectedPageSet =
        new Set(
          selectedTranslationPages.map(
            String
          )
        );

      const chosenPages =
        pages.filter(
          (page, index) =>
            selectedPageSet.has(
              String(
                getPageNumber(
                  page,
                  index
                )
              )
            )
        );

      sourceLabel =
        `Selected pages: ${chosenPages
          .map((page) =>
            getPageNumber(
              page,
              pages.indexOf(page)
            )
          )
          .join(", ")}`;

      sections =
        chosenPages.flatMap(
          (page) => {
            const pageNumber =
              getPageNumber(
                page,
                pages.indexOf(page)
              );

            const pageText =
              getPageText(
                page
              ).trim();

            if (!pageText) {
              return [];
            }

            const chunks = [];

            for (
              let offset = 0;
              offset < pageText.length;
              offset += 2500
            ) {
              chunks.push(
                pageText.slice(
                  offset,
                  offset + 2500
                )
              );
            }

            return chunks.map(
              (
                chunk,
                chunkIndex
              ) => ({
                label:
                  chunks.length > 1
                    ? `Page ${pageNumber} (part ${
                        chunkIndex + 1
                      }/${chunks.length})`
                    : `Page ${pageNumber}`,

                text: chunk,
              })
            );
          }
        );
    }

    // -------------------------------------------------------
    // CURRENT PAGE
    // -------------------------------------------------------

    else {
      const page =
        pages.find(
          (item, index) =>
            Number(
              getPageNumber(
                item,
                index
              )
            ) ===
            Number(
              currentPageNumber
            )
        );

      text =
        getPageText(page).trim();

      sourceLabel =
        `Page ${currentPageNumber}`;

      if (text) {
        sections = [
          {
            label: sourceLabel,
            text,
          },
        ];
      }
    }

    // -------------------------------------------------------
    // NO CONTENT
    // -------------------------------------------------------

    if (!sections.length) {
      setTranslationError(
        source === "selection"
          ? "Select some text in the document first."
          : source === "document"
          ? "There is no extracted text in this document to translate."
          : source === "pages"
          ? selectedTranslationPages.length
            ? "The selected pages have no extracted text to translate."
            : "Select one or more pages to translate first."
          : "There is no extracted text on this page to translate."
      );

      setTranslation("");

      return;
    }

    // -------------------------------------------------------
    // START TRANSLATION
    // -------------------------------------------------------

    setTranslationLoading(true);
    setTranslationError("");
    setTranslation("");
    setTranslationSource(sourceLabel);
    setTranslationResultLanguage(
      targetLanguage
    );

    try {
      const translatedSections = [];

      for (
        let index = 0;
        index < sections.length;
        index += 1
      ) {
        const section =
          sections[index];

        if (
          source === "document" ||
          source === "pages"
        ) {
          setTranslationProgress(
            `Translating section ${
              index + 1
            } of ${
              sections.length
            }…`
          );
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/assistant/translate`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                targetLanguage,
                text: section.text,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            `${
              data.message ||
              "Translation failed."
            } (${section.label})`
          );
        }

        if (!data.reply?.trim()) {
          throw new Error(
            `The translation service returned an empty result for ${section.label}.`
          );
        }

        translatedSections.push(
          `--- ${section.label} ---\n${data.reply}`
        );
      }

      // -----------------------------------------------------
      // SHOW TRANSLATION RESULT
      // -----------------------------------------------------

      setTranslation(
        translatedSections.join(
          "\n\n"
        )
      );

      setShowTranslationResult(
        true
      );
    } catch (error) {
      setTranslation("");

      setTranslationError(
        error.message ||
          "Translation failed. Please try again."
      );
    } finally {
      setTranslationLoading(false);
      setTranslationProgress("");
    }
  };

  // =========================================================
  // PAUSE / RESUME
  // =========================================================

  const togglePauseResume = () => {
    if (!speechSupported) {
      return;
    }

    if (
      speechStatus === "speaking"
    ) {
      if (
        generatedSpeechRef.current
      ) {
        generatedAudioRef.current?.pause();
        setSpeechStatus("paused");
        return;
      }

      window.speechSynthesis.pause();
      setSpeechStatus("paused");
      return;
    }

    if (
      speechStatus === "paused"
    ) {
      if (
        generatedSpeechRef.current
      ) {
        generatedAudioRef.current?.play();
        setSpeechStatus("speaking");
        return;
      }

      window.speechSynthesis.resume();
      setSpeechStatus("speaking");
    }
  };

  // =========================================================
  // STOP SPEECH
  // =========================================================

  const stopSpeech = () => {
    if (!speechSupported) {
      return;
    }

    speechActiveRef.current = false;

    generatedAudioRef.current?.pause();
    generatedAudioRef.current = null;

    generatedSpeechRef.current =
      false;

    if (generatedAudioUrlRef.current) {
      URL.revokeObjectURL(
        generatedAudioUrlRef.current
      );

      generatedAudioUrlRef.current =
        "";
    }

    speechQueueRef.current = [];
    speechIndexRef.current = 0;

    window.speechSynthesis.cancel();

    setSpeechStatus("idle");
    setSpeechSource("");
    speechLanguageRef.current =
      "";
  };

  // =========================================================
  // CHANGE SPEED
  // =========================================================

  const handleSpeechRateChange = (
    event
  ) => {
    const rate = Number(
      event.target.value
    );

    speechRateRef.current = rate;
    setSpeechRate(rate);

    if (
      speechStatus === "speaking" ||
      speechStatus === "paused"
    ) {
      const queue =
        speechQueueRef.current;

      const currentIndex =
        speechIndexRef.current;

      const remainingText =
        queue.slice(currentIndex);

      window.speechSynthesis.cancel();

      speechQueueRef.current =
        remainingText;

      speechIndexRef.current = 0;

      window.setTimeout(() => {
        speakNextChunk();
      }, 50);
    }
  };

  // =========================================================
  // CHANGE VOICE
  // =========================================================

  const handleVoiceChange = (
    event
  ) => {
    const voiceName =
      event.target.value;

    selectedVoiceRef.current =
      voiceName;

    setSelectedVoice(
      voiceName
    );

    if (
      speechStatus === "speaking" ||
      speechStatus === "paused"
    ) {
      const queue =
        speechQueueRef.current;

      const currentIndex =
        speechIndexRef.current;

      const remainingText =
        queue.slice(currentIndex);

      window.speechSynthesis.cancel();

      speechQueueRef.current =
        remainingText;

      speechIndexRef.current = 0;

      window.setTimeout(() => {
        speakNextChunk();
      }, 50);
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const searchResults = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const results = [];

    pages.forEach(
      (page, index) => {
        const text =
          getPageText(page);

        if (!text) {
          return;
        }

        const lowerText =
          text.toLowerCase();

        let start = 0;
        let count = 0;

        while (true) {
          const position =
            lowerText.indexOf(
              query,
              start
            );

          if (position === -1) {
            break;
          }

          results.push({
            pageNumber:
              getPageNumber(
                page,
                index
              ),

            index: count,
            position,
          });

          count += 1;

          start =
            position +
            query.length;
        }
      }
    );

    return results;
  }, [searchQuery, pages]);

  // =========================================================
  // SCROLL TO SEARCH RESULT
  // =========================================================

  const scrollToSearchResult = (
    result
  ) => {
    if (!result) {
      return;
    }

    const pageElement =
      document.querySelector(
        `[data-page-number="${result.pageNumber}"]`
      );

    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setCurrentPageNumber(
        Number(
          result.pageNumber
        )
      );
    }
  };

  // =========================================================
  // NEXT SEARCH RESULT
  // =========================================================

  const goToNextSearchResult = () => {
    if (!searchResults.length) {
      return;
    }

    const nextIndex =
      (currentSearchIndex + 1) %
      searchResults.length;

    setCurrentSearchIndex(
      nextIndex
    );

    scrollToSearchResult(
      searchResults[nextIndex]
    );
  };

  // =========================================================
  // PREVIOUS SEARCH RESULT
  // =========================================================

  const goToPreviousSearchResult =
    () => {
      if (!searchResults.length) {
        return;
      }

      const previousIndex =
        (currentSearchIndex -
          1 +
          searchResults.length) %
        searchResults.length;

      setCurrentSearchIndex(
        previousIndex
      );

      scrollToSearchResult(
        searchResults[
          previousIndex
        ]
      );
    };

  // =========================================================
  // ESCAPE HTML
  // =========================================================

  const escapeHtml = (value) => {
    return String(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  };

  // =========================================================
  // ESCAPE REGULAR EXPRESSION
  // =========================================================

  function escapeRegExp(value) {
    return String(value).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }

  // =========================================================
  // RENDER PAGE TEXT
  // =========================================================

  const renderPageHtml = (
    text,
    pageNumber
  ) => {
    if (!text) {
      return "";
    }

    const originalText =
      String(text);

    let html =
      escapeHtml(originalText);

    // -------------------------------------------------------
    // SAVED HIGHLIGHTS
    // -------------------------------------------------------

    const pageHighlights =
      highlights.filter(
        (highlight) =>
          Number(
            highlight.pageNumber
          ) === Number(pageNumber)
      );

    const hasStoredRange =
      (highlight) =>
        highlight.start != null &&
        highlight.end != null;

    const rangedHighlights =
      pageHighlights
        .filter((highlight) => {
          if (
            !hasStoredRange(
              highlight
            )
          ) {
            return false;
          }

          const start =
            Number(
              highlight.start
            );

          const end =
            Number(
              highlight.end
            );

          return (
            Number.isInteger(
              start
            ) &&
            Number.isInteger(
              end
            ) &&
            start >= 0 &&
            end > start &&
            end <=
              originalText.length
          );
        })
        .sort(
          (first, second) =>
            Number(first.start) -
            Number(second.start)
        );

    if (rangedHighlights.length) {
      const highlightedParts = [];
      let cursor = 0;

      rangedHighlights.forEach(
        (highlight) => {
          const start =
            Number(
              highlight.start
            );

          const end =
            Number(
              highlight.end
            );

          if (start < cursor) {
            return;
          }

          const segment =
            originalText.slice(
              start,
              end
            );

          const expectedText =
            String(
              highlight.text ||
                highlight.content ||
                ""
            ).trim();

          if (
            segment.trim() !==
            expectedText
          ) {
            return;
          }

          highlightedParts.push(
            escapeHtml(
              originalText.slice(
                cursor,
                start
              )
            )
          );

          highlightedParts.push(
            `<mark class="reader-saved-highlight">${escapeHtml(
              segment
            )}</mark>`
          );

          cursor = end;
        }
      );

      highlightedParts.push(
        escapeHtml(
          originalText.slice(cursor)
        )
      );

      html =
        highlightedParts.join("");
    }

    pageHighlights
      .filter(
        (highlight) =>
          !hasStoredRange(
            highlight
          )
      )
      .forEach(
        (highlight) => {
          const highlightedText =
            highlight.text ||
            highlight.content;

          if (!highlightedText) {
            return;
          }

          const escaped =
            escapeHtml(
              highlightedText
            );

          html = html.replace(
            new RegExp(
              escapeRegExp(
                escaped
              ),
              "gi"
            ),
            (match) =>
              `<mark class="reader-saved-highlight">${match}</mark>`
          );
        }
      );

    // -------------------------------------------------------
    // SEARCH HIGHLIGHTS
    // -------------------------------------------------------

    const query =
      searchQuery.trim();

    if (query) {
      const escapedQuery =
        escapeHtml(query);

      const regex =
        new RegExp(
          `(${escapeRegExp(
            escapedQuery
          )})`,
          "gi"
        );

      let occurrence = 0;

      html = html.replace(
        regex,
        (match) => {
          const pageResults =
            searchResults.filter(
              (result) =>
                Number(
                  result.pageNumber
                ) ===
                Number(pageNumber)
            );

          const resultForOccurrence =
            pageResults[
              occurrence
            ];

          const globalIndex =
            resultForOccurrence
              ? searchResults.indexOf(
                  resultForOccurrence
                )
              : -1;

          const isCurrent =
            globalIndex ===
            currentSearchIndex;

          occurrence += 1;

          return `<mark class="${
            isCurrent
              ? "reader-search-highlight current"
              : "reader-search-highlight"
          }">${match}</mark>`;
        }
      );
    }

    return html;
  };

  // =========================================================
  // ZOOM
  // =========================================================

  const zoomIn = () => {
    setZoom((current) =>
      Math.min(
        current + 10,
        180
      )
    );
  };

  const zoomOut = () => {
    setZoom((current) =>
      Math.max(
        current - 10,
        60
      )
    );
  };

  const resetZoom = () => {
    setZoom(100);
  };

  // =========================================================
  // BOOKMARK CHECK
  // =========================================================

  const isPageBookmarked = (
    pageNumber
  ) => {
    return bookmarks.some(
      (bookmark) =>
        Number(
          bookmark.pageNumber
        ) === Number(pageNumber)
    );
  };

  // =========================================================
  // TOGGLE BOOKMARK
  // =========================================================

  const toggleBookmark =
    async (pageNumber) => {
      if (
        !documentId ||
        pageNumber ===
          undefined ||
        pageNumber === null
      ) {
        return;
      }

      const normalizedPageNumber =
        Number(pageNumber);

      if (
        !Number.isFinite(
          normalizedPageNumber
        )
      ) {
        return;
      }

      const existingBookmark =
        bookmarks.find(
          (bookmark) =>
            Number(
              bookmark.pageNumber
            ) ===
            normalizedPageNumber
        );

      try {
        setBookmarkError("");

        // ---------------------------------------------------
        // REMOVE BOOKMARK
        // ---------------------------------------------------

        if (existingBookmark) {
          const response =
            await fetch(
              `${API_BASE_URL}/api/documents/${documentId}/bookmarks/${normalizedPageNumber}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Unable to remove bookmark."
            );
          }

          setBookmarks(
            (current) =>
              Array.isArray(
                data.bookmarks
              )
                ? data.bookmarks
                : current.filter(
                    (bookmark) =>
                      Number(
                        bookmark.pageNumber
                      ) !==
                      normalizedPageNumber
                  )
          );

          return;
        }

        // ---------------------------------------------------
        // ADD BOOKMARK
        // ---------------------------------------------------

        const response =
          await fetch(
            `${API_BASE_URL}/api/documents/${documentId}/bookmarks`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              },

              body: JSON.stringify({
                pageNumber:
                  normalizedPageNumber,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to save bookmark."
          );
        }

        setBookmarks(
          (current) =>
            Array.isArray(
              data.bookmarks
            )
              ? data.bookmarks
              : current
        );
      } catch (err) {
        console.error(
          "Bookmark error:",
          err
        );

        setBookmarkError(
          err.message ||
            "Unable to update bookmark."
        );
      }
    };

  // =========================================================
  // GET SELECTION INFORMATION
  // =========================================================

  const getSelectionInfo = () => {
    const selection =
      window.getSelection();

    if (
      !selection ||
      selection.isCollapsed
    ) {
      return null;
    }

    const selectedText =
      selection
        .toString()
        .trim();

    if (!selectedText) {
      return null;
    }

    const range =
      selection.getRangeAt(0);

    let container =
      range.commonAncestorContainer;

    if (
      container.nodeType ===
      Node.TEXT_NODE
    ) {
      container =
        container.parentElement;
    }

    const pageElement =
      container?.closest(
        ".reader-page-card"
      );

    if (!pageElement) {
      return null;
    }

    const pageNumber =
      Number(
        pageElement.getAttribute(
          "data-page-number"
        )
      );

    const textElement =
      pageElement.querySelector(
        ".reader-page-text"
      );

    const pageText =
      textElement?.textContent ||
      "";

    let startOffset = -1;
    let endOffset = -1;

    if (textElement) {
      try {
        const prefixRange =
          document.createRange();

        prefixRange.selectNodeContents(
          textElement
        );

        prefixRange.setEnd(
          range.startContainer,
          range.startOffset
        );

        const rawSelection =
          selection.toString();

        const leadingTrim =
          rawSelection.length -
          rawSelection.trimStart()
            .length;

        startOffset =
          prefixRange.toString()
            .length +
          leadingTrim;

        endOffset =
          startOffset +
          selectedText.length;

        if (
          pageText
            .slice(
              startOffset,
              endOffset
            )
            .trim() !==
          selectedText
        ) {
          startOffset = -1;
          endOffset = -1;
        }
      } catch {
        startOffset = -1;
        endOffset = -1;
      }
    }

    if (startOffset < 0) {
      startOffset =
        pageText.indexOf(
          selectedText
        );

      endOffset =
        startOffset >= 0
          ? startOffset +
            selectedText.length
          : -1;
    }

    return {
      selectedText,
      pageNumber,

      startOffset:
        startOffset >= 0
          ? startOffset
          : undefined,

      endOffset:
        endOffset >= 0
          ? endOffset
          : undefined,
    };
  };

  // =========================================================
  // SAVE HIGHLIGHT
  // =========================================================

  const saveHighlight =
    async () => {
      const selectionInfo =
        selectionInfoRef.current ||
        getSelectionInfo();

      if (!selectionInfo) {
        alert(
          "Please select some text first."
        );

        return;
      }

      console.log(
        "Saving highlight:",
        selectionInfo
      );

      const scrollPosition = {
        x: window.scrollX,
        y: window.scrollY,
      };

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/documents/${documentId}/highlights`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              },

              body: JSON.stringify({
                pageNumber:
                  selectionInfo.pageNumber,

                text:
                  selectionInfo.selectedText,

                start:
                  selectionInfo.startOffset,

                end:
                  selectionInfo.endOffset,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to save highlight"
          );
        }

        if (
          Array.isArray(
            data.highlights
          )
        ) {
          setHighlights(
            data.highlights
          );
        } else {
          const newHighlight =
            data.highlight ||
            data;

          setHighlights(
            (current) => [
              ...current,
              newHighlight,
            ]
          );
        }

        window
          .getSelection()
          ?.removeAllRanges();

        selectionInfoRef.current =
          null;

        setSelectionHighlightPosition(
          null
        );

        window.scrollTo({
          left: scrollPosition.x,
          top: scrollPosition.y,
          behavior: "instant",
        });
      } catch (err) {
        console.error(
          "Highlight error:",
          err
        );

        alert(
          err.message ||
            "Unable to save this highlight."
        );
      }
    };

  // =========================================================
  // REMOVE HIGHLIGHT
  // =========================================================

  const removeHighlight =
    async (highlightId) => {
      if (!highlightId) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/documents/${documentId}/highlights/${encodeURIComponent(
              highlightId
            )}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to remove highlight"
          );
        }

        if (
          Array.isArray(
            data.highlights
          )
        ) {
          setHighlights(
            data.highlights
          );
        } else {
          setHighlights(
            (current) =>
              current.filter(
                (highlight) =>
                  String(
                    highlight.id
                  ) !==
                  String(
                    highlightId
                  )
              )
          );
        }
      } catch (err) {
        console.error(
          "Remove highlight error:",
          err
        );
      }
    };

  // =========================================================
  // JUMP TO PAGE
  // =========================================================

  const jumpToPage = (
    pageNumber
  ) => {
    const pageElement =
      document.querySelector(
        `[data-page-number="${pageNumber}"]`
      );

    if (!pageElement) {
      return;
    }

    pageElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setCurrentPageNumber(
      Number(pageNumber)
    );
  };

  // =========================================================
  // BACK TO DASHBOARD
  // =========================================================

  const goBack = () => {
    window.location.hash =
      "dashboard";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="reader-page">
        <aside className="dashboard-sidebar">
          <a
            href="#dashboard"
            className="dashboard-logo"
          >
            <span className="dashboard-logo-icon">
              ✦
            </span>

            <span>DocIQ</span>
          </a>
        </aside>

        <main className="reader-content">
          <div className="reader-loading">
            <div className="reader-loading-icon">
              ⟳
            </div>

            <p>
              Loading document...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="reader-page">
        <aside className="dashboard-sidebar">
          <a
            href="#dashboard"
            className="dashboard-logo"
          >
            <span className="dashboard-logo-icon">
              ✦
            </span>

            <span>DocIQ</span>
          </a>
        </aside>

        <main className="reader-content">
          <div className="reader-error">
            <div className="reader-error-icon">
              !
            </div>

            <h2>
              Unable to open document
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={goBack}
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="reader-page">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="dashboard-sidebar">
        <a
          href="#dashboard"
          className="dashboard-logo"
        >
          <span className="dashboard-logo-icon">
            ✦
          </span>

          <span>DocIQ</span>
        </a>

        <div className="dashboard-menu-title">
          MAIN MENU
        </div>

        <nav className="dashboard-menu">
          <a
            href="#dashboard"
            className="dashboard-menu-item"
          >
            <span>🏠</span>
            Dashboard
          </a>

          <a
            href="#documents"
            className="dashboard-menu-item"
          >
            <span>📄</span>
            My Documents
          </a>

          <a
            href="#upload"
            className="dashboard-menu-item"
          >
            <span>📤</span>
            Upload Document
          </a>

          <a
            href="#study"
            className="dashboard-menu-item"
          >
            <span>🎓</span>
            Study Hub
          </a>

          <a
            href="#assistant"
            className="dashboard-menu-item"
          >
            <span>🤖</span>
            AI Assistant
          </a>

          <a
            href="#settings"
            className="dashboard-menu-item"
          >
            <span>⚙️</span>
            Settings
          </a>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-help-card">
            <div className="dashboard-help-icon">
              ?
            </div>

            <strong>
              Need help?
            </strong>

            <p>
              Explore DocIQ and learn smarter.
            </p>

            <button
              type="button"
              onClick={() =>
                (window.location.hash =
                  "upload")
              }
            >
              Learn more →
            </button>
          </div>

          <button
            className="dashboard-logout"
            type="button"
            onClick={() => {
              localStorage.removeItem(
                "userName"
              );

              localStorage.removeItem(
                "token"
              );

              window.location.hash =
                "home";
            }}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main
        className="reader-content"
        onMouseUp={() => {
          setTimeout(() => {
            const selectionInfo =
              getSelectionInfo();

            if (!selectionInfo) {
              return;
            }

            selectionInfoRef.current =
              selectionInfo;

            const selection =
              window.getSelection();

            if (
              !selection ||
              selection.rangeCount === 0
            ) {
              return;
            }

            const range =
              selection.getRangeAt(0);

            const bounds =
              range.getBoundingClientRect();

            setSelectionHighlightPosition({
              left: Math.max(
                8,
                Math.min(
                  window.innerWidth -
                    120,
                  bounds.left +
                    bounds.width /
                      2 -
                    55
                )
              ),

              top: Math.max(
                8,
                bounds.top - 50
              ),
            });
          }, 0);
        }}
      >

        {/* ===================================================
            TOP BAR
        ==================================================== */}

        <header className="reader-topbar">
          <button
            type="button"
            className="reader-back"
            onClick={goBack}
          >
            ← Back
          </button>

          <div className="reader-user">
            <div className="reader-user-avatar">
              {userName
                .charAt(0)
                .toUpperCase()}
            </div>

            <span>
              {userName}
            </span>
          </div>
        </header>

        {/* ===================================================
            DOCUMENT HEADER
        ==================================================== */}

        <section className="reader-document-header">
          <div>
            <p className="reader-eyebrow">
              {getFileType(
                documentTitle
              )}{" "}
              DOCUMENT
            </p>

            <h1 className="reader-document-title">
              <span className="reader-file-icon">
                ▤
              </span>

              {documentTitle}
            </h1>
          </div>

          <button
            type="button"
            className="reader-study-button"
            onClick={() => {
              window.location.hash =
                "study";
            }}
          >
            Study Mode →
          </button>
        </section>

        {/* ===================================================
            TOOLBAR
        ==================================================== */}

        <div className="reader-toolbar">

          {/* SEARCH */}

          <div className="reader-search">
            <span>
              ⌕
            </span>

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(
                  event.target.value
                );

                setCurrentSearchIndex(
                  0
                );
              }}
              placeholder="Search in document..."
            />

            {searchQuery && (
              <button
                type="button"
                className="reader-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentSearchIndex(
                    0
                  );
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* SEARCH BUTTON */}

          <button
            type="button"
            className="reader-search-button"
            onClick={() => {
              if (
                searchResults.length >
                0
              ) {
                scrollToSearchResult(
                  searchResults[
                    currentSearchIndex
                  ]
                );
              }
            }}
          >
            Search
          </button>

          {/* CONTROLS */}

          <div className="reader-controls">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= 60}
              title="Zoom out"
            >
              −
            </button>

            <button
              type="button"
              className="reader-zoom-value"
              onClick={resetZoom}
              title="Reset zoom"
            >
              {zoom}%
            </button>

            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= 180}
              title="Zoom in"
            >
              +
            </button>

            <button
              type="button"
              className="reader-highlight-button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={saveHighlight}
            >
              Highlight
            </button>
          </div>
        </div>

        {/* ===================================================
            SEARCH RESULTS
        ==================================================== */}

        {searchQuery && (
          <div className="reader-search-results">
            <div className="reader-search-results-header">
              <span>
                {searchResults.length >
                0
                  ? `${searchResults.length} result${
                      searchResults.length ===
                      1
                        ? ""
                        : "s"
                    }`
                  : "No results"}
              </span>

              {searchResults.length >
                0 && (
                <div className="reader-search-navigation">
                  <button
                    type="button"
                    onClick={
                      goToPreviousSearchResult
                    }
                  >
                    ↑
                  </button>

                  <span className="reader-search-count">
                    {currentSearchIndex +
                      1}
                    {" / "}
                    {searchResults.length}
                  </span>

                  <button
                    type="button"
                    onClick={
                      goToNextSearchResult
                    }
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>

            {searchResults.length >
              0 && (
              <div className="reader-search-results-list">
                {searchResults
                  .slice(0, 10)
                  .map(
                    (
                      result,
                      index
                    ) => (
                      <button
                        type="button"
                        key={`${result.pageNumber}-${result.position}`}
                        className="reader-search-result"
                        onClick={() => {
                          setCurrentSearchIndex(
                            index
                          );

                          jumpToPage(
                            result.pageNumber
                          );
                        }}
                      >
                        <span>
                          Page{" "}
                          {
                            result.pageNumber
                          }
                        </span>

                        <strong>
                          Match{" "}
                          {result.index +
                            1}
                        </strong>
                      </button>
                    )
                  )}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            TEXT TO SPEECH
        ==================================================== */}

        <section className="reader-tts-panel">
          <div className="reader-tts-title">
            <strong>
              🔊 Read Aloud
            </strong>

            <span>
              Browser Text-to-Speech
            </span>
          </div>

          {speechSupported ? (
            <>
              <div className="reader-tts-controls">
                <button
                  type="button"
                  onClick={
                    readCurrentPage
                  }
                >
                  ▶ Read Page
                </button>

                <button
                  type="button"
                  onMouseDown={(event) =>
                    event.preventDefault()
                  }
                  onClick={
                    readSelectedText
                  }
                >
                  🔊 Read Selection
                </button>

                <button
                  type="button"
                  onClick={
                    togglePauseResume
                  }
                  disabled={
                    speechStatus ===
                    "idle"
                  }
                >
                  {speechStatus ===
                  "paused"
                    ? "▶ Resume"
                    : "⏸ Pause"}
                </button>

                <button
                  type="button"
                  onClick={stopSpeech}
                  disabled={
                    speechStatus ===
                    "idle"
                  }
                >
                  ■ Stop
                </button>

                <label>
                  Speed

                  <select
                    value={speechRate}
                    onChange={
                      handleSpeechRateChange
                    }
                  >
                    <option value="0.5">
                      0.5×
                    </option>

                    <option value="0.75">
                      0.75×
                    </option>

                    <option value="1">
                      1×
                    </option>

                    <option value="1.25">
                      1.25×
                    </option>

                    <option value="1.5">
                      1.5×
                    </option>

                    <option value="1.75">
                      1.75×
                    </option>

                    <option value="2">
                      2×
                    </option>
                  </select>
                </label>

                {voices.length >
                  0 && (
                  <label>
                    Voice

                    <select
                      value={
                        selectedVoice
                      }
                      onChange={
                        handleVoiceChange
                      }
                    >
                      {voices.map(
                        (voice) => (
                          <option
                            key={`${voice.name}-${voice.lang}`}
                            value={
                              voice.name
                            }
                          >
                            {voice.name}{" "}
                            (
                            {
                              voice.lang
                            }
                            )
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}
              </div>

              <div className="reader-tts-status">
                {speechStatus ===
                  "speaking" && (
                  <span>
                    🔊 Reading{" "}
                    {speechSource ||
                      "document"}
                    ...
                  </span>
                )}

                {speechStatus ===
                  "paused" && (
                  <span>
                    ⏸ Reading paused
                  </span>
                )}

                {speechStatus ===
                  "idle" && (
                  <span>
                    Select text or read
                    the current page.
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="reader-tts-not-supported">
              Your browser does not support
              Speech Synthesis.
            </div>
          )}
        </section>

        {/* ===================================================
            TRANSLATION
        ==================================================== */}

        <section className="reader-translation-panel">
          <div className="reader-translation-header">
            <div>
              <div className="reader-translation-title">
                <span
                  className="reader-translation-icon"
                  aria-hidden="true"
                >
                  文
                </span>

                <span>
                  Translate document
                </span>
              </div>

              <p className="reader-translation-subtitle">
                Translate the current page or
                selected text.
              </p>
            </div>
          </div>

          <div className="reader-translation-controls">
            <select
              className="reader-translation-select"
              aria-label="Translation language"
              value={
                translationLanguage
              }
              onChange={(event) =>
                setTranslationLanguage(
                  event.target.value
                )
              }
            >
              {[
                "English",
                "Hindi",
                "Malayalam",
                "Tamil",
                "Telugu",
                "Bengali",
                "Marathi",
                "Kannada",
                "Gujarati",
                "Punjabi",
                "Urdu",
                "Spanish",
                "French",
                "German",
                "Arabic",
                "Chinese",
                "Japanese",
                "Portuguese",
                "Italian",
                "Korean",
                "Russian",
              ].map(
                (language) => (
                  <option
                    key={language}
                    value={language}
                  >
                    {language}
                  </option>
                )
              )}
            </select>

            <button
              className="reader-translate-button"
              type="button"
              onClick={() =>
                translateText("pages")
              }
              disabled={
                translationLoading ||
                selectedTranslationPages.length ===
                  0
              }
            >
              {translationLoading &&
              translationSource.startsWith(
                "Selected pages:"
              )
                ? translationProgress ||
                  "Translating selected pages…"
                : `Translate selected pages (${selectedTranslationPages.length})`}
            </button>

            <button
              className="reader-translate-button"
              type="button"
              onClick={() =>
                translateText(
                  "document"
                )
              }
              disabled={
                translationLoading
              }
            >
              {translationLoading &&
              translationSource ===
                "Entire document"
                ? translationProgress ||
                  "Translating document…"
                : "Translate Entire Document"}
            </button>

            <button
              className="reader-translate-button"
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                translateText(
                  "selection"
                )
              }
              disabled={
                translationLoading
              }
            >
              Translate Selection
            </button>
          </div>

          {/* PAGE SELECTION */}

          <div className="reader-translation-page-picker">
            <div className="reader-translation-page-picker-heading">
              <strong>
                Choose pages to translate
              </strong>

              <button
                type="button"
                onClick={() =>
                  setSelectedTranslationPages(
                    selectedTranslationPages.length ===
                      pages.length
                      ? []
                      : pages.map(
                          (
                            page,
                            index
                          ) =>
                            getPageNumber(
                              page,
                              index
                            )
                        )
                  )
                }
                disabled={
                  !pages.length ||
                  translationLoading
                }
              >
                {selectedTranslationPages.length ===
                pages.length
                  ? "Clear selection"
                  : "Select all"}
              </button>
            </div>

            <div className="reader-translation-page-options">
              {pages.map(
                (page, index) => {
                  const pageNumber =
                    getPageNumber(
                      page,
                      index
                    );

                  const selected =
                    selectedTranslationPages.some(
                      (item) =>
                        String(
                          item
                        ) ===
                        String(
                          pageNumber
                        )
                    );

                  return (
                    <label
                      key={
                        pageNumber
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          selected
                        }
                        disabled={
                          translationLoading
                        }
                        onChange={() =>
                          setSelectedTranslationPages(
                            (
                              current
                            ) =>
                              selected
                                ? current.filter(
                                    (
                                      item
                                    ) =>
                                      String(
                                        item
                                      ) !==
                                      String(
                                        pageNumber
                                      )
                                  )
                                : [
                                    ...current,
                                    pageNumber,
                                  ]
                          )
                        }
                      />

                      Page{" "}
                      {pageNumber}
                    </label>
                  );
                }
              )}
            </div>
          </div>

          {/* TRANSLATION ERROR */}

          {translationError && (
            <div
              className="reader-translation-error"
              role="alert"
            >
              {translationError}
            </div>
          )}

          {/* TRANSLATION PROGRESS */}

          {translationProgress &&
            (
              translationSource ===
                "Entire document" ||
              translationSource.startsWith(
                "Selected pages:"
              )
            ) && (
              <div
                className="reader-translation-status loading"
                role="status"
              >
                {translationProgress}
              </div>
            )}

          {/* =================================================
              TRANSLATED RESULT
          ================================================== */}

          {translation &&
            showTranslationResult && (
              <div
                className="reader-translated-result"
                aria-live="polite"
              >
                <div className="reader-translated-result-header">
                  <strong>
                    {translationSource} ·{" "}
                    {
                      translationResultLanguage
                    }
                  </strong>

                  {/* CLOSE BUTTON */}

                  <button
                    type="button"
                    className="reader-translation-close"
                    onClick={() => {
                      stopSpeech();
                      setShowTranslationResult(
                        false
                      );
                    }}
                    title="Close translation"
                    aria-label="Close translation"
                  >
                    ×
                  </button>
                </div>

                {/* READ TRANSLATION */}

                {speechSupported && (
                  <button
                    className="reader-translation-voice"
                    type="button"
                    onClick={
                      readTranslatedText
                    }
                  >
                    🔊 Read translation aloud
                    in{" "}
                    {
                      translationResultLanguage
                    }
                  </button>
                )}

                {/* SPEECH ERROR */}

                {speechLanguageError && (
                  <div
                    className="reader-translation-error"
                    role="alert"
                  >
                    {
                      speechLanguageError
                    }
                  </div>
                )}

                {/* TRANSLATED TEXT */}

                <div
                  className="reader-translated-text reader-translated-markdown"
                  dangerouslySetInnerHTML={{
                    __html:
                      DOMPurify.sanitize(
                        marked.parse(
                          translation
                        )
                      ),
                  }}
                />
              </div>
            )}

        </section>

        {/* ===================================================
            BOOKMARKS
        ==================================================== */}

        {bookmarkError && (
          <div
            className="reader-bookmark-error"
            role="alert"
          >
            {bookmarkError}
          </div>
        )}

        {bookmarks.length > 0 && (
          <section className="reader-bookmarks">
            <h2 className="reader-section-heading">
              🔖 Bookmarks
            </h2>

            <div className="reader-bookmark-list">
              {bookmarks.map(
                (bookmark) => (
                  <button
                    type="button"
                    key={
                      bookmark._id ||
                      bookmark.id ||
                      bookmark.pageNumber
                    }
                    className="reader-bookmark"
                    onClick={() =>
                      jumpToPage(
                        bookmark.pageNumber
                      )
                    }
                  >
                    Page{" "}
                    {
                      bookmark.pageNumber
                    }
                  </button>
                )
              )}
            </div>
          </section>
        )}

        {/* ===================================================
            DOCUMENT PAGES
        ==================================================== */}

        <section className="reader-document-area">
          {pages.length === 0 ? (
            <div className="reader-no-pages">
              <h2>
                No document text available
              </h2>

              <p>
                This document does not
                contain readable text yet.
              </p>
            </div>
          ) : (
            pages.map(
              (page, index) => {
                const pageNumber =
                  getPageNumber(
                    page,
                    index
                  );

                const pageText =
                  getPageText(page);

                const bookmarked =
                  isPageBookmarked(
                    pageNumber
                  );

                return (
                  <article
                    key={pageNumber}
                    className="reader-page-card"
                    data-page-number={
                      pageNumber
                    }
                  >
                    {/* PAGE HEADER */}

                    <div className="reader-page-header">
                      <div>
                        <span className="reader-page-label">
                          Page{" "}
                          {pageNumber}
                        </span>

                        <strong>
                          {Number(
                            pageNumber
                          ) ===
                          Number(
                            currentPageNumber
                          )
                            ? "Currently reading"
                            : ""}
                        </strong>
                      </div>

                      <div>
                        <button
                          type="button"
                          className={
                            bookmarked
                              ? "reader-bookmark active"
                              : "reader-bookmark"
                          }
                          onClick={() =>
                            toggleBookmark(
                              pageNumber
                            )
                          }
                          title={
                            bookmarked
                              ? "Remove bookmark"
                              : "Bookmark page"
                          }
                        >
                          {bookmarked
                            ? "🔖"
                            : "☆"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            startSpeech(
                              pageText,
                              `page ${pageNumber}`
                            )
                          }
                          title="Read this page"
                        >
                          🔊
                        </button>
                      </div>
                    </div>

                    {/* PAGE TEXT */}

                    {pageText ? (
                      <div
                        className="reader-page-text"
                        style={{
                          fontSize: `${zoom}%`,
                        }}
                        dangerouslySetInnerHTML={{
                          __html:
                            renderPageHtml(
                              pageText,
                              pageNumber
                            ),
                        }}
                      />
                    ) : (
                      <div className="reader-empty-page">
                        This page has no
                        readable text.
                      </div>
                    )}
                  </article>
                );
              }
            )
          )}
        </section>

        {/* ===================================================
            SAVED HIGHLIGHTS
        ==================================================== */}

        {selectionHighlightPosition && (
          <button
            type="button"
            className="reader-selection-highlight-action"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={saveHighlight}
            style={{
              position: "fixed",
              left:
                selectionHighlightPosition.left,
              top:
                selectionHighlightPosition.top,
              zIndex: 1000,
              border: 0,
              borderRadius: 8,
              padding: "8px 12px",
              background: "#4b254f",
              color: "white",
              boxShadow:
                "0 4px 14px rgba(48, 36, 59, 0.22)",
              cursor: "pointer",
            }}
          >
            Highlight
          </button>
        )}

        {highlights.length > 0 && (
          <section className="reader-highlights">
            <h2 className="reader-section-heading">
              Saved Highlights
            </h2>

            <div className="reader-highlight-list">
              {highlights.map(
                (highlight) => (
                  <div
                    key={
                      highlight._id ||
                      highlight.id
                    }
                    className="reader-highlight-item"
                  >
                    <div className="reader-highlight-content">
                      <span className="reader-highlight-text">
                        "
                        {highlight.text ||
                          highlight.content ||
                          "Highlighted text"}
                        "
                      </span>

                      <small>
                        Page{" "}
                        {
                          highlight.pageNumber
                        }
                      </small>
                    </div>

                    <button
                      type="button"
                      className="reader-highlight-remove"
                      onClick={() =>
                        removeHighlight(
                          highlight.id ||
                            highlight._id
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Reader;
