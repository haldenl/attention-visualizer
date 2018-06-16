import * as React from 'react';
import SplitPane from 'react-split-pane';
import * as d3 from 'd3';

import InputText, { InputRecord } from './InputText';
import OutputText, { OutputRecord } from './OutputText';
import Flowmap, { FlowmapData, FlowmapAttentionRecord } from './Flowmap';
import ControlPanel from './ControlPanel';
import DataPanel, { DataRecord } from './DataPanel';
import Loading from './Loading';

import '../styles/AttentionVisualizer.css';
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
}

interface State {
  inputData: InputRecord[] | null;
  outputData: OutputRecord[] | null;
  flowmapData: FlowmapData | null;
  resizing: boolean;
  resizingText: boolean;
  filtered: boolean;
  locked: boolean;
  minAttnWeight: number;
  dataRecord: DataRecord;
  redraw: boolean;
}

const DEFAULT_MIN_ATTENTION_WEIGHT = 0.05;

export default class AttentionVisualizer extends React.Component<Props, State> {
  originalData: AttentionData;
  data: AttentionData;

  constructor(props: Props) {
    super(props);

    this.data = null;

    this.state = this.getStateFromData(null, null, DEFAULT_MIN_ATTENTION_WEIGHT);

    this.filterByOutputIndex = this.filterByOutputIndex.bind(this);
    this.filterByInputIndex = this.filterByInputIndex.bind(this);
    this.filterByEdgeTokenMatch = this.filterByEdgeTokenMatch.bind(this);
    this.zoomByInputIndex = this.zoomByInputIndex.bind(this);
    this.lock = this.lock.bind(this);
    this.setState = this.setState.bind(this);
    this.setDataSource = this.setDataSource.bind(this);
    this.setWeightThreshold = this.setWeightThreshold.bind(this);
    this.setResizingText = this.setResizingText.bind(this);
  }

  componentDidMount() {
    let dataRecord: DataRecord = DataPanel.retrieveFirstDataSource();

    d3.json(dataRecord.url).then((data: AttentionData) => {
      this.originalData = data;
      this.data = {
        attentionRecords: data.attentionRecords.slice(),
        inputTokens: data.inputTokens.slice(),
        outputTokens: data.outputTokens.slice() 
      }
      this.setState( this.getStateFromData(data, dataRecord, this.state.minAttnWeight) );
    });
  }

  render() {
    const setState = this.setState;

    return (
      <div className="AttentionVisualizer">
        <SplitPane defaultSize={400} minSize={320}
          onDragStarted={function () { setState({ resizingText: true , resizing: true}); }}
          onDragFinished={function () { setState({ resizingText: false, resizing: false }); }}
        >
          { /* hide the minimap because resizing causes it to bug out */}
          <div className="vertical">
            <div className="title">
              input
            </div>
            <div className="input-pane">
              {this.state.inputData !== null ?
                <InputText data={this.state.inputData} filterByIndex={this.filterByInputIndex}
                  showMinimap={!this.state.resizingText} filtered={this.state.filtered} lock={this.lock}
                  locked={this.state.locked} /> :
                <Loading />
              }
            </div>
          </div>
          <SplitPane primary="second" defaultSize={400} minSize={320}
            onDragStarted={function () { setState({ resizingText: true, resizing: true }); }}
            onDragFinished={function () { setState({ resizingText: false, resizing: false }); }}
          >
            {this.state.resizing ? null : this.state.flowmapData === null ? <Loading /> :
              <Flowmap data={this.state.flowmapData} filtered={this.state.filtered}
                filterByOutputIndex={this.filterByOutputIndex} filterByInputIndex={this.filterByInputIndex}
                zoomByInputIndex={this.zoomByInputIndex} setResizingText={this.setResizingText}
                lock={this.lock} locked={this.state.locked} redraw={this.state.redraw}/>
            }
            <div className="vertical">
              <div className="title">
                output
              </div>
              <div className="output-pane">
                { this.state.outputData === null ? <Loading /> : 
                  <OutputText data={this.state.outputData} filterByIndex={this.filterByOutputIndex} filtered={this.state.filtered}
                    lock={this.lock} locked={this.state.locked} />
                }
              </div>
              <div className="control-pane" 
                onClick={() => {
                  if (this.state.locked) {
                    this.lock(false);
                    this.filterByOutputIndex(null);
                  }
              }}>
                <ControlPanel lock={this.lock} locked={this.state.locked}
                  filterByOutputIndex={this.filterByOutputIndex}
                  filterByEdgeTokenMatch={this.filterByEdgeTokenMatch} 
                  setWeightThreshold={this.setWeightThreshold} weightThreshold={this.state.minAttnWeight}/>
              </div>
              <DataPanel data={this.data} currentDataSource={this.state.dataRecord} lock={this.lock} setDataSource={this.setDataSource} />
            </div>
          </SplitPane>
        </SplitPane>
      </div>
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
      .rollup(function (g) { return d3.sum(g, (d: AttentionRecord) => { return d.weight }) })
      .entries(filteredAttention)
      .reduce(function (dict: any, d: any) {
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
    });

    return inputData;
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
      .rollup(function (g) { return d3.sum(g, (d: AttentionRecord) => { return d.weight }) })
      .entries(filteredAttention)
      .reduce(function (dict: any, d: any) {
        dict[+d.key] = d.value;
        return dict;
      }, {})

    const inputTokens = new Set();
    for (const record of data.inputTokens) {
      inputTokens.add(record.token);
    }

    const outputData: OutputRecord[] = data.outputTokens.map((d: TextRecord, i: number) => {
      return {
        index: d.index,
        token: d.token,
        pos: d.pos,
        weight: outputAttention[d.index],
        novel: !inputTokens.has(d.token)
      }
    })

    return outputData;
  }

  /**
   * @param {Function} filter A function that selects on output index.
   */
  static getFlowmapAttentionData(data: AttentionData, minWeight: number,
    filter?: (attentionRecord: AttentionRecord) => boolean): FlowmapAttentionRecord[] {

    return data.attentionRecords.filter(function (record: AttentionRecord) {
      return record.weight >= minWeight;
    }).map(function (record: AttentionRecord, index: number) {
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
      outputFilter = function (d: AttentionRecord) {
        return filter(d.outputIndex);
      }
    }

    const inputData = AttentionVisualizer.getInputData(this.data, outputFilter);
    const outputData = AttentionVisualizer.getOutputData(this.data);
    outputData.forEach(function (d: OutputRecord) {
      d.selected = filter ? filter(d.index) : false;
    });
    const attentionRecords = AttentionVisualizer.getFlowmapAttentionData(
      this.data, this.state.minAttnWeight, outputFilter);

    const inputDataTrueIndex = inputData.reduce((map: any, d: InputRecord, i: number) => {
      map[d.index] = i;
      return map;
    }, {});

    attentionRecords.forEach(function (d: FlowmapAttentionRecord) {
      if (d.selected) {
        inputData[inputDataTrueIndex[d.inputIndex]].selected = true;
        outputData[d.outputIndex].selected = true;
      }
    });

    const flowmapData = {
      inputRecords: inputData,
      outputRecords: outputData,
      attentionRecords: attentionRecords
    }

    this.setState({
      inputData,
      outputData,
      flowmapData,
      filtered: !!filter,
      redraw: false
    });
  }

  private filterByInputIndex(filter: (index: number) => boolean): void {
    let inputFilter = null;
    if (filter) {
      inputFilter = function (d: AttentionRecord) {
        return filter(d.inputIndex);
      }
    }

    const inputData: InputRecord[] = AttentionVisualizer.getInputData(this.data, null);
    const inputDataTrueIndex = inputData.reduce((map: any, d: InputRecord, i: number) => {
      map[d.index] = i;
      return map;
    }, {});

    inputData.forEach(function (d: InputRecord) {
      d.selected = filter ? filter(inputDataTrueIndex[d.index]) : false;
    });
    const outputData = AttentionVisualizer.getOutputData(this.data, inputFilter);
    const attentionRecords = AttentionVisualizer.getFlowmapAttentionData(this.data, this.state.minAttnWeight, inputFilter);

    attentionRecords.forEach(function (d: FlowmapAttentionRecord) {
      if (d.selected) {
        inputData[d.inputIndex].selected = true;
        outputData[d.outputIndex].selected = true;
      }
    });

    const flowmapData = {
      inputRecords: inputData,
      outputRecords: outputData,
      attentionRecords: attentionRecords
    }

    this.setState({
      inputData,
      outputData,
      flowmapData,
      filtered: !!filter,
      redraw: false
    });
  }

  private filterByEdgeTokenMatch(match: boolean) {
    const inputData: InputRecord[] = AttentionVisualizer.getInputData(this.data, null);
    const outputData = AttentionVisualizer.getOutputData(this.data, null);

    function edgeFilter(d: AttentionRecord) {
      return (inputData[d.inputIndex].token === outputData[d.outputIndex].token) === match;
    }

    const attentionRecords = AttentionVisualizer.getFlowmapAttentionData(this.data, this.state.minAttnWeight, edgeFilter);

    attentionRecords.forEach(function (d: FlowmapAttentionRecord) {
      if (d.selected) {
        inputData[d.inputIndex].selected = true;
        outputData[d.outputIndex].selected = true;
      }
    });

    const flowmapData = {
      inputRecords: inputData,
      outputRecords: outputData,
      attentionRecords: attentionRecords
    }

    this.setState({
      inputData,
      outputData,
      flowmapData,
      filtered: true,
      redraw: false
    });
  }

  private setResizingText(resizingText: boolean) {
    this.setState({ resizingText });
  }

  private zoomByInputIndex(start: number, end: number) {
    this.data.inputTokens = this.originalData.inputTokens.filter(function(d: InputRecord, i: number) {
      return d.index >= start && d.index <= end;
    });
    this.data.attentionRecords = this.originalData.attentionRecords.filter(function(d: AttentionRecord, i: number) {
      return d.inputIndex >= start && d.inputIndex <= end;
    });

    const newState = this.getStateFromData(this.data, this.state.dataRecord, this.state.minAttnWeight, true);
    this.setState(newState);
  }

  private lock(lock: boolean) {
    this.setState({
      locked: lock
    });
  }

  private setDataSource(dataRecord: DataRecord) {
    this.setState(this.getStateFromData(null, dataRecord, this.state.minAttnWeight));
    d3.json(dataRecord.url).then((data: AttentionData) => {
      this.originalData = data;
      this.data = {
        attentionRecords: data.attentionRecords.slice(),
        inputTokens: data.inputTokens.slice(),
        outputTokens: data.outputTokens.slice() 
      }
      this.setState(this.getStateFromData(data, dataRecord, this.state.minAttnWeight));
    });
  }

  private getStateFromData(data: AttentionData, dataRecord: DataRecord, minAttnWeight: number, redraw?: boolean) {
    let inputData = null;
    let outputData = null;
    let flowmapAttentionData = null;
    let flowmapData = null;

    redraw = typeof redraw === 'undefined' ? false : redraw;

    if (this.state && this.state.minAttnWeight !== minAttnWeight) {
      redraw = true;
    }

    if (data !== null) {
      inputData = AttentionVisualizer.getInputData(data);
      outputData = AttentionVisualizer.getOutputData(data);
      flowmapAttentionData = AttentionVisualizer.getFlowmapAttentionData(data, minAttnWeight);
      flowmapData = {
        inputRecords: inputData,
        outputRecords: outputData,
        attentionRecords: flowmapAttentionData
      }
    }


    const newState = {
      // @ts-ignore
      inputData: inputData,

      // @ts-ignore
      outputData: outputData,

      // @ts-ignore
      flowmapData: flowmapData,
      resizing: false,
      resizingText: false,
      filtered: false,
      locked: false,
      minAttnWeight: minAttnWeight,
      dataRecord: dataRecord,
      redraw
    };

    return newState;
  }
  
  private setWeightThreshold(weightThreshold: number) {
    this.setState(this.getStateFromData(this.data, this.state.dataRecord, weightThreshold));
  }
}