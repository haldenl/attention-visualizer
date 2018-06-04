import * as React from 'react';
import * as d3 from 'd3';

import AttentionVisualizer, { AttentionData } from './components/AttentionVisualizer';

import './App.css';

interface State {
  data: AttentionData;
}

const DATA_URL = 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/model_data_3.json';

export default class App extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      data: null
    }
  }

  componentDidMount() {
    d3.json(DATA_URL).then((data: AttentionData) => {
      this.setState({ data });
    });
  }


  render() {
    if (this.state.data === null) {
      return <div>loading...</div>
    }

    return (
      <AttentionVisualizer data={this.state.data}/>
    );
  }
}