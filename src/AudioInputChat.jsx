import React, { useRef, useState } from "react";
import "./AudioInputChat.css";
import AudioUploadDropzone from "./AudioUploadZone";

const AudioInputChat = ({ onSubmit }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) return;
    setIsSubmitting(true);
    if (onSubmit) {
      await onSubmit(audioFile);
    }
    setIsSubmitting(false);
    setAudioFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="audio-chatgpt-bar-container ai-ring">
      {/* <form className="audio-chatgpt-bar" onSubmit={handleSubmit}>
        <button
          type="button"
          className="audio-mic-btn"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="Upload audio"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#ececf1" />
            <path
              d="M12 7v6m0 0a2 2 0 0 0 2-2V9a2 2 0 0 0-4 0v2a2 2 0 0 0 2 2zm0 0v2m-4 0a4 4 0 0 0 8 0"
              stroke="#6b6b6b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div className="audio-file-preview">
          {audioFile ? (
            audioFile.name
          ) : (
            <span className="audio-placeholder">Upload or record audio...</span>
          )}
        </div>
        <button
          type="submit"
          className="audio-send-btn"
          disabled={!audioFile || isSubmitting}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#10a37f" />
            <path d="M8 12l4-4v3h4v2h-4v3l-4-4z" fill="#fff" />
          </svg>
        </button>
      </form> */}
      <AudioUploadDropzone />
    </div>
  );
};

export default AudioInputChat;
