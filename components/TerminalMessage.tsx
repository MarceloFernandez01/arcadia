export default function TerminalMessage({
  command,
  lines,
  tone,
}: {
  command: string;
  lines: string[];
  tone: "success" | "error";
}) {
  return (
    <div
      className="terminal-success"
      style={{ marginTop: 16, ...(tone === "error" ? { borderColor: "var(--magenta)" } : {}) }}
    >
      <div className="term-bar">
        <span className="dot r"></span>
        <span className="dot y"></span>
        <span className="dot g"></span>
        <span className="term-title">VAULT-OS // TERMINAL</span>
      </div>
      <div className="term-body">
        <div className="line">
          <span className="prompt">vault@arcade:~$</span> {command}
        </div>
        {lines.map((text, i) =>
          i === lines.length - 1 ? (
            <div
              key={i}
              className={tone === "success" ? "line success" : "line"}
              style={tone === "error" ? { color: "var(--magenta)" } : undefined}
            >
              {text}
              <span className="caret">_</span>
            </div>
          ) : (
            <div key={i} className="line dim">
              {text}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
