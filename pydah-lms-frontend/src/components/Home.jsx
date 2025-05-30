import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const campuses = [
    {
      name: 'Engineering',
      code: 'engineering',
      description: 'PYDAH College of Engineering',
      image: '🏛️'
    },
    {
      name: 'Degree',
      code: 'degree',
      description: 'PYDAH Degree College',
      image: '🎓'
    },
    {
      name: 'Pharmacy',
      code: 'pharmacy',
      description: 'PYDAH College of Pharmacy',
      image: '💊'
    },
    {
      name: 'Diploma',
      code: 'diploma',
      description: 'PYDAH Polytechnic College',
      image: '📚'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Welcome to PYDAH Leave Management System
          </h1>
          <p className="text-xl text-gray-600">
            Please select your role to proceed
          </p>
        </div>

        {/* Login Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left Side - Staff Login Options */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary mb-6">Staff Access</h2>
            
            {/* Employee Access Card */}
            <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-4">👨‍💼</span>
                <div>
                  <h3 className="text-xl font-semibold text-primary">Employee Portal</h3>
                  <p className="text-gray-600">Access or register for leave management</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  onClick={() => navigate('/employee-login')}
                  className="w-full py-2 px-4 rounded-neumorphic bg-secondary shadow-outerRaised 
                           hover:shadow-innerSoft transition-all duration-300 text-primary"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/employee-register')}
                  className="w-full py-2 px-4 rounded-neumorphic bg-primary text-white shadow-outerRaised 
                           hover:shadow-innerSoft transition-all duration-300"
                >
                  Register
                </button>
              </div>
            </div>

            {/* HOD Login Card */}
            <div 
              onClick={() => navigate('/hod-login')}
              className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised hover:shadow-innerSoft 
                       transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center">
                <span className="text-4xl mr-4">👨‍🏫</span>
                <div>
                  <h3 className="text-xl font-semibold text-primary">HOD Login</h3>
                  <p className="text-gray-600">Department head access portal</p>
                </div>
              </div>
            </div>

            {/* Super Admin Login Card */}
            <div 
              onClick={() => navigate('/super-admin-login')}
              className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised hover:shadow-innerSoft 
                       transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center">
                <span className="text-4xl mr-4">👨‍💻</span>
                <div>
                  <h3 className="text-xl font-semibold text-primary">Super Admin Login</h3>
                  <p className="text-gray-600">System administration portal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Campus Principal Login */}
          <div>
            <h2 className="text-2xl font-semibold text-primary mb-6">Principal Login</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campuses.map((campus) => (
                <div
                  key={campus.code}
                  onClick={() => navigate(`/${campus.code}/principal-login`)}
                  className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised hover:shadow-innerSoft 
                           transition-all duration-300 cursor-pointer"
                >
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">{campus.image}</span>
                    <h3 className="text-lg font-semibold text-primary mb-1">
                      {campus.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {campus.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center text-gray-600">
          <p>Need help? Contact your system administrator</p>
          <p className="text-sm mt-2">© 2024 PYDAH Leave Management System</p>
        </div>
      </div>
    </div>
  );
};

export default Home; 