import {
  ArrowRight,
  AudioLines,
  Check,
  Clock3,
  Headphones,
  LoaderCircle,
  Mic,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Square,
  Trash2,
} from "lucide-react";
import { scenarios } from "../scenarios";
import ReplyAudio from "./ReplyAudio";

const formatTime = (seconds) =>
  Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");

export default function PracticeStudio({
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
  stopWaiting,
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
}) {
  const signedIn = auth === "signed-in";
  return (
    <section
      id="practice"
      className={`practice-section ${working ? "session-active" : ""}`}
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / THE PRACTICE STUDIO</span>
          <h2>
            {working ? (
              <>
                Make your next <em>move.</em>
              </>
            ) : (
              <>
                A real challenge.
                <br />A safe place to <em>start.</em>
              </>
            )}
          </h2>
        </div>
        <div className="section-description">
          {working ? (
            <>
              <span className="live-badge">
                <span className="status-dot" /> SESSION IN PROGRESS
              </span>
              <p>One conversation. Your own way forward.</p>
            </>
          ) : (
            <p>
              Navigate competing priorities, ask better questions, and find
              common ground. Start with the conversation below.
            </p>
          )}
        </div>
      </div>
      <div className="studio-layout">
        <aside className="brief-panel">
          <div className="panel-topline">
            <span className="eyebrow">SCENARIO / 001</span>
            <span className="category">NEGOTIATION</span>
          </div>
          <label className="field-label" htmlFor="scenario">
            Your scenario
          </label>
          <select
            id="scenario"
            value={scenarioId}
            onChange={(event) => setScenarioId(event.target.value)}
            disabled={!!session || locked}
          >
            {scenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <h3>{scenario.title}</h3>
          <p className="brief-description">{scenario.brief}</p>
          <div className="role-card">
            <span className="eyebrow">YOU ARE THE</span>
            <strong>{scenario.role}</strong>
          </div>
          <div className="section-label">
            <span>THE CONSTRAINTS</span>
            <span>EFFORT / POINTS</span>
          </div>
          <dl className="facts">
            {scenario.facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="capacity">
            <span>Team capacity already committed</span>
            <div>
              <i />
            </div>
            <span>
              5 of 5 points <strong>100%</strong>
            </span>
          </div>
          <h4 className="section-label">YOUR FOCUS</h4>
          <ul className="goals">
            {scenario.goals.map((goal) => (
              <li key={goal}>
                <Check size={13} />
                {goal}
              </li>
            ))}
          </ul>
          <div className="brief-tip">
            <Headphones size={17} />
            <p>Find a quiet spot. Speak as you would in a real conversation.</p>
          </div>
        </aside>
        <section className="conversation-panel" aria-label="Conversation">
          <div className="conversation-header">
            <div className="partner">
              <span className="avatar alex">
                <AudioLines size={22} />
              </span>
              <div>
                <h3>
                  Alex <span className="ai-tag">AI PARTNER</span>
                </h3>
                <p>Business stakeholder</p>
              </div>
            </div>
            <span className={`session-status ${recording ? "recording" : ""}`}>
              <span className="status-dot" />
              {phase}
            </span>
          </div>
          <div className="conversation-scroll" aria-live="polite">
            <div className="conversation-date">
              <span />
              {session
                ? "CONVERSATION STARTED"
                : "THE CONVERSATION STARTS HERE"}
              <span />
            </div>
            <div className="message partner-message">
              <span className="message-label">
                <span className="speaker-dot" /> ALEX
              </span>
              <div className="bubble">{scenario.opening}</div>
            </div>
            {!working && (
              <div className="start-prompt">
                <div className="start-orbit">
                  <Mic size={25} strokeWidth={1.3} />
                </div>
                <h3>The next words are yours.</h3>
                <p>
                  {signedIn
                    ? "Start a session and take the conversation forward."
                    : "Sign in, turn on your microphone, and give it a try."}
                </p>
                <button
                  className="button primary"
                  onClick={
                    signedIn
                      ? startSession
                      : auth === "offline"
                        ? refreshAuth
                        : login
                  }
                  disabled={auth === "checking" || !!busy}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <Play size={15} />
                  )}
                  {signedIn
                    ? "Start this scenario"
                    : auth === "offline"
                      ? "Reconnect"
                      : "Sign in to practice"}
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
            {turns.map((turn) => (
              <div key={turn.turnId} className="exchange">
                <div className="message student-message">
                  <span className="message-label">
                    YOU{" "}
                    <span>
                      / TURN {String(turn.turnNumber).padStart(2, "0")}
                    </span>
                  </span>
                  <div className="bubble">
                    {turn.transcript || (
                      <span className="muted">
                        <AudioLines size={17} /> Your recording has been
                        received.
                      </span>
                    )}
                  </div>
                </div>
                {turn.characterReply && (
                  <div className="message partner-message">
                    <span className="message-label">
                      <span className="speaker-dot" /> ALEX
                    </span>
                    <div className="bubble">{turn.characterReply}</div>
                    <ReplyAudio
                      sessionId={session.sessionId}
                      turnNumber={turn.turnNumber}
                    />
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div
                className={`processing ${pollPaused ? "paused" : ""}`}
                role="status"
              >
                {pollPaused ? (
                  <Clock3 size={20} />
                ) : (
                  <LoaderCircle className="spin" size={20} />
                )}
                <div>
                  <strong>
                    {pollPaused
                      ? "The reply is taking longer than expected."
                      : "Alex is thinking it through."}
                  </strong>
                  <p>
                    {pollPaused
                      ? "Your response is saved. Check again, or start a fresh session."
                      : "Your recording is saved. We’re waiting for Alex’s response."}
                  </p>
                  <button className="text-button" onClick={stopWaiting}>
                    <Square size={12} /> Stop waiting
                  </button>
                  {pollPaused && (
                    <div className="recovery-actions">
                      <button
                        className="text-button"
                        onClick={() => {
                          setError("");
                          setPollVersion((value) => value + 1);
                        }}
                      >
                        <RefreshCw size={13} /> Check again
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setConfirmNew(true)}
                      >
                        <Plus size={13} /> New session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="composer">
            {preview && (
              <div className="recording-preview">
                <div>
                  <span className="eyebrow">YOUR RECORDING</span>
                  <audio controls src={preview} />
                </div>
                <button
                  className="icon-button"
                  title="Discard recording"
                  disabled={!!busy}
                  onClick={() => {
                    setClip(null);
                    setSeconds(0);
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            )}
            <div className="composer-main">
              <button
                className={`record-button ${recording ? "is-recording" : ""}`}
                aria-label={
                  recording ? "Stop recording" : "Record your response"
                }
                onClick={recording ? stopRecording : startRecording}
                disabled={!working || locked}
              >
                {recording ? (
                  <Square size={17} fill="currentColor" />
                ) : (
                  <Mic size={21} />
                )}
              </button>
              <div className="record-copy">
                <strong>
                  {recording
                    ? `Recording ${formatTime(seconds)}`
                    : busy && busy !== "session"
                      ? `${busy}...`
                      : clip
                        ? "Ready when you are."
                        : pending
                          ? "Waiting for Alex"
                          : "Press record. Find your words."}
                </strong>
                <span>
                  {recording
                    ? "Click stop when you’re done. Up to 2 minutes."
                    : clip
                      ? "Listen back, re-record, or send your response."
                      : !working
                        ? "Your microphone becomes available after you start."
                        : "Speak naturally. You don’t need a perfect answer."}
                </span>
              </div>
              <button
                className="button primary send-button"
                onClick={submit}
                disabled={!clip || locked || recording}
              >
                {busy && busy !== "session" ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                <span>Send response</span>
              </button>
            </div>
            <div className="composer-footer">
              <span>
                <ShieldCheck size={12} /> Your recordings stay with your
                session.
              </span>
              {working && (
                <button
                  className="text-button"
                  disabled={!!busy || recording || (!!pending && !pollPaused)}
                  onClick={() => setConfirmNew(true)}
                >
                  <Plus size={13} /> New session
                </button>
              )}
            </div>
          </div>
          <div className="conversation-bottom">
            <span>
              <span className="status-dot" /> VOICE PRACTICE
            </span>
            <span>{String(completed).padStart(2, "0")} EXCHANGES</span>
          </div>
        </section>
      </div>
    </section>
  );
}
