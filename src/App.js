import React, { Component } from 'react';
import Header from './components/header';
import ImageSeriesViewer from './components/image_series_viewer';
import './App.css';

export const PUBLIC_URL = 'http://localhost:3000';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      imageResults: [],
      stack: {}
    };
  }

  componentDidMount() {
    fetch('/api/image_series.json', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    })
    .then((response) => response.json())
    .then((response) => {
      this.setState({
        imageResults: response.Results,
        loading: false,
        stack: {
          imageIds: response.Results.map(image => `${PUBLIC_URL}/${image.Dicom}`),
          currentImageIdIndex: 0
        }
      });
    });
  }

  render() {
    const { loading, stack } = this.state;
    return !loading ? (
      <div className="app">
        <Header />
        <ImageSeriesViewer stack={stack} />
      </div>
    ) : null;
  }
}

export default App;
