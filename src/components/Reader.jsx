import React, {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  const [bookmarkError, setBookmarkError] = useState("");

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
  const [speechSource, setSpeechSource] = useState("");
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [translationLanguage, setTranslationLanguage] = useState("English");
  const [translation, setTranslation] = useState("");
  const [translationSource, setTranslationSource] = useState("");
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [translationProgress, setTranslationProgress] = useState("");

  // =========================================================
  // REFS
  // =========================================================

  const speechQueueRef = useRef([]);
  const speechIndexRef = useRef(0);
  const speechActiveRef = useRef(false);
  const speechRateRef = useRef(1);
  const selectedVoiceRef = useRef("");
  const speechLanguageRef = useRef("");

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
      setLoading(false);
      setError("No document was selected.");
      return;
    }

    let cancelled = false;

    const loadDocument = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/documents/${documentId}`
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

    const requestedLanguage = speechLanguageRef.current;
    if (requestedLanguage) {
      utterance.lang = requestedLanguage;
      const baseLanguage = requestedLanguage.split("-")[0].toLowerCase();
      const matchingVoice = voices.find(
        (voice) => voice.lang?.toLowerCase() === requestedLanguage.toLowerCase()
      ) || voices.find(
        (voice) => voice.lang?.toLowerCase().startsWith(`${baseLanguage}-`)
      );
      if (matchingVoice) utterance.voice = matchingVoice;
    } else {
      const voiceName = selectedVoiceRef.current;
      const voice = voices.find((item) => item.name === voiceName);
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

    window.speechSynthesis.cancel();

    const chunks =
      splitTextIntoChunks(text);

    if (!chunks.length) {
      return;
    }

    speechQueueRef.current = chunks;
    speechIndexRef.current = 0;
    speechActiveRef.current = true;
    speechLanguageRef.current = SPEECH_LANGUAGE_CODES[language] || "";

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
        ) === Number(currentPageNumber)
    );

    if (!page) {
      return;
    }

    const text = getPageText(page);

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

  const readTranslatedText = () => {
    if (!translation || !speechSupported) return;
    const container = document.createElement("div");
    container.innerHTML = DOMPurify.sanitize(marked.parse(translation));
    startSpeech(
      container.textContent || container.innerText || "",
      `translation in ${translationLanguage}`,
      translationLanguage
    );
  };

  const translateText = async (source) => {
    let text = "";
    let sourceLabel = "";
    let sections = [];

    if (source === "selection") {
      text = window.getSelection()?.toString().trim() || "";
      sourceLabel = "Selected text";
      if (text) sections = [{ label: sourceLabel, text }];
    } else if (source === "document") {
      sourceLabel = "Entire document";
      sections = [
        { label: "Document title", text: documentTitle },
        ...pages.flatMap((page, index) => {
        const pageNumber = getPageNumber(page, index);
        const pageText = getPageText(page).trim();
        if (!pageText) return [];

        const chunks = [];
        for (let offset = 0; offset < pageText.length; offset += 2500) {
          chunks.push(pageText.slice(offset, offset + 2500));
        }
        return chunks.map((chunk, chunkIndex) => ({
          label: chunks.length > 1
            ? `Page ${pageNumber} (part ${chunkIndex + 1}/${chunks.length})`
            : `Page ${pageNumber}`,
          text: chunk,
        }));
        }),
      ];
    } else {
      const page = pages.find(
        (item, index) =>
          Number(getPageNumber(item, index)) === Number(currentPageNumber)
      );
      text = getPageText(page).trim();
      sourceLabel = `Page ${currentPageNumber}`;
      if (text) sections = [{ label: sourceLabel, text }];
    }

    if (!sections.length) {
      setTranslationError(source === "selection"
        ? "Select some text in the document first."
        : source === "document"
          ? "There is no extracted text in this document to translate."
          : "There is no extracted text on this page to translate.");
      setTranslation("");
      return;
    }

    setTranslationLoading(true);
    setTranslationError("");
    setTranslation("");
    setTranslationSource(sourceLabel);

    try {
      const translatedSections = [];
      for (let index = 0; index < sections.length; index += 1) {
        const section = sections[index];
        if (source === "document") {
          setTranslationProgress(`Translating section ${index + 1} of ${sections.length}…`);
        }
        const response = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `Translate the following document text into ${translationLanguage}. Translate the document title, topic names, headings, labels, and body text too. Preserve meaning, formatting, and paragraph breaks. Do not leave headings or topic names in the original language unless they are proper names. Return only the translation.\n\n${section.text.slice(0, 5500)}`,
            }],
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `Translation failed for ${section.label}.`);
        if (!data.reply) throw new Error(`The translation service returned an empty result for ${section.label}.`);
        translatedSections.push(`--- ${section.label} ---\n${data.reply}`);
        setTranslation(translatedSections.join("\n\n"));
      }
    } catch (error) {
      setTranslationError(error.message || "Translation failed. Please try again.");
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
      window.speechSynthesis.pause();
      setSpeechStatus("paused");
      return;
    }

    if (
      speechStatus === "paused"
    ) {
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
    speechQueueRef.current = [];
    speechIndexRef.current = 0;

    window.speechSynthesis.cancel();

    setSpeechStatus("idle");
    setSpeechSource("");
    speechLanguageRef.current = "";
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

    setSelectedVoice(voiceName);

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

    pages.forEach((page, index) => {
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
    });

    return results;
  }, [searchQuery, pages]);

  // =========================================================
  // RESET SEARCH INDEX
  // =========================================================

  useEffect(() => {
    setCurrentSearchIndex(0);
  }, [searchQuery]);

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
        Number(result.pageNumber)
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

    setCurrentSearchIndex(nextIndex);

    scrollToSearchResult(
      searchResults[nextIndex]
    );
  };

  // =========================================================
  // PREVIOUS SEARCH RESULT
  // =========================================================

  const goToPreviousSearchResult = () => {
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
      searchResults[previousIndex]
    );
  };

  // =========================================================
  // ESCAPE HTML
  // =========================================================

  const escapeHtml = (value) => {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

    let html = escapeHtml(text);

    // -------------------------------------------------------
    // Saved highlights
    // -------------------------------------------------------

    const pageHighlights =
      highlights.filter(
        (highlight) =>
          Number(
            highlight.pageNumber
          ) === Number(pageNumber)
      );

    pageHighlights.forEach(
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
            escapeRegExp(escaped),
            "gi"
          ),
          (match) =>
            `<mark class="reader-saved-highlight">${match}</mark>`
        );
      }
    );

    // -------------------------------------------------------
    // Search highlights
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
                ) === Number(pageNumber)
            );

          const resultForOccurrence =
            pageResults[occurrence];

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
      Math.min(current + 10, 180)
    );
  };

  const zoomOut = () => {
    setZoom((current) =>
      Math.max(current - 10, 60)
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

  const toggleBookmark = async (
    pageNumber
  ) => {
    if (
      !documentId ||
      pageNumber === undefined ||
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
          ) === normalizedPageNumber
      );

    try {
      setBookmarkError("");

      // =====================================================
      // REMOVE BOOKMARK
      // =====================================================

      if (existingBookmark) {
        const response =
          await fetch(
            `${API_BASE_URL}/api/documents/${documentId}/bookmarks/${normalizedPageNumber}`,
            {
              method: "DELETE",
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

        setBookmarks((current) =>
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

      // =====================================================
      // ADD BOOKMARK
      // =====================================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/documents/${documentId}/bookmarks`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
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

      setBookmarks((current) =>
        Array.isArray(data.bookmarks)
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
      selection.toString().trim();

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

    const pageText =
      pageElement.querySelector(
        ".reader-page-text"
      )?.innerText || "";

    const startOffset =
      pageText.indexOf(
        selectedText
      );

    return {
      selectedText,
      pageNumber,

      startOffset:
        startOffset >= 0
          ? startOffset
          : 0,

      endOffset:
        startOffset >= 0
          ? startOffset +
            selectedText.length
          : selectedText.length,
    };
  };

  // =========================================================
  // SAVE HIGHLIGHT
  // =========================================================

  const saveHighlight = async () => {
    const selectionInfo =
      getSelectionInfo();

    if (!selectionInfo) {
      alert(
        "Please select some text first."
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/documents/${documentId}/highlights`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
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
          data.highlight || data;

        setHighlights((current) => [
          ...current,
          newHighlight,
        ]);
      }

      window
        .getSelection()
        ?.removeAllRanges();
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

  const removeHighlight = async (
    highlightId
  ) => {
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
        setHighlights((current) =>
          current.filter(
            (highlight) =>
              String(
                highlight.id
              ) !== String(highlightId)
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
            <span>▦</span>
            Dashboard
          </a>

          <a
            href="#documents"
            className="dashboard-menu-item"
          >
            <span>▤</span>
            My Documents
          </a>

          <a
            href="#upload"
            className="dashboard-menu-item"
          >
            <span>↑</span>
            Upload Document
          </a>

          <a
            href="#study"
            className="dashboard-menu-item"
          >
            <span>▣</span>
            Study Hub
          </a>

          <a
            href="#assistant"
            className="dashboard-menu-item"
          >
            <span>✦</span>
            AI Assistant
          </a>

          <a
            href="#settings"
            className="dashboard-menu-item"
          >
            <span>⚙</span>
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

      <main className="reader-content">

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

          {/* Search */}

          <div className="reader-search">
            <span>
              ⌕
            </span>

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search in document..."
            />

            {searchQuery && (
              <button
                type="button"
                className="reader-search-clear"
                onClick={() =>
                  setSearchQuery("")
                }
              >
                ×
              </button>
            )}
          </div>

          {/* Search Button */}

          <button
            type="button"
            className="reader-search-button"
            onClick={() => {
              if (
                searchResults.length > 0
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

          {/* Controls */}

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
                {searchResults.length > 0
                  ? `${searchResults.length} result${
                      searchResults.length === 1
                        ? ""
                        : "s"
                    }`
                  : "No results"}
              </span>

              {searchResults.length > 0 && (
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
                    {currentSearchIndex + 1}
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

            {searchResults.length > 0 && (
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
                          {result.index + 1}
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

                {voices.length > 0 && (
                  <label>
                    Voice

                    <select
                      value={selectedVoice}
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
                            {voice.name} (
                            {voice.lang})
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
                    Select text or read the
                    current page.
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

        <section className="reader-translation-panel">
          <div className="reader-translation-header">
            <div>
              <div className="reader-translation-title">
                <span className="reader-translation-icon" aria-hidden="true">文</span>
                <span>Translate document</span>
              </div>
              <p className="reader-translation-subtitle">
                Translate the current page or selected text.
              </p>
            </div>
          </div>

          <div className="reader-translation-controls">
            <select
              className="reader-translation-select"
              aria-label="Translation language"
              value={translationLanguage}
              onChange={(event) => setTranslationLanguage(event.target.value)}
            >
              {["English", "Hindi", "Malayalam", "Tamil", "Telugu", "Bengali", "Marathi", "Kannada", "Gujarati", "Punjabi", "Urdu", "Spanish", "French", "German", "Arabic", "Chinese", "Japanese", "Portuguese", "Italian", "Korean", "Russian"].map((language) => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
            <button
              className="reader-translate-button"
              type="button"
              onClick={() => translateText("document")}
              disabled={translationLoading}
            >
              {translationLoading && translationSource === "Entire document"
                ? translationProgress || "Translating document…"
                : "Translate Entire Document"}
            </button>
            <button
              className="reader-translate-button"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => translateText("selection")}
              disabled={translationLoading}
            >
              Translate Selection
            </button>
          </div>

          {translationError && (
            <div className="reader-translation-error" role="alert">{translationError}</div>
          )}
          {translationProgress && translationSource === "Entire document" && (
            <div className="reader-translation-status loading" role="status">{translationProgress}</div>
          )}
          {translation && (
            <div className="reader-translated-result" aria-live="polite">
              <div className="reader-translated-result-header">
                <strong>{translationSource} · {translationLanguage}</strong>
              </div>
              {speechSupported && (
                <button
                  className="reader-translation-voice"
                  type="button"
                  onClick={readTranslatedText}
                >
                  Read translation aloud
                </button>
              )}
              <div
                className="reader-translated-text reader-translated-markdown"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(translation)),
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
