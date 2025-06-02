import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReactTyped } from "react-typed";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'animate.css';
import Footer from './Footer';

// Import your images here (replace with your actual imports)
import PIC from './images/PYDAH LOGO.png';
import Durga_Prasad from './images/PIC_DP.jpg';
import Ravi from './images/ravi_IMAGE.jpg';
import PullToRefresh from "./PullToRefresh";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const employeeId = searchParams.get('employeeId');
    const password = searchParams.get('password');

    if (employeeId && password) {
      console.log("URL parameters found, redirecting to login");
      navigate(`/login?employeeId=${employeeId}&password=${password}`);
    }

    // Handle scroll effect for header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigate]);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 4000,
    adaptiveHeight: true,
    dotsClass: "slick-dots custom-dots",
    responsive: [
      {
        breakpoint: 768,
        settings: {
          dots: true,
          arrows: false,
          adaptiveHeight: true
        }
      }
    ]
  };

  const handleRefresh = () => {
    console.log("Refreshing data...");
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PullToRefresh onRefresh={handleRefresh} />
      {/* Header with always-visible nav */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-primary/20' 
          : 'bg-white'
      }`}>
        <div className="container mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 animate__animated animate__fadeInLeft">
            <div className="relative">
              <img 
                src={PIC}
                alt="Pydah Logo" 
                className="w-12 h-12 md:w-16 md:h-16 rounded-xl  object-contain bg-white p-1"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-bold text-primary leading-tight">
                Pydah College
              </h1>
              <p className="text-xs md:text-sm text-accent font-medium">Engineering Excellence</p>
            </div>
          </div>
          {/* Navigation - always visible, responsive */}
          <nav className="w-full md:w-auto mt-4 md:mt-0 flex flex-col md:flex-row items-center md:space-x-6 space-y-2 md:space-y-0">
            <a href="#about" className="text-primary hover:text-accent transition-colors font-medium w-full text-center md:w-auto">About</a>
            <a href="#features" className="text-primary hover:text-accent transition-colors font-medium w-full text-center md:w-auto">Features</a>
            <a href="#team" className="text-primary hover:text-accent transition-colors font-medium w-full text-center md:w-auto">Team</a>
            <a href="#contact" className="text-primary hover:text-accent transition-colors font-medium w-full text-center md:w-auto">Contact</a>
          </nav>
        </div>
        {/* College Info Bar - Mobile */}
        <div className="sm:hidden mt-3 text-center">
          <p className="text-sm text-primary font-semibold">Autonomous Institution | Kakinada, AP</p>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 px-2 sm:px-4 bg-white">
        <div className="container mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          {/* Hero Content */}
          <div className="text-center lg:text-left animate__animated animate__fadeInUp">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/20 text-accent font-medium text-sm mb-6">
              <span className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></span>
              Now Live - Leave Management System
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-b from-primary to-primary/80 bg-clip-text text-transparent">
                <ReactTyped
                  strings={[
                    "Smart Leave Management",
                    "Seamless Staff Portal",
                    "Digital Leave Tracking"
                  ]}
                  typeSpeed={60}
                  backSpeed={40}
                  loop
                />
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto lg:mx-0">
              Transform your leave management experience with our intuitive, 
              modern platform designed for Pydah College faculty and staff.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => navigate("/home")}
                className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white font-semibold rounded-2xl 
                         shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Get Started
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-primary text-primary font-semibold rounded-2xl
                               hover:bg-primary hover:text-white transition-all duration-300">
                Learn More
              </button>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">500+</div>
                <div className="text-xs sm:text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">99%</div>
                <div className="text-xs sm:text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">24/7</div>
                <div className="text-xs sm:text-sm text-gray-600">Support</div>
              </div>
            </div>
          </div>
          {/* Hero Visual */}
          <div className="relative animate__animated animate__fadeInRight mt-10 lg:mt-0">
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <Slider {...sliderSettings}>
                <div className="relative h-64 sm:h-80 md:h-96">
                  <img
                    src="https://static.wixstatic.com/media/bfee2e_a361f3557fc440c98d1d2edf8c1f0d1f~mv2.jpg/v1/fill/w_1891,h_783,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/bfee2e_a361f3557fc440c98d1d2edf8c1f0d1f~mv2.jpg"
                    alt="College Campus"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="relative h-64 sm:h-80 md:h-96">
                  <img
                    src="https://www.vidyavision.com/CollegeUploads/Photos/2019-30-3-15-05-13_Screenshot%20(160).png"
                    alt="College Campus"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </Slider>
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-accent/20 rounded-full animate-bounce"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 sm:w-16 sm:h-16 bg-primary/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4">About Pydah College</h2>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6"></div>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Leading the way in engineering education since 2009
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="relative order-last lg:order-first">
              <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-4 sm:p-6">
                <img
                  src={PIC}
                  alt="Pydah College"
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl">
                <div className="text-xl sm:text-2xl font-bold text-primary">15+</div>
                <div className="text-xs sm:text-sm text-gray-600">Years of Excellence</div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-primary mb-1 sm:mb-2">Autonomous Institution</h3>
                  <p className="text-sm sm:text-base text-gray-600">NAAC Grade A accredited institution with autonomous status, ensuring quality education.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-primary mb-1 sm:mb-2">Prime Location</h3>
                  <p className="text-sm sm:text-base text-gray-600">40-acre campus in Kakinada, Andhra Pradesh with world-class infrastructure.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-primary mb-1 sm:mb-2">Expert Faculty</h3>
                  <p className="text-sm sm:text-base text-gray-600">Distinguished faculty from premier institutes like IITs, ensuring top-quality education.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 bg-gradient-to-br from-secondary to-lightBeige">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4">System Features</h2>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6"></div>
            <p className="text-lg sm:text-xl text-gray-600">Powerful tools for seamless leave management</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary to-accent rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-primary mb-3 sm:mb-4">Easy Leave Requests</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Submit leave applications effortlessly with our intuitive interface. Track status in real-time.</p>
            </div>

            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-primary mb-3 sm:mb-4">Quick Approvals</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Managers can review and approve requests instantly with automated notifications and reminders.</p>
            </div>

            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary to-accent rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-primary mb-3 sm:mb-4">Admin Dashboard</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Comprehensive analytics and reporting tools for efficient leave record management and insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4">Meet Our Developers</h2>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6"></div>
            <p className="text-lg sm:text-xl text-gray-600">The talented minds behind this innovative system</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Developer - Ravi */}
            <div className="group bg-gradient-to-br from-secondary to-lightBeige rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="text-center">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <img
                    src={Ravi}
                    alt="Ravi"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-primary to-accent rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2">Ravi Buraga</h3>
                <p className="text-accent font-semibold mb-3 sm:mb-4">Full Stack Developer</p>
                
                <div className="bg-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    Expert in <span className="font-semibold text-primary">MERN Stack & REST APIs</span>. 
                    Specializes in seamless frontend-backend integration and database optimization.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-4 sm:mb-6">
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">React</span>
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">Node.js</span>
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">MongoDB</span>
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">REST API</span>
                </div>

                <a
                  href="https://www.linkedin.com/in/ravi-buraga-54b0bb280/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-primary to-accent text-white font-semibold rounded-lg sm:rounded-xl
                           hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn Profile
                </a>
              </div>
            </div>

            {/* Developer - Durga Prasad */}
            <div className="group  rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="text-center">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <img
                    src={Durga_Prasad}
                    alt="Durga Prasad"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-primary to-accent rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2">Durga Prasad</h3>
                <p className="text-accent font-semibold mb-3 sm:mb-4">Full Stack Developer</p>
                
                <div className="bg-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    Skilled in <span className="font-semibold text-primary">React, Node.js & MongoDB</span>. 
                    Passionate about responsive web applications and clean UI/UX design.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-4 sm:mb-6">
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">React</span>
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">UI/UX</span>
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">MongoDB</span>
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">Responsive</span>
                </div>

                <a
                  href="https://www.linkedin.com/in/durga-prasad-kakileti-bannu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white font-semibold rounded-lg sm:rounded-xl
                           hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
                >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
    </div>
    
  );
};

export default LandingPage;