import React, { useEffect, useMemo, useRef, useState } from "react";
import { notifyDocIQ } from "../utils/notifications";
import "./Processing.css";

const API_BASE_URL = "http://localhost:5000";

function Processing() {
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState("");
  const notifiedStatus = useRef(null);

  const documentId = useMemo(() => {
    const hash = window.location.hash || "";

    const parts = hash
      .replace("#", "")
      .split("/");

    return parts.length > 1 ? parts[1] : null;
  }, []);

  const navigateTo = (path) => {
    window.location.hash = path;
  };

  useEffect(() => {
    if (!documentId) {
      setError("Document ID is missing.");
      return;
    }

    let intervalId;

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/documents/${documentId}/status`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to check document status."
          );
        }

        setStatus(data.status);

        if (data.status === "ready") {
          if (notifiedStatus.current !== "ready") {
            notifiedStatus.current = "ready";
            notifyDocIQ("documentProcessing", "Document ready", "Your document has finished processing and is ready to read.");
          }
          clearInterval(intervalId);

          setTimeout(() => {
            navigateTo(`reader/${documentId}`);
          }, 800);
        }

        if (data.status === "failed") {
          if (notifiedStatus.current !== "failed") {
            notifiedStatus.current = "failed";
            notifyDocIQ("documentProcessing", "Processing failed", data.message || "DocIQ could not process your document.");
          }
          clearInterval(intervalId);
          setError(
            data.message || "DocIQ could not process this document."
          );
        }
      } catch (error) {
        console.error(
          "Processing status error:",
          error
        );

        clearInterval(intervalId);

        setError(
          error.message ||
            "Unable to check document processing status."
        );
      }
    };

    checkStatus();

    intervalId = setInterval(
      checkStatus,
      1500
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [documentId]);

  const getStatusMessage = () => {
    if (status === "ready") {
      return "Document is ready!";
    }

    if (status === "failed") {
      return "Processing failed";
    }

    return "Processing your document...";
  };

  return (
    <div className="processing-page">
      <div className="processing-card">
        <div className="processing-icon">
          {status === "ready"
            ? "✓"
            : status === "failed"
            ? "!"
            : "⟳"}
        </div>

        <span className="processing-eyebrow">
          DOCUMENT PROCESSING
        </span>

        <h1>
          {getStatusMessage()}
        </h1>

        {status === "processing" && (
          <>
            <p>
              DocIQ is extracting the text
              and preparing your document
              for reading.
            </p>

            <div className="processing-progress">
              <div className="processing-progress-bar" />
            </div>

            <div className="processing-steps">
              <div className="processing-step active">
                <span>✓</span>
                Upload received
              </div>

              <div className="processing-step active">
                <span>⟳</span>
                Extracting text
              </div>

              <div className="processing-step">
                <span>○</span>
                Preparing reader
              </div>
            </div>
          </>
        )}

        {status === "ready" && (
          <p>
            Your document has been processed.
            Opening the Reader...
          </p>
        )}

        {error && (
          <div className="processing-error">
            <strong>
              Something went wrong
            </strong>

            <p>{error}</p>
          </div>
        )}

        <div className="processing-document-id">
          Document ID:{" "}
          {documentId || "Unknown"}
        </div>

        <div className="processing-actions">
          {status === "failed" && (
            <button
              type="button"
              className="processing-button primary"
              onClick={() =>
                navigateTo("documents")
              }
            >
              ← My Documents
            </button>
          )}

          {status !== "ready" && (
            <button
              type="button"
              className="processing-button secondary"
              onClick={() =>
                navigateTo("documents")
              }
            >
              Go to My Documents
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Processing;
