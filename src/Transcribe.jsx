import "./Transcribe.css";
const TranscribeButton = ({ onClick, label }) => {
  return (
    <button className="transcribe-btn" onClick={onClick}>
      <span className="icon">✨</span>
      {label}
    </button>
  );
};
export default TranscribeButton;
