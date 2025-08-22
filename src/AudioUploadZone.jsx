import React, { useCallback, useId, useRef, useState } from "react";
import { AudioLines, Mic, UploadCloud } from "lucide-react";
import "./AudioUploadZone.css";

export default function AudioUploadDropzone({
  onFiles,
  accept = "audio/*",
  maxSizeBytes = 2 * 1024 * 1024 * 1024, // 2GB
  buttonLabel = "Upload file",
  helperText = "Add audio files with spoken audio. Max file size: 2GB",
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const validateFiles = useCallback(
    (files) => {
      const accepted = [];
      const problems = [];
      for (const f of files) {
        const typeOk = accept
          ? accept === "*/*" || f.type.startsWith(accept.replace("/*", "/"))
          : true;
        const sizeOk = f.size <= maxSizeBytes;
        if (!typeOk) problems.push(`${f.name}: unsupported type`);
        else if (!sizeOk) problems.push(`${f.name}: too large`);
        else accepted.push(f);
      }
      return { accepted, problems };
    },
    [accept, maxSizeBytes]
  );

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList);
      const { accepted, problems } = validateFiles(files);
      if (problems.length) setError(problems.join("\n"));
      else setError("");
      if (accepted.length && typeof onFiles === "function") onFiles(accepted);
    },
    [onFiles, validateFiles]
  );

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave = (e) => {
    if (e.currentTarget === e.target) setIsDragging(false);
  };

  const handleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied:", err);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      handleDownload();
    }
  };

  const handleDownload = () => {
    console.log("herere", audioBlob);

    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm"; // change to .wav or .mp3 if needed
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const openFileDialog = () => inputRef.current?.click();

  return (
    <div className="upload-container">
      <div
        role="region"
        aria-label="File upload dropzone"
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && openFileDialog()
        }
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`dropzone ${isDragging ? "dragging" : ""}`}
      >
        {/* <div className="illustration">
          <div className="card back" />
          <div className="card mid" />
          <div className="card front">
            <UploadCloud className="icon" aria-hidden="true" />
          </div>
        </div> */}
        <AudioLines size={75} className="mid-audio" />

        <p className="text">Choose your file or just drag and drop it here.</p>

        <div className="row-center gap-8">
          <button
            type="button"
            onClick={openFileDialog}
            className="upload-button"
          >
            <UploadCloud className="icon-small" aria-hidden="true" />
            {buttonLabel}
          </button>
          <button
            type="button"
            onClick={handleRecord}
            className={`record-button ${isRecording ? "recording" : ""}`}
          >
            <Mic className="icon-small" />{" "}
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>

        <p className="helper">{helperText}</p>

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden-input"
          onChange={(e) =>
            e.currentTarget.files && handleFiles(e.currentTarget.files)
          }
        />

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
