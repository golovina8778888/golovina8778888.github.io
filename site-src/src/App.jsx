import { useRef, useState } from "react";
import {
  ArrowRight,
  EnvelopeSimple,
  List,
  X,
  Plus,
} from "@phosphor-icons/react";
import { sendInquiry } from "./contact";


const services = [
  {
    id: "distribution",
    image: "/site-assets/service-distribution.webp",
    title: "Content distribution",
    description: "Bringing films and video catalogs to YouTube.",
    detail: "We plan and manage each catalog from publishing strategy to ongoing support on the platform, taking the materials, available rights, and rights holder's goals into account.",
  },
  {
    id: "channels",
    image: "/site-assets/service-channels.webp",
    title: "Channel development",
    description: "Publishing, audiences, and channel management.",
    detail: "We manage channel structure, presentation, and publishing schedules. We analyze viewing patterns and audience behavior to guide the next steps.",
  },
  {
    id: "monetization",
    image: "/site-assets/service-monetization.webp",
    title: "Monetization and analytics",
    description: "Revenue and content performance.",
    detail: "We manage content monetization and track channel and catalog performance. These insights shape publishing plans and future growth.",
  },
];

function Brand() {
  return (
    <a className="brand" href={"/"} aria-label={"PLIPLY — home"}>
      PLIPLY<span>.PRO</span>
    </a>
  );
}

function Header({ partners }) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="site-header shell">
      <Brand />
      <button
        className="menu-toggle icon-button"
        type="button"
        aria-label={menu ? "Close menu" : "Open menu"}
        aria-expanded={menu}
        aria-controls="main-navigation"
        onClick={() => setMenu(!menu)}
      >
        {menu ? <X size={25} /> : <List size={25} />}
      </button>
      <nav
        id="main-navigation"
        aria-label="Main navigation"
        className={menu ? "navigation is-open" : "navigation"}
      >
        <a
          href={partners ? "/#company" : "#company"}
          onClick={() => setMenu(false)}
        >
          {"Company"}
        </a>
        <a
          href={partners ? "/#directions" : "#directions"}
          onClick={() => setMenu(false)}
        >
          {"What we do"}
        </a>
        <a
          href={"/partners/"}
          aria-current={partners ? "page" : undefined}
          onClick={() => setMenu(false)}
        >
          {"For rights holders"}
        </a>
      </nav>
    </header>
  );
}

function Action({ children, onClick, secondary = false, ...props }) {
  return (
    <button
      type="button"
      className={secondary ? "action action-secondary" : "action"}
      onClick={onClick}
      {...props}
    >
      <span>{children}</span>
      <ArrowRight aria-hidden="true" weight="light" />
    </button>
  );
}

