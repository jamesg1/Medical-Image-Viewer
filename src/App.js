import React, { Component } from 'react';
import axios from 'axios';
import Header from './components/header';
import ImageSeriesViewer from './components/image_series_viewer';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      imageResults: [],
      stack: {}
    };
  }

  /**
   * Fetch Image Series from JSON API with a Promise
   */
  componentDidMount() {
    this.fetchImageSeries();
  }

  /**
   * Fetch Image Series Response
   */
  fetchImageSeries = () => {
    axios
      .get('/api/image_series.json')
      .then(response => {
        this.setImageResults(response.data);
      })
      .catch(error => {
        console.log(
          'An error has occured trying to retrive image series',
          error
        );
      });
  };

  /**
   * Sort Response and set Results into State
   * @param response API Response
   */
  setImageResults = response => {
    const imageResults = response.Results.sort((a, b) => a.Length - b.Length);
    this.setState({
      imageResults,
      stack: {
        imageIds: imageResults.map(image => `${window.location.href}/${image.Dicom}`),
        currentImageIdIndex: 0
      },
      loading: false
    });
  };

  /**
   * Renders Simple Loading Message
   * @returns {Node} h3 Element
   */
  showLoadingMessage = () => <h3>Loading Please wait ....</h3>;

  /**
   * Render Image Series Viewer and pass down state props
   * @returns {*}
   */
  renderViewer = () => {
    const { imageResults, stack } = this.state;
    return <ImageSeriesViewer imageResults={imageResults} stack={stack} />;
  };

  render() {
    const { loading } = this.state;
    return (
      <div className="app">
        <Header title="Medical Image Series Viewer" />
        {loading ? this.showLoadingMessage() : this.renderViewer()}
      </div>
    );
  }
}

export default App;
