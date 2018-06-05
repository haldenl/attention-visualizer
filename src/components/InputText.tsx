import * as React from 'react';
import * as d3 from 'd3';
import * as classNames from 'classnames';

import Minimap from 'react-minimap';
import { TextRecord } from './AttentionVisualizer';
import MinimapChild from './MinimapChild';

import '../styles/InputText.css';
import '../styles/Minimap.css';

interface Props {
  data: InputRecord[];
  showMinimap: boolean;
  filterByIndex: (filter: (index: number) => boolean) => void;
  filtered: boolean;
  lock: (lock: boolean) => void;
  locked: boolean;
}

interface State {
  colorScale: Function;
}

export interface InputRecord {
  index: number;
  token: string;
  pos: string;
  weight: number;
  selected?: boolean;
}

export const WEIGHT_SCALE = 1.5;

export default class InputText extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      colorScale: null
    }
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const weightDomain = [0, WEIGHT_SCALE * d3.max(nextProps.data, (d: InputRecord) => { return d.weight })];
    // @ts-ignore
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain(weightDomain);

    return {
      colorScale
    }
  }

  render() {
    const filterByIndex = this.props.filterByIndex;
    const locked = this.props.locked;
    const lock = this.props.lock;

    const text = this.props.data.map((record: InputRecord, i: number) => {
      const token = record.token;
      const backgroundColor = this.state.colorScale(record.weight);
      const classes = classNames({
        'token': true, 'selected': this.props.filtered && record.selected
      });

      return (
        <span className={classes} key={i} style={{ backgroundColor }}
          
          onMouseEnter={function(event: any) {
            if (!locked) {
              filterByIndex(function(index: number) {
                return index === i;
              });
            }
          }}>
          {`${token} `}
        </span>
      );
    });

    if (this.props.showMinimap) {
      return (
        <div className="InputText" 

        onMouseOut={function() {
          if (!locked) {
            filterByIndex(null);
          }
        }}>
          <Minimap selector=".token" childComponent={MinimapChild} width={100} keepAspectRatio={true}>
            <div className="text">
              {text}
            </div>
          </Minimap>
        </div>
      )
    } else {
      return (
        <div className="InputText"
        
        onMouseOut={function() {
          if (!locked) {
            filterByIndex(null);
          }
        }}>
          <div className="text">
            {text}
          </div>
        </div>
      )
    }
  }
}