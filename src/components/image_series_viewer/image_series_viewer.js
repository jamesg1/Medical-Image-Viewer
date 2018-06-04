import React, { Component } from 'react';
import Hammer from "hammerjs";
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import './image_series_viewer.css';

// Initialise References for CornerstoneTools Plugin
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;

// Initialise References for Cornerstone Web Image Loader
cornerstoneWebImageLoader.external.cornerstone = cornerstone;

class ImageSeriesViewer extends Component {

  constructor(props) {
    super(props);
    this.range = React.createRef();

    this.state = {
      currentImageIdIndex: props.stack.currentImageIdIndex,
      stack: props.stack
    };
  }

  handleRangeChange = (event) => {
    this.setState({ currentImageIdIndex: event.target.value });
  }

  render() {
    const { currentImageIdIndex, stack } = this.state;
    return (
      <div className="container">
        <div className="controls">
          <input
            type="range"
            min={0}
            max={stack.imageIds.length - 1}
            value={currentImageIdIndex}
            onChange={this.handleRangeChange}
            ref={this.range} />
        </div>
        {currentImageIdIndex}
        <div
          ref={input => {
            this.element = input;
          }}
          className="viewer">
          <canvas className="cornerstone-canvas" />
        </div>
      </div>
    );
  }

}

export default ImageSeriesViewer;
