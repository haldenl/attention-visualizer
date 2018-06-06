import * as React from 'react';
import * as d3 from 'd3';
import * as classNames from 'classnames';

import { AttentionRecord } from './AttentionVisualizer';
import { InputRecord, WEIGHT_SCALE } from './InputText';
import { OutputRecord } from './OutputText';

import '../styles/Flowmap.css';
import { dsv } from 'd3';

interface Props {
  data: FlowmapData;
  filterByOutputIndex: (filter: (index: number) => boolean) => void;
  filterByInputIndex: (filter: (index: number) => boolean) => void;
  filtered: boolean;
  locked: boolean;
  lock: (lock: boolean) => void;
}

interface State {
  filteredAttentionRecords: FlowmapAttentionRecord[],
  inputScale: any;
  inputColorScale: any;
  outputScale: any;
  outputColorScale: any;
  xScale: any;
  path: any;
  edgeWidthScale: any;
  edgeColorScale: any;
  edgeColorScaleCopy: any;
  edgeColorScaleGrey: any;
}

interface Tracking {
  prev: number;
  anchor: number;
  end: number;
  brushing: boolean;
}

export interface FlowmapAttentionRecord extends AttentionRecord {
  index: number;
  selected?: boolean;
}

export interface FlowmapData {
  inputRecords: InputRecord[];
  outputRecords: OutputRecord[];
  attentionRecords: AttentionRecord[];
}

export default class Flowmap extends React.Component<Props, State> {
  divElement: SVGSVGElement;
  static margin = {
    top: 16,
    right: 96,
    bottom: 64,
    left: 96
  };
  static inputNodeWidth = 10;  
  static outputNodeWidth = 24;
  static maxEdgeWidth = 5;
  eventPanel: any;
  chart: any;
  inputNodes: any;
  outputNodes: any;
  edges: any;
  inputText: any;
  outputText: any;

  tracking: Tracking;
  
  constructor(props: Props) {
    super(props);

    this.state = {
      filteredAttentionRecords: null,
      inputScale: null,
      inputColorScale: null,
      outputScale: null,
      outputColorScale: null,      
      xScale: null,
      path: null,
      edgeWidthScale: null,
      edgeColorScale: null,
      edgeColorScaleCopy: null,
      edgeColorScaleGrey: null,
    }

    this.tracking = {
      prev: 0,
      anchor: -1,
      end: -1,
      brushing: false
    }
  }

  static getDerivedStateFromProps(nextProps: Props) {
    const inputScale = d3.scaleBand()
      // @ts-ignore
      .domain(d3.range(0, nextProps.data.inputRecords.length));

    const inputWeightDomain = [0, d3.max(nextProps.data.inputRecords, (d: InputRecord) => {
        return d.weight * WEIGHT_SCALE;
    })];

    // @ts-ignore
    const inputColorScale =  d3.scaleSequential(d3.interpolateBlues).domain(inputWeightDomain);

    const outputScale = d3.scaleBand()
      // @ts-ignore      
      .domain(d3.range(0, nextProps.data.outputRecords.length));

    const outputWeightDomain = [0, 1 * WEIGHT_SCALE * 2]

    // @ts-ignore
    const outputColorScale =  d3.scaleSequential(d3.interpolateReds).domain(outputWeightDomain);

    const xScale = d3.scaleOrdinal()
      .domain(['input', 'output']);

    const line = d3.line();
    const path = (d: any) => {
      // @ts-ignore
      return line(xScale.domain().map(function(sequence: string) {
        let x;
        let y;
        if (sequence === 'input') {
          // @ts-ignore
          x = xScale(sequence) + Flowmap.inputNodeWidth / 2;
          y = inputScale(d.inputIndex) + (inputScale.bandwidth() / 2);
        } else if (sequence === 'output') {
          // @ts-ignore
          x = xScale(sequence) + Flowmap.outputNodeWidth / 2;
          y = outputScale(d.outputIndex) + (outputScale.bandwidth() / 2);
        }
        
        return [x, y];
      }));
    }

    const edgeWidthScale = d3.scaleLinear()
      .range([0, Flowmap.maxEdgeWidth])
      .domain([0, 1]);

    const edgeColorScale = d3.scaleSequential(d3.interpolateReds)
      .domain([0, 1 * WEIGHT_SCALE])
      
    const edgeColorScaleCopy = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, 1 * WEIGHT_SCALE]);

    const edgeColorScaleGrey = d3.scaleSequential(d3.interpolateGreys)
      .domain([0, 1 * WEIGHT_SCALE]);


    function attentionRecordFilter(record: FlowmapAttentionRecord) {
      return edgeWidthScale(record.weight) >= 0.1;
    }

    return {
      inputScale,
      inputColorScale,
      outputScale,
      outputColorScale,
      xScale,
      path,
      edgeWidthScale,
      edgeColorScale,
      edgeColorScaleCopy,
      edgeColorScaleGrey,
    }
  }

  componentDidMount() {
    this.updateWidthHeight();

    this.eventPanel = d3.select(this.divElement).append('rect')
      .attr('class', 'event-panel')
      .attr('width', '100%')
      .attr('height', '100%')
      .on('click', (event: any) => {
        this.props.filterByOutputIndex(null);
        this.props.lock(false);
      });


    this.chart = d3.select(this.divElement).append('g')
      .attr('transform', `translate(${Flowmap.margin.left}, ${Flowmap.margin.top})`);

    this.edges = this.chart.append('g');
    this.edges.selectAll('.edge')
      .data(this.props.data.attentionRecords)
      .enter()
      .append('path')
      .attr('class', (d: FlowmapAttentionRecord) => {
        return classNames({
          'edge': true,
          'copy': this.props.data.inputRecords[d.inputIndex].token === this.props.data.outputRecords[d.outputIndex].token
        })
      })
      .style('stroke', (d: FlowmapAttentionRecord) => {
        if (this.props.data.inputRecords[d.inputIndex].token === this.props.data.outputRecords[d.outputIndex].token) {
          return this.state.edgeColorScaleCopy(d.weight);
        } else {
          return this.state.edgeColorScale(d.weight);
        }
      })
      .attr('d', this.state.path)
      .style('stroke-width', (d: FlowmapAttentionRecord) => { return this.state.edgeWidthScale(d.weight) });

    this.inputNodes = this.chart.append('g')
      .on('mouseleave', () => {
        if (!this.props.locked && !this.tracking.brushing) {
          this.props.filterByOutputIndex(null);
        }
      });

    this.inputNodes.selectAll('.node')
      .data(this.props.data.inputRecords)
      .enter()
      .append('rect')
      .attr('class', 'node input')
      .attr('x', this.state.xScale('input'))
      .attr('y', (d: any) => { return this.state.inputScale(d.index)})
      .attr('width', Flowmap.inputNodeWidth)
      .attr('height', this.state.inputScale.bandwidth())
      .attr('fill', (d: any) => { return this.state.inputColorScale(d.weight); })
      .on('mouseenter', (d: InputRecord) => {
        if (!this.props.locked && !this.tracking.brushing) { 
          // highlight a single token
          this.props.filterByInputIndex(function(index: number) {
            return index === d.index;
          });
        }
      }).on('click', (d: OutputRecord) => {
        this.props.lock(!this.props.locked);
      })

    this.outputNodes = this.chart.append('g')
      .on('mouseleave', () => {
        if (!this.props.locked && !this.tracking.brushing) {
          this.props.filterByOutputIndex(null);
        }
      });

    this.outputNodes.selectAll('.node')
      .data(this.props.data.outputRecords)
      .enter()
      .append('rect')
      .attr('class', (d: OutputRecord) => {
        return classNames({
          'node': true,
          'output': true,
          'clickable': !this.props.locked && !this.tracking.brushing,
          'selected': d.selected && this.props.filtered,
          'grabbable': d.selected && this.props.locked && !this.tracking.brushing,
          'grabbed': this.props.locked && this.tracking.brushing,
          'extendable': this.tracking.brushing && !this.props.locked
        });
      })
      .attr('x', this.state.xScale('output'))
      .attr('y', (d: any) => { return this.state.outputScale(d.index)})
      .attr('width', Flowmap.outputNodeWidth)
      .attr('height', this.state.outputScale.bandwidth())
      .attr('fill', (d: OutputRecord) => { 
        if (d.selected && this.props.filtered) {
          return this.state.outputColorScale(d.weight);
        } else {
          return '#fff';
        }
      })
      .on('mouseenter', (d: OutputRecord) => {
        if (this.props.locked) {
          if (this.tracking.brushing) {
            // move brush
            const delta = d.index - this.tracking.prev;
            this.tracking.anchor += delta;
            this.tracking.end += delta;
            this.props.filterByOutputIndex((index: number) => {
              return (
                (index >= this.tracking.anchor && index <= this.tracking.end) ||
                (index <= this.tracking.anchor && index >= this.tracking.end)
              );
            });
          }
          this.tracking.prev = d.index;
        } else {
          if (this.tracking.brushing) {
            // increase brush range
            this.props.filterByOutputIndex((index: number) => {
              return (
                (index >= this.tracking.anchor && index <= d.index) ||
                (index <= this.tracking.anchor && index >= d.index)
              );
            });
          } else {
            this.tracking.anchor = d.index;
            this.tracking.end = d.index;
            this.tracking.prev = d.index;            
            // highlight a single token
            this.props.filterByOutputIndex(function(index: number) {
              return index === d.index;
            });
          }
        }
      }).on('mousedown', (d: OutputRecord) => {
        if (this.props.locked) {
          this.tracking.prev = d.index;
        }
        this.tracking.brushing = true;
        if (!d.selected) {
          this.props.lock(false);
          this.tracking.anchor = d.index;
          this.tracking.end = d.index;
          this.tracking.prev = d.index;            
          // highlight a single token
          this.props.filterByOutputIndex(function(index: number) {
            return index === d.index;
          });
        } else {
          this.forceUpdate();
        }
      }).on('mouseup', (d: OutputRecord) => {
        const wasBrushing = this.tracking.brushing;
        this.tracking.brushing = false;        
        if (this.props.locked) {
          this.forceUpdate();
        } else {
          this.tracking.end = d.index;
          if (d.selected && wasBrushing) {
            this.props.lock(true);
          }
        }
      });

    this.inputText = this.chart.append('g');
    this.outputText = this.chart.append('g');
    this.redrawInputText();
    this.redrawOutputText();
  }

  componentDidUpdate(prevProps: Props, prevState: State, snapshot: any) {
    this.updateWidthHeight();
    this.updateTracking();

    this.eventPanel
      .attr('class', classNames({
          'event-panel': true,
          'grabbed': this.props.locked && this.tracking.brushing,
          'extendable': this.tracking.brushing && !this.props.locked
        })
      );

    this.edges.selectAll('.edge')
      .data(this.props.data.attentionRecords, function(d: FlowmapAttentionRecord) {
        return d.index;
      })
      .style('stroke', (d: FlowmapAttentionRecord) => {
        if (d.selected) {
          if (this.props.data.inputRecords[d.inputIndex].token === this.props.data.outputRecords[d.outputIndex].token) {
            return this.state.edgeColorScaleCopy(d.weight);
          } else {
            return this.state.edgeColorScale(d.weight);
          }
        } else {
          return '#000';
        }
      })
      .attr('class', (d: FlowmapAttentionRecord) => {
        return classNames({
          'edge': true,
          'copy': this.props.data.inputRecords[d.inputIndex].token === this.props.data.outputRecords[d.outputIndex].token,
          'faded': !d.selected
        })
      });

    this.inputNodes.selectAll('.node')
      .data(this.props.data.inputRecords)
      .attr('fill', (d: any) => { return this.state.inputColorScale(d.weight); });

    this.outputNodes.selectAll('.node')
      .data(this.props.data.outputRecords)
      .attr('class', (d: OutputRecord) => {
        return classNames({
          'node': true,
          'output': true,
          'clickable': !this.props.locked && !this.tracking.brushing,
          'selected': d.selected && this.props.filtered,
          'grabbable': d.selected && this.props.locked && !this.tracking.brushing,
          'grabbed': this.props.locked && this.tracking.brushing,
          'extendable': this.tracking.brushing && !this.props.locked
        });
      })
      .attr('fill', (d: any) => { 
        if (d.selected && this.props.filtered) {
          return this.state.outputColorScale(d.weight);
        } else {
          return '#fff';
        }
      });
    
    this.redrawInputText();
    this.redrawOutputText();
  }

  render() {
    return (
      <svg className="Flowmap" ref={ (divElement) => this.divElement = divElement }>
      </svg>
    );
  }

  private updateWidthHeight() {
    const height = this.divElement.clientHeight - Flowmap.margin.top - Flowmap.margin.bottom;
    const width = this.divElement.clientWidth - Flowmap.margin.left - Flowmap.margin.right;

    // set ranges for scales now that we have the proper sizing
    this.state.inputScale.range([0, height]);
    this.state.outputScale.range([0, height]);
    this.state.xScale.range([0, width - Flowmap.outputNodeWidth]);
  }
  
  private updateTracking() {
    [this.tracking.anchor, this.tracking.end] = d3.extent(this.props.data.outputRecords.filter((d: OutputRecord) => {
      return d.selected;
    }), (d: OutputRecord) => { return d.index; });
  }

  private redrawInputText() {
    this.inputText.selectAll('.input-text').remove();      
    if (this.props.filtered) {
      const usedInputTextPositions = new Set();      
  
      this.inputText.selectAll('.input-text')
        .data(this.props.data.inputRecords.filter((d: InputRecord) => {
          return d.selected
        }))
        .enter()
        .append('text')
        .attr('class', (d: InputRecord) => {
          return classNames({
            'text': true,
            'input-text': true,
            'copy': d.selected
          })
        })
        .attr('alignment-baseline', 'middle')
        .attr('x', this.state.xScale('input') - 8)
        .attr('text-anchor', 'end')
        .text((d: InputRecord) => { return `${d.token} `})
        .attr('y', (d: InputRecord) => {
          let pos = Math.round(this.state.inputScale(d.index)) + Math.round(this.state.inputScale.bandwidth() / 2);
          while (usedInputTextPositions.has(pos)) {
            pos += 1;
          }
          for (let i = pos - 10; i < pos + 10; i++) {
            usedInputTextPositions.add(i);
          }
          return pos;
        })
        .append('tspan')
          .attr('class', (d: InputRecord) => {
            return classNames({
              'pos': true,
              'copy': d.selected
            })
          })
          .text((d: InputRecord) => {
            return `${d.pos}`;
          })
          .attr('alignment-baseline', 'middle');
    }
  }

  private redrawOutputText() {
    this.outputText.selectAll('.output-text').remove();
    if (this.props.filtered) {
      const usedOutputTextPositions = new Set();      
  
      this.outputText.selectAll('.output-text')
        .data(this.props.data.outputRecords.filter((d: OutputRecord) => {
          return d.selected
        }))
        .enter()
        .append('text')
        .attr('class', 'text output-text')
        .attr('alignment-baseline', 'middle')
        .attr('x', this.state.xScale('output') + 8 + Flowmap.outputNodeWidth)
        .text((d: OutputRecord) => { return `${d.token} ` })
        .attr('y', (d: OutputRecord) => {
          let pos = Math.round(this.state.outputScale(d.index)) + Math.round(this.state.outputScale.bandwidth() / 2);
          while (usedOutputTextPositions.has(pos)) {
            pos += 1;
          }
          for (let i = pos - 10; i < pos + 10; i++) {
            usedOutputTextPositions.add(i);
          }
          return pos;
        })
        .append('tspan')
          .attr('class', 'pos')
          .text((d: OutputRecord) => {
            return `${d.pos}`;
          })
          .attr('alignment-baseline', 'middle');
    }
  }
}