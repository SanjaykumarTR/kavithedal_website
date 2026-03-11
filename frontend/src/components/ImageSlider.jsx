import { useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectCoverflow, Parallax } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import "swiper/css/parallax";
import { LanguageContext } from "../context/LanguageContext";
import image1 from "../assects/image1.jpg.jpeg";
import image2 from "../assects/image2.jpg.jpeg";
import image3 from "../assects/image3.jpg.jpeg";
import image4 from "../assects/image4.jpg.jpeg";
import image5 from "../assects/image5.jpg.jpeg";
import image6 from "../assects/image6.jpg.jpeg";
import "../styles/imageSlider.css";

export default function ImageSlider() {
  const { language } = useContext(LanguageContext);

  const slides = [
    { src: image1, alt: "Slide 1" },
    { src: image2, alt: "Slide 2" },
    { src: image3, alt: "Slide 3" },
    { src: image4, alt: "Slide 4" },
    { src: image5, alt: "Slide 5" },
    { src: image6, alt: "Slide 6" }
  ];

  const sliderContent = {
    en: {
      badge: "Kavithedal Publications",
      title: "Discover Amazing Stories",
      subtitle: "Explore our collection of finest Tamil literature"
    },
    ta: {
      badge: "கவித்தேடல் பதிப்பகம்",
      title: "அற்புதமான கதைகளை கண்டுபிடிக்கவும்",
      subtitle: "எங்கள் தமிழ் இலக்கியத்தின் சிறந்த தொகுப்பை ஆராயுங்கள்"
    }
  };

  const content = sliderContent[language];

  return (
    <div className="slider-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectCoverflow, Parallax]}
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 150,
          modifier: 1.5,
          slideShadows: true,
        }}
        parallax={true}
        spaceBetween={0}
        navigation={true}
        pagination={{ 
          clickable: true,
          dynamicBullets: true,
        }}
        autoplay={{ 
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={true}
        className="modern-slider"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="slider-slide">
            <div className="slide-content" data-parallax="0.3">
              <img src={slide.src} alt={slide.alt} />
              <div className="slide-overlay">
                <div className="slide-text">
                  <span className="slide-badge">{content.badge}</span>
                  <h2>{content.title}</h2>
                  <p>{content.subtitle}</p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
