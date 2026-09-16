import Link from "next/link";
import { CalendarDays, Clock3, Heart, Sparkles } from "lucide-react";

const services = [
  { name: "Manicure", description: "Cuidado completo para unhas impecáveis e delicadas.", price: "Valor definido na agenda" },
  { name: "Pedicure", description: "Cuidado, acabamento e bem-estar para os pés.", price: "Valor definido na agenda" },
  { name: "Atendimento especial", description: "Escolha o serviço e consulte os horários disponíveis.", price: "Consulte disponibilidade" },
];

export default function Home() {
  return <>
    <header className="header"><div className="shell header-inner"><Link className="brand" href="/">Clicia Macena<span>nail care • agendamentos</span></Link><nav className="nav"><a href="#servicos">Serviços</a><a href="#como-funciona">Como funciona</a><Link href="/admin/login">Área administrativa</Link></nav><Link className="btn btn-primary" href="/agendar"><CalendarDays size={17}/> Agendar horário</Link></div></header>
    <main>
      <section className="shell hero"><div><div className="eyebrow">Seu momento de cuidado</div><h1>Beleza nos detalhes, cuidado em cada momento.</h1><p className="lead">Escolha seu serviço, encontre o melhor horário e faça seu agendamento online de forma simples.</p><div className="flow"><span className="step">1. Serviço</span><span className="step">2. Data</span><span className="step">3. Horário</span><span className="step">4. Seus dados</span><span className="step">5. Confirmação</span></div><Link className="btn btn-primary" href="/agendar"><Sparkles size={17}/> Quero agendar</Link></div><div className="hero-card"><Heart size={34}/><strong>Um espaço feito para você.</strong><p className="section-copy">Organize seu horário sem mensagens de ida e volta e acompanhe as opções disponíveis.</p></div></section>
      <section id="servicos" className="section"><div className="shell"><div className="eyebrow">Serviços</div><h2 className="section-title">Escolha seu cuidado</h2><p className="section-copy">A Clicia poderá editar serviços, valores, duração e disponibilidade diretamente pela área administrativa.</p><div className="grid">{services.map((service)=><article className="card" key={service.name}><Sparkles size={22}/><h3>{service.name}</h3><p>{service.description}</p><div className="price">{service.price}</div></article>)}</div></div></section>
      <section id="como-funciona" className="section"><div className="shell"><div className="eyebrow">Agendamento online</div><h2 className="section-title">Simples do começo ao fim</h2><div className="grid"><div className="card"><Sparkles/><h3>Escolha</h3><p>Selecione o serviço que deseja realizar.</p></div><div className="card"><Clock3/><h3>Encontre um horário</h3><p>Veja somente os horários que estiverem livres na agenda.</p></div><div className="card"><CalendarDays/><h3>Confirme</h3><p>Informe seus dados e receba o resumo do agendamento.</p></div></div></div></section>
    </main>
    <footer className="footer"><div className="shell">© {new Date().getFullYear()} Clicia Macena • Agendamentos</div></footer>
  </>;
}