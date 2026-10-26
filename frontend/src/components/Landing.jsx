import {
  ArrowRight,
  AudioLines,
  BookOpen,
  ChevronRight,
  LoaderCircle,
  LogIn,
  Mic,
  ShieldCheck,
} from "lucide-react";

export function LandingHero({
  auth,
  busy,
  signedIn,
  startSession,
  refreshAuth,
  login,
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> A PRACTICE SPACE FOR YOUR NEXT BIG
            CONVERSATION
          </div>
          <h1>
            Find your voice.
            <br />
            Before it <em>matters.</em>
          </h1>
          <p>
            Some conversations deserve a rehearsal. Step into a real-world
            scenario, speak your mind, and work through it with an AI partner
            who talks back.
          </p>
          <div className="hero-actions">
            <button
              className="button primary"
              disabled={auth === "checking" || !!busy}
              onClick={
                signedIn
                  ? startSession
                  : auth === "offline"
                    ? refreshAuth
                    : login
              }
            >
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <Mic size={17} />
              )}
              {busy === "login"
                ? "Complete sign-in"
                : busy === "session"
                  ? "Creating your session"
                  : auth === "checking"
                    ? "Connecting"
                    : signedIn
                      ? "Enter the practice studio"
                      : auth === "offline"
                        ? "Reconnect to backend"
                        : "Start practicing"}
              <ArrowRight size={16} />
            </button>
            <a className="button ghost" href="#how-it-works">
              See how it works <ChevronRight size={14} />
            </a>
          </div>
          <div className="hero-footnote">
            <ShieldCheck size={13} />
            {auth === "offline"
              ? "Start Spring Boot on localhost:8080, then reconnect."
              : "Your pace. Your perspective. A fresh start whenever you need it."}
          </div>
        </div>
        <div className="hero-visual" id="preview">
          <div className="visual-grid" />
          <div className="signal-ring ring-one" />
          <div className="signal-ring ring-two" />
          <div className="hero-console">
            <div className="console-bar">
              <span>
                <span className="status-dot" /> THE PRACTICE ROOM
              </span>
              <span>01 / VOICE</span>
            </div>
            <div className="console-partner">
              <span className="partner-orb">
                <AudioLines size={34} strokeWidth={1.3} />
              </span>
              <div>
                <strong>Meet Alex.</strong>
                <p>Your stakeholder. Your conversation partner.</p>
              </div>
            </div>
            <div className="console-message">
              <span>ALEX · BUSINESS STAKEHOLDER</span>
              <p>
                “We need analytics and CSV export added before Friday. Can your
                team commit to both?”
              </p>
            </div>
            <div className="console-wave" aria-hidden="true">
              {Array.from({ length: 43 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    "--height": `${8 + ((i * 17 + 13) % 37)}px`,
                    "--delay": `${i * 35}ms`,
                  }}
                />
              ))}
            </div>
            <div className="console-footer">
              <span>
                <Mic size={13} /> What would you say?
              </span>
              <span className="example-label">SCENARIO PREVIEW</span>
            </div>
          </div>
          <div className="floating-label">
            <span className="status-dot" /> Real situations. Room to try.
          </div>
        </div>
      </section>
      <div className="principles">
        <div>
          <span className="principle-index">01</span>
          <p>
            <strong>Speak naturally.</strong>
            <span>No scripts. No multiple choice.</span>
          </p>
        </div>
        <div>
          <span className="principle-index">02</span>
          <p>
            <strong>Stay in the moment.</strong>
            <span>A partner that responds in character.</span>
          </p>
        </div>
        <div>
          <span className="principle-index">03</span>
          <p>
            <strong>Try another approach.</strong>
            <span>Every conversation is a fresh start.</span>
          </p>
        </div>
      </div>
    </>
  );
}

export function AboutSections({ auth, busy, signedIn, refreshAuth, login }) {
  return (
    <>
      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {signedIn ? "02" : "01"} / HOW IT WORKS
            </span>
            <h2>
              Less overthinking.
              <br />
              More <em>conversation.</em>
            </h2>
          </div>
          <p className="section-description">
            From your first words to a different perspective. A simple loop,
            built around you.
          </p>
        </div>
        <div className="steps-grid">
          {[
            {
              icon: BookOpen,
              title: "Step into a situation.",
              text: "Get to know your role, the challenge, and the facts. There’s a real trade-off to work through.",
            },
            {
              icon: Mic,
              title: "Say what you think.",
              text: "Record your response in your own words. Listen back and send it when you’re ready.",
            },
            {
              icon: AudioLines,
              title: "Keep it going.",
              text: "Hear your partner’s perspective, ask a follow-up, and see where the conversation takes you.",
            },
          ].map((step, i) => (
            <article key={step.title}>
              <div className="step-top">
                <step.icon size={23} strokeWidth={1.4} />
                <span>0{i + 1}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="closing-note">
        <span className="eyebrow">A SMALL REHEARSAL. A DIFFERENT START.</span>
        <p>
          You don’t need the perfect words.
          <br />
          You just need a place to <em>begin.</em>
        </p>
        <a href={signedIn ? "#practice" : "#continue"} className="text-button">
          {signedIn ? "Back to the studio" : "Find your starting point"}{" "}
          <ArrowRight size={15} />
        </a>
      </section>
      {!signedIn && (
        <section className="access-section" id="continue">
          <div className="access-symbol">
            <AudioLines size={30} strokeWidth={1.3} />
          </div>
          <span className="eyebrow">YOUR NEXT CONVERSATION STARTS HERE</span>
          <h2>
            A little practice.
            <br />
            <em>A different kind of confidence.</em>
          </h2>
          <p>
            You’ve seen a glimpse. Now make the conversation your own.
            <br />
            Sign in or sign up to continue.
          </p>
          <button
            className="button primary"
            onClick={auth === "offline" ? refreshAuth : login}
            disabled={auth === "checking" || !!busy}
          >
            {busy === "login" || auth === "checking" ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <LogIn size={17} />
            )}
            {auth === "offline"
              ? "Reconnect to backend"
              : busy === "login"
                ? "Complete sign-in"
                : "Sign in / Sign up"}
            <ArrowRight size={16} />
          </button>
          <span className="access-footnote">
            <ShieldCheck size={12} /> Secure sign-in with Amazon Cognito. Create
            an account on the sign-in page.
          </span>
        </section>
      )}
    </>
  );
}
