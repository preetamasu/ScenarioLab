import { useEffect, useRef, useState } from 'react';
import { ArrowRight, AudioLines, BookOpen, Check, ChevronRight, Clock3, Headphones, LoaderCircle, LogIn, LogOut, Mic, Play, Plus, RefreshCw, Send, ShieldCheck, Square, Trash2, Volume2, X } from 'lucide-react';
import { api, checkSession, signOut, uploadAudio } from './api';
import { scenarios } from './scenarios';

const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const sessionKey = 'scenariolab.session';

function ReplyAudio({ sessionId, turnNumber }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { const result = await api(`/sessions/${sessionId}/turns/${turnNumber}/audio-url`); setUrl(result.url); }
    catch (error) { setError(error.message); }
    finally { setLoading(false); }
  }
  return <div className="reply-audio">
    {!url ? <button className="text-button" onClick={load} disabled={loading}>{loading ? <LoaderCircle className="spin" size={15} /> : <Volume2 size={15} />} Listen to Alex</button>
      : <><audio controls src={url} onError={() => { setUrl(''); setError('Audio link expired. Click Listen to load a new link.'); }} /><button className="icon-button" title="Refresh audio link" onClick={load}><RefreshCw size={14} /></button></>}
    {error && <p className="small-error">{error}</p>}
  </div>;
}

