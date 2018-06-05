import React, { Component } from 'react';
import Hammer from 'hammerjs';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
import * as d3 from 'd3';
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
      contours: false,
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
    this.setupImageOverlay();
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
    this.setupImageOverlay();
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

  setupImageOverlay = () => {
    const url = `images/overlay_${this.state.stack.currentImageIdIndex}.png`;
    this.drawContours(url);
    this.covertImageToCanvas(url);
  };

  drawContours = url => {
    let values;

    imagex(url).then(function(image) {
      var m = image.height,
        n = image.width;
      values = new Array(n * m);
      for (var j = 0, k = 0; j < m; ++j) {
        for (var i = 0; i < n; ++i, ++k) {
          values[k] = image.data[k << 2] / 255;
        }
      }
      x();
    });
    function imagex(url) {
      return new Promise(function(resolve) {
        var image = new Image();
        image.src = url;
        image.onload = function() {
          var canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          var context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);
          resolve(context.getImageData(0, 0, image.width, image.height));
        };
      });
    }

    function x() {
      var svg = d3.select('svg'),
        svgWidth = +svg.attr('width'),
        svgHeight = +svg.attr('height'),
        contours = d3.contours().size([svgWidth, svgHeight]);
      var color = d3
        .scaleLinear()
        .domain([0.1, 0.4, 0.8])
        .range(['transparent', 'green', 'red']);
      svg.selectAll('*').remove();
      svg
        .selectAll('path')
        .data(contours(values))
        .enter()
        .append('path')
        .attr('d', d3.geoPath(d3.geoIdentity().scale(svgWidth / svgHeight)))
        .attr('stroke-width', 1.2)
        .attr('fill', 'transparent')
        .attr('stroke', function(d, i) {
          return color(d.value);
        });
    }
  };

  covertImageToCanvas = url => {
    let canvas = this.canvasOverlay;
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
    this.setState({
      overlay: !this.state.overlay,
      contours: false
    });
  };

  toggleContours = () => {
    this.setState({
      overlay: false,
      contours: !this.state.contours
    });
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
          this.canvasOverlay = canvas;
        }}
      />
      <svg
        ref={svg => {
          this.svg = svg;
        }}
        className={this.state.contours ? 'viewer__contours' : 'hidden'}
        width="320"
        height="320"
      />
      <div className="viewer__label">Image: {this.getImageCountText()}</div>
    </div>
  );

  renderViewerControls = () => (
    <div className="viewer__controls">
      <button className="viewer__button" onClick={this.toggleContours}>
        Toggle Contours Overlay
      </button>
      <button className="viewer__button" onClick={this.toggleOverlay}>
        Toggle Transparency Overlay
      </button>
    </div>
  );

  renderIntro = () => {
    <p>To scroll through the Image stack simply </p>;
  };

  render() {
    return (
      <div className="container">
        {this.renderIntro()}
        {this.renderViewer()}
        {this.renderViewerControls()}
      </div>
    );
  }
}

export default ImageSeriesViewer;
