import * as React from 'react';

import '../styles/ControlPanel.css';

import lock from '../images/lock.svg';
import openLock from '../images/unlocked.svg';

interface Props {
  lock: (lock: boolean) => void;
  locked: boolean;
  filterByOutputIndex: (filter: (index: number) => boolean) => void;
  filterByEdgeTokenMatch: (match: boolean) => void;
}

interface State {

}

export default class ControlPanel extends React.Component<Props, State> {

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
          <ul className="instructions">
            <li className="instruction"><span className="bold">Hover</span> over either text or nodes to create a filter.</li>
            <li className="instruction"><span className="bold">Click and drag</span> over the output text / nodes to brush.</li>
            <li className="instruction">Clicking on any node / text locks the current selection.</li>
            <li className="instruction">Input tokens that appear on the flowmap are <span className="underline">underlined.</span></li>
          </ul>
          <br />
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
                </span> edges represent same-word attention.
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
                </span> edges represent different-word attention.
              </div>
          <br />
          {this.props.locked ?
            <img className="locks" src={lock} /> : <img className="locks" src={openLock} />
          }
          <div>click on available white-space to clear a selection.</div>
        </div>
      </div>
    )
  }
}
