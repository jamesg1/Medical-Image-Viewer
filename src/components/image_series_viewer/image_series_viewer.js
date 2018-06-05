import React, { Component } from 'react';
import Hammer from 'hammerjs';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
import './image_series_viewer.css';

// Specify External Dependencies for CornerstoneTools Plugin
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
// Specify External Dependencies for Cornerstone Web Image Loader
cornerstoneWebImageLoader.external.cornerstone = cornerstone;

class ImageSeriesViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      overlay: true,
      stack: props.stack,
      currentImage: props.stack.imageIds[0]
    };
  }

  componentDidMount() {
    const viewer = this.viewer;
    const { currentImage } = this.state;

    cornerstone.enable(viewer);
    cornerstone.loadImage(currentImage).then(image => {
      cornerstoneTools.mouseWheelInput.enable(viewer);
      cornerstone.displayImage(viewer, image);
      this.setupViewerStack(viewer);
      this.initialiseEventListeners();
    });
    this.setupOverlay();
  }

  setupViewerStack = viewer => {
    const stack = this.state.stack;
    cornerstoneTools.addStackStateManager(viewer, ['stack']);
    cornerstoneTools.addToolState(viewer, 'stack', stack);
    cornerstoneTools.stackScroll.activate(viewer, 1);
    cornerstoneTools.stackScrollWheel.activate(viewer);
    cornerstoneTools.scrollIndicator.enable(viewer);
  };

  componentDidUmount() {
    window.removeEventListener('resize', this.onWindowResize);
    this.viewer.removeEventListener('cornerstonenewimage', this.onNewImage);
    cornerstone.disable(this.viewer);
  }

  initialiseEventListeners = () => {
    // Listens for window resize before resizing viewer canvas
    window.addEventListener('resize', this.onWindowResize);
    // Sets current currentImageIdIndex State
    this.viewer.addEventListener('cornerstonenewimage', this.onNewImage);
  };

  onNewImage = () => {
    this.setupOverlay();
    const enabledElement = cornerstone.getEnabledElement(this.viewer);
    this.setState({
      currentImage: enabledElement.image.imageId
    });
  };

  onWindowResize = () => {
    cornerstone.resize(this.viewer);
  };

  getImageCountText = () => {
    const { currentImageIdIndex, imageIds } = this.state.stack;
    // This starts the count from 1 rather than 0. eg 1-20 rather than 1-19
    return `${currentImageIdIndex + 1} of ${imageIds.length}`;
  };

  setupOverlay = () => {
    const url = `images/overlay_${this.state.stack.currentImageIdIndex}.png`;
    this.covertOverlayToCanvas(url);
  };

  covertOverlayToCanvas = url => {
    let canvas = this.canvas;
    let ctx = canvas.getContext('2d');

    return new Promise(resolve => {
      var image = new Image();
      image.src = url;
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.globalAlpha = 0.7;
        ctx.drawImage(image, 0, 0);

        let imageData = ctx.getImageData(0, 0, image.width, image.height);
        let data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          let rgbColor = data[i] + data[i + 1] + data[i + 2];
          // Turning Black to transparent pixels
          if (rgbColor < 10) {
            data[i + 3] = 0; // Chang rgb alpha to 0
          }
          // Check if white - change to magenta
          if (rgbColor === 765) {
            imageData.data[i] = 191;
            imageData.data[i + 1] = 0;
            imageData.data[i + 2] = 255;
          }
          // Check if grey - change to yellow
          if (rgbColor === 381) {
            imageData.data[i] = 230;
            imageData.data[i + 1] = 230;
            imageData.data[i + 2] = 0;
          }
        }
        resolve(ctx.putImageData(imageData, 0, 0));
      };
    });
  };

  toggleOverlay = () => {
    this.setState({ overlay: !this.state.overlay });
  };

  renderViewer = () => (
    <div
      ref={input => {
        this.viewer = input;
      }}
      className="viewer"
    >
      <canvas className="cornerstone-canvas" />
      <canvas
        className={this.state.overlay ? 'viewer__overlay' : 'hidden'}
        ref={canvas => {
          this.canvas = canvas;
        }}
      />
      <div className="viewer__label">Image: {this.getImageCountText()}</div>
    </div>
  );

  renderViewerControls = () => (
    <div>
      <button onClick={this.toggleOverlay}>Toggle Transparency Overlay</button>
    </div>
  );

  render() {
    return (
      <div className="container">
        {this.renderViewer()}
        {this.renderViewerControls()}
      </div>
    );
  }
}

export default ImageSeriesViewer;
