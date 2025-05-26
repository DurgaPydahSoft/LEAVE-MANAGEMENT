import React from 'react';
import logo from './images/PYDAH LOGO.png';
import 'animate.css';

const Header = () => {
  return (
    <header className="bg-secondary shadow-outRaised border-b-8 border-primary rounded-neumorphic sticky top-0 z-50">
      <div className="container mx-auto p-6 flex flex-col md:flex-row items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center animate__animated animate__bounce animate__slower">
          <img 
            src={logo}
            alt="Pydah Logo" 
            className="w-32 h-auto mr-4 rounded-neumorphic "
          />
        </div>

        {/* College Information - Hidden on small screens */}
        <div className="hidden md:block text-center md:text-right text-primary">
          <h1 className="text-2xl font-heading">Pydah College Of Engineering</h1>
          <p className="text-md text-accent">An Autonomous Institution</p>
          <p className="text-md text-accent">Kakinada | Andhra Pradesh | INDIA</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
