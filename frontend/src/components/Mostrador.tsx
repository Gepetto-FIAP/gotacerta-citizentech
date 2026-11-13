/**
 * Mostrador do hidrômetro, como na pág. 7 do guia: rolos pretos = metros cúbicos (o que vai na conta),
 * rolos vermelhos = litros. Ex.: 1.234.582 L → [0 1 2 3 4] m³ + [5 8 2] litros.
 */
export function Mostrador({ litros }: { litros: number }) {
  const total = Math.max(0, Math.floor(litros));
  const metrosCubicos = String(Math.floor(total / 1000) % 100_000).padStart(5, "0");
  const litrosRestantes = String(total % 1000).padStart(3, "0");

  return (
    <div
      role="img"
      aria-label={`Leitura do mostrador: ${Number(metrosCubicos)} metros cúbicos e ${Number(litrosRestantes)} litros`}
      className="flex items-end gap-2"
    >
      <div className="flex gap-0.5 rounded-md bg-white/10 p-1">
        {metrosCubicos.split("").map((d, i) => (
          <Rolo key={`m${i}`} digito={d} cor="bg-texto" />
        ))}
        {litrosRestantes.split("").map((d, i) => (
          <Rolo key={`l${i}`} digito={d} cor="bg-ponteiro" />
        ))}
      </div>
      <span className="pb-1 text-sm text-white/80">m³</span>
    </div>
  );
}

function Rolo({ digito, cor }: { digito: string; cor: string }) {
  return (
    <span
      className={`numero grid h-10 w-7 place-items-center rounded-sm text-xl font-bold text-white shadow-[inset_0_-6px_8px_rgba(0,0,0,0.25),inset_0_6px_8px_rgba(0,0,0,0.25)] sm:h-11 sm:w-8 sm:text-2xl ${cor}`}
    >
      {digito}
    </span>
  );
}

/**
 * O ponteiro vermelho de litros (×0,0001 m³): 1 volta = 1 litro.
 * Gira na velocidade real: a 40 L/min dá 40 voltas por minuto (1,5 s por volta).
 * Sem água passando, fica parado. Quem pede menos movimento no sistema vê o ponteiro parado.
 */
export function PonteiroLitros({ vazaoLpm }: { vazaoLpm: number }) {
  const girando = vazaoLpm > 0;
  const segundosPorVolta = girando ? Math.max(60 / vazaoLpm, 0.4) : 0;

  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 sm:h-28 sm:w-28" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="white" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
      {Array.from({ length: 10 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="8"
          x2="50"
          y2={i % 5 === 0 ? 17 : 13}
          stroke="#1b2a30"
          strokeWidth={i % 5 === 0 ? 2.5 : 1.5}
          transform={`rotate(${i * 36} 50 50)`}
        />
      ))}
      <g
        className={girando ? "motion-safe:animate-girar" : undefined}
        style={
          {
            transformBox: "view-box",
            transformOrigin: "50px 50px",
            "--periodo": `${segundosPorVolta}s`,
          } as React.CSSProperties
        }
      >
        <path d="M50 14 L54 50 L46 50 Z" fill="#c8102e" />
        <path d="M50 62 L53 50 L47 50 Z" fill="#c8102e" opacity="0.5" />
      </g>
      <circle cx="50" cy="50" r="5" fill="#1b2a30" />
    </svg>
  );
}
