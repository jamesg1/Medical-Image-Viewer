import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import Header from './header';

describe('Header', () => {
  it('renders component correctly with title', () => {
    const wrapper = shallow(<Header title="Medical Image Series Viewer" />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('renders component without props', () => {
    const wrapper = shallow(<Header />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
