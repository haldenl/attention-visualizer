import * as React from 'react';
import * as classNames from 'classnames';
import * as d3 from 'd3';

import '../styles/OutputText.css';

const WEIGHT_SCALE = 3;

interface Props {
  data: OutputRecord[];
  filterByIndex: (filter: (index: number) => boolean) => void;
  filtered: boolean;
  lock: (lock: boolean) => void;
  locked: boolean;
}

interface State {
  colorScale: any;
}

export interface OutputRecord {
  index: number;
  token: string;
  pos: string;
  weight?: number;
  selected?: boolean;
  novel?: boolean;
}

interface Tracking {
  anchor: number;
  brushing: boolean;
}

export default class OutputText extends React.Component<Props, State> {
  tracking: Tracking;

  constructor(props: Props) {
    super(props);

    this.tracking = {
      anchor: -1,
      brushing: false
    }

    this.state = {
      colorScale: null
    }

    this.forceUpdate = this.forceUpdate.bind(this);
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const weightDomain = [0, WEIGHT_SCALE * 1];
    // @ts-ignore
    const colorScale = d3.scaleSequential(d3.interpolateReds).domain(weightDomain);

    return {
      colorScale
    }
  }

  render() {
    const filterByIndex = this.props.filterByIndex;
    const tracking = this.tracking;

    const text = this.props.data.map((record: OutputRecord, i: number) => {
      const token = record.token;
      
      let backgroundColor;
      if (this.props.filtered && record.selected) {
        backgroundColor = this.state.colorScale(record.weight);
      } else {
        backgroundColor = '#fff';
      }

      const classes = classNames({
        'token': true, 'selected': !this.props.filtered || record.selected, 'novel': record.novel,
        'copy': !record.novel
      });

      return (
        <span className={classes} key={i} style={{ backgroundColor }}

          onMouseEnter={(event: any) => {
            if (!this.props.locked) {
              if (tracking.brushing) {
                // increase brush range
                filterByIndex(function(index: number) {
                  return (
                    (index >= tracking.anchor && index <= i) ||
                    (index <= tracking.anchor && index >= i)
                  );
                });
              } else {
                // highlight a single token
                filterByIndex(function(index: number) {
                  return index === i;
                });
              }
            }
          }}

          onMouseDown={(event: any) => {
            tracking.anchor = i;           
            tracking.brushing = true;             
            if (!this.props.locked) {
            } else {
              this.props.lock(false);
              this.props.filterByIndex(function(index: number) {
                return index === i;
              });
            }
          }}

          onMouseUp={(event: any) => {
            const wasBrushing = this.tracking.brushing;
            tracking.brushing = false;            
            if (!this.props.locked && wasBrushing) {
              this.props.lock(true);              
            }
          }}
        >
          {`${token} `}
        </span>
      )
    });

    return (
      <div className="OutputText" 
      
      onMouseOut={() => {
        if (!this.props.locked) {
          filterByIndex(null);
        }
      }}
      >
        <div className="content">
          <div className="text">
            {text}
          </div>
        </div>
      </div>
    )
  }
}