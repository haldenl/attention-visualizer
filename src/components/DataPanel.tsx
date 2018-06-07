import * as React from 'react';
import * as classNames from 'classnames';
import ReactJson from 'react-json-view';

import '../styles/DataPanel.css';

import expand from '../images/expand.svg';

import { AttentionData } from './AttentionVisualizer';

interface Props {
  data: AttentionData;
  lock: (lock: boolean) => void;
  setDataSource: (dataRecord: DataRecord) => void;
  currentDataSource: DataRecord;
}

interface State {
  full: boolean;
  bounce: boolean;
  addingSource: boolean;
  dataSources: DataRecord[];
}

const STORAGE_KEY = 'attention-visualization-data-sources';

const MICHELLE_MODEL = 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/model_data_0.json';
const MICHELLE_HIERARCHICAL = 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/hierarchical_similarity_data_michelle_3.json';
const MICHELLE_TEACHER =
'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/teacher_data_0.json';
const MICHELLE_MODEL_RECORD: DataRecord = { name: 'michelle_model', url: MICHELLE_MODEL };
const MICHELLE_HIERARCHICAL_RECORD: DataRecord = { name: 'michelle_hierarchical', url: MICHELLE_HIERARCHICAL };
const MICHELLE_TEACHER_RECORD: DataRecord = { name: 'michelle_teacher', url: MICHELLE_TEACHER };

const DEMOS: DataRecord[] = [MICHELLE_MODEL_RECORD, MICHELLE_HIERARCHICAL_RECORD, MICHELLE_TEACHER_RECORD];

export interface DataRecord {
  name: string;
  url: string;
}

export default class ControlPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      full: false,
      bounce: false,
      addingSource: false,
      dataSources: []
    }
  }

  componentDidMount() {
    const dataSources = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (dataSources && dataSources.length > 0) {
      this.setState({ dataSources });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMOS));
      this.setState({
        dataSources: DEMOS
      });
    }
  }

  render() {
    return (
      <div className={classNames({
        'DataPanel': true,
        'full': this.state.full,
        'bounce': this.state.bounce
      })}>
        <div className="insides">
          <div className="expand-button"
            onMouseEnter={() => {
              this.setState({ bounce: !this.state.full })
            }}

            onMouseLeave={() => {
              this.setState({ bounce: false })
            }}

            onClick={() => {
              this.setState({ full: !this.state.full });
            }}
          >
            <img className={classNames({
              'expand': true, 'retract': this.state.full
            })} src={expand} />
          </div>
          <div className="current-dataset">
            {this.props.currentDataSource ?
              `current dataset: ${this.props.currentDataSource.name}` : ''
            }
          </div>
          <div className="info">
            <div className="title">
              Data Sources:
            </div>
            <div className="data-content">
              <div className="data-sources">
                <ul>
                  <li key={-1} className="example-json">
                    <a className="url" href={`${window.location}static/AttentionDataExample.json`} target="_blank">example json</a>
                  </li>
                  {
                    this.state.dataSources.map((d: DataRecord, i: number) => {
                      return (
                        <li key={i}>
                          <div className="data-source">
                            <div className="name">
                              {d.name}
                            </div>
                            <a className="url" href={d.url} target="_blank">
                              {d.url}
                            </a>
                            <div className="actions">
                              {
                                // @ts-ignore
                                DEMOS.map((d: DataRecord) => { return d.name }).includes(d.name) ? null :
                                  <button className="remove" onClick={() => {
                                    this.state.dataSources.splice(i, 1);
                                    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.dataSources));
                                    this.setState({ dataSources: this.state.dataSources });
                                  }}>
                                    delete
                              </button>
                              }
                              <button className="load" onClick={() => {
                                this.props.setDataSource(d);
                              }}>
                                load
                            </button>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  }
                </ul>
              </div>
              <div className="controls">
                {
                  this.state.addingSource ?
                    <div className="table">
                      <div className="row">
                        <div className="bold">name:</div>
                        <input id="name-input" className="cell text-input" type="text" />
                      </div>
                      <div className="row">
                        <div className="bold">url:</div>
                        <input id="url-input" className="cell text-input" type="text" />
                      </div>
                    </div>
                    :
                    null
                }
                {!this.state.addingSource ?
                  <button className="add-data-button" onClick={() => {
                    this.setState({ addingSource: true });
                  }}>
                    add a source
                </button>
                  :
                  <div>
                    <button className="cancel-data-button" onClick={() => {
                      this.setState({ addingSource: false });
                    }}>
                      cancel
                  </button>
                    <button className="submit-data-button" onClick={() => {
                      // @ts-ignore
                      const name = document.getElementById('name-input').value;
                      // @ts-ignore
                      const url = document.getElementById('url-input').value;
                      const dataSource: DataRecord = { name, url };

                      const dataSources = this.state.dataSources.concat([dataSource]);

                      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataSources));
                      this.setState({ addingSource: false, dataSources });
                      this.props.setDataSource(dataSource);
                    }}>
                      submit
                  </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  static retrieveFirstDataSource() {
    const dataSources = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (dataSources !== null && dataSources.length > 0) {
      return dataSources[0];
    } else {
      return null;
    }
  }
}