export default function App() {
  const [auth, setAuth] = useState('checking');
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [session, setSession] = useState(null);
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [pollVersion, setPollVersion] = useState(0);
  const [pollPaused, setPollPaused] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null);
  const [preview, setPreview] = useState('');
  const [confirmNew, setConfirmNew] = useState(false);
  const recorder = useRef(null);
  const stream = useRef(null);
  const popup = useRef(null);
  const bottom = useRef(null);
  const mounted = useRef(true);
  const scenario = scenarios.find(item => item.id === scenarioId);

  async function restore() {
    const stored = localStorage.getItem(sessionKey);
    if (!stored) return;
    const data = await api(`/sessions/${encodeURIComponent(stored)}`);
    const history = await api(`/sessions/${data.sessionId}/turns`);
    if (!mounted.current) return;
    setSession(data); setTurns(history);
    setScenarioId(data.scenarioId);
    const unfinished = history.find(turn => !turn.characterReply || !turn.replyAudioS3Key);
    if (unfinished) setPending(unfinished.turnNumber);
  }

  async function refreshAuth() {
    try {
      await checkSession();
      if (!mounted.current) return;
      setAuth('signed-in');
      try { await restore(); } catch (error) {
        if (error.status === 404 || error.status === 403) localStorage.removeItem(sessionKey);
        else setError(error.message);
      }
    } catch (error) {
      if (!mounted.current) return;
      setAuth(error.status === 401 ? 'signed-out' : 'offline');
    }
  }

  useEffect(() => {
    mounted.current = true;
    refreshAuth();
    return () => { mounted.current = false; stream.current?.getTracks().forEach(track => track.stop()); popup.current?.close(); };
  }, []);

  useEffect(() => {
    if (!clip) { setPreview(''); return; }
    const url = URL.createObjectURL(clip); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [clip]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turns, pending]);

  useEffect(() => {
    if (!session || !pending) return;
    let cancelled = false;
    let timer;
    const deadline = Date.now() + 180000;
    setPollPaused(false);
    async function poll() {
      try {
        const turn = await api(`/sessions/${session.sessionId}/turns/${pending}`);
        if (cancelled) return;
        setTurns(items => [...items.filter(item => item.turnNumber !== turn.turnNumber), turn].sort((a, b) => a.turnNumber - b.turnNumber));
        if (turn.characterReply && turn.replyAudioS3Key) { setPending(null); return; }
        if (Date.now() > deadline) { setPollPaused(true); return; }
        timer = setTimeout(poll, 2000);
      } catch (error) {
        if (cancelled) return;
        setError(error.message); setPollPaused(true);
        if (error.status === 401) setAuth('signed-out');
      }
    }
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [session, pending, pollVersion]);

  async function login() {
    setError('');
    const loginWindow = window.open(import.meta.env.VITE_LOGIN_URL || 'http://localhost:8080/oauth2/authorization/cognito', 'scenariolab-login', 'popup,width=540,height=740');
    if (!loginWindow) { setError('Allow pop-ups for this site to open the Cognito sign-in page.'); return; }
    popup.current = loginWindow; setBusy('login');
    // Cognito returns to Spring Boot on :8080. Localhost cookies are shared
    // across ports; the Vite proxy then forwards the session cookie to it.
    const deadline = Date.now() + 300000;
    while (mounted.current && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      try {
        await checkSession();
        if (!mounted.current) return;
        loginWindow.close(); await refreshAuth(); setBusy(''); return;
      } catch { if (loginWindow.closed) break; }
    }
    if (mounted.current) { setBusy(''); setError('Sign-in was not completed. Please try again.'); }
    loginWindow.close();
  }

  async function logout() {
    setBusy('logout'); setError('');
    try {
      await signOut(); localStorage.removeItem(sessionKey);
      setSession(null); setTurns([]); setPending(null); setClip(null); setAuth('signed-out');
    } catch (error) { setError(error.message); }
    finally { setBusy(''); }
  }

  async function startSession() {
    setBusy('session'); setError('');
    try {
      const data = await api('/sessions', { scenarioId });
      localStorage.setItem(sessionKey, data.sessionId);
      setSession(data); setTurns([]); setPending(null); setClip(null); setSeconds(0); setConfirmNew(false);
    } catch (error) { setError(error.message); if (error.status === 401) setAuth('signed-out'); }
    finally { setBusy(''); }
  }

  async function startRecording() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Recording needs a supported browser on localhost or HTTPS. Try Chrome or Edge.'); return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
      const chunks = [];
      mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      mediaRecorder.onstop = () => {
        stream.current?.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (blob.size) setClip(blob);
        else setError('No audio was recorded. Please try again.');
        setRecording(false);
      };
      mediaRecorder.onerror = () => { stream.current?.getTracks().forEach(track => track.stop()); setRecording(false); setError('Recording failed. Please try again.'); };
      recorder.current = mediaRecorder;
      mediaRecorder.start(); setClip(null); setSeconds(0); setRecording(true);
    } catch (error) { setError(error.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your browser settings and try again.' : 'Could not access your microphone. Check that it is connected.'); }
  }

  function stopRecording() { if (recorder.current?.state === 'recording') recorder.current.stop(); }
  useEffect(() => { if (recording && seconds >= 120) stopRecording(); }, [seconds, recording]);

  async function submit() {
    if (!clip || !session) return;
    setBusy('Uploading recording'); setError('');
    try {
      const upload = await api(`/sessions/${session.sessionId}/audio/upload-url`, { contentType: clip.type });
      await uploadAudio(upload.url, clip);
      setBusy('Sending your response');
      const turn = await api(`/sessions/${session.sessionId}/turns`, { audioS3Key: upload.audioS3Key });
      setTurns(items => [...items, turn]); setPending(turn.turnNumber); setClip(null); setSeconds(0);
    } catch (error) {
      setError(`${error.message} If the submit request timed out, refresh before sending again to check whether it was saved.`);
      if (error.status === 401) setAuth('signed-out');
    } finally { setBusy(''); }
  }

  const locked = !!busy || !!pending || auth !== 'signed-in';
  const completed = turns.filter(turn => turn.characterReply).length;

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="ScenarioLab home"><span className="brand-icon"><AudioLines size={23} /></span>Scenario<span>Lab</span></a>
      <div className="sidebar-label">YOUR WORKSPACE</div>
      <div className="nav-active"><BookOpen size={18} /> Practice studio <span className="nav-dot" /></div>
      <div className="sidebar-note"><span className="tiny-label">LEARN BY DOING</span><h3>A little practice.<br />A better conversation.</h3><p>A space to try, reflect, and find your voice.</p><div className="note-lines"><span /><span /><span /><span /><span /><span /><span /></div></div>
      <div className="sidebar-footer"><ShieldCheck size={16} /><span>Sign-in secured by Cognito</span></div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><span className="breadcrumb">Workspace <ChevronRight size={13} /> <strong>Practice studio</strong></span>
        {auth === 'signed-in' ? <div className="account"><span className="avatar">S</span><span>Student workspace</span><button className="icon-button" onClick={logout} disabled={!!busy || recording || !!pending} title="Sign out"><LogOut size={17} /></button></div>
          : <span className="secure-label"><ShieldCheck size={15} /> Your learning space</span>}
      </header>

      <main>
        <div className="page-heading"><div><div className="eyebrow">PRACTICE WITH PURPOSE</div><h1>Real conversations. Room to grow.</h1><p>Build confidence one conversation at a time.</p></div><span className="studio-badge"><span /> Voice practice</span></div>
        {error && <div className="alert" role="alert"><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={() => setError('')}><X size={17} /></button></div>}

        {auth !== 'signed-in' ? <section className="welcome-card">
          <div className="welcome-copy"><span className="pill">YOUR NEXT CONVERSATION STARTS HERE</span><h2>Practice the moments<br />that matter.</h2><p>Step into a realistic workplace scenario. Speak naturally, explore different approaches, and hear your conversation partner respond.</p>
            <button className="button primary" onClick={auth === 'offline' ? refreshAuth : login} disabled={auth === 'checking' || !!busy}>{auth === 'checking' || busy === 'login' ? <LoaderCircle size={17} className="spin" /> : <LogIn size={17} />}{auth === 'offline' ? 'Reconnect to backend' : busy === 'login' ? 'Waiting for sign-in…' : auth === 'checking' ? 'Connecting…' : 'Sign in to start'}<ArrowRight size={17} /></button>
            <span className="welcome-footnote">{auth === 'offline' ? 'Start Spring Boot on localhost:8080, then reconnect.' : 'Continue securely with your Cognito account.'}</span>
          </div><div className="welcome-preview"><div className="preview-top"><span className="avatar alex">A</span><div><strong>Alex</strong><small>Business stakeholder</small></div><span className="online-dot" /></div><div className="preview-bubble">“We need analytics and CSV export added before Friday. Can your team commit to both?”</div><div className="preview-answer"><AudioLines size={22} /><span>Your perspective makes<br />the conversation.</span></div><span className="preview-caption">ONE SCENARIO. MANY WAYS FORWARD.</span></div>
        </section> : <div className="studio-layout">
          <aside className="brief-panel">
            <div className="panel-label"><BookOpen size={16} /> SCENARIO BRIEF</div>
            <label className="field-label" htmlFor="scenario">Choose your scenario</label>
            <select id="scenario" value={scenarioId} onChange={event => setScenarioId(event.target.value)} disabled={!!session || locked}>{scenarios.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
            <span className="category">{scenario.category}</span><h2>{scenario.title}</h2><p className="brief-description">{scenario.brief}</p>
            <div className="role-card"><span className="tiny-label">YOUR ROLE</span><strong>{scenario.role}</strong></div>
            <h3 className="section-label">What you know</h3><dl className="facts">{scenario.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <h3 className="section-label">Focus on</h3><ul className="goals">{scenario.goals.map(goal => <li key={goal}><Check size={14} />{goal}</li>)}</ul>
            <div className="brief-tip"><Headphones size={18} /><p>Find a quiet spot. There’s no perfect script—start with what you would say.</p></div>
          </aside>

          <section className="conversation-panel" aria-label="Conversation">
            <div className="conversation-header"><div className="partner"><span className="avatar alex">A</span><div><h3>Alex <span className="ai-tag">AI PARTNER</span></h3><p>Business stakeholder</p></div></div><span className="turn-count">{completed} {completed === 1 ? 'exchange' : 'exchanges'}</span></div>
            <div className="conversation-scroll" aria-live="polite">
              <div className="conversation-date"><span />{session ? 'YOUR PRACTICE SESSION' : 'READY WHEN YOU ARE'}<span /></div>
              <div className="message partner-message"><span className="message-label">ALEX</span><div className="bubble">{scenario.opening}</div></div>
              {!session && <div className="start-prompt"><span className="start-icon"><Mic size={24} /></span><h3>Take the conversation forward.</h3><p>Start a session, then record your response.<br />Alex will listen and reply in character.</p><button className="button primary" onClick={startSession} disabled={!!busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Play size={16} />} Start practice</button></div>}
              {turns.map(turn => <div key={turn.turnId} className="exchange"><div className="message student-message"><span className="message-label">YOU <span>· RESPONSE {turn.turnNumber}</span></span><div className="bubble">{turn.transcript || <span className="muted"><AudioLines size={17} /> Recording received</span>}</div></div>{turn.characterReply && <div className="message partner-message"><span className="message-label">ALEX</span><div className="bubble">{turn.characterReply}</div>{turn.replyAudioS3Key && <ReplyAudio sessionId={session.sessionId} turnNumber={turn.turnNumber} />}</div>}</div>)}
              {pending && <div className="processing" role="status">{pollPaused ? <Clock3 size={18} /> : <LoaderCircle className="spin" size={18} />}<div><strong>{pollPaused ? 'Still waiting for a reply' : 'Alex is preparing a response…'}</strong><p>{pollPaused ? 'Your recording is saved. Check again without resending it.' : 'Transcribing your recording and creating a spoken reply.'}</p>{pollPaused && <button className="text-button" onClick={() => { setError(''); setPollVersion(value => value + 1); }}><RefreshCw size={14} /> Check for reply</button>}</div></div>}
              <div ref={bottom} />
            </div>

            <div className="composer">
              {preview && <div className="recording-preview"><audio controls src={preview} /><button className="icon-button" title="Discard recording" disabled={!!busy} onClick={() => { setClip(null); setSeconds(0); }}><Trash2 size={17} /></button></div>}
              <div className="composer-main"><button className={`record-button ${recording ? 'is-recording' : ''}`} aria-label={recording ? 'Stop recording' : 'Record your response'} onClick={recording ? stopRecording : startRecording} disabled={!session || locked}>{recording ? <Square size={19} fill="currentColor" /> : <Mic size={22} />}</button><div className="record-copy"><strong>{recording ? `Recording · ${formatTime(seconds)}` : busy && busy !== 'session' ? `${busy}…` : clip ? 'Your response is ready' : pending ? 'Waiting for Alex’s reply' : 'Your turn to speak'}</strong><span>{recording ? 'Click stop when you’re done · 2 minute limit' : clip ? 'Listen back or send it to Alex.' : !session ? 'Start a session to enable your microphone.' : 'Click the microphone and speak naturally.'}</span></div><button className="button primary send-button" onClick={submit} disabled={!clip || locked || recording}>{busy && busy !== 'session' ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}<span>Send response</span></button></div>
              <div className="composer-footer"><span><ShieldCheck size={12} /> Recordings are saved to your learning session.</span>{session && <button className="text-button" disabled={locked || recording} onClick={() => setConfirmNew(true)}><Plus size={13} /> New session</button>}</div>
            </div>
          </section>
        </div>}

        <footer className="page-footer"><span>ScenarioLab</span><span>A safe space to practice. A stronger voice for what’s next.</span></footer>
      </main>
    </div>
    {confirmNew && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-session-title"><h2 id="new-session-title">Start a fresh conversation?</h2><p>Your current conversation stays saved. This workspace will move to a new session.</p><div><button className="button secondary" onClick={() => setConfirmNew(false)}>Keep practicing</button><button className="button primary" disabled={!!busy} onClick={startSession}>New session</button></div></div></div>}
  </div>;
}
