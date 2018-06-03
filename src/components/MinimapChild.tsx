import * as React from 'react';
import '../styles/MinimapChild.css';

interface Props {
  width: number;
  height: number;
  top: number;
  left: number;
  node: any;
}

interface State {
}

export default class MinimapChild extends React.Component<Props, State> {
  render() {
    const {width, height, left, top, node} = this.props;
    
    return (
      <div
        style={{
          position: 'absolute',
          width,
          height,
          left,
          top,
          backgroundColor: this.props.node.style.backgroundColor
        }}
        className="MinimapChild"
      ></div>
    );
  }
}
