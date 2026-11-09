import { siGithub, siInstagram } from "simple-icons";

type Props = { className?: string };

function Marca({ path, className }: { path: string } & Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d={path} />
    </svg>
  );
}

export function IconeGithub(props: Props) {
  return <Marca path={siGithub.path} {...props} />;
}

export function IconeInstagram(props: Props) {
  return <Marca path={siInstagram.path} {...props} />;
}

// Para usar a marca oficial: baixe o SVG em brand.linkedin.com/downloads,
// salve em public/linkedin.svg e troque este componente por
// <Image src="/linkedin.svg" alt="" width={20} height={20} className={className} />
export function IconeLinkedin({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.9" />
      <path d="M5.4 16.2c.5-1.5 1.7-2.3 3.1-2.3s2.6.8 3.1 2.3" />
      <path d="M14.5 9.5h4.2M14.5 12.5h4.2M14.5 15.5h2.6" />
    </svg>
  );
}