function ContactDialog({ dialogRef, openerRef, topic }) {
  const [draft, setDraft] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("idle");
  const [formError, setFormError] = useState(null);
  const requestRef = useRef(null);
  function update(event) {
    const { name, value } = event.target;
    setDraft((previous) => ({ ...previous, [name]: value }));
    if (status === "error") setStatus("idle");
    if (formError?.field === name) setFormError(null);
  }
  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const error = !draft.name.trim()
      ? { field: "name", message: "Please enter your name." }
      : !draft.email.trim() || !form.elements.email.validity.valid
        ? { field: "email", message: "Please enter a valid email address." }
        : !draft.message.trim()
          ? { field: "message", message: "Tell us briefly about your catalog and goals." }
          : null;
    setFormError(error);
    if (error) {
      form.elements[error.field].focus();
      return;
    }
    setStatus("sending");
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      await sendInquiry({ ...draft, honey: form.elements._gotcha.value }, topic, controller.signal);
      setStatus("sent");
    } catch {
      if (dialogRef.current?.open) setStatus("error");
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) requestRef.current = null;
    }
  }
  return (
    <dialog
      ref={dialogRef}
      className="contact-dialog"
      aria-labelledby="contact-title"
      aria-describedby="contact-note"
      onClose={() => {
        requestRef.current?.abort();
        if (status === "sent") setDraft({ name: "", company: "", email: "", message: "" });
        setStatus("idle");
        setFormError(null);
        if (openerRef.current?.isConnected) openerRef.current.focus();
      }}
    >
      <button
        type="button"
        className="dialog-close icon-button"
        aria-label={"Close dialog"}
        onClick={() => dialogRef.current.close()}
      >
        <X size={26} />
      </button>
      <p className="eyebrow">{"PARTNERSHIP"}</p>
      <h2 id="contact-title">{"Let's discuss your catalog"}</h2>
      <p id="contact-note" className="dialog-note">
        {"Send your inquiry directly to the PLIPLY team."}
      </p>
      {status !== "sent" ? (
        <form
          noValidate
          onSubmit={submit}
        >
          <div className="honey-field" aria-hidden="true">
            <label>Leave this field empty<input name="_gotcha" type="text" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <div className="form-grid">
            <label>
              {"Your name"}
              <input
                name="name"
                autoComplete="name"
                value={draft.name}
                onChange={update}
                maxLength={80}
                aria-invalid={formError?.field === "name" || undefined}
                aria-describedby={formError?.field === "name" ? "form-error" : undefined}
                required
              />
            </label>
            <label>
              {"Company"} <span className="optional">{"(optional)"}</span>
              <input
                name="company"
                autoComplete="organization"
                value={draft.company}
                onChange={update}
                maxLength={160}
              />
            </label>
          </div>
          <label>
            {"Email address"}
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={draft.email}
              onChange={update}
              maxLength={254}
              aria-invalid={formError?.field === "email" || undefined}
              aria-describedby={formError?.field === "email" ? "form-error" : undefined}
              required
            />
          </label>
          <label>
            {"About your catalog"}
            <textarea
              name="message"
              value={draft.message}
              onChange={update}
              rows={4}
              maxLength={6000}
              aria-invalid={formError?.field === "message" || undefined}
              aria-describedby={formError?.field === "message" ? "form-error" : undefined}
              required
              placeholder={"Tell us about your content and business goals"}
            />
          </label>
          {formError && <p className="form-error" id="form-error" role="alert">{formError.message}</p>}
          {status === "error" && (
            <p className="form-error" role="alert">
              {"We couldn't confirm your submission. Your details are still here. Before retrying, check with us at "}
              <a href="mailto:adm@pliply.pro">adm@pliply.pro</a>.
            </p>
          )}
          <button className="action form-submit" type="submit" disabled={status === "sending"}>
            <span>{status === "sending" ? "Sending…" : "Send inquiry"}</span>
            <ArrowRight aria-hidden="true" />
          </button>
          <p className="form-footnote">
            {"A brief overview is enough. Your inquiry is processed by Formspree and emailed to PLIPLY."}
          </p>
        </form>
      ) : (
        <div className="sent-message" role="status">
          <p>{"Thank you. Your inquiry has been submitted."}</p>
          <button type="button" className="action" onClick={() => dialogRef.current.close()}>
            <span>{"Close"}</span>
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      )}
    </dialog>
  );
}

function ContactSection({ openContact, partners = false }) {
  return (
    <footer className="contact-section" id="contact">
      <img
        className="contact-art"
        src="/site-assets/hero-studio.webp"
        alt=""
        loading="lazy"
        aria-hidden="true"
      />
      <div className="shell contact-inner">
        <h2>{"Let's discuss your catalog"}</h2>
        <div className="contact-actions">
          <Action onClick={openContact}>{"Contact our team"}</Action>
          <a className="email-link" href="mailto:adm@pliply.pro">
            <EnvelopeSimple aria-hidden="true" weight="light" />
            <span>adm@pliply.pro</span>
          </a>
        </div>
        <div className="footer-base">
          <span>PLIPLY LTD</span>
          <a href={partners ? "/" : "/partners/"}>
            {partners ? "Home" : "For rights holders"}
          </a>
          <span>{"Projects and commercial terms remain confidential"}</span>
        </div>
      </div>
    </footer>
  );
}

