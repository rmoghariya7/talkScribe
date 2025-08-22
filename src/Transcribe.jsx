import "./Transcribe.css";
const TranscribeButton = ({ onClick }) => {
  return (
    <button className="transcribe-btn" onClick={onClick}>
      <span className="icon">✨</span>
      Transcribe
    </button>
  );
};
export default TranscribeButton;
