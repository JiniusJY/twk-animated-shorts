import React from "react";
import {AbsoluteFill, Img, staticFile, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Grain} from "./NcicScene";
import {siApple, siOpenai, siGoogle, siNvidia, siNasa} from "simple-icons";

/**
 * TWK end card: logo + follow, then the site's newsletter card ("Master tech in 1 minute a day").
 * Mirrors the techwhoknows newsletter popup, adapted for video: the email field becomes a
 * "link in bio" button (nothing is typeable in a video). Reader-company marks come from
 * Simple Icons (owner decision, matches the site popup).
 * The reader count is the owner's own published claim; keep it in sync with the site.
 */
const BG = "#0b0b0d", PANEL = "#111114", LINE = "#2a2a30", TXT = "#f3f2ee", MUTED = "#9a9aa2", CYAN = "#5fd0f5", VIOLET = "#7b5cf0";
export const NEWSLETTER = {
  kicker: "FREE DAILY NEWSLETTER",
  pre: "Master tech in ", accent: "1 minute", post: " a day",
  body: "Get the latest tech news, understand why it matters, and learn how to apply it in your work.",
  social: "Join 50,000+ readers from Apple, OpenAI, NASA & more",
  cta: "Subscribe free · link in bio",
  fine: "Free. Unsubscribe in one click.",
};

const MARKS = [siApple, siOpenai, siGoogle, siNvidia, siNasa];

export const EndCard: React.FC<{start: number; handle: string}> = ({start, handle}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const t = f - start;
  const sp = (d: number, cfg = {damping: 20, stiffness: 180}) => spring({frame: t - d, fps, config: cfg});
  const logo = sp(0), follow = sp(6), card = sp(16, {damping: 22, stiffness: 150});
  const clickAt = Math.round(fps * 1.1);
  const clicked = t > clickAt;
  const press = Math.max(0, 1 - Math.abs(t - clickAt) / 5);
  const line = (d: number) => clamp((t - d) / 10);
  const shimmer = 50 + 50 * Math.sin(t / 12);
  const ctaPulse = 1 + 0.025 * Math.sin(Math.max(0, t - 60) / 7);
  return (
    <AbsoluteFill style={{background: BG, color: TXT, alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", paddingBottom: 170, boxSizing: "border-box",
      opacity: Math.min(1, (t + 1) / 6)}}>
      {/* logo + follow */}
      <div style={{width: 190, height: 190, borderRadius: "50%", overflow: "hidden", background: "#111316",
        border: `3px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center",
        transform: `scale(${0.6 + 0.4 * logo})`, opacity: logo}}>
        <Img src={staticFile("brand/twk-owner-logo-centered.png")} style={{width: 190, maxWidth: "none", height: "auto"}}/>
      </div>
      <div style={{display: "flex", alignItems: "center", gap: 26, marginTop: 34, opacity: follow,
        transform: `translateY(${(1 - follow) * 20}px)`}}>
        <div style={{fontSize: 60, fontWeight: 800, letterSpacing: -1}}>{handle}</div>
        <div style={{borderRadius: 50, padding: "14px 30px", fontSize: 30, fontWeight: 700,
          color: clicked ? BG : CYAN, background: clicked ? CYAN : "transparent", border: `3px solid ${CYAN}`,
          transform: `scale(${1 - press * 0.1})`, position: "relative"}}>
          {clicked ? "✓ Following" : "+ Follow"}
          {/* cursor glides in and taps the button */}
          {(() => {
            const g = Math.max(0, Math.min(1, (t - (clickAt - 20)) / 16));
            const e = 1 - Math.pow(1 - g, 3);
            const fade = Math.max(0, Math.min(1, (t - (clickAt + 14)) / 10));
            if (g <= 0 || fade >= 1) return null;
            return (
              <svg width="54" height="64" viewBox="0 0 24 28" style={{position: "absolute",
                left: 70 + 160 * (1 - e), top: 34 + 120 * (1 - e), opacity: 1 - fade,
                transform: `scale(${1 - press * 0.15})`, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.6))"}}>
                <path d="M2 2 L2 22 L7.5 17 L11 25 L14.5 23.5 L11 15.8 L18.5 15.8 Z" fill="#ffffff" stroke="#0b0b0d" strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
            );
          })()}
          {press > 0 && <div style={{position: "absolute", left: "50%", top: "50%", width: 40 + 160 * (1 - press),
            height: 40 + 160 * (1 - press), marginLeft: -(20 + 80 * (1 - press)), marginTop: -(20 + 80 * (1 - press)),
            borderRadius: "50%", border: `3px solid ${CYAN}`, opacity: press}}/>}
        </div>
      </div>

      {/* newsletter card */}
      <div style={{width: 940, marginTop: 60, background: PANEL, border: `2px solid ${LINE}`, borderRadius: 30,
        padding: "52px 56px 44px", boxSizing: "border-box", opacity: card,
        transform: `translateY(${(1 - card) * 60}px)`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)"}}>
        <div style={{fontSize: 27, fontWeight: 700, letterSpacing: 5, color: CYAN, opacity: line(20)}}>{NEWSLETTER.kicker}</div>
        <div style={{fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: 74, lineHeight: 1.12,
          letterSpacing: -1, marginTop: 22, opacity: line(26), transform: `translateY(${(1 - line(26)) * 16}px)`}}>
          {NEWSLETTER.pre}
          <span style={{whiteSpace: "nowrap", backgroundImage: `linear-gradient(90deg, ${CYAN} 0%, ${VIOLET} ${100 + shimmer}%)`,
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent"}}>{NEWSLETTER.accent}</span>
          {NEWSLETTER.post}
        </div>
        <div style={{fontSize: 34, lineHeight: 1.5, color: MUTED, marginTop: 26, opacity: line(36)}}>{NEWSLETTER.body}</div>
        <div style={{display: "flex", alignItems: "center", gap: 26, marginTop: 34}}>
          <div style={{display: "flex", flexShrink: 0}}>
            {MARKS.map((m, i) => {
              const mp = sp(42 + i * 3, {damping: 14, stiffness: 240});
              return (
                <div key={m.slug} style={{width: 78, height: 78, borderRadius: "50%", background: "#151518",
                  border: `2px solid ${LINE}`, marginLeft: i ? -16 : 0, display: "flex", alignItems: "center",
                  justifyContent: "center", opacity: mp, transform: `scale(${0.5 + 0.5 * mp})`, zIndex: MARKS.length - i}}>
                  <svg viewBox="0 0 24 24" width={m.slug === "nasa" ? 50 : 38} height={m.slug === "nasa" ? 50 : 38}>
                    <path d={m.path} fill={TXT}/>
                  </svg>
                </div>
              );
            })}
          </div>
          <div style={{fontSize: 30, lineHeight: 1.35, color: MUTED, opacity: line(52)}}>{NEWSLETTER.social}</div>
        </div>
        <div style={{marginTop: 40, background: CYAN, color: "#06121a", borderRadius: 16, padding: "30px 0",
          textAlign: "center", fontSize: 40, fontWeight: 800, opacity: line(56),
          transform: `scale(${(0.94 + 0.06 * line(56)) * ctaPulse})`}}>{NEWSLETTER.cta} ↗</div>
        <div style={{fontSize: 25, color: MUTED, marginTop: 24, opacity: line(64)}}>{NEWSLETTER.fine}</div>
      </div>
      <Grain frame={f}/>
    </AbsoluteFill>
  );
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
