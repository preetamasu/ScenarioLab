import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  LoaderCircle,
  LogOut,
  Plus,
  X,
} from "lucide-react";
import { api, checkSession, signOut, uploadAudio } from "./api";
import { scenarios } from "./scenarios";
import { LandingHero, AboutSections } from "./components/Landing";
import PracticeStudio from "./components/PracticeStudio";

const sessionKey = "scenariolab.session";

export default function App() {
  const [auth, setAuth] = useState("checking");
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [session, setSession] = useState(null);
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const [pollVersion, setPollVersion] = useState(0);
  const [pollPaused, setPollPaused] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null);
  const [preview, setPreview] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);
  const recorder = useRef(null);
  const stream = useRef(null);
  const bottom = useRef(null);
  const mounted = useRef(true);
  const sending = useRef(false);
  const initialCheckStarted = useRef(false);
  const scenario =
    scenarios.find((item) => item.id === scenarioId) || scenarios[0];

  async function restore() {
    const stored = localStorage.getItem(sessionKey);
    if (!stored) return;
    const data = await api(`/sessions/${encodeURIComponent(stored)}`);
    const history = await api(`/sessions/${data.sessionId}/turns`);
    if (!mounted.current) return;
    setSession(data);
    setTurns(history);
    setScenarioId(data.scenarioId);
    // Restoring history must not restart an old worker wait.
    setPending(null);
    setPollPaused(false);
  }

  async function refreshAuth() {
    try {
      await checkSession();
      if (!mounted.current) return;
      setAuth("signed-in");
      try {
        await restore();
      } catch (error) {
        if (error.status === 404 || error.status === 403)
          localStorage.removeItem(sessionKey);
        else setError(error.message);
      }
      return true;
    } catch (error) {
      if (!mounted.current) return;
      setAuth(error.status === 401 ? "signed-out" : "offline");
      return false;
    }
  }

  useEffect(() => {
    mounted.current = true;
    if (!initialCheckStarted.current) {
      initialCheckStarted.current = true;
      refreshAuth();
    }
    return () => {
      mounted.current = false;
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!clip) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(clip);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [clip]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (turns.length || pending)
      bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns, pending]);

  useEffect(() => {
    if (!session || !pending) return;
    const waitingTurn = turns.find(turn => turn.turnNumber === pending);
    if (waitingTurn?.createdAt && Date.now() - Date.parse(waitingTurn.createdAt) > 120000) {
      setPending(null);
      setPollPaused(false);
      return;
    }
    let cancelled = false;
    let timer;
    const deadline = Date.now() + 120000;
    setPollPaused(false);
    async function poll() {
      try {
        const turn = await api(
          `/sessions/${session.sessionId}/turns/${pending}`,
        );
        if (cancelled) return;
        setTurns((items) =>
          [
            ...items.filter((item) => item.turnNumber !== turn.turnNumber),
            turn,
          ].sort((a, b) => a.turnNumber - b.turnNumber),
        );
        // Text is enough to continue the conversation; delayed audio must not
        // keep the microphone locked for the next turn.
        if (turn.characterReply?.trim()) {
          setPending(null);
          return;
        }
        if (Date.now() > deadline) {
          setPollPaused(true);
          return;
        }
        timer = setTimeout(poll, 5000);
      } catch (error) {
        if (cancelled) return;
        if (error.status === 401) {
          setError(error.message);
          setPollPaused(true);
          setAuth("signed-out");
          return;
        }
        // Pause immediately when the backend fails; retry only on user action.
        setError(error.message);
        setPollPaused(true);
      }
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [session, pending, pollVersion]);

  async function login() {
    setError("");
    setBusy("login");
    window.location.assign(
      import.meta.env.VITE_LOGIN_URL ||
        "http://localhost:8080/oauth2/authorization/cognito",
    );
  }

  async function logout() {
    setBusy("logout");
    setError("");
    try {
      await signOut();
      localStorage.removeItem(sessionKey);
      setSession(null);
      setTurns([]);
      setPending(null);
      setClip(null);
      setAuth("signed-out");
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy("");
    }
  }

  async function startSession() {
    setBusy("session");
    setError("");
    try {
      const data = await api("/sessions", { scenarioId });
      localStorage.setItem(sessionKey, data.sessionId);
      setSession(data);
      setTurns([]);
      setPending(null);
      setClip(null);
      setSeconds(0);
      setConfirmNew(false);
    } catch (error) {
      setError(error.message);
      if (error.status === 401) setAuth("signed-out");
    } finally {
      setBusy("");
    }
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Recording needs a supported browser on localhost or HTTPS. Try Chrome or Edge.",
      );
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(
        stream.current,
        mimeType ? { mimeType } : undefined,
      );
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        stream.current?.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        const blob = new Blob(chunks, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        if (blob.size) setClip(blob);
        else setError("No audio was recorded. Please try again.");
        setRecording(false);
      };
      mediaRecorder.onerror = () => {
        stream.current?.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setError("Recording failed. Please try again.");
      };
      recorder.current = mediaRecorder;
      mediaRecorder.start();
      setClip(null);
      setSeconds(0);
      setRecording(true);
    } catch (error) {
      setError(
        error.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in your browser settings and try again."
          : "Could not access your microphone. Check that it is connected.",
      );
    }
  }

  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }
  useEffect(() => {
    if (recording && seconds >= 120) stopRecording();
  }, [seconds, recording]);

  async function submit() {
    if (!clip || !session || sending.current || pending) return;
    sending.current = true;
    let audioS3Key;
    setBusy("Uploading recording");
    setError("");
    try {
      const upload = await api(
        `/sessions/${session.sessionId}/audio/upload-url`,
        { contentType: clip.type },
      );
      await uploadAudio(upload.url, clip);
      audioS3Key = upload.audioS3Key;
      setBusy("Sending your response");
      const turn = await api(`/sessions/${session.sessionId}/turns`, {
        audioS3Key: upload.audioS3Key,
      });
      setTurns((items) => [...items, turn]);
      setPending(turn.turnNumber);
      setClip(null);
      setSeconds(0);
    } catch (error) {
      // A POST can save a turn before its response times out. Recover that turn
      // instead of making the student submit the same recording a second time.
      if (audioS3Key && error.status !== 401) {
        try {
          const history = await api(`/sessions/${session.sessionId}/turns`);
          const savedTurn = history.find(
            (turn) => turn.audioS3Key === audioS3Key,
          );
          if (savedTurn) {
            setTurns(history);
            setPending(
              savedTurn.characterReply?.trim() ? null : savedTurn.turnNumber,
            );
            setClip(null);
            setSeconds(0);
            setError(
              "Your recording was saved, but the submit request did not finish normally. We are checking for its reply.",
            );
            return;
          }
        } catch {
          /* Keep the recording available if reconciliation fails. */
        }
      }
      setError(
        audioS3Key
          ? `${error.message} Refresh to check whether the turn was saved before sending it again.`
          : error.message,
      );
      if (error.status === 401) setAuth("signed-out");
    } finally {
      sending.current = false;
      setBusy("");
    }
  }

  const locked = !!busy || !!pending || auth !== "signed-in";
  const completed = turns.filter((turn) => turn.characterReply).length;

  const signedIn = auth === "signed-in";
  const working = Boolean(session) && signedIn;
  const phase = recording
    ? "Recording"
    : busy === "Uploading recording"
      ? "Uploading"
      : busy === "Sending your response"
        ? "Sending"
        : pending
          ? pollPaused
            ? "Check required"
            : "Awaiting reply"
          : clip
            ? "Ready to send"
            : working
              ? "Your turn"
              : "Ready to practice";

  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <AudioLines size={22} />
          </span>
          scenario<span>lab</span>
          <span className="brand-beta">BETA</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#preview">The experience</a>
          <a href="#how-it-works">How it works</a>
          <a
            href="https://github.com/preetamasu/ScenarioLab"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ArrowRight size={12} />
          </a>
        </nav>
        <div className="header-actions">
          {signedIn ? (
            <>
              <span className="connection">
                <i /> Signed in
              </span>
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={logout}
                disabled={!!busy || recording || (!!pending && !pollPaused)}
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <button
              className="button header-cta"
              disabled={auth === "checking" || !!busy}
              onClick={auth === "offline" ? refreshAuth : login}
            >
              {busy === "login"
                ? "Signing in..."
                : auth === "offline"
                  ? "Reconnect"
                  : "Sign in"}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      <main id="main">
        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
            <button
              className="icon-button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!working && (
          <LandingHero
            auth={auth}
            busy={busy}
            signedIn={signedIn}
            startSession={startSession}
            refreshAuth={refreshAuth}
            login={login}
          />
        )}
        {signedIn && (
          <PracticeStudio
            {...{
              working,
              scenario,
              scenarioId,
              setScenarioId,
              session,
              locked,
              completed,
              phase,
              recording,
              auth,
              busy,
              startSession,
              refreshAuth,
              login,
              turns,
              pending,
              pollPaused,
              setError,
              setPollVersion,
              stopWaiting: () => { setPending(null); setPollPaused(false); },
              setConfirmNew,
              bottom,
              preview,
              setClip,
              setSeconds,
              seconds,
              clip,
              stopRecording,
              startRecording,
              submit,
            }}
          />
        )}

        <AboutSections
          auth={auth}
          busy={busy}
          signedIn={signedIn}
          refreshAuth={refreshAuth}
          login={login}
        />
      </main>
      <footer className="site-footer">
        <a className="brand" href="#top">
          <AudioLines size={19} /> scenario<span>lab</span>
        </a>
        <span>Practice with purpose. Speak with confidence.</span>
        <a
          href="https://github.com/preetamasu/ScenarioLab"
          target="_blank"
          rel="noreferrer"
        >
          Built by Venkat <ArrowRight size={12} />
        </a>
      </footer>
      {confirmNew && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-session-title"
          >
            <span className="eyebrow">A FRESH PERSPECTIVE</span>
            <h2 id="new-session-title">Start a new conversation?</h2>
            <p>
              Your current conversation stays saved. You’ll start again with
              Alex and a clean slate.
            </p>
            <div>
              <button
                className="button ghost"
                onClick={() => setConfirmNew(false)}
              >
                Stay here
              </button>
              <button
                className="button primary"
                disabled={!!busy}
                onClick={startSession}
              >
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Plus size={16} />
                )}{" "}
                New session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
