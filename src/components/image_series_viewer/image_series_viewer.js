import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
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

class ImageSeriesViewer extends PureComponent {
  static propTypes = {
    stack: PropTypes.shape({
      imageIds: PropTypes.array,
      currentImageIdIndex: PropTypes.number
    }),
    imageResults: PropTypes.array
  };

  constructor(props) {
    super(props);
    this.state = {
      fillOverlayEnabled: false,
      contoursEnabled: false,
      stack: props.stack,
      currentImage: props.stack.imageIds[0]
    };
  }

  /**
   * Enables Cornerstone plugin and setup Viewer Stack
   */
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

  /**
   * Assign cornerstoneTools stack and scroll attributes to viewer
   * @param viewer Viewer DOM element
   */
  setupViewerStack = viewer => {
    const stack = this.state.stack;
    cornerstoneTools.addStackStateManager(viewer, ['stack']);
    cornerstoneTools.addToolState(viewer, 'stack', stack);
    cornerstoneTools.stackScroll.activate(viewer, 1);
    cornerstoneTools.stackScrollWheel.activate(viewer);
    cornerstoneTools.scrollIndicator.enable(viewer);
  };

  /**
   * Remove eventListeners if compoent is Unmounted
   */
  componentDidUmount() {
    window.removeEventListener('resize', this.onWindowResize);
    this.viewer.removeEventListener('cornerstonenewimage', this.onNewImage);
    cornerstone.disable(this.viewer);
  }

  /**
   * Initialise eventListeners for Viewer
   */
  initialiseEventListeners = () => {
    // Listens for window resize before resizing viewer canvas
    window.addEventListener('resize', this.onWindowResize);
    // Sets current currentImageIdIndex State
    this.viewer.addEventListener('cornerstonenewimage', this.onNewImage);
  };

  /**
   * Called when a new image is viewed, sets the state and renders Overlays
   */
  onNewImage = () => {
    this.setupImageOverlay();
    const enabledElement = cornerstone.getEnabledElement(this.viewer);
    this.setState({
      currentImage: enabledElement.image.imageId
    });
  };

  /**
   * Resize viewer to window viewport
   */
  onWindowResize = () => {
    cornerstone.resize(this.viewer);
  };

  /**
   * Shows Current Index of the currently viewed image
   * @returns {string} Total image count text
   */
  getImageCountText = () => {
    const { currentImageIdIndex, imageIds } = this.state.stack;
    // This starts the count from 1 rather than 0. eg 1-20 rather than 1-19
    return `${currentImageIdIndex + 1} of ${imageIds.length}`;
  };

  /**
   * Build out image overlay URL and draw Contours and Transparent Canvases
   */
  setupImageOverlay = () => {
    const url = `images/overlay_${this.state.stack.currentImageIdIndex}.png`;
    this.drawContours(url);
    this.convertImageToTransparentCanvas(url);
  };

  /**
   * Convert Image into a canvas overlay
   * @param url Url of canvas overlay
   * @returns {Promise<any>} Load Image Promise
   */
  loadImageOntoCanvas = url => {
    return new Promise(resolve => {
      let image = new Image();
      image.src = url;
      image.onload = function() {
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        let context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        resolve(context.getImageData(0, 0, image.width, image.height));
      };
    });
  };

