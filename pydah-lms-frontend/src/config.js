const config = {
  // Base URLs
  API_URL: process.env.REACT_APP_API_URL || 'https://leave-management-4i9x.onrender.com',
  API_BASE_URL: `${process.env.REACT_APP_API_URL || 'https://leave-management-4i9x.onrender.com'}/api`,
  
  // Frontend URL
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'https://leave-management-pied.vercel.app',
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: '/auth',
    EMPLOYEE: '/employee',
    HOD: '/hod',
    PRINCIPAL: '/principal',
    SUPER_ADMIN: '/super-admin'
  }
};

export default config; 