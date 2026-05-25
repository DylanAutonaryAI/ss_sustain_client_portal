interface SsLogoProps {
  size?: number;
}

export default function SsLogo({ size = 32 }: SsLogoProps) {
  return (
    <img
      src="/applogo.png"
      alt="SS Sustain"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
