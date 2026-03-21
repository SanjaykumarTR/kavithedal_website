export default function PromoSection() {
  return (
    <div className="promo-container">

      {/* WHATSAPP CARD - Centered, Premium */}
      <div className="whatsapp-card-wrapper">
        <div className="whatsapp-card">
          <div className="whatsapp-glow"></div>

          {/* WhatsApp Icon */}
          <div className="whatsapp-icon-circle">
            <svg viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg" className="wa-svg">
              <path d="M16 0C7.164 0 0 7.163 0 16c0 2.824.736 5.474 2.025 7.775L0 32l8.476-2.003A15.933 15.933 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.763-1.84l-.484-.287-5.027 1.187 1.21-4.897-.317-.502A13.278 13.278 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.267-9.94c-.398-.199-2.352-1.16-2.717-1.293-.364-.132-.63-.199-.895.2-.265.398-1.027 1.293-1.259 1.56-.232.265-.464.298-.862.1-.398-.2-1.68-.62-3.2-1.974-1.183-1.054-1.981-2.355-2.213-2.753-.232-.398-.025-.613.174-.811.18-.178.398-.465.597-.697.2-.232.265-.398.398-.663.132-.265.066-.497-.033-.697-.1-.199-.895-2.156-1.226-2.952-.323-.774-.651-.668-.895-.68-.232-.012-.497-.015-.762-.015-.265 0-.696.1-.1.06 1.492-.01 2.884.75 3.646 2.01.762 1.26 2.655 4.16 6.44 5.832.883.38 1.572.607 2.108.776.885.281 1.692.241 2.329.146.71-.105 2.186-.893 2.494-1.756.308-.863.308-1.603.216-1.756-.09-.152-.331-.24-.695-.432z"/>
            </svg>
          </div>

          {/* Content */}
          <h2 className="whatsapp-card-title">
            வாட்ஸ்அப்பில் அனுப்பினால்<br />வாசற்படிக்கே புத்தகம்
          </h2>
          <p className="whatsapp-card-subtitle">
            உங்கள் வீட்டு வாசலிலேயே புத்தகங்கள் — இப்போதே ஆர்டர் செய்யுங்கள்!
          </p>

          {/* CTA Button */}
          <a
            href="https://wa.me/917904730223"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-cta-btn"
          >
            <svg viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg" className="btn-wa-icon">
              <path d="M16 0C7.164 0 0 7.163 0 16c0 2.824.736 5.474 2.025 7.775L0 32l8.476-2.003A15.933 15.933 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.763-1.84l-.484-.287-5.027 1.187 1.21-4.897-.317-.502A13.278 13.278 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.267-9.94c-.398-.199-2.352-1.16-2.717-1.293-.364-.132-.63-.199-.895.2-.265.398-1.027 1.293-1.259 1.56-.232.265-.464.298-.862.1-.398-.2-1.68-.62-3.2-1.974-1.183-1.054-1.981-2.355-2.213-2.753-.232-.398-.025-.613.174-.811.18-.178.398-.465.597-.697.2-.232.265-.398.398-.663.132-.265.066-.497-.033-.697-.1-.199-.895-2.156-1.226-2.952-.323-.774-.651-.668-.895-.68-.232-.012-.497-.015-.762-.015-.265 0-.696.1-.1.06 1.492-.01 2.884.75 3.646 2.01.762 1.26 2.655 4.16 6.44 5.832.883.38 1.572.607 2.108.776.885.281 1.692.241 2.329.146.71-.105 2.186-.893 2.494-1.756.308-.863.308-1.603.216-1.756-.09-.152-.331-.24-.695-.432z"/>
            </svg>
            WhatsApp Now
          </a>

          <div className="whatsapp-card-shine"></div>
        </div>
      </div>

      {/* INFO STRIP */}
      <div className="info-strip glass-strip">
        <div className="info-item">
          <span className="info-icon">📚</span>
          <span className="info-text">30க்கும் மேற்பட்ட விருதுகள்</span>
        </div>
        <div className="info-divider"></div>
        <div className="info-item">
          <span className="info-icon">📖</span>
          <span className="info-text">600க்கும் மேல் நூல்கள்</span>
        </div>
        <div className="info-divider"></div>
        <div className="info-item">
          <span className="info-icon">🏢</span>
          <span className="info-text">முழுமையான பதிப்பு சேவைகள்</span>
        </div>
        <div className="info-divider"></div>
        <div className="info-item">
          <span className="info-icon">✅</span>
          <span className="info-text">200க்கும் மேற்பட்ட எழுத்தாளர்கள்</span>
        </div>
      </div>

    </div>
  );
}
