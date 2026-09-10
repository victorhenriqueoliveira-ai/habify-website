import React from "react";

/**
 * HeroAnimation — animação "puro CSS/React" para o Hero da HabiFy.
 * Sem dependências externas além do React. Loop de 15s, contínuo.
 *
 * Uso: substitua o bloco de `<OptimizedImage src="/Foto1.png" .../>`
 * dentro do Hero.tsx por <HeroAnimation />.
 */

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_LIGHT = "#FDBA74";
const INK = "#0d0d0e";
const PANEL_LT = "#202226";
const MUTE = "#5c5c60";
const WHITE = "#f7f5f2";

const DISPLAY_FONT = '"Brockmann", "SF Pro Display", Inter, sans-serif';
const BODY_FONT = "Inter, system-ui, sans-serif";

// 15s loop. Moments (seconds -> % of 15s):
// Act 1 "sem site"    0.0s  -> 3.3s   (0%    - 22%)
// Sweep transition    2.9s  -> 4.0s   (19.3% - 26.7%)
// Act 2 "construindo" 3.6s  -> 9.0s   (24%   - 60%)
// Act 3 "leads"       8.7s  -> 13.8s  (58%   - 92%)
// Act 4 "marca"       13.5s -> 15.0s  (90%   - 100%)

function BrowserChrome({
  x,
  y,
  width,
  height,
  muted,
  glow,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  muted?: boolean;
  glow?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        background: muted ? "#1c1c1e" : "#101012",
        border: `1px solid ${muted ? "rgba(255,255,255,0.06)" : "rgba(249,115,22,0.4)"}`,
        boxShadow: glow
          ? "0 0 0 1px rgba(249,115,22,0.2), 0 40px 100px -20px rgba(249,115,22,0.55), 0 20px 60px rgba(0,0,0,0.55)"
          : "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          height: 34,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "0 14px",
          background: muted ? "#232326" : "#17181a",
          borderBottom: `1px solid ${muted ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ width: 8, height: 8, borderRadius: "50%", background: "#5c5c60", opacity: 0.6 }}
          />
        ))}
        <div
          style={{
            marginLeft: 10,
            height: 14,
            width: width * 0.4,
            borderRadius: 4,
            background: muted ? "#2c2c2f" : "#232427",
          }}
        />
      </div>
      <div style={{ position: "relative", width: "100%", height: height - 34 }}>{children}</div>
    </div>
  );
}

export default function HeroAnimation() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 24,
        overflow: "hidden",
        background: INK,
        containerType: "inline-size",
      }}
    >
      <style>{`
        @property --p { syntax: '<number>'; initial-value: 0; inherits: false; }

        @keyframes ha-breathe { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.035) } }
        @keyframes ha-blob1 { 0%{transform:translate(0,0)} 33%{transform:translate(-40px,26px)} 66%{transform:translate(28px,-32px)} 100%{transform:translate(0,0)} }
        @keyframes ha-blob2 { 0%{transform:translate(0,0)} 33%{transform:translate(32px,-20px)} 66%{transform:translate(-26px,26px)} 100%{transform:translate(0,0)} }
        @keyframes ha-blob3 { 0%{transform:translate(0,0)} 33%{transform:translate(-26px,-26px)} 66%{transform:translate(32px,20px)} 100%{transform:translate(0,0)} }
        @keyframes ha-particle { 0%{ transform:translateY(0); opacity:0 } 10%{opacity:.65} 90%{opacity:.45} 100%{ transform:translateY(-680px); opacity:0 } }
        @keyframes ha-streak { 0%{ left:-25%; opacity:0 } 3%{ opacity:.6 } 26%{ opacity:0 } 26.01%{ opacity:0 } 100%{ left:130%; opacity:0 } }

        @keyframes ha-act-before { 0%{opacity:0} 2.7%{opacity:1} 19.3%{opacity:1} 22%{opacity:0} 100%{opacity:0} }
        @keyframes ha-shake { 0%,100%{ transform:translate(-50%,-50%) rotate(-8deg) } 50%{ transform:translate(-50%,-50%) rotate(-5deg) } }

        @keyframes ha-sweep { 0%{opacity:0} 19.3%{opacity:0} 22%{opacity:1} 26.7%{opacity:0} 100%{opacity:0} }
        @keyframes ha-sweep-move { 19.3%{ left:-25% } 26.7%{ left:130% } 100%{ left:130% } }

        @keyframes ha-act-build { 0%{opacity:0} 24%{opacity:0} 26.7%{opacity:1} 57%{opacity:1} 60%{opacity:0} 100%{opacity:0} }
        @keyframes ha-header-grow { 0%{width:0%} 24%{width:0%} 27.3%{width:40%} 100%{width:40%} }
        @keyframes ha-hero-pop { 0%{opacity:0; transform:scale(.96)} 26.7%{opacity:0; transform:scale(.96)} 30%{opacity:1; transform:scale(1)} 60%{opacity:1} 100%{opacity:0} }
        @keyframes ha-card1 { 0%{opacity:0;transform:scale(.65)} 30%{opacity:0;transform:scale(.65)} 33%{opacity:1;transform:scale(1)} 60%{opacity:1} 100%{opacity:0} }
        @keyframes ha-card2 { 0%{opacity:0;transform:scale(.65)} 31.7%{opacity:0;transform:scale(.65)} 34.7%{opacity:1;transform:scale(1)} 60%{opacity:1} 100%{opacity:0} }
        @keyframes ha-card3 { 0%{opacity:0;transform:scale(.65)} 33.3%{opacity:0;transform:scale(.65)} 36.3%{opacity:1;transform:scale(1)} 60%{opacity:1} 100%{opacity:0} }
        @keyframes ha-ring { 0%{ --p:0 } 24%{ --p:0 } 60%{ --p:360 } 100%{ --p:360 } }
        @keyframes ha-ring-pulse { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.02) } }
        @keyframes ha-stage-72 { 0%{opacity:0} 24%{opacity:0} 25%{opacity:1} 32%{opacity:1} 33%{opacity:0} 100%{opacity:0} }
        @keyframes ha-stage-48 { 0%{opacity:0} 33%{opacity:0} 34%{opacity:1} 40.5%{opacity:1} 41.5%{opacity:0} 100%{opacity:0} }
        @keyframes ha-stage-24 { 0%{opacity:0} 41.5%{opacity:0} 42.5%{opacity:1} 49%{opacity:1} 50%{opacity:0} 100%{opacity:0} }
        @keyframes ha-stage-done { 0%{opacity:0} 50%{opacity:0} 51%{opacity:1} 58%{opacity:1} 60%{opacity:0} 100%{opacity:0} }

        @keyframes ha-act-leads { 0%{opacity:0} 58%{opacity:0} 60.7%{opacity:1} 89.3%{opacity:1} 92%{opacity:0} 100%{opacity:0} }
        @keyframes ha-msg1 { 0%{opacity:0;transform:translateY(16px) scale(.9)} 60%{opacity:0;transform:translateY(16px) scale(.9)} 64%{opacity:1;transform:translateY(0) scale(1)} 92%{opacity:1} 100%{opacity:0} }
        @keyframes ha-msg2 { 0%{opacity:0;transform:translateY(16px) scale(.9)} 65%{opacity:0;transform:translateY(16px) scale(.9)} 69%{opacity:1;transform:translateY(0) scale(1)} 92%{opacity:1} 100%{opacity:0} }
        @keyframes ha-msg3 { 0%{opacity:0;transform:translateY(16px) scale(.9)} 70%{opacity:0;transform:translateY(16px) scale(.9)} 74%{opacity:1;transform:translateY(0) scale(1)} 92%{opacity:1} 100%{opacity:0} }
        @keyframes ha-msg4 { 0%{opacity:0;transform:translateY(16px) scale(.9)} 75%{opacity:0;transform:translateY(16px) scale(.9)} 79%{opacity:1;transform:translateY(0) scale(1)} 92%{opacity:1} 100%{opacity:0} }
        @keyframes ha-count-pop { 0%{opacity:0;transform:scale(.8)} 58%{opacity:0;transform:scale(.8)} 62%{opacity:1;transform:scale(1)} 92%{opacity:1} 100%{opacity:0} }

        @keyframes ha-act-final { 0%{opacity:0} 90%{opacity:0} 93%{opacity:1} 97%{opacity:1} 100%{opacity:0} }
        @keyframes ha-brand-pulse { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.03) } }
      `}</style>

      {/* Ambient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, ${INK} 0%, #141210 55%, #1a1208 100%)`,
          animation: "ha-breathe 8s ease-in-out infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "70%",
            top: "10%",
            width: "45%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ORANGE}66 0%, ${ORANGE}00 70%)`,
            filter: "blur(8px)",
            animation: "ha-blob1 9s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "0%",
            top: "62%",
            width: "36%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ORANGE_DARK}66 0%, ${ORANGE_DARK}00 70%)`,
            filter: "blur(8px)",
            animation: "ha-blob2 11s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "44%",
            top: "76%",
            width: "29%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ORANGE_LIGHT}66 0%, ${ORANGE_LIGHT}00 70%)`,
            filter: "blur(8px)",
            animation: "ha-blob3 10s ease-in-out infinite",
          }}
        />
        {Array.from({ length: 26 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 4.1) % 100}%`,
              bottom: -10,
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: ORANGE_LIGHT,
              animation: `ha-particle ${9 + (i % 6)}s linear infinite`,
              animationDelay: `${-(i * 1.1)}s`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-25%",
            width: "16%",
            height: "160%",
            transform: "rotate(18deg)",
            background: `linear-gradient(90deg, transparent 0%, transparent 20%, ${ORANGE}30 50%, transparent 80%, transparent 100%)`,
            filter: "blur(4px)",
            animation: "ha-streak 5s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />
      </div>

      {/* Act 1 — sem site */}
      <div style={{ position: "absolute", inset: 0, animation: "ha-act-before 15s infinite" }}>
        <div style={{ position: "absolute", left: "32%", top: "30.5%", width: "35.4%", height: "38.9%" }}>
          <BrowserChrome x={0} y={0} width={680} height={420} muted>
            <div style={{ padding: 26, transform: "scale(0.55)", transformOrigin: "top left", width: 680 }}>
              <div style={{ height: 140, borderRadius: 10, background: "#28282b", marginBottom: 16 }} />
              <div style={{ display: "flex", gap: 14 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ flex: 1, height: 100, borderRadius: 10, background: "#232326" }} />
                ))}
              </div>
              <div style={{ marginTop: 18, height: 12, width: "60%", borderRadius: 4, background: "#28282b" }} />
            </div>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "55%",
                border: "2px solid #7a3b2a",
                color: "#c56a52",
                fontFamily: BODY_FONT,
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: "0.08em",
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(20,10,8,0.55)",
                whiteSpace: "nowrap",
                animation: "ha-shake 0.6s ease-in-out infinite",
              }}
            >
              SEM SITE PRÓPRIO
            </div>
          </BrowserChrome>
        </div>

        <div
          style={{
            position: "absolute",
            left: "13%",
            top: "35%",
            width: "11.5%",
            aspectRatio: "220/320",
            borderRadius: 28,
            background: "#1a1a1c",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "4%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "27%",
              height: "2%",
              borderRadius: 3,
              background: "#0d0d0e",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "13% 7% 5%",
              borderRadius: 16,
              background: "#141416",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="#4a4a4d" strokeWidth="1.5" />
              <path d="M8 12h8" stroke="#4a4a4d" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: "#5c5c60", fontWeight: 600 }}>
              0 mensagens
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: "13%",
            top: "20%",
            display: "flex",
            flexDirection: "column",
            gap: "0.4em",
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              fontSize: "clamp(13px,1.9cqw,25px)",
              lineHeight: 1.2,
              color: "#8a8a8e",
              letterSpacing: "-0.01em",
            }}
          >
            Sem site. Sem leads.
          </div>
          <div
            style={{
              fontFamily: BODY_FONT,
              fontWeight: 500,
              fontSize: "clamp(10px,1.1cqw,16px)",
              lineHeight: 1.3,
              color: "#5c5c60",
            }}
          >
            A concorrência vende.
          </div>
        </div>
      </div>

      {/* Transition sweep */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-25%",
            width: "30%",
            height: "160%",
            transform: "rotate(18deg)",
            background: `linear-gradient(90deg, transparent 0%, ${ORANGE_LIGHT}00 10%, ${ORANGE} 48%, ${ORANGE_LIGHT}00 90%, transparent 100%)`,
            filter: "blur(2px)",
            animation: "ha-sweep 15s infinite, ha-sweep-move 15s infinite",
          }}
        />
      </div>

      {/* Act 2 — construindo na hora */}
      <div style={{ position: "absolute", inset: 0, animation: "ha-act-build 15s infinite" }}>
        <div
          style={{
            position: "absolute",
            left: "34%",
            top: "12%",
            width: "36%",
            fontFamily: DISPLAY_FONT,
            fontWeight: 700,
            fontSize: "clamp(13px,1.6cqw,19px)",
            lineHeight: 1.15,
            color: WHITE,
            letterSpacing: "-0.01em",
          }}
        >
          Seu site sendo criado agora
        </div>

        <div style={{ position: "absolute", left: "34%", top: "27.3%", width: "35.4%", height: "39.8%" }}>
          <BrowserChrome x={0} y={0} width={680} height={430} glow>
            <div style={{ padding: 24, transform: "scale(0.55)", transformOrigin: "top left", width: 680 }}>
              <div
                style={{
                  height: 12,
                  borderRadius: 4,
                  background: ORANGE,
                  marginBottom: 18,
                  animation: "ha-header-grow 15s infinite",
                }}
              />
              <div
                style={{
                  height: 130,
                  borderRadius: 10,
                  marginBottom: 16,
                  background: `linear-gradient(120deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
                  backgroundImage:
                    "repeating-linear-gradient(115deg, rgba(255,255,255,0.10) 0 12px, rgba(255,255,255,0) 12px 24px)",
                  animation: "ha-hero-pop 15s infinite",
                }}
              />
              <div style={{ display: "flex", gap: 14 }}>
                {["ha-card1", "ha-card2", "ha-card3"].map((anim, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 108,
                      borderRadius: 10,
                      background: PANEL_LT,
                      border: "1px solid rgba(249,115,22,0.3)",
                      padding: 10,
                      boxSizing: "border-box",
                      animation: `${anim} 15s infinite`,
                    }}
                  >
                    <div style={{ height: 56, borderRadius: 6, background: "#2c2d31", marginBottom: 8 }} />
                    <div style={{ height: 8, width: "80%", borderRadius: 3, background: "#3a3b3f", marginBottom: 6 }} />
                    <div style={{ height: 8, width: "50%", borderRadius: 3, background: ORANGE, opacity: 0.7 }} />
                  </div>
                ))}
              </div>
            </div>
          </BrowserChrome>
        </div>

        <div
          style={{
            position: "absolute",
            left: "72%",
            top: "25.5%",
            width: "8.3%",
            aspectRatio: "1",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `conic-gradient(${ORANGE} calc(var(--p, 0) * 1deg), #2a2a2d 0deg)`,
            animation: "ha-ring 15s infinite, ha-ring-pulse 2s ease-in-out infinite",
            boxShadow: `0 0 40px ${ORANGE}33`,
          }}
        >
          <div
            style={{
              width: "86%",
              height: "86%",
              borderRadius: "50%",
              background: INK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {[
              { label: "Fotos", anim: "ha-stage-72" },
              { label: "IA", anim: "ha-stage-48" },
              { label: "Deploy", anim: "ha-stage-24" },
              { label: "Pronto ✓", anim: "ha-stage-done", small: true },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  animation: `${s.anim} 15s infinite`,
                }}
              >
                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 800,
                    fontSize: s.small ? "clamp(9px,1.15cqw,15px)" : "clamp(12px,1.5cqw,20px)",
                    color: ORANGE,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: "clamp(7px,0.7cqw,10px)",
                    color: MUTE,
                    marginTop: 2,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  entrega
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Act 3 — leads no WhatsApp */}
      <div style={{ position: "absolute", inset: 0, animation: "ha-act-leads 15s infinite" }}>
        <div
          style={{
            position: "absolute",
            left: "11%",
            top: "12%",
            width: "40%",
            fontFamily: DISPLAY_FONT,
            fontWeight: 700,
            fontSize: "clamp(13px,1.6cqw,19px)",
            lineHeight: 1.15,
            color: WHITE,
            letterSpacing: "-0.01em",
          }}
        >
          Leads direto no seu WhatsApp
        </div>

        <div style={{ position: "absolute", left: "11%", top: "27.3%", width: "32.3%", height: "39.8%" }}>
          <BrowserChrome x={0} y={0} width={620} height={430} glow>
            <div style={{ padding: 24, transform: "scale(0.55)", transformOrigin: "top left", width: 620 }}>
              <div style={{ height: 12, width: "38%", borderRadius: 4, background: ORANGE, marginBottom: 18 }} />
              <div
                style={{
                  height: 130,
                  borderRadius: 10,
                  marginBottom: 16,
                  background: `linear-gradient(120deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
                  backgroundImage:
                    "repeating-linear-gradient(115deg, rgba(255,255,255,0.10) 0 12px, rgba(255,255,255,0) 12px 24px)",
                }}
              />
              <div style={{ display: "flex", gap: 14 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 108,
                      borderRadius: 10,
                      background: PANEL_LT,
                      border: "1px solid rgba(249,115,22,0.3)",
                      padding: 10,
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ height: 56, borderRadius: 6, background: "#2c2d31", marginBottom: 8 }} />
                    <div style={{ height: 8, width: "80%", borderRadius: 3, background: "#3a3b3f", marginBottom: 6 }} />
                    <div style={{ height: 8, width: "50%", borderRadius: 3, background: ORANGE, opacity: 0.7 }} />
                  </div>
                ))}
              </div>
            </div>
          </BrowserChrome>
        </div>

        <div
          style={{
            position: "absolute",
            left: "54%",
            top: "22%",
            width: "13.5%",
            aspectRatio: "260/480",
            borderRadius: 32,
            background: "#141416",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "3.3%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "27%",
              height: "1.5%",
              borderRadius: 4,
              background: "#0d0d0e",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "9.5% 5.5% 3%",
              borderRadius: 20,
              background: "#0e1a13",
              overflow: "hidden",
              padding: "5%",
              display: "flex",
              flexDirection: "column",
              gap: "5%",
              boxSizing: "border-box",
            }}
          >
            {[
              { name: "Marina S.", text: "Oi! Tenho interesse no apto 203 👀", anim: "ha-msg1" },
              { name: "Rafael T.", text: "Ainda está disponível a casa na Vila Nova?", anim: "ha-msg2" },
              { name: "Camila O.", text: "Quero agendar uma visita amanhã", anim: "ha-msg3" },
              { name: "Diego M.", text: "Qual o valor do condomínio?", anim: "ha-msg4" },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  background: "#1f2e23",
                  borderRadius: 12,
                  padding: "7px 10px",
                  maxWidth: "90%",
                  animation: `${m.anim} 15s infinite`,
                }}
              >
                <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 10, color: "#4ade80", marginBottom: 2 }}>
                  {m.name}
                </div>
                <div style={{ fontFamily: BODY_FONT, fontSize: 9.5, color: "#e8f5ec", lineHeight: 1.3 }}>{m.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: "11%",
            top: "69%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(23,24,26,0.85)",
            border: "1px solid rgba(249,115,22,0.35)",
            borderRadius: 16,
            padding: "10px 18px",
            animation: "ha-count-pop 15s infinite",
            boxShadow: `0 0 30px ${ORANGE}22`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade80" }} />
          <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: "clamp(14px,1.8cqw,26px)", color: ORANGE }}>
            +32
          </div>
          <div style={{ fontFamily: BODY_FONT, fontSize: "clamp(9px,1cqw,14px)", color: "#c9c9cc" }}>leads hoje</div>
        </div>
      </div>

      {/* Act 4 — marca */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: "ha-act-final 15s infinite",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "42%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ORANGE}55 0%, transparent 70%)`,
            filter: "blur(6px)",
            animation: "ha-brand-pulse 1.2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "0.4em",
          }}
        >
          <img
            src="/logotipo_habify.png"
            alt=""
            style={{
              height: "clamp(28px,4.6cqw,52px)",
              width: "auto",
              objectFit: "contain",
            }}
          />
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 800,
              fontSize: "clamp(30px,5.2cqw,60px)",
              color: WHITE,
              letterSpacing: "-0.02em",
            }}
          >
            Habi<span style={{ color: ORANGE }}>Fy</span>
          </div>
        </div>
        <div
          style={{
            position: "relative",
            fontFamily: BODY_FONT,
            fontWeight: 600,
            fontSize: "clamp(12px,1.6cqw,20px)",
            color: "#d8d8da",
          }}
        >
          Site pronto na hora. Leads no automático.
        </div>
      </div>
    </div>
  );
}
