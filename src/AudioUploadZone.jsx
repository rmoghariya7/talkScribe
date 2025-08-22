import React, { useCallback, useId, useRef, useState } from "react";
import { AudioLines, Mic, UploadCloud, X } from "lucide-react";
import "./AudioUploadZone.css";
import transcribe from "./service/api";
import TranscribeButton from "./Transcribe";

export default function AudioUploadDropzone({
  onFiles,
  accept = "audio/*",
  maxSizeBytes = 25 * 1024 * 1024, // 25 MB (fixed)
  buttonLabel = "Upload file",
  helperText = "Add audio files with spoken audio. Max file size: 25MB",
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null); // now holds a File when set
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const [loading, setLoading] = useState(false);

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
      if (problems.length) {
        setError(problems.join("\n"));
        return;
      } else {
        setError("");
      }
      if (accepted.length) {
        // call optional external handler
        if (typeof onFiles === "function") onFiles(accepted);
        // and set first file as the current audio
        const first = accepted[0];
        setAudioBlob(first);
      }
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
    // STOP flow
    if (isRecording) {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) return;

      try {
        mediaRecorder.stop();
      } catch (err) {
        console.error("Error stopping MediaRecorder:", err);
        return;
      }

      // onstop defined below will handle building the file
      return;
    }

    // START flow
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredType = "audio/webm;codecs=opus";
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: preferredType });
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
      };

      mediaRecorder.onstop = () => {
        try {
          const mime = mediaRecorder.mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type: mime });

          // infer extension
          const ext =
            mime.includes("wav") || mime.includes("wave")
              ? "wav"
              : mime.includes("mp3")
              ? "mp3"
              : mime.includes("ogg")
              ? "ogg"
              : mime.includes("webm")
              ? "webm"
              : "audio";

          const filename = `recording.${ext}`;
          const file = new File([blob], filename, {
            type: blob.type,
            lastModified: Date.now(),
          });

          // cleanup stream tracks
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }

          // reset recorder/ref
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];

          setIsRecording(false);

          // set the file and send to transcribe
          setAudioBlob(file);
          // transcribe(file);
        } catch (err) {
          console.error("Error processing recorded audio:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setError("Microphone access denied or unavailable.");
    }
  };

  // helper to clear selected file both in state and the DOM input value
  const clearSelectedFile = () => {
    setAudioBlob(null);
    setError("");
    if (inputRef.current) {
      try {
        inputRef.current.value = "";
      } catch {
        // some browsers may throw, ignore safely
      }
    }
  };

  const openFileDialog = () => {
    // clear input value first so same file can be selected again
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files && event.target.files[0];
    if (!uploadedFile) return;

    // validate via validateFiles
    const { problems } = validateFiles([uploadedFile]);
    if (problems.length) {
      setError(problems.join("\n"));
      return;
    }

    setError("");
    setAudioBlob(uploadedFile);
    // optionally call transcribe immediately:
    // transcribe(uploadedFile);
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      setError("No audio selected.");
      return;
    }
    setLoading(true);
    await transcribe(audioBlob);
    console.log("here");

    setLoading(false);
  };

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
        <AudioLines size={75} className="mid-audio" />

        <p className="text">Choose your file or Record it to transcribe.</p>

        {!audioBlob ? (
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
        ) : (
          <div className="audio-details">
            <p>{audioBlob.name}</p>
            <button
              className="remove-audio-button"
              type="button"
              onClick={clearSelectedFile}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        )}

        <p className="helper">{helperText}</p>

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={false}
          className="hidden-input"
          onChange={handleFileUpload}
        />

        {error && <div className="error">{error}</div>}
      </div>
      {audioBlob && (
        <TranscribeButton
          label={loading ? "Transcribing..." : "Transcribe"}
          onClick={handleTranscribe}
        />
      )}
    </div>
  );
}
