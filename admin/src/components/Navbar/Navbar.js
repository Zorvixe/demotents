import React from 'react'
import './Navbar.css'
import tentLogo from "../../assets/tent_logo.avif";
import profileImg from "../../assets/profile.jpg";



const Navbar = () => {
  return (
    <div className='navbar'>
      <img className= 'logo' src={tentLogo} alt="Tent Logo" />
  <img className= 'profile' src={profileImg} alt="Profile" />

    </div>
  )
}

export default Navbar
