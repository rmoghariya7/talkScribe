import React, { useCallback, useId, useRef, useState } from "react";
import { AudioLines, Mic, UploadCloud, X } from "lucide-react";
import "./AudioUploadZone.css";
import transcribe from "./service/api";
import TranscribeButton from "./Transcribe";

export default function AudioUploadDropzone({
  onFiles,
  accept = "audio/*",
  maxSizeBytes = 25 * 1024, // 2GB
  buttonLabel = "Upload file",
  helperText = "Add audio files with spoken audio. Max file size: 25mb",
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  //   const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  console.log("audioBlob", audioBlob);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

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

  //   const handleRecord = async () => {
  //     if (!isRecording) {
  //       try {
  //         const stream = await navigator.mediaDevices.getUserMedia({
  //           audio: true,
  //         });
  //         const mediaRecorder = new MediaRecorder(stream);
  //         mediaRecorderRef.current = mediaRecorder;
  //         audioChunksRef.current = [];

  //         mediaRecorder.ondataavailable = (event) => {
  //           if (event.data.size > 0) {
  //             audioChunksRef.current.push(event.data);
  //           }
  //         };

  //         mediaRecorder.onstop = () => {
  //           const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
  //           setAudioBlob(blob);
  //           const url = URL.createObjectURL(blob);
  //           setAudioUrl(url);
  //         };

  //         mediaRecorder.start();
  //         setIsRecording(true);
  //       } catch (err) {
  //         console.error("Microphone access denied:", err);
  //       }
  //     } else {
  //       mediaRecorderRef.current?.stop();
  //       setIsRecording(false);
  //       handleDownload();
  //     }
  //   };

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

      // Wait for onstop to complete and return the blob
      //   const blob = await new Promise((resolve) => {
      // preserve any previous onstop (or overwrite safely)
      mediaRecorder.onstop = () => {
        const b = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        // store and expose
        // setAudioBlob(b);
        // const url = URL.createObjectURL(b);
        // setAudioUrl(url);

        // cleanup stream tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }

        // reset recorder/ref
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);
        if (b) handleDownload(b);
      };

      // stop triggers onstop asynchronously
      //   });

      // Now we have the blob (or null), call download
      return;
    }

    // START flow
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // preferred mimeType, fall back if not supported
      const preferredType = "audio/webm;codecs=opus";
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: preferredType });
      } catch (e) {
        // some browsers don't support the above mimeType
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

      mediaRecorder.start(); // start recording
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      // optionally show UI error state to user
    }
  };

  const handleDownload = (audioBlob) => {
    console.log("audioBlob", audioBlob);
    const file = new File([audioBlob], "recording.wav", {
      type: audioBlob.type || "audio/wav",
      lastModified: Date.now(),
    });

    transcribe(file);
    setAudioBlob(file);
    // transcribe(audioBlob);
    // if (audioBlob) {
    //   const url = URL.createObjectURL(audioBlob);
    //   const a = document.createElement("a");
    //   a.href = url;
    //   a.download = "recording.webm"; // change to .wav or .mp3 if needed
    //   a.click();
    //   URL.revokeObjectURL(url);
    // }
  };

  const openFileDialog = () => inputRef.current?.click();

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];

    if (uploadedFile) {
      const fileExtension = uploadedFile.name.split(".").pop().toLowerCase();
      // if (fileExtension !== "xlsx" && fileExtension !== "xls") {
      //   setError("Please upload a valid Excel file (.xlsx or .xls)");
      //   return;
      // }
      setAudioBlob(uploadedFile);

      // transcribe(uploadedFile);
    }
  };

  const handleTranscribe = () => {
    console.log("audioBlob", audioBlob);
    transcribe(audioBlob);
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
        {/* <div className="illustration">
          <div className="card back" />
          <div className="card mid" />
          <div className="card front">
            <UploadCloud className="icon" aria-hidden="true" />
          </div>
        </div> */}
        <AudioLines size={75} className="mid-audio" />

        <p className="text">Choose your file or just drag and drop it here.</p>

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
              onClick={() => setAudioBlob(null)}
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
          multiple
          className="hidden-input"
          onChange={handleFileUpload}
        />

        {error && <div className="error">{error}</div>}
      </div>
      {audioBlob && <TranscribeButton onClick={handleTranscribe} />}
    </div>
  );
}
