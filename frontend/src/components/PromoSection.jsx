export default function PromoSection() {
  return (
    <div className="promo-container">

      {/* TOP SECTION */}
      <div className="promo-top">

        {/* BIG LEFT BANNER - 3D Glassmorphism */}
        <div className="promo-main">
          <div className="promo-glow"></div>
          <h2>வாட்ஸ்அப்பில் அனுப்பினால் வாசற்படிக்கே புத்தகம்</h2>
          <p>தமிழ் இலக்கியத்தின் சிறந்த படைப்புகள்</p>
          <button className="primary-btn modern-btn">
            <a href="tel:+91 7904730223">
              <span>வாட்ஸ்அப்பில் எங்களை தொடர்புகொள்க</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </button>
        </div>

        {/* RIGHT SIDE OFFERS - Glassmorphism Cards */}
        <div className="promo-side">

          <div className="side-card glass-card">
            <div className="card-icon">🎯</div>
            <h3>சிறப்பு சலுகை</h3>
            <p>40% வரை தள்ளுபடி</p>
            <div className="card-shine"></div>
          </div>

          <div className="side-card blue glass-card">
            <div className="card-icon">📚</div>
            <h3>ஆக்ஸ்போர்ட் வெளியீடுகள்</h3>
            <p>30% வரை தள்ளுபடி</p>
            <div className="card-shine"></div>
          </div>

        </div>
      </div>

      {/* SECOND ROW - 3D Hover Cards */}
      <div className="promo-row">

        <div className="offer-card red glass-offer">
          <div className="offer-icon">🌍</div>
          <h3>உலகின் சிறந்த கதைகள்</h3>
          <p>காமிக் வடிவில்</p>
          <div className="offer-shine"></div>
        </div>

        <div className="offer-card green glass-offer">
          <div className="offer-icon">📖</div>
          <h3>டம்மீஸ் தொடர்</h3>
          <p>30% வரை தள்ளுபடி</p>
          <div className="offer-shine"></div>
        </div>

        <div className="offer-card purple glass-offer">
          <div className="offer-icon">👑</div>
          <h3>பீகாக் கிளாசிக்ஸ்</h3>
          <p>50% வரை தள்ளுபடி</p>
          <div className="offer-shine"></div>
        </div>

      </div>

      {/* INFO STRIP - Modern Glassmorphism */}
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
