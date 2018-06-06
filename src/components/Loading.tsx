import * as React from 'react';

import '../styles/Loading.css';

export default class Loading extends React.Component<any, any> {
  render() {
    return (
      <div className="Loading">
        <div className="loader"/>
      </div>
    );
  }
}