import * as React from 'react';
import Slider from 'react-rangeslider';

import '../styles/ControlPanel.css';
import 'react-rangeslider/lib/index.css'

import lock from '../images/lock.svg';
import openLock from '../images/unlocked.svg';

interface Props {
  lock: (lock: boolean) => void;
  locked: boolean;
  filterByOutputIndex: (filter: (index: number) => boolean) => void;
  filterByEdgeTokenMatch: (match: boolean) => void;
  setWeightThreshold: (edgeThreshold: number) => void;
  weightThreshold: number;
}

interface State {
  weightThreshold: number;
}

export default class ControlPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      weightThreshold: this.props.weightThreshold
    }
  }

  render() {
    return (
      <div className="ControlPanel"
        onClick={() => {
          if (this.props.locked) {
            this.props.lock(false);
            this.props.filterByOutputIndex(null);
          }
        }}
      >
        <div className="guide">
          <div className="instructions">Darker colors (text, nodes) and large widths (edges) indicate higher attention.</div>
          <br/>
          <div className="instructions">Italicized output tokens are novel (they do not appear in the input sequence).</div>
          <ul className="instructions">
            <li className="instruction"><span className="bold">Hover</span> over either text or nodes to create a filter.</li>
            <li className="instruction"><span className="bold">Click and drag</span> over the output text / nodes to brush.</li>
            <li className="instruction">Clicking on any node / text locks the current selection.</li>
            <li className="instruction">Input tokens that appear on the flowmap are <span className="underline">underlined.</span></li>
            <li className="instruction">Set the range of input tokens displayed using the input sequence brush on the far left of the flow map.</li>
          </ul>
          <div className='slider'>
            <Slider
              min={0.005}
              max={1}
              step={0.005}
              value={this.state.weightThreshold}
              onChangeStart={() => {
                this.props.lock(true);
              }}
              onChange={(weightThreshold: number) => {
                weightThreshold = Math.round(weightThreshold * 1000) / 1000;
                this.setState({ weightThreshold })
              }}
              onChangeComplete={() => { 
                this.props.lock(false);
                this.props.setWeightThreshold(this.state.weightThreshold);
              }}
            />
            <div className='value'><span style={{ fontWeight: 400 }}>Weight Threshold: </span>{`${this.props.weightThreshold}`}</div>
          </div>
          <br/>
          <br/>
          <div>The legend below is clickable.</div>
          <br />
          <div className="legend-clickable" onClick={(e: any) => {
            this.props.lock(false);
            this.props.filterByEdgeTokenMatch(true);
            this.props.lock(true);
            e.stopPropagation();
          }}>
            <span style={{ fontWeight: 400, color: 'rgb(59, 136, 190)' }}>
              blue
                </span> edges encode same-word attention.
              </div>
          <div className="legend-clickable" onClick={(e: any) => {
            this.props.lock(false);
            this.props.filterByEdgeTokenMatch(false);
            this.props.lock(true);
            e.stopPropagation();
          }}
          >
            <span style={{ fontWeight: 400, color: 'rgb(250, 160, 133)' }}>
              orange
                </span> edges encode different-word attention.
              </div>
          <br />
          {this.props.locked ?
            <img className="locks" onClick={() => {
              this.props.lock(false);
            }} src={lock} /> : <img className="locks" src={openLock} onClick={() => {
              this.props.lock(true);
            }}/>
          }
          <div>click on available white-space to clear a selection.</div>
          <br/>
          <div style={{ fontWeight: 400 }}>expand the panel below to choose or load a dataset.</div>
        </div>
      </div>
    )
  }
}
