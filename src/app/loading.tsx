import BrandLogo from "@/components/BrandLogo";

export default function Loading() {
  return <main className="loading-screen"><div className="loading-content"><BrandLogo variant="login"/><div className="gold-spinner" aria-hidden="true"/><p>Preparando sua agenda...</p><span className="sr-only">Carregando</span></div></main>;
}
