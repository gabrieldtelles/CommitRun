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

export function IconeLinkedin({ className }: Props) {
  const mascara = "url(/linkedin-mascara.png)";

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        backgroundColor: "currentColor",
        maskImage: mascara,
        WebkitMaskImage: mascara,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
