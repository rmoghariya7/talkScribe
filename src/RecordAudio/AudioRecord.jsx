import { useState, useRef } from "react";

const RecordButton = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const url = URL.createObjectURL(audioBlob);
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
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={handleRecord}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          color: "#fff",
          background: isRecording ? "#ef4444" : "#3b82f6",
          transition: "all 0.3s ease",
        }}
      >
        {isRecording ? "⏹ Stop Recording" : "🎤 Start Recording"}
      </button>

      {audioUrl && (
        <div style={{ marginTop: "16px" }}>
          <p>Recorded Audio:</p>
          <audio src={audioUrl} controls />
        </div>
      )}
    </div>
  );
};

export default RecordButton;
