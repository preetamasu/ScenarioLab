import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, Volume2 } from "lucide-react";
import { api } from "../api";

export default function ReplyAudio({ sessionId, turnNumber }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const player = useRef(null);
  useEffect(() => {
    if (url) player.current?.play().catch(() => {
      // Native controls remain available if the browser blocks autoplay.
    });
  }, [url]);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await api(
        `/sessions/${sessionId}/turns/${turnNumber}/audio-url`,
      );
      setUrl(result.url);
    } catch (error) {
      setError(error.status === 404
        ? "The spoken reply is not ready yet. You can continue and check again later."
        : error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="reply-audio">
      {!url ? (
        <button className="text-button" onClick={load} disabled={loading}>
          {loading ? (
            <LoaderCircle className="spin" size={15} />
          ) : (
            <Volume2 size={15} />
          )}{" "}
          Listen to Alex
        </button>
      ) : (
        <>
          <audio
            ref={player}
            controls
            src={url}
            onError={() => {
              setUrl("");
              setError("Audio link expired. Click Listen to load a new link.");
            }}
          />
          <button
            className="icon-button"
            title="Refresh audio link"
            onClick={load}
          >
            <RefreshCw size={14} />
          </button>
        </>
      )}
      {error && <p className="small-error">{error}</p>}
    </div>
  );
}
