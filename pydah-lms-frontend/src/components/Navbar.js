import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@mui/material';

const Navbar = () => {
  return (
    <div>
      {/* Add HR login link in the navigation menu */}
      <Button
        color="inherit"
        component={Link}
        to="/hr/login"
        sx={{ mx: 1 }}
      >
        HR Login
      </Button>
    </div>
  );
};

export default Navbar; 