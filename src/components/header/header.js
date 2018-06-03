import React from 'react';
import logo from './logo.svg'
import './header.css';

const Header = () => (
  <header className="header">
    <img src={logo} className="App-logo" alt="logo" />
    <h1 className="header-title">Medical Image Series Viewer</h1>
  </header>
);

export default Header;