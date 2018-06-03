import React, { Component } from 'react';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import './image_series_viewer.css';

cornerstoneWebImageLoader.external.cornerstone = cornerstone;

class ImageSeriesViewer extends Component {
  render() {
    return (
      <div className="container">
        <p>Viewer</p>
      </div>
    );
  }
}

export default ImageSeriesViewer;
