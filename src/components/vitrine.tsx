const LINHAS = [
  { prompt: true, texto: "git switch -c rodape" },
  { texto: "Switched to a new branch 'rodape'" },
  { prompt: true, texto: "git add index.html" },
  { prompt: true, texto: 'git commit -m "adiciona rodape"' },
  { texto: "[rodape 9f2c1ab] adiciona rodape", destaque: true },
  { prompt: true, texto: "git switch main" },
  { prompt: true, texto: "git merge rodape" },
  { texto: "Updating 4a7d2e1..9f2c1ab", },
  { texto: "Fast-forward", destaque: true },
];

const NOS = [
  { y: 24, lane: 0, label: "adiciona rodape" },
  { y: 74, lane: 1, label: "ajusta estilo" },
  { y: 124, lane: 0, label: "primeiro commit" },
];

export function Vitrine() {
  return (
    <div aria-hidden="true" className="select-none space-y-4">
      <div className="overflow-hidden rounded-xl border border-line bg-[#0d1017]">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-danger/70" />
          <span className="h-2 w-2 rounded-full bg-warn/70" />
          <span className="h-2 w-2 rounded-full bg-ok/70" />
          <span className="ml-1 font-mono text-[11px] text-muted">terminal</span>
        </div>

        <div className="space-y-0.5 p-4 font-mono text-xs leading-6">
          {LINHAS.map((linha, indice) => (
            <p
              key={indice}
              className={linha.destaque ? "text-lime" : linha.prompt ? "text-ink" : "text-muted"}
            >
              {linha.prompt && <span className="text-sky">~/telleslab$ </span>}
              {linha.texto}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="font-mono text-[11px] text-muted">linha do tempo</p>
        <div className="mt-2 flex gap-3">
          <svg width="40" height="150" className="shrink-0">
            <path d="M 12 24 C 12 50, 30 50, 30 74" fill="none" stroke="#c084fc" strokeWidth="2" strokeOpacity="0.5" />
            <path d="M 30 74 C 30 100, 12 100, 12 124" fill="none" stroke="#c084fc" strokeWidth="2" strokeOpacity="0.5" />
            <path d="M 12 24 L 12 124" fill="none" stroke="#a3e635" strokeWidth="2" strokeOpacity="0.5" />
            {NOS.map((no) => (
              <circle
                key={no.y}
                cx={no.lane === 0 ? 12 : 30}
                cy={no.y}
                r={no.lane === 0 ? 5.5 : 4.5}
                fill={no.lane === 0 ? "#a3e635" : "#11141b"}
                stroke={no.lane === 0 ? "#a3e635" : "#c084fc"}
                strokeWidth="2"
              />
            ))}
          </svg>

          <ul className="flex-1 text-sm">
            {NOS.map((no) => (
              <li key={no.label} style={{ height: 50 }}>
                <p className="truncate text-ink/90">{no.label}</p>
                <p className="font-mono text-[11px] text-muted">
                  {no.lane === 0 ? "main" : "rodape"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
