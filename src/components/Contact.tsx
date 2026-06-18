"use client";

import { useState, FormEvent } from "react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data)),
    }).catch(() => {});

    setSending(false);
    setSubmitted(true);
  };

  return (
    <section id="contact">
      <div className="si">
        <div className="sh rev">
          <span className="label">Contact</span>
          <h2>Let&apos;s Build<br />Something <span className="gradient-text">Together</span></h2>
          <p>Tell us about your project — we&apos;ll get back to you within 24 hours.</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info rev">
            <div className="contact-items">
              <div className="citem">
                <div className="citem-icon">P</div>
                <div>
                  <h4>Phone</h4>
                  <p><a href="tel:9801048019">+977 9801048019</a></p>
                </div>
              </div>
              <div className="citem">
                <div className="citem-icon">@</div>
                <div>
                  <h4>Email</h4>
                  <p><a href="mailto:brandgnepal@gmail.com">brandgnepal@gmail.com</a></p>
                </div>
              </div>
              <div className="citem">
                <div className="citem-icon">→</div>
                <div>
                  <h4>Location</h4>
                  <p>Koteshwor, Kathmandu, Nepal</p>
                </div>
              </div>
              <div className="citem">
                <div className="citem-icon">⌚</div>
                <div>
                  <h4>Hours</h4>
                  <p>Sunday – Friday: 9 AM – 6 PM</p>
                </div>
              </div>
            </div>
            <div className="contact-cta-box">
              <h4>Free Consultation</h4>
              <p>Not sure where to start? Book a no-obligation call and we&apos;ll walk you through the options.</p>
              <a href="tel:9801048019" className="btn btn-white" style={{ fontSize: "0.82rem", padding: "11px 24px" }}>Call Now →</a>
            </div>
          </div>
          <div className="contact-form rev d2">
            {!submitted ? (
              <>
                <h3>Start a Conversation</h3>
                <form id="cf" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group"><label>First Name</label><input name="first_name" type="text" placeholder="First name" required /></div>
                    <div className="form-group"><label>Last Name</label><input name="last_name" type="text" placeholder="Last name" required /></div>
                  </div>
                  <div className="form-group"><label>Email</label><input name="email" type="email" placeholder="you@example.com" required /></div>
                  <div className="form-group"><label>Phone</label><input name="phone" type="tel" placeholder="+977 98XXXXXXXX" /></div>
                  <div className="form-group">
                    <label>Service</label>
                    <select name="service">
                      <option value="">Select a service...</option>
                      <option>Brand Identity Creation</option>
                      <option>Strategic Marketing</option>
                      <option>Social Media Mastery</option>
                      <option>Content Creation &amp; Curation</option>
                      <option>Social Media Advertising</option>
                      <option>Print Media Solutions</option>
                      <option>Full Package</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Message</label><textarea name="message" placeholder="Tell us about your project..." /></div>
                  <button type="submit" className="btn btn-primary form-submit">
                    {sending ? "Sending..." : "Send Message →"}
                  </button>
                </form>
              </>
            ) : (
              <div className="form-success show">
                ✅ Message received. We&apos;ll get back to you within 24 hours.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