  /**
   * Convert Canvas into Multi coloured Contour Overlay
   * @param url Image URL for the Canvas
   */
  drawContours = url => {
    // data values for Contours
    let values;

    this.loadImageOntoCanvas(url).then(image => {
      let m = image.height,
        n = image.width;
      values = new Array(n * m);
      // Find contours of canvas looping through each pixel
      // Formula from D3.js Cloud Contours https://bl.ocks.org/mbostock/818053c76d79d4841790c332656bf9da
      for (let j = 0, k = 0; j < m; ++j) {
        for (let i = 0; i < n; ++i, ++k) {
          values[k] = image.data[k << 2] / 255;
        }
      }

      // Build out SVG for Contour Overlay with D3.js contours
      let svg = d3.select('svg'),
        svgWidth = +svg.attr('width'),
        svgHeight = +svg.attr('height'),
        contours = d3.contours().size([svgWidth, svgHeight]);
      let color = d3
        .scaleLinear()
        .domain([0.1, 0.4, 0.8]) // Threshold for colour selection and to remove background
        .range(['transparent', 'green', 'red']);

      // Remove previous SVG Paths
      svg.selectAll('*').remove();

      // Plot out data values onto SVG to create contours
      svg
        .selectAll('path')
        .data(contours(values))
        .enter()
        .append('path')
        .attr('d', d3.geoPath(d3.geoIdentity().scale(svgWidth / svgHeight)))
        .attr('stroke-width', 1.2)
        .attr('fill', 'transparent')
        .attr('stroke', d => color(d.value));
    });
  };

  /**
   * Convert Image to Transparent Canvas with opacity
   * @param url Url for the Image
   * @returns {Promise<any>} Promise for Image Conversion
   */
  convertImageToTransparentCanvas = url => {
    let canvas = this.canvasOverlay;
    let ctx = canvas.getContext('2d');
    return new Promise(resolve => {
      let image = new Image();
      image.src = url;
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.globalAlpha = 0.7; // Sets opacity for whole Canvas
        ctx.drawImage(image, 0, 0);

        let imageData = ctx.getImageData(0, 0, image.width, image.height);
        let data = imageData.data;
        // Loop over every pixel and update accordingly
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
        // Update Canvas with new pixel data
        resolve(ctx.putImageData(imageData, 0, 0));
      };
    });
  };

  /**
   * Toggles state for Transparency and turns off Contours overlay
   */
  toggleOverlay = () => {
    this.setState({
      fillOverlayEnabled: !this.state.fillOverlayEnabled,
      contoursEnabled: false
    });
  };

  /**
   * Toggles state for Contours and turns off Transparency overlay
   */
  toggleContours = () => {
    this.setState({
      fillOverlayEnabled: false,
      contoursEnabled: !this.state.contoursEnabled
    });
  };

  /**
   * Displays Welcome Text
   * @returns {Node} Welcome Text
   */
  renderIntro = () => (
    <Fragment>
      <p>
        To scroll through the Image stack scroll either horizontally or
        vertically.
      </p>
      <p>
        The toggle buttons below control the Contour Overlay and Transparency
        Overlay.
      </p>
    </Fragment>
  );

  /**
   * Sets up Viewer Container with inner html elements
   * @returns {Node}
   */
  renderViewer = () => (
    <div
      ref={input => {
        this.viewer = input;
      }}
      className="viewer"
    >
      <canvas className="cornerstone-canvas" />
      <canvas
        className={this.state.fillOverlayEnabled ? 'viewer__overlay' : 'hidden'}
        ref={canvas => {
          this.canvasOverlay = canvas;
        }}
      />
      <svg
        ref={svg => {
          this.svg = svg;
        }}
        className={this.state.contoursEnabled ? 'viewer__contours' : 'hidden'}
        width="320"
        height="320"
      />
      <div className="viewer__label">Image: {this.getImageCountText()}</div>
    </div>
  );

  /**
   * Hooks up Button Toggles to State to Toggle Overlays
   * @returns {Node} Viewer Controls
   */
  renderViewerControls = () => {
    const { contoursEnabled, fillOverlayEnabled } = this.state;
    return (
      <div className="viewer__controls">
        <button
          className={classNames(
            'viewer__button',
            contoursEnabled ? 'active' : ''
          )}
          onClick={this.toggleContours}
        >
          Contours Overlay
        </button>
        <button
          className={classNames(
            'viewer__button',
            fillOverlayEnabled ? 'active' : ''
          )}
          onClick={this.toggleOverlay}
        >
          Transparency Overlay
        </button>
      </div>
    );
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
