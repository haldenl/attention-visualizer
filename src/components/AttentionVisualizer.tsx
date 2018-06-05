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
  filtered: boolean;
  locked: boolean;
  minAttnWeight: number;
}

const DEFAULT_MIN_ATTENTION_WEIGHT = 0.05;

export default class AttentionVisualizer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const inputData = AttentionVisualizer.getInputData(this.props.data);
    const outputData = AttentionVisualizer.getOutputData(this.props.data);
    const flowmapAttentionData = AttentionVisualizer.getFlowmapAttentionData(this.props.data, DEFAULT_MIN_ATTENTION_WEIGHT);

    const flowmapData = {
      inputRecords: inputData,
      outputRecords: this.props.data.outputTokens,
      attentionRecords:  flowmapAttentionData
    }

    this.state = {
      inputData: inputData,
      outputData: outputData,
      flowmapData: flowmapData,
      resizing: false,
      filtered: false,
      locked: false,
      minAttnWeight: DEFAULT_MIN_ATTENTION_WEIGHT
    };

    this.filterByOutputIndex = this.filterByOutputIndex.bind(this);
    this.filterByInputIndex = this.filterByInputIndex.bind(this);
    this.lock = this.lock.bind(this);
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
        <InputText data={this.state.inputData} filterByIndex={this.filterByInputIndex}
          showMinimap={ !this.state.resizing } filtered={this.state.filtered} lock={this.lock}
          locked={this.state.locked}/>
        <SplitPane primary="second" defaultSize={400}
          onDragStarted={function() { setState({ resizing: true }); }}
          onDragFinished={function() { setState({ resizing: false }); }}
        >
          {this.state.resizing ? null :
            <Flowmap data={this.state.flowmapData} filtered={this.state.filtered}
              filterByOutputIndex={this.filterByOutputIndex} filterByInputIndex={this.filterByInputIndex}
              lock={this.lock} locked={this.state.locked}/>
          }
          <OutputText data={this.state.outputData} filterByIndex={this.filterByOutputIndex} filtered={this.state.filtered}
            lock={this.lock} locked={this.state.locked}/>
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
   * @param {Function} filter A function that filters by input index.
   */
  static getOutputData(data: AttentionData,
                      filter?: (attentionRecord: AttentionRecord) => boolean): OutputRecord[] {
    let filteredAttention = data.attentionRecords;
    
    if (filter) {
      filteredAttention = data.attentionRecords.filter((d: AttentionRecord) => {
        return filter(d);
      });
    }

    let outputAttention = d3.nest()
      .key((d: AttentionRecord) => { return String(d.outputIndex) })
      // @ts-ignore
      .rollup(function(g) { return d3.sum(g, (d: AttentionRecord) => { return d.weight })})
      .entries(filteredAttention)
      .reduce(function(dict: any, d: any) {
        dict[+d.key] = d.value;
        return dict;
      }, {})

    const outputData: OutputRecord[] = data.outputTokens.map((d: TextRecord, i: number) => {
      return {
        index: d.index,
        token: d.token,
        pos: d.pos,
        weight: outputAttention[d.index]
      }
    })

    return outputData;
  }

  /**
   * @param {Function} filter A function that selects on output index.
   */
  static getFlowmapAttentionData(data: AttentionData, minWeight: number,
      filter?: (attentionRecord: AttentionRecord) => boolean): FlowmapAttentionRecord[] {

    return data.attentionRecords.filter(function(record: AttentionRecord) {
      return record.weight >= minWeight;
    }).map(function(record: AttentionRecord, index: number) {
      return {
        ...record,
        index,
        selected: filter ? filter(record) : true
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
    const outputData = AttentionVisualizer.getOutputData(this.props.data);
    outputData.forEach(function(d: OutputRecord) {
      d.selected = filter ? filter(d.index) : false;
    });
    const attentionRecords = AttentionVisualizer.getFlowmapAttentionData(
      this.props.data, this.state.minAttnWeight, outputFilter);

    attentionRecords.forEach(function(d: FlowmapAttentionRecord) {
      if (d.selected) {
        inputData[d.inputIndex].selected = true;
        outputData[d.outputIndex].selected = true;
      }
    });

    const flowmapData = {
      inputRecords: inputData,
      outputRecords: outputData,
      attentionRecords:  attentionRecords
    }
    
    this.setState({
      inputData,
      outputData,
      flowmapData,
      filtered: !!filter
    });
  }

  private filterByInputIndex(filter: (index: number) => boolean): void {
    let inputFilter = null;
    if (filter) {
      inputFilter = function(d: AttentionRecord) {
        return filter(d.inputIndex);
      }
    }

    const inputData: InputRecord[] = AttentionVisualizer.getInputData(this.props.data, null)
    inputData.forEach(function(d: InputRecord) {
      d.selected = filter ? filter(d.index) : false;
    });
    const outputData = AttentionVisualizer.getOutputData(this.props.data, inputFilter);   
    const attentionRecords = AttentionVisualizer.getFlowmapAttentionData(this.props.data, this.state.minAttnWeight, inputFilter);

    attentionRecords.forEach(function(d: FlowmapAttentionRecord) {
      if (d.selected) {
        inputData[d.inputIndex].selected = true;
        outputData[d.outputIndex].selected = true;
      }
    });

    const flowmapData = {
      inputRecords: inputData,
      outputRecords: outputData,
      attentionRecords:  attentionRecords
    }

    this.setState({
      inputData,
      outputData,
      flowmapData,
      filtered: !!filter
    });
  }

  private lock(lock: boolean) {
    this.setState({
      locked: lock
    });
  }
}