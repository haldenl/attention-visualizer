import * as React from 'react';
import * as classNames from 'classnames';

import '../styles/OutputText.css';

interface Props {
  data: OutputRecord[];
  filterByIndex: (filter: (index: number) => boolean) => void;
}

interface State {

}

export interface OutputRecord {
  index: number;
  token: string;
  pos: string;
  selected?: boolean;
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
  }

  render() {
    const filterByIndex = this.props.filterByIndex;
    const tracking = this.tracking;

    const text = this.props.data.map((record: OutputRecord, i: number) => {
      const token = record.token;
      
      const classes  = classNames({
        token: true,
        selected: record.selected
      });

      return (
        <span className={classes} key={i}

          onMouseEnter={function(event: any) {
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
          }}

          onMouseDown={function(event: any) {
            tracking.anchor = i;
            tracking.brushing = true;
          }}

          onMouseUp={function(event: any) {
            tracking.brushing = false;
          }}
        >
          {`${token} `}
        </span>
      )
    });

    return (
      <div className="OutputText" 
      
      onMouseOut={function() {
        filterByIndex(null);
      }}>
        <div className="text">
          {text}
        </div>
      </div>
    )
  }
}