import {
  useEffect,
  useState,
} from "react";

import "./StudyHub.css";


// ======================================================
// HELPERS
// ======================================================

function getDocumentIdFromHash() {
  const hash =
    window.location.hash;

  if (!hash.startsWith("#study/")) {
    return null;
  }

  const parts =
    hash
      .replace("#study/", "")
      .split("/");

  return parts[0] || null;
}


function getTabFromHash() {
  const hash =
    window.location.hash;

  if (!hash.startsWith("#study/")) {
    return "keypoints";
  }

  const parts =
    hash
      .replace("#study/", "")
      .split("/");

  const tab =
    parts[1];

  if (
    tab === "exam" ||
    tab === "notes" ||
    tab === "questions" ||
    tab === "flashcards" ||
    tab === "keypoints"
  ) {
    return tab;
  }

  return "keypoints";
}


function formatFileSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


// ======================================================
// SIDEBAR
// ======================================================

function StudySidebar() {
  return (
    <aside className="dashboard-sidebar">

      <a
        href="#dashboard"
        className="dashboard-logo"
      >
        <span className="dashboard-logo-icon">
          ✦
        </span>

        DocIQ
      </a>


      <p className="dashboard-menu-title">
        MAIN MENU
      </p>


      <div className="dashboard-menu">

        <a
          href="#dashboard"
          className="dashboard-menu-item"
        >
          <span>🏠</span>
          Dashboard
        </a>


        <a
          href="#upload"
          className="dashboard-menu-item"
        >
          <span>📤</span>
          Upload Document
        </a>


        <a
          href="#documents"
          className="dashboard-menu-item"
        >
          <span>📄</span>
          Documents
        </a>


        <a
          href="#study"
          className="dashboard-menu-item active"
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

      </div>


      <div className="dashboard-sidebar-bottom">

        <div className="dashboard-help-card">

          <div className="dashboard-help-icon">
            ?
          </div>

          <strong>
            Need help?
          </strong>

          <p>
            Learn how to get the most
            out of DocIQ.
          </p>

          <button>
            View help center →
          </button>

        </div>


        <button
          className="dashboard-logout"
          onClick={() => {
            window.location.hash =
              "#login";
          }}
        >
          <span>↪</span>
          Logout
        </button>

      </div>

    </aside>
  );
}


// ======================================================
// STUDY HUB HOME
// ======================================================

function StudyHubHome({
  onOpenDocument,
}) {
  const [
    documents,
    setDocuments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {

    async function loadDocuments() {

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "http://localhost:5000/api/documents"
          );

        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load documents."
          );
        }


        // Backend returns:
        // { documents: [...] }

        const allDocuments =
          Array.isArray(
            data.documents
          )
            ? data.documents
            : [];


        // Only documents whose
        // extraction is complete

        const readyDocuments =
          allDocuments.filter(
            (document) =>
              document.status ===
              "ready"
          );


        setDocuments(
          readyDocuments
        );

      } catch (error) {

        console.error(
          "Study Hub document loading error:",
          error
        );

        setError(
          "Unable to load your documents."
        );

        setDocuments([]);

      } finally {

        setLoading(false);

      }
    }


    loadDocuments();

  }, []);


  function openFirstDocument(tab) {

    if (!documents[0]) {

      alert(
        "Please upload a document before using this study tool."
      );

      return;
    }


    // IMPORTANT:
    // Backend returns document.id
    // NOT document._id

    onOpenDocument(
      documents[0].id,
      tab
    );
  }


  return (
    <main className="study-main">

      {/* HERO */}

      <section className="study-hero">

        <div>

          <div className="study-hero-label">
            <span>✦</span>
            AI-POWERED LEARNING
          </div>

          <h1>
            Study smarter with
            <span>
              {" "}DocIQ
            </span>
          </h1>

          <p>
            Turn your documents into
            clear notes, important
            questions, written exam
            practice and flashcards.
          </p>

        </div>


        <div className="study-hero-icon">
          🎓
        </div>

      </section>


      {/* STATS */}

      <section className="study-statistics">

        <div className="study-stat-card">

          <div className="study-stat-icon">
            📄
          </div>

          <div>
            <strong>
              {documents.length}
            </strong>

            <span>
              Ready Documents
            </span>
          </div>

        </div>


        <div className="study-stat-card">

          <div className="study-stat-icon">
            💡
          </div>

          <div>
            <strong>
              5
            </strong>

            <span>
              Study Tools
            </span>
          </div>

        </div>


        <div className="study-stat-card">

          <div className="study-stat-icon">
            🤖
          </div>

          <div>
            <strong>
              AI
            </strong>

            <span>
              Powered Learning
            </span>
          </div>

        </div>

      </section>


      {/* TOOLS */}

      <section className="study-section">

        <div className="study-section-heading">

          <div>
            <p className="study-eyebrow">
              LEARNING TOOLS
            </p>

            <h2>
              Choose how you want to study
            </h2>

            <p>
              Select a tool and DocIQ will
              use your uploaded document.
            </p>
          </div>

        </div>


        <div className="study-tools-grid">

          {/* KEY POINTS */}

          <button
            className="study-tool-card"
            onClick={() =>
              openFirstDocument(
                "keypoints"
              )
            }
          >

            <div className="study-tool-icon purple">
              💡
            </div>

            <div className="study-tool-content">

              <h3>
                Key Points
              </h3>

              <p>
                Quickly understand the
                most important ideas
                from your document.
              </p>

              <span>
                Explore →
              </span>

            </div>

          </button>


          {/* SHORT NOTES */}

          <button
            className="study-tool-card"
            onClick={() =>
              openFirstDocument(
                "notes"
              )
            }
          >

            <div className="study-tool-icon orange">
              📝
            </div>

            <div className="study-tool-content">

              <h3>
                Short Notes
              </h3>

              <p>
                Create concise revision
                notes from your document.
              </p>

              <span>
                Create notes →
              </span>

            </div>

          </button>


          {/* QUESTIONS */}

          <button
            className="study-tool-card"
            onClick={() =>
              openFirstDocument(
                "questions"
              )
            }
          >

            <div className="study-tool-icon blue">
              ❓
            </div>

            <div className="study-tool-content">

              <h3>
                Important Questions
              </h3>

              <p>
                Find questions that are
                useful for exam preparation.
              </p>

              <span>
                View questions →
              </span>

            </div>

          </button>


          {/* EXAM PRACTICE */}

          <button
            className="study-tool-card study-tool-card-featured"
            onClick={() =>
              openFirstDocument(
                "exam"
              )
            }
          >

            <div className="study-tool-icon green">
              ✍️
            </div>

            <div className="study-tool-content">

              <div className="study-tool-title-row">

                <h3>
                  Written Exam Practice
                </h3>

                <span className="study-new-badge">
                  AI
                </span>

              </div>

              <p>
                Write your own answers
                and get AI-powered
                evaluation and feedback.
              </p>

              <span>
                Start practice →
              </span>

            </div>

          </button>


          {/* FLASHCARDS */}

          <button
            className="study-tool-card"
            onClick={() =>
              openFirstDocument(
                "flashcards"
              )
            }
          >

            <div className="study-tool-icon pink">
              🗂️
            </div>

            <div className="study-tool-content">

              <h3>
                Flashcards
              </h3>

              <p>
                Review important concepts
                with quick study cards.
              </p>

              <span>
                Start reviewing →
              </span>

            </div>

          </button>

        </div>

      </section>


      {/* DOCUMENTS */}

      <section className="study-section">

        <div className="study-section-heading study-documents-heading">

          <div>
            <p className="study-eyebrow">
              YOUR DOCUMENTS
            </p>

            <h2>
              Ready to study
            </h2>
          </div>


          <a
            href="#documents"
            className="study-view-all"
          >
            View all →
          </a>

        </div>


        {loading && (

          <div className="study-message">
            <span className="study-spinner">
              ⟳
            </span>

            Loading your documents...
          </div>

        )}


        {!loading && error && (

          <div className="study-message study-error">
            {error}
          </div>

        )}


        {!loading &&
          !error &&
          documents.length === 0 && (

            <div className="study-empty">

              <div className="study-empty-icon">
                📄
              </div>

              <h3>
                No ready documents
              </h3>

              <p>
                Upload a document and wait
                for processing to finish
                before using Study Hub.
              </p>

              <a
                href="#upload"
                className="study-primary-button"
              >
                Upload Document
              </a>

            </div>

          )}


        {!loading &&
          !error &&
          documents.length > 0 && (

            <div className="study-document-list">

              {documents.map(
                (document) => (

                  <button
                    key={
                      document.id
                    }
                    className="study-document-row"
                    onClick={() =>
                      onOpenDocument(
                        document.id,
                        "keypoints"
                      )
                    }
                  >

                    <div className="study-document-file-icon">
                      📄
                    </div>


                    <div className="study-document-info">

                      <strong>
                        {
                          document.name
                        }
                      </strong>

                      <span>
                        {
                          document.type
                        }{" "}
                        •{" "}
                        {
                          formatFileSize(
                            document.size
                          )
                        }
                      </span>

                    </div>


                    <div className="study-ready-badge">
                      Ready
                    </div>


                    <span className="study-document-arrow">
                      →
                    </span>

                  </button>

                )
              )}

            </div>

          )}

      </section>

    </main>
  );
}


// ======================================================
// STUDY DOCUMENT
// ======================================================

function StudyDocument({
  documentId,
  initialTab,
}) {

  const [
    document,
    setDocument,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    initialTab || "keypoints"
  );


  const [
    questions,
    setQuestions,
  ] = useState([]);

  const [
    generatingQuestions,
    setGeneratingQuestions,
  ] = useState(false);

  const [
    examError,
    setExamError,
  ] = useState("");


  const [
    selectedQuestion,
    setSelectedQuestion,
  ] = useState(null);

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    evaluation,
    setEvaluation,
  ] = useState(null);

  const [
    evaluating,
    setEvaluating,
  ] = useState(false);


  // ====================================================
  // LOAD DOCUMENT
  // ====================================================

  useEffect(() => {

    async function loadDocument() {

      try {

        setLoading(true);
        setError("");

        const response =
          await fetch(
            `http://localhost:5000/api/documents/${documentId}`
          );

        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load document."
          );
        }


        setDocument(data);

      } catch (error) {

        console.error(
          "Study document error:",
          error
        );

        setError(
          error.message ||
            "Unable to load document."
        );

      } finally {

        setLoading(false);

      }
    }


    if (documentId) {
      loadDocument();
    }

  }, [documentId]);


  // ====================================================
  // SYNC TAB
  // ====================================================

  useEffect(() => {

    if (initialTab) {
      setActiveTab(
        initialTab
      );
    }

  }, [initialTab]);


  // ====================================================
  // CHANGE TAB
  // ====================================================

  function changeTab(tab) {

    setActiveTab(tab);

    window.location.hash =
      `#study/${documentId}/${tab}`;
  }


  // ====================================================
  // GENERATE EXAM QUESTIONS
  // ====================================================

  async function generateExamQuestions() {

    try {

      setGeneratingQuestions(
        true
      );

      setExamError("");

      setQuestions([]);

      setSelectedQuestion(
        null
      );

      setEvaluation(null);


      const response =
        await fetch(
          `http://localhost:5000/api/ai/exam-questions/${documentId}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to generate questions."
        );
      }


      if (
        !Array.isArray(
          data.questions
        )
      ) {
        throw new Error(
          "Invalid questions received from AI."
        );
      }


      setQuestions(
        data.questions
      );

    } catch (error) {

      console.error(
        "Question generation error:",
        error
      );

      setExamError(
        error.message ||
          "Unable to generate exam questions."
      );

    } finally {

      setGeneratingQuestions(
        false
      );

    }
  }


  // ====================================================
  // SELECT QUESTION
  // ====================================================

  function selectQuestion(question) {

    setSelectedQuestion(
      question
    );

    setAnswer("");

    setEvaluation(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // ====================================================
  // EVALUATE ANSWER
  // ====================================================

  async function evaluateAnswer() {

    if (
      !selectedQuestion
    ) {
      return;
    }


    if (
      !answer.trim()
    ) {
      alert(
        "Please write your answer first."
      );

      return;
    }


    try {

      setEvaluating(true);

      setExamError("");

      setEvaluation(null);


      const response =
        await fetch(
          `http://localhost:5000/api/ai/evaluate-answer/${documentId}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                question:
                  selectedQuestion.question,

                answer:
                  answer,

                marks:
                  selectedQuestion.marks,

                answerPoints:
                  selectedQuestion.answerPoints,
              }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to evaluate answer."
        );
      }


      setEvaluation(
        data.evaluation
      );

    } catch (error) {

      console.error(
        "Answer evaluation error:",
        error
      );

      setExamError(
        error.message ||
          "Unable to evaluate answer."
      );

    } finally {

      setEvaluating(false);

    }
  }


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {

    return (
      <main className="study-main">

        <div className="study-page-loading">

          <span className="study-spinner">
            ⟳
          </span>

          Loading document...

        </div>

      </main>
    );
  }


  // ====================================================
  // ERROR
  // ====================================================

  if (error) {

    return (
      <main className="study-main">

        <div className="study-error-page">

          <div className="study-empty-icon">
            ⚠️
          </div>

          <h2>
            Unable to open document
          </h2>

          <p>
            {error}
          </p>

          <a
            href="#study"
            className="study-primary-button"
          >
            Back to Study Hub
          </a>

        </div>

      </main>
    );
  }


  if (!document) {
    return null;
  }


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="study-main">

      {/* DOCUMENT HERO */}

      <section className="study-document-hero">

        <div>

          <button
            className="study-back-button"
            onClick={() => {
              window.location.hash =
                "#study";
            }}
          >
            ← Back to Study Hub
          </button>


          <div className="study-document-title-row">

            <div className="study-large-file-icon">
              📄
            </div>

            <div>

              <p className="study-eyebrow">
                STUDYING DOCUMENT
              </p>

              <h1>
                {
                  document.originalName
                }
              </h1>

              <p>
                AI-powered study tools
                for this document.
              </p>

            </div>

          </div>

        </div>


        <div className="study-document-ready">
          <span>✓</span>
          Ready
        </div>

      </section>


      {/* TABS */}

      <nav className="study-tabs">

        <button
          className={
            activeTab ===
            "keypoints"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "keypoints"
            )
          }
        >
          💡 Key Points
        </button>


        <button
          className={
            activeTab ===
            "notes"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "notes"
            )
          }
        >
          📝 Short Notes
        </button>


        <button
          className={
            activeTab ===
            "questions"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "questions"
            )
          }
        >
          ❓ Questions
        </button>


        <button
          className={
            activeTab ===
            "exam"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "exam"
            )
          }
        >
          ✍️ Exam Practice
        </button>


        <button
          className={
            activeTab ===
            "flashcards"
              ? "active"
              : ""
          }
          onClick={() =>
            changeTab(
              "flashcards"
            )
          }
        >
          🗂️ Flashcards
        </button>

      </nav>


      {/* KEY POINTS */}

      {activeTab ===
        "keypoints" && (

        <section className="study-content-card">

          <div className="study-placeholder-icon">
            💡
          </div>

          <h2>
            Key Points
          </h2>

          <p>
            AI-generated key points
            from your document will
            appear here.
          </p>

          <div className="study-document-text-preview">

            <h3>
              Document content
            </h3>

            {document.pages
              ?.slice(0, 3)
              .map(
                (page) => (

                  <div
                    key={
                      page.pageNumber
                    }
                    className="study-page-preview"
                  >

                    <span>
                      Page{" "}
                      {
                        page.pageNumber
                      }
                    </span>

                    <p>
                      {
                        page.text
                      }
                    </p>

                  </div>

                )
              )}

          </div>

        </section>

      )}


      {/* NOTES */}

      {activeTab ===
        "notes" && (

        <section className="study-content-card">

          <div className="study-placeholder-icon orange">
            📝
          </div>

          <h2>
            Short Notes
          </h2>

          <p>
            Short revision notes
            will be generated from
            this document.
          </p>

          <div className="study-coming-soon">
            AI note generation is
            ready to be connected.
          </div>

        </section>

      )}


      {/* QUESTIONS */}

      {activeTab ===
        "questions" && (

        <section className="study-content-card">

          <div className="study-placeholder-icon blue">
            ❓
          </div>

          <h2>
            Important Questions
          </h2>

          <p>
            Written questions for
            exam preparation.
          </p>


          <div className="study-coming-soon">
            Use Written Exam Practice
            to generate AI-powered
            written questions.
          </div>


          <button
            className="study-primary-button"
            onClick={() =>
              changeTab(
                "exam"
              )
            }
          >
            Go to Exam Practice →
          </button>

        </section>

      )}


      {/* EXAM PRACTICE */}

      {activeTab ===
        "exam" && (

        <section className="study-exam-section">

          {/* EXAM HEADER */}

          <div className="study-exam-header">

            <div>

              <p className="study-eyebrow">
                WRITTEN EXAM PRACTICE
              </p>

              <h2>
                Practice writing answers
              </h2>

              <p>
                Gemini will create important
                written questions from your
                document. Write your answer
                and receive AI feedback.
              </p>

            </div>


            <button
              className="study-generate-button"
              onClick={
                generateExamQuestions
              }
              disabled={
                generatingQuestions
              }
            >

              {generatingQuestions
                ? "Generating..."
                : "✨ Generate Questions"}

            </button>

          </div>


          {/* ERROR */}

          {examError && (

            <div className="study-ai-error">
              ⚠️ {examError}
            </div>

          )}


          {/* SELECTED QUESTION */}

          {selectedQuestion && (

            <div className="study-answer-card">

              <div className="study-answer-top">

                <button
                  className="study-small-back"
                  onClick={() => {
                    setSelectedQuestion(
                      null
                    );

                    setEvaluation(
                      null
                    );
                  }}
                >
                  ← Questions
                </button>

                <span className="study-mark-badge">
                  {
                    selectedQuestion.marks
                  } Marks
                </span>

              </div>


              <h3>
                {
                  selectedQuestion.question
                }
              </h3>


              <textarea
                className="study-answer-input"
                value={answer}
                onChange={(event) =>
                  setAnswer(
                    event.target.value
                  )
                }
                placeholder="Write your answer here..."
              />


              <div className="study-answer-footer">

                <span>
                  Write in your own words.
                </span>

                <button
                  className="study-primary-button"
                  onClick={
                    evaluateAnswer
                  }
                  disabled={
                    evaluating
                  }
                >
                  {evaluating
                    ? "Evaluating..."
                    : "🤖 Evaluate Answer"}
                </button>

              </div>


              {/* EVALUATION */}

              {evaluation && (

                <div className="study-evaluation">

                  <div className="study-score-box">

                    <strong>
                      {
                        evaluation.score
                      }
                    </strong>

                    <span>
                      /{" "}
                      {
                        selectedQuestion.marks
                      }
                    </span>

                  </div>


                  <div className="study-evaluation-main">

                    <h3>
                      AI Feedback
                    </h3>

                    <p>
                      {
                        evaluation.feedback
                      }
                    </p>


                    {evaluation.matchedPoints
                      ?.length >
                      0 && (

                      <div className="study-feedback-group">

                        <h4>
                          ✓ What you got right
                        </h4>

                        <ul>

                          {evaluation.matchedPoints.map(
                            (
                              point,
                              index
                            ) => (

                              <li
                                key={
                                  index
                                }
                              >
                                {
                                  point
                                }
                              </li>

                            )
                          )}

                        </ul>

                      </div>

                    )}


                    {evaluation.missingPoints
                      ?.length >
                      0 && (

                      <div className="study-feedback-group">

                        <h4>
                          + Points to improve
                        </h4>

                        <ul>

                          {evaluation.missingPoints.map(
                            (
                              point,
                              index
                            ) => (

                              <li
                                key={
                                  index
                                }
                              >
                                {
                                  point
                                }
                              </li>

                            )
                          )}

                        </ul>

                      </div>

                    )}


                    {evaluation.improvedAnswer && (

                      <div className="study-improved-answer">

                        <h4>
                          ✨ Improved Answer
                        </h4>

                        <p>
                          {
                            evaluation.improvedAnswer
                          }
                        </p>

                      </div>

                    )}

                  </div>

                </div>

              )}

            </div>

          )}


          {/* QUESTIONS LIST */}

          {!selectedQuestion &&
            questions.length ===
              0 && (

            <div className="study-exam-empty">

              <div className="study-exam-empty-icon">
                ✍️
              </div>

              <h3>
                Ready for written practice?
              </h3>

              <p>
                Generate 10 important
                written examination
                questions from this document.
              </p>

              <div className="study-exam-rules">

                <span>
                  ✓ No MCQs
                </span>

                <span>
                  ✓ Written answers
                </span>

                <span>
                  ✓ 2, 5 & 10 marks
                </span>

                <span>
                  ✓ AI evaluation
                </span>

              </div>

            </div>

          )}


          {!selectedQuestion &&
            questions.length >
              0 && (

            <div className="study-question-list">

              <div className="study-question-list-header">

                <div>

                  <h3>
                    Important Written Questions
                  </h3>

                  <p>
                    Choose a question to
                    start writing.
                  </p>

                </div>

                <span>
                  {
                    questions.length
                  } Questions
                </span>

              </div>


              {questions.map(
                (
                  question,
                  index
                ) => (

                  <button
                    key={
                      index
                    }
                    className="study-question-card"
                    onClick={() =>
                      selectQuestion(
                        question
                      )
                    }
                  >

                    <div className="study-question-number">
                      {
                        index + 1
                      }
                    </div>


                    <div className="study-question-content">

                      <p>
                        {
                          question.question
                        }
                      </p>

                      <span>
                        Write an answer
                        →
                      </span>

                    </div>


                    <div className="study-mark-badge">
                      {
                        question.marks
                      } Marks
                    </div>

                  </button>

                )
              )}

            </div>

          )}

        </section>

      )}


      {/* FLASHCARDS */}

      {activeTab ===
        "flashcards" && (

        <section className="study-content-card">

          <div className="study-placeholder-icon pink">
            🗂️
          </div>

          <h2>
            Flashcards
          </h2>

          <p>
            Important concepts can be
            turned into quick revision
            cards.
          </p>

          <div className="study-coming-soon">
            AI flashcard generation is
            ready to be connected.
          </div>

        </section>

      )}

    </main>
  );
}


// ======================================================
// MAIN COMPONENT
// ======================================================

export default function StudyHub() {

  const [
    documentId,
    setDocumentId,
  ] = useState(
    getDocumentIdFromHash()
  );

  const [
    initialTab,
    setInitialTab,
  ] = useState(
    getTabFromHash()
  );


  useEffect(() => {

    function handleHashChange() {

      const id =
        getDocumentIdFromHash();

      const tab =
        getTabFromHash();


      setDocumentId(id);

      setInitialTab(tab);
    }


    window.addEventListener(
      "hashchange",
      handleHashChange
    );


    handleHashChange();


    return () => {

      window.removeEventListener(
        "hashchange",
        handleHashChange
      );

    };

  }, []);


  function openDocument(
    id,
    tab = "keypoints"
  ) {

    if (!id) {

      alert(
        "Unable to open this document."
      );

      return;
    }


    window.location.hash =
      `#study/${id}/${tab}`;
  }


  return (
    <div className="dashboard-page">

      <StudySidebar />


      {documentId ? (

        <StudyDocument
          documentId={
            documentId
          }
          initialTab={
            initialTab
          }
        />

      ) : (

        <StudyHubHome
          onOpenDocument={
            openDocument
          }
        />

      )}

    </div>
  );
}