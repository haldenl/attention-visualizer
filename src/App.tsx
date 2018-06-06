import * as React from 'react';
import * as d3 from 'd3';

import AttentionVisualizer, { AttentionData } from './components/AttentionVisualizer';

import './App.css';

export default class App extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <AttentionVisualizer />
    );
  }
}