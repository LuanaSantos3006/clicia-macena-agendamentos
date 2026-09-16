import Image from "next/image";
import Link from "next/link";

type Props = { variant?: "header" | "admin" | "login" | "booking"; href?: string };

export default function BrandLogo({ variant = "header", href = "/" }: Props) {
  const logo = <Image src="/logo-clicia-transparente.png" alt="Clicia Macena Manicure" width={900} height={450} priority={variant === "header" || variant === "login"} sizes={variant === "login" ? "(max-width: 600px) 82vw, 320px" : "220px"}/>;
  return <Link href={href} className={`brand-logo brand-logo-${variant}`} aria-label="Clicia Macena — página inicial">{logo}</Link>;
}
