import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface KineticTextProps {
  text: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  delayPerChar?: number;
  animationType?: 'fadeUp' | 'wave' | 'bounce' | 'rotate' | 'scale';
  staggerStart?: number;
  highlightWords?: string[];
  highlightColor?: string;
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  fontSize = 64,
  fontWeight = 700,
  color = '#fff',
  delayPerChar = 2,
  animationType = 'fadeUp',
  staggerStart = 0,
  highlightWords = [],
  highlightColor = '#6C5CE7',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(' ');
  let charIndex = 0;

  const getCharacterStyle = (localCharIndex: number, word: string) => {
    const delay = staggerStart + localCharIndex * delayPerChar;
    const isHighlighted = highlightWords.includes(word);

    const progress = spring({
      frame: frame - delay,
      fps,
      config: { damping: 12, stiffness: 100 },
    });

    const baseColor = isHighlighted ? highlightColor : color;

    switch (animationType) {
      case 'fadeUp':
        return {
          display: 'inline-block',
          transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
          opacity: progress,
          color: baseColor,
        };

      case 'wave':
        const waveOffset = Math.sin((frame + localCharIndex * 0.5) * 0.2) * 8;
        return {
          display: 'inline-block',
          transform: `translateY(${waveOffset + interpolate(progress, [0, 1], [20, 0])}px)`,
          opacity: progress,
          color: baseColor,
        };

      case 'bounce':
        const bounce = spring({
          frame: frame - delay,
          fps,
          config: { damping: 8, stiffness: 200 },
        });
        return {
          display: 'inline-block',
          transform: `scale(${interpolate(bounce, [0, 0.5, 1], [0, 1.2, 1])})`,
          opacity: progress,
          color: baseColor,
        };

      case 'rotate':
        return {
          display: 'inline-block',
          transform: `rotateY(${interpolate(progress, [0, 1], [90, 0])}deg)`,
          opacity: progress,
          color: baseColor,
        };

      case 'scale':
        return {
          display: 'inline-block',
          transform: `scale(${interpolate(progress, [0, 1], [0, 1])})`,
          opacity: progress,
          color: baseColor,
        };

      default:
        return {
          display: 'inline-block',
          opacity: progress,
          color: baseColor,
        };
    }
  };

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        textAlign: 'center',
      }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          {word.split('').map((char, i) => {
            const currentCharIndex = charIndex++;
            return (
              <span key={i} style={getCharacterStyle(currentCharIndex, word)}>
                {char}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </div>
  );
};
