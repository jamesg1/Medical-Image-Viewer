import React from 'react';
import PropTypes from 'prop-types';
import logo from './logo.svg';
import './header.css';

const Header = ({ title }) => (
  <header className="header">
    <img src={logo} className="logo" alt="logo" />
    <h1 className="title">{title}</h1>
  </header>
);

Header.propTypes = {
  title: PropTypes.string
};

export default Header;
