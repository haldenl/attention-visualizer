import * as React from 'react';
import SplitPane from 'react-split-pane';
import * as d3 from 'd3';

import InputText, { InputRecord } from './InputText';
import OutputText, { OutputRecord } from './OutputText';
import Flowmap, { FlowmapData, FlowmapAttentionRecord } from './Flowmap';

import '../styles/Resizer.css';

export interface AttentionRecord {
  inputIndex: number;
  outputIndex: number;
  weight: number;
}

export interface TextRecord {
  index: number;
  token: string;
  pos: string;
}

export interface AttentionData {
  attentionRecords: AttentionRecord[];
  inputTokens: TextRecord[];
  outputTokens: TextRecord[];
}

interface Props {
  data: AttentionData;
}

interface State {
  inputData: InputRecord[];
  outputData: OutputRecord[];
  flowmapData: FlowmapData;
  resizing: boolean;
}

export default class AttentionVisualizer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const inputData = AttentionVisualizer.getInputData(this.props.data);
    const flowmapAttentionData = AttentionVisualizer.getFlowmapAttentionData(this.props.data);

    const flowmapData = {
      inputRecords: inputData,
      outputRecords: this.props.data.outputTokens,
      attentionRecords:  flowmapAttentionData
    }

    this.state = {
      inputData: inputData,
      outputData: this.props.data.outputTokens,
      flowmapData: flowmapData,
      resizing: false
    };

    this.filterByOutputIndex = this.filterByOutputIndex.bind(this);
    this.setState = this.setState.bind(this);
  }

  render() {
    const setState = this.setState;

    if (this.props.data === null) {
      return null;
    }

    return (
      <SplitPane defaultSize={400}
        onDragStarted={function() { setState({ resizing: true }); }}
        onDragFinished={function() { setState({ resizing: false }); }}
      >
        { /* hide the minimap because resizing causes it to bug out */ }
        <InputText data={this.state.inputData} showMinimap={ !this.state.resizing }/>
        <SplitPane primary="second" defaultSize={400}
          onDragStarted={function() { setState({ resizing: true }); }}
          onDragFinished={function() { setState({ resizing: false }); }}
        >
          {this.state.resizing ? null :
            <Flowmap data={this.state.flowmapData} filterByIndex={this.filterByOutputIndex} />
          }
          <OutputText data={this.state.outputData} filterByIndex={this.filterByOutputIndex} />
        </SplitPane>
      </SplitPane>
    )
  }

  /**
   * @param {Function} filter A function that filters by output index.
   */
  static getInputData(data: AttentionData,
                      filter?: (attentionRecord: AttentionRecord) => boolean): InputRecord[] {
    let filteredAttention = data.attentionRecords;
    
    if (filter) {
      filteredAttention = data.attentionRecords.filter((d: AttentionRecord) => {
        return filter(d);
      });  
    }

    let inputAttention = d3.nest()
      .key((d: AttentionRecord) => { return String(d.inputIndex) })
      // @ts-ignore
      .rollup(function(g) { return d3.sum(g, (d: AttentionRecord) => { return d.weight })})
      .entries(filteredAttention)
      .reduce(function(dict: any, d: any) {
        dict[+d.key] = d.value;
        return dict;
      }, {})

    const inputData: InputRecord[] = data.inputTokens.map((d: TextRecord, i: number) => {
      return {
        index: d.index,
        token: d.token,
        pos: d.pos,
        weight: inputAttention[d.index]
      }
    })

    return  inputData;
  }

  /**
   * @param {Function} filter A function that selects on output index.
   */
  static getFlowmapAttentionData(data: AttentionData,
      filter?: (attentionRecord: AttentionRecord) => boolean): FlowmapAttentionRecord[] {
    return data.attentionRecords.map(function(record: AttentionRecord) {
      return {
        ...record,
        selected: filter ? filter(record) : false
      }
    });
  }


  private filterByOutputIndex(filter: (index: number) => boolean): void {
    let outputFilter = null;
    if (filter) {
      outputFilter = function(d: AttentionRecord) {
        return filter(d.outputIndex);
      }
    }

    const inputData = AttentionVisualizer.getInputData(this.props.data, outputFilter);

    const outputData = this.props.data.outputTokens.map(function(d: OutputRecord, i: number) {
      return {
        ...d,
        selected: filter ? filter(i) : false
      }
    });

    const flowmapData = {
      inputRecords: inputData,
      outputRecords: outputData,
      attentionRecords:  AttentionVisualizer.getFlowmapAttentionData(this.props.data, outputFilter)
    }
    
    this.setState({
      inputData,
      outputData,
      flowmapData
    });
  }
}