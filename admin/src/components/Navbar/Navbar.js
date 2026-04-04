import React from 'react'
import './Navbar.css'
import tentLogo from "../../assets/tent_logo.avif";
import profileImg from "../../assets/profile.jpg";



const Navbar = () => {
  return (
    <div className='navbar'>
 <div className="navbar-brand m-0 text-center" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <h1 className="Logo-Text">Demotents.com</h1>
          </div>  <img className= 'profile' src={profileImg} alt="Profile" />

    </div>
  )
}

export default Navbar
