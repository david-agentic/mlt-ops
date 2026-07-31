import Image from "next/image";

/**
 * Purely presentational -- renders an already-resolved illustration URL.
 * Existence-checking happens server-side via lib/illustrations.ts so this
 * component stays safe to use from both Server and Client Components.
 */
export function Illustration({
  src,
  alt,
  width = 200,
  height = 200,
  className,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <Image src={src} alt={alt} width={width} height={height} className={className} />
  );
}
