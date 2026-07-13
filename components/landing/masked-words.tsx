interface MaskedWordsProps {
  text: string;
  /** Palavra exata → cor (ex.: { "WhatsApp.": "#0072E3" }) */
  accents?: Record<string, string>;
}

/**
 * Divide o texto em palavras mascaradas que sobem em cascata quando o
 * ancestral (Reveal) recebe `is-visible`. Componente de servidor — o
 * movimento é 100% CSS (.mw em globals.css).
 */
export function MaskedWords({ text, accents = {} }: MaskedWordsProps) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i} className="mw mr-[0.24em] last:mr-0">
          <span
            style={
              {
                "--i": i,
                ...(accents[word] ? { color: accents[word] } : {}),
              } as React.CSSProperties
            }
          >
            {word}
          </span>
        </span>
      ))}
    </>
  );
}
