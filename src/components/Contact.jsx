import { Mail, Phone } from "lucide-react";
import SectionReveal from "./SectionReveal";

function Contact() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <SectionReveal id="contact" className="content-section content-section--contact">
      <div className="section-shell contact-layout">
        <div className="section-heading">
          <span className="eyebrow">Contact</span>
          <h2>Discuss your Web GIS project, dataset integration, or suitability workflow.</h2>
          <p>
            Use the form to share your project scope or connect directly through the contact details
            below.
          </p>

          <div className="contact-details">
            <a href="mailto:sinciyabasheer@gmail.com">
              <Mail size={18} />
              sinciyabasheer@gmail.com
            </a>
            <a href="tel:9995443990">
              <Phone size={18} />
              9995443990
            </a>
          </div>
        </div>

        <form className="contact-card" onSubmit={handleSubmit}>
          <label className="field-group" htmlFor="name">
            <span>Name</span>
            <input id="name" name="name" type="text" placeholder="Enter your name" />
          </label>

          <label className="field-group" htmlFor="email">
            <span>Email</span>
            <input id="email" name="email" type="email" placeholder="Enter your email" />
          </label>

          <label className="field-group" htmlFor="message">
            <span>Message</span>
            <textarea id="message" name="message" rows="5" placeholder="Tell us about your GIS use case" />
          </label>

          <button className="primary-button" type="submit">
            Submit
          </button>
        </form>
      </div>
    </SectionReveal>
  );
}

export default Contact;
