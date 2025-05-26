import React from "react";
import { useNavigate } from "react-router-dom";
import { ReactTyped} from "react-typed";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'animate.css';
import PIC from './images/PYDAH LOGO.png';
import Durga_Prasad from './images/PIC_DP.jpg';
import Ravi from './images/ravi_IMAGE.jpg';
import PullToRefresh from "./PullToRefresh";

export default function Home() {
  const navigate = useNavigate();

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  <script>
  AOS.init();
</script>
const handleRefresh = () => {
  console.log("Refreshing data...");
  // Call API or refresh state here
};

  return (
    <div className="flex flex-col min-h-screen bg-secondary text-textDark ">
      <PullToRefresh onRefresh={handleRefresh} />
      {/* Hero Section */}
      <div className="sticky flex flex-col md:flex-row items-center justify-around px-6 py-16 md:py-32 bg-secondary shadow-outRaised text-textDark border-b-8 border-primary rounded-neumorphic ">
      <div className="max-w-3xl">
      {/* Typing Effect Heading */}
      <h1 className="text-4xl md:text-5xl font-heading">
        <ReactTyped
          strings={[
            "Staff Leave Management System",
            "Seamless Leave Tracking",
            "Manage Leaves Effortlessly",
          ]}
          typeSpeed={50}
          backSpeed={30}
          loop
        />
      </h1>

      <p className="mt-4 text-lg text-black">
        Streamline leave tracking for faculty and staff effortlessly.
      </p>

      <button
      
        className="mt-6 px-6 py-3 bg-accent text-textDark font-semibold rounded-neumorphic shadow-md
                   hover:shadow-none border-2 border-primary active:shadow-innerSoft transition-all duration-300
                   "
        onClick={() => navigate("/login")}
      >
        Get Started
      </button>
    </div>

        {/* Slider Section */}
        <div className="mt-8 md:mt-0 max-w-2xl w-full rounded-neumorphic shadow-outerRaised p-2 overflow-hidden">
          <Slider {...sliderSettings}>
            <div>
              <img
                src="https://static.wixstatic.com/media/bfee2e_a361f3557fc440c98d1d2edf8c1f0d1f~mv2.jpg/v1/fill/w_1891,h_783,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/bfee2e_a361f3557fc440c98d1d2edf8c1f0d1f~mv2.jpg"
                alt="College Campus"
                className="rounded-lg w-full"
              />
            </div>
            <div>
              <img
                src="https://www.vidyavision.com/CollegeUploads/Photos/2019-30-3-15-05-13_Screenshot%20(160).png"
                alt="College Campus"
                className="rounded-lg w-full h-64"
              />
            </div>
          </Slider>
        </div>
      </div>

      {/* About College Section */}
      <div className="flex py-16 px-6 bg-white rounded-neumorphic shadow-innerSoft flex-row justify-around" >
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-16 items-center">
          {/* Image Section */}
          <div className="relative rounded-neumorphic shadow-innerSoft overflow-hidden">
            <img
              src={PIC}
              alt="Pydah College"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Text Section */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-heading text-primary">About Pydah College of Engineering</h2>
            <p className="mt-4 text-lg text-black">
              Pydah College of Engineering is a prestigious institution in Kakinada, Andhra Pradesh. Established in 2009, it offers top-tier education.
            </p>
            <p className="mt-4 text-black">
              The campus spans over 40 acres with world-class infrastructure and faculty from premier institutes like IITs.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-6 bg-secondary rounded-neumorphic shadow-innerSoft">
        <div  className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-heading text-primary">Why Choose Our System?</h2>
          <p className="mt-2 text-textDark">A seamless leave management experience.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10 max-w-5xl mx-auto">
          <div className="p-6 bg-lightBeige rounded-neumorphic shadow-outerRaised">
            <h3 className="text-xl font-semibold text-accent">Employee Leave Requests</h3>
            <p className="text-textDark mt-2">Employees can apply for leave with ease.</p>
          </div>
          <div className="p-6 bg-lightBeige rounded-neumorphic shadow-outerRaised">
            <h3 className="text-xl font-semibold text-accent">Manager Approvals</h3>
            <p className="text-textDark mt-2">Managers can approve leave requests instantly.</p>
          </div>
          <div className="p-6 bg-lightBeige rounded-neumorphic shadow-outerRaised">
            <h3 className="text-xl font-semibold text-accent">Admin Dashboard</h3>
            <p className="text-textDark mt-2">Admins can track leave records efficiently.</p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 px-6 bg-primary text-center rounded-neumorphic ">
        <h2 className="text-3xl font-heading text-white mb-2">Need Assistance?</h2>
        
       {/* Developers Section */}
<div className="py-16 px-6 bg-secondary text-center rounded-neumorphic shadow-innerSoft">
  <h2 className="text-3xl font-heading text-primary">Meet the Developers</h2>
  <p className="mt-2 text-textDark">The minds behind the system</p>

  <div className="flex flex-col sm:flex-row justify-center gap-8 mt-10">
    {/* Developer - Ravi */}
    <div className="p-6 bg-background rounded-neumorphic shadow-outerRaised text-center max-w-xs">
      <img
        src={Ravi}
        alt="Ravi"
        className="w-32 h-32 mx-auto rounded-full shadow-outerRaised"
      />
      <h3 className="text-xl font-semibold text-primary mt-4">Ravi</h3>
      <p className="text-textDark">Full Stack Developer</p>
      <p className="mt-2 text-sm text-gray-600 shadow-inner rounded-md p-2">
        With expertise in <strong>MERN Stack & REST APIs</strong>, Ravi ensures <strong>seamless integration</strong> between frontend and backend, optimizing database performance and API security.
      </p>
      <a
        href="https://www.linkedin.com/in/ravi-buraga-54b0bb280/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block px-4 py-2 bg-primary text-textLight rounded-neumorphic shadow-outerRaised
                   hover:shadow-none active:shadow-innerSoft transition-all duration-300"
      >
        LinkedIn Profile
      </a>
    </div>

    {/* Developer - Durga Prasad */}
    <div className="p-6 bg-background rounded-neumorphic shadow-outerRaised text-center max-w-xs">
      <img
        src={Durga_Prasad}
        alt="Durga Prasad"
        className="w-32 h-32 mx-auto rounded-full shadow-outerRaised"
      />
      <h3 className="text-xl font-semibold text-primary mt-4">Durga Prasad</h3>
      <p className="text-textDark">Full Stack Developer</p>
      <p className="mt-2  text-sm text-gray-600 rounded-md p-2 shadow-inner">
        Skilled in <strong>React, Node.js, and MongoDB</strong>,specializes in building <strong>responsive web applications</strong>. He is passionate about clean UI/UX and backend optimization.
      </p>
      <a
        href="https://www.linkedin.com/in/durga-prasad-kakileti-bannu/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block px-4 py-2 bg-primary text-textLight rounded-neumorphic shadow-outerRaised
                   hover:shadow-none active:shadow-innerSoft transition-all duration-300"
      >
        LinkedIn Profile
      </a>
    </div>
  </div>
</div>



      </div>
    </div>
  );
}