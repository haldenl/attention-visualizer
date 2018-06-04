import * as React from 'react';
import * as d3 from 'd3';
import * as classNames from 'classnames';

import { AttentionRecord } from './AttentionVisualizer';
import { InputRecord, WEIGHT_SCALE } from './InputText';
import { OutputRecord } from './OutputText';

import '../styles/Flowmap.css';

interface Props {
  data: FlowmapData;
  filterByIndex: (filter: (index: number) => boolean) => void;
}

interface State {
  filteredAttentionRecords: FlowmapAttentionRecord[],
  inputScale: any;
  inputColorScale: any;
  outputScale: any;
  xScale: any;
  path: any;
  edgeWidthScale: any;
  edgeColorScale: any;
  edgeColorScaleCopy: any;
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
    right: 32,
    bottom: 16,
    left: 32
  };
  static nodeWidth = 10;
  chart: any;
  inputNodes: any;
  outputNodes: any;
  edges: any;
  
  constructor(props: Props) {
    super(props);

    this.state = {
      filteredAttentionRecords: null,
      inputScale: null,
      inputColorScale: null,
      outputScale: null,
      xScale: null,
      path: null,
      edgeWidthScale: null,
      edgeColorScale: null,
      edgeColorScaleCopy: null
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
      .padding(0.2)
      // @ts-ignore      
      .domain(d3.range(0, nextProps.data.outputRecords.length));

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
          x = xScale(sequence) + Flowmap.nodeWidth;
          y = inputScale(d.inputIndex) + (inputScale.bandwidth() / 2);
        } else if (sequence === 'output') {
          x = xScale(sequence);
          y = outputScale(d.outputIndex) + (outputScale.bandwidth() / 2);
        }
        
        return [x, y];
      }));
    }

    const edgeWidthScale = d3.scaleLinear()
      .range([0, Flowmap.nodeWidth / 2])
      .domain([0, 1]);

    const edgeColorScale = d3.scaleSequential(d3.interpolateRdPu)
      .domain([0, 1 * WEIGHT_SCALE])
      
    const edgeColorScaleCopy = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, 1 * WEIGHT_SCALE]);

    const filteredAttentionRecords = nextProps.data.attentionRecords.filter(function(record: FlowmapAttentionRecord) {
      return edgeWidthScale(record.weight) >= 1;
    });

    return {
      inputScale,
      inputColorScale,
      outputScale,
      xScale,
      path,
      edgeWidthScale,
      edgeColorScale,
      edgeColorScaleCopy,
      filteredAttentionRecords
    }
  }

  componentDidMount() {
    this.updateWidthHeight();

    this.chart = d3.select(this.divElement).append('g')
      .attr('transform', `translate(${Flowmap.margin.left}, ${Flowmap.margin.top})`);

    this.edges = this.chart.append('g');
    this.edges.selectAll('.edge')
      .data(this.state.filteredAttentionRecords)
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

    this.inputNodes = this.chart.append('g');
    this.inputNodes.selectAll('.node')
      .data(this.props.data.inputRecords)
      .enter()
      .append('rect')
      .attr('class', 'node input')
      .attr('x', this.state.xScale('input'))
      .attr('y', (d: any) => { return this.state.inputScale(d.index)})
      .attr('width', Flowmap.nodeWidth)
      .attr('height', this.state.inputScale.bandwidth())
      .attr('fill', (d: any) => { return this.state.inputColorScale(d.weight); });

    this.outputNodes = this.chart.append('g');
    this.outputNodes.selectAll('.node')
      .data(this.props.data.outputRecords)
      .enter()
      .append('rect')
      .attr('class', (d: any) => {
        return classNames({
          node: true,
          output: true,
          selected: d.selected
        });
      })
      .attr('x', this.state.xScale('output'))
      .attr('y', (d: any) => { return this.state.outputScale(d.index)})
      .attr('width', Flowmap.nodeWidth)
      .attr('height', this.state.outputScale.bandwidth())
      .on('mouseenter', (d: OutputRecord) => {
        this.props.filterByIndex((index: number) => {
          return index === d.index;
        });
      });;
  }

  componentDidUpdate(prevProps: Props, prevState: State, snapshot: any) {
    this.updateWidthHeight();

    const newEdges = this.edges.selectAll('.edge')
      .data(this.state.filteredAttentionRecords, function(d: FlowmapAttentionRecord) {
        return d.index;
      });

    newEdges.exit().remove();
    newEdges.enter()
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

    newEdges
      .attr('class', (d: FlowmapAttentionRecord) => {
        return classNames({
          'edge': true,
          'copy': this.props.data.inputRecords[d.inputIndex].token === this.props.data.outputRecords[d.outputIndex].token
        });
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

    this.inputNodes.selectAll('.node')
      .data(this.props.data.inputRecords)
      .attr('fill', (d: any) => { return this.state.inputColorScale(d.weight); });

    this.outputNodes.selectAll('.node')
      .data(this.props.data.outputRecords)
      .attr('class', (d: OutputRecord) => {
        return classNames({
          'node': true,
          'output': true,
          'selected': d.selected
        });
      });
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
    this.state.xScale.range([0, width - Flowmap.nodeWidth]);
  }
}