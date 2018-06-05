import React, { Component } from 'react';
import Header from './components/header';
import ImageSeriesViewer from './components/image_series_viewer';
import './App.css';

export const BASEURI = 'http://localhost:3000';

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
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((response) => this.setImageResults(response));
  }

  setImageResults = response => {
    const imageResults = response.Results.sort((a, b) => a.Length - b.Length);
    this.setState({
      imageResults,
      stack: {
        imageIds: imageResults.map(image => `${BASEURI}/${image.Dicom}`),
        currentImageIdIndex: 0
      },
      loading: false
    });
  }

  render() {
    const { loading, imageResults, stack } = this.state;
    return !loading ? (
      <div className="app">
        <Header />
        <ImageSeriesViewer imageResults={imageResults} stack={stack} />
      </div>
    ) : null;
  }
}

export default App;
