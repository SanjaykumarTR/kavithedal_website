import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

export default function About() {
  const { language } = useContext(LanguageContext);

  return (
    <div className="about-page">
      <h2 className="section-title">
        {language === "en" ? "About Kavithedal Publications" : "கவித்தேடல் பதிப்பகம் பற்றி"}
      </h2>

      <div className="about-content">
        <div className="about-text">
          <p>
            {language === "en"
              ? "Since our inception, Kavithedal Publication has revolutionized regional publishing with a focus on commercial excellence and literary merit. From publishing our first book on February 20, 2023, we've rapidly grown to publish 350+ books, establishing ourselves as a pioneering force in the publishing industry."
              : "எங்கள் தொடக்க நாளிலிருந்தே, கவித்தேடல் பதிப்பகம் வணிக சிறப்பும் இலக்கிய மேன்மையும் ஒன்றிணைந்த புதிய பாதையை பிராந்திய பதிப்புலகில் உருவாக்கியுள்ளது. 20 பிப்ரவரி 2023 அன்று எங்கள் முதல் நூலை வெளியிட்டதிலிருந்து, இன்று வரை 350க்கும் மேற்பட்ட நூல்களை வெளியிட்டு பதிப்புத்துறையில் முன்னோடியான சக்தியாக வளர்ந்துள்ளோம்."}
          </p>
          <p>
            {language === "en"
              ? "We specialize in innovative Print on Demand (POD) technology, creating premium publications with precision craftsmanship—DEMI 1/8 bookline format (22cm × 14.6cm), 70 GSM quality paper, and Unicode font excellence. Our commitment to quality extends from manuscript submission to final distribution across multiple channels including our digital showroom, Amazon, and Flipkart"
              : "நாங்கள் நவீன Print on Demand (POD) தொழில்நுட்பத்தில் சிறப்பு பெற்றுள்ளோம். துல்லியமான அச்சுத் தொழில்நுட்பத்துடன் உயர்தர வெளியீடுகளை உருவாக்குகிறோம் — DEMI 1/8 புத்தக வடிவம் (22 செ.மீ × 14.6 செ.மீ), 70 GSM தரமான தாள், மற்றும் Unicode எழுத்துரு தரநிலைகள் ஆகியவற்றுடன் சிறப்பான தயாரிப்புகளை வழங்குகிறோம்."}
          </p>
          <p >
            {
              language == "en"
              ? "Headquartered in Dharmapuri, we've achieved remarkable milestones, including publishing a world-record 6,000-page book and nurturing over 120+ authors. Our unique poet enrollment program and author-centric approach have made quality literature accessible while empowering regional voices."
              :"கையெழுத்து சமர்ப்பிப்பிலிருந்து இறுதி விநியோகம் வரை தரத்தை உறுதிப்படுத்துவது எங்கள் முக்கிய நோக்கம். எங்கள் டிஜிட்டல் ஷோரூம், Amazon மற்றும் Flipkart போன்ற பல்வேறு விநியோக தளங்களின் மூலம் நூல்கள் வாசகர்களை அடைகின்றன."
            }
          </p>
          <p>
            {
              language=="en"
              ?"Today, we continue pioneering the future of publishing by blending traditional literary values with cutting-edge digital strategies, making Tamil and regional literature accessible to readers worldwide while maintaining unwavering editorial excellence and ethical standards.translate in tamil"
              :"இன்று, பாரம்பரிய இலக்கிய மதிப்புகளையும் நவீன டிஜிட்டல் மூலோபாயங்களையும் இணைத்து, தமிழ் மற்றும் பிராந்திய இலக்கியத்தை உலகளாவிய வாசகர்களிடம் கொண்டு சேர்ப்பதில் தொடர்ந்து முன்னோடியாக செயற்பட்டு வருகிறோம். அதே நேரத்தில் எங்கள் ஆசிரியர் தரநிலைகளிலும் நெறிமுறைகளிலும் எப்போதும் உறுதியுடன் நிற்கிறோம்."
            }
          </p>
        </div>

        <div className="about-stats">
          <div className="stat-card">
            <h3>30+</h3>
            <p>{language === "en" ? "Awards Won" : "வெற்றிப்பெற்ற விருதுகள்"}</p>
          </div>
          <div className="stat-card">
            <h3>600+</h3>
            <p>{language === "en" ? "Books Published" : "வெளியிடப்பட்ட நூல்கள்"}</p>
          </div>
          <div className="stat-card">
            <h3>150+</h3>
            <p>{language === "en" ? "Authors" : "எழுத்தாளர்கள்"}</p>
          </div>
          <div className="stat-card">
            <h3>50K+</h3>
            <p>{language === "en" ? "Happy Readers" : "மகிழ்ச்சியான வாசகர்கள்"}</p>
          </div>
        </div>
      </div>

      <div className="about-mission">
        <h3>{language === "en" ? "Our Mission" : "எங்கள் நோக்கம்"}</h3>
        <p>
          {language === "en"
            ? "To make Tamil literature accessible to everyone around the world, fostering a love for reading and preserving the rich literary heritage of Tamil Nadu."
            : "உலகெங்கிலும் உள்ள அனைவருக்கும் தமிழ் இலக்கியத்தை அணுகக்கூடியதாக மாற்றுவது, வாசிப்பின் மீதான அன்பை வளர்ப்பது மற்றும் தமிழ்நாட்டின் வளமான இலக்கிய மரபுரிமையைப் பாதுகாப்பது."}
        </p>
      </div>

      <div className="about-founders">
        <h3>{language === "en" ? "Our Founder" : "எங்கள் நிறுவனர்"}</h3>
        <div className="founders-grid">
          <div className="founder-card">
            <img src="/founder.jpeg" alt="Founder" />
            <h4>{language === "en" ? "Mr. Gokul Kalliyappan" : "திரு. கோகுல் கல்லியப்பன்"}</h4>
            <p className="founder-role">
              {language === "en" ? "Founder, Poet, Writer & Publisher" : "நிறுவனர், கவிஞர், எழுத்தாளர் & பதிப்பாளர்"}
            </p>
            <p>
              {language === "en"
                ? "Mr. Gokul Kalliyappan is the owner of Kavithedal Publications, a Tamil writer and publisher. Within a short period (3 years), he has achieved a remarkable milestone by publishing over 400 books. He has authored works such as 'Valipogalin Valimoligal', 'Veyrgalukku Velicham Thevaiyillai', 'Vituppa Kavithaikal', and 'Iyanam Inga' (Free Link). He has participated in events like the Dharmapuri Book Exhibition and continues to encourage new writers."
                : "கவித்தேடல் பதிப்பகத்தின் உரிமையாளரான கோகுல் கல்லியப்பன் ஒரு தமிழ் எழுத்தாளர் மற்றும் பதிப்பாளர் ஆவார். இவர் குறுகிய காலத்தில் (3 ஆண்டுகளில்) 400-க்கும் மேற்பட்ட புத்தகங்களை வெளியிட்டு சாதனை படைத்துள்ளார். 'வழிப்போக்கனின் வழிமொழிகள்', 'வேர்களுக்கு வெளிச்சம் தேவையில்லை', 'விடுபட்ட கவிதைகள்', 'இதயம் இங்கே' (இலவச இணைப்பு) ஆகிய நூல்களை எழுதியுள்ளார். தர்மபுரி புத்தகக் கண்காட்சி போன்ற நிகழ்வுகளில் பங்கேற்று, புதிய எழுத்தாளர்களை ஊக்குவிக்கும் பணியில் ஈடுபட்டு வருகிறார்."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