function Homepage({ openContact }) {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <img
          className="hero-art"
          src="/site-assets/hero-studio.webp"
          alt=""
          fetchPriority="high"
          aria-hidden="true"
        />
        <div className="hero-content shell">
          <h1 id="hero-title">
            <span>{"A media partner"}</span>
            <span>{"for"}</span>
            <span>{"rights holders"}</span>
          </h1>
          <p className="hero-description">
            {"We work with film companies and video catalog owners to distribute content, develop YouTube channels, and manage monetization."}
          </p>
          <Action onClick={openContact}>{"Discuss your catalog"}</Action>
          <p className="hero-meta">{"Films · Video catalogs · YouTube"}</p>
        </div>
      </section>
      <section
        className="experience"
        id="company"
        aria-labelledby="experience-title"
      >
        <div className="shell experience-grid">
          <h2 id="experience-title">
            {"Experience that"}
            <br />
            {"works for your"}
            <br />
            {"content"}
          </h2>
          <p>
            {"PLIPLY brings years of experience with YouTube, films, and a substantial portfolio of channels."}
          </p>
        </div>
      </section>
      <section
        className="directions"
        id="directions"
        aria-labelledby="directions-title"
      >
        <div className="shell">
          <h2 className="section-heading" id="directions-title">
            {"What we do"}
          </h2>
          <div className="service-list">
            {services.map((service) => (
              <details className="service" key={service.id}>
                <summary>
                  <img src={service.image} alt="" loading="lazy" />
                  <div className="service-copy">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                  <ArrowRight
                    className="service-arrow"
                    aria-hidden="true"
                    weight="light"
                  />
                </summary>
                <div className="service-detail">
                  <p>{service.detail}</p>
                  <button
                    className="text-button"
                    type="button"
                    onClick={(event) => openContact(event, service.title)}
                  >
                    {"Discuss this service"} <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
      <ContactSection openContact={openContact} />
    </>
  );
}

function Partners({ openContact }) {
  return (
    <>
      <section className="partner-hero hero" aria-labelledby="partner-title">
        <img
          className="hero-art"
          src="/site-assets/hero-studio.webp"
          alt=""
          fetchPriority="high"
          aria-hidden="true"
        />
        <div className="shell partner-hero-content">
          <p className="eyebrow">{"FOR RIGHTS HOLDERS"}</p>
          <h1 id="partner-title">
            {"Putting your"}
            <br />
            {"catalog to work"}
          </h1>
          <p className="partner-intro">
            {"Film distribution, channel development, and video monetization. Let's discuss your goals and the right way to work together."}
          </p>
          <Action onClick={openContact}>{"Discuss a partnership"}</Action>
        </div>
      </section>
      <section
        className="partner-process content-section"
        aria-labelledby="process-title"
      >
        <div className="shell">
          <h2 className="section-heading" id="process-title">
            {"How we work together"}
          </h2>
          <ol className="process-list">
            <li>
              <span className="step-number" aria-hidden="true">
                01
              </span>
              <h3>{"Get to know your catalog"}</h3>
              <p>
                {"You tell us about your content, available materials, and business goals."}
              </p>
            </li>
            <li>
              <span className="step-number" aria-hidden="true">
                02
              </span>
              <h3>{"Agree on the approach"}</h3>
              <p>
                {"We discuss available rights, territories, and commercial terms."}
              </p>
            </li>
            <li>
              <span className="step-number" aria-hidden="true">
                03
              </span>
              <h3>{"Put the plan into action"}</h3>
              <p>
                {"Together we establish the approach to publishing, monetization, and ongoing content management."}
              </p>
            </li>
          </ol>
        </div>
      </section>
      <section
        className="partner-preparation content-section"
        aria-labelledby="preparation-title"
      >
        <div className="shell preparation-grid">
          <div>
            <h2 id="preparation-title">
              {"Let's start with"}<br />
              {"your catalog"}
            </h2>
            <p>
              {"A general overview of your content and goals is enough for an initial conversation."}
            </p>
          </div>
          <ul className="preparation-list">
            <li>{"Brief catalog overview"}</li>
            <li>{"Format and volume of materials"}</li>
            <li>{"Available rights and territories"}</li>
            <li>{"Your goals and a team contact"}</li>
          </ul>
        </div>
      </section>
      <section
        className="partner-questions content-section"
        aria-labelledby="questions-title"
      >
        <div className="shell questions-grid">
          <h2 id="questions-title">
            {"Before our first"}
            <br />
            {"conversation"}
          </h2>
          <div className="faq-list">
            <details>
              <summary>
                <span>{"Do we need to send the whole catalog now?"}</span>
                <Plus aria-hidden="true" />
              </summary>
              <p>
                {"A brief description is enough to start. We'll agree on any materials needed later."}
              </p>
            </details>
            <details>
              <summary>
                <span>{"How are partnership terms set?"}</span>
                <Plus aria-hidden="true" />
              </summary>
              <p>
                {"We discuss terms based on the catalog, available rights, territories, and your goals."}
              </p>
            </details>
            <details>
              <summary>
                <span>{"How do you handle confidential information?"}</span>
                <Plus aria-hidden="true" />
              </summary>
              <p>
                {"We keep projects and commercial terms confidential and agree with each partner on how materials are shared."}
              </p>
            </details>
          </div>
        </div>
      </section>
      <ContactSection openContact={openContact} partners />
    </>
  );
}

export function App() {
  const partners = window.location.pathname.startsWith("/partners");
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const [topic, setTopic] = useState("Partnership inquiry — PLIPLY");
  function openContact(event, serviceTopic) {
    openerRef.current = event.currentTarget;
    setTopic(
      serviceTopic ? `PLIPLY — ${serviceTopic}` : "Partnership inquiry — PLIPLY",
    );
    dialogRef.current.showModal();
    dialogRef.current.querySelector('input[name="name"]')?.focus();
  }
  return (
    <>
      <a className="skip-link" href="#main">{"Skip to content"}</a>
      <Header partners={partners} />
      <main id="main">
        {partners ? (
          <Partners openContact={openContact} />
        ) : (
          <Homepage openContact={openContact} />
        )}
      </main>
      <ContactDialog
        dialogRef={dialogRef}
        openerRef={openerRef}
        topic={topic}
      />
    </>
  );
}
