"use client";

import { useEffect, useRef, useState } from "react";
import { certificateError, uploadCertificate } from "@/lib/certificate";
import {
  clearPendingCertificate,
  getPendingCertificate,
} from "@/lib/pendingCertificate";
import "./CertificateRetry.css";

export default function CertificateRetry({ companyId, onUploaded }) {
  const fileInput = useRef(null);
  const [savedFile, setSavedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPendingCertificate(companyId).then((file) => {
      if (active) setSavedFile(file);
    });
    return () => {
      active = false;
    };
  }, [companyId]);

  async function upload(file) {
    const problem = certificateError(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setUploading(true);
    try {
      await uploadCertificate(companyId, file);
      await clearPendingCertificate();
      setSavedFile(null);
      onUploaded();
    } catch (err) {
      setError(err.message || "The upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="cert-retry">
      <p className="cert-retry-title">Upload your PACRA certificate</p>
      {savedFile && (
        <p className="cert-retry-file">Saved file: {savedFile.name}</p>
      )}

      {error && <p className="cert-retry-error">{error}</p>}

      <div className="cert-retry-actions">
        {savedFile && (
          <button
            type="button"
            className="cert-retry-button"
            disabled={uploading}
            onClick={() => upload(savedFile)}
          >
            {uploading ? "Uploading…" : "Try again"}
          </button>
        )}
        <button
          type="button"
          className="cert-retry-button is-outline"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {savedFile ? "Choose a different file" : "Choose file"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          hidden
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <p className="cert-retry-hint">PDF, JPG or PNG · Max 10 MB</p>
    </div>
  );
}
