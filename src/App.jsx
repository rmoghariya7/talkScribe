import "./App.css";
import AudioInputChat from "./AudioInputChat";
import TranscribeButton from "./Transcribe";

function App() {
  // Example submit handler
  const handleAudioSubmit = (audioFile) => {
    // You can handle the audio file here (e.g., upload to server)
    alert(`Audio file submitted: ${audioFile.name}`);
  };

  return (
    <div className="center">
      <AudioInputChat onSubmit={handleAudioSubmit} />
    </div>
  );
}

export default App;
