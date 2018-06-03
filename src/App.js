import React, { Component } from 'react';
import Header from './components/header';
import ImageSeriesViewer from './components/image_series_viewer';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="app">
        <Header />
        <ImageSeriesViewer />
      </div>
    );
  }
}

export default App;
