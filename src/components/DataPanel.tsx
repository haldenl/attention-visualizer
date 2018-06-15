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
  dataIndex: number;
}

const STORAGE_KEY = 'attention-visualization-data-sources';

const DEMO = 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/manchester_data_0.json';
const MICHELLE_MODEL = 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/model_data_0.json';
const MICHELLE_HIERARCHICAL = 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/hierarchical_similarity_data_michelle_3.json';
const MICHELLE_TEACHER =
'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/teacher_data_0.json';
const DEMO_RECORD: DataRecord = { name: 'DEMO', url: DEMO }
const MICHELLE_MODEL_RECORD: DataRecord = { name: 'michelle_model_attention', url: MICHELLE_MODEL };
const MICHELLE_HIERARCHICAL_RECORD: DataRecord = { name: 'michelle_hierarchical_similarity', url: MICHELLE_HIERARCHICAL };
const MICHELLE_TEACHER_RECORD: DataRecord = { name: 'michelle_teacher_forcing', url: MICHELLE_TEACHER };
const WOMEN_MODEL_RECORD: DataRecord = {
  name: 'women_model_attention', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/model_data_5.json'
}
const WOMEN_TEACHER_RECORD: DataRecord = {
  name: 'women_teacher_forcing', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/teacher_data_5.json'
}
const WOMEN_HIERARCHICAL_RECORD: DataRecord = {
  name: 'women_hierchical_similarity', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/hierarchical_similarity_data_women_1.json'
}
const CHARLOTTE_MODEL_RECORD: DataRecord = {
  name: 'charlotte_model_attention', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/model_data_15.json'
}
const CHARLOTTE_TEACHER_RECORD: DataRecord = {
  name: 'charlotte_teacher_forcing', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/teacher_data_15.json'
}
const CHARLOTTE_HIERARCHICAL_RECORD: DataRecord = {
  name: 'charlotte_hierarchical_similarity', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/hierarchical_similarity_data_charlotte.json'
}
const SPACE_MODEL_RECORD: DataRecord = {
  name: 'space_model_attention', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/model_data_2.json'
}
const SPACE_TEACHER_RECORD: DataRecord = {
  name: 'space_teacher_forcing', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/teacher_data_2.json'
}
const SPACE_HIERARCHICAL_RECORD: DataRecord = {
  name: 'space_hierarchical_similarity', url: 'https://raw.githubusercontent.com/haldenl/nlpcapstone/master/data/hierarchical_similarity_data_space.json'
}


const DEMOS: DataRecord[] = [DEMO_RECORD, MICHELLE_MODEL_RECORD, MICHELLE_TEACHER_RECORD, MICHELLE_HIERARCHICAL_RECORD,
  WOMEN_MODEL_RECORD, WOMEN_TEACHER_RECORD, WOMEN_HIERARCHICAL_RECORD, CHARLOTTE_MODEL_RECORD, CHARLOTTE_TEACHER_RECORD,
  CHARLOTTE_HIERARCHICAL_RECORD, SPACE_MODEL_RECORD, SPACE_TEACHER_RECORD, SPACE_HIERARCHICAL_RECORD];

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
      dataSources: [],
      dataIndex: 0
    }
  }

  componentDidMount() {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const dataSources = storage ? storage.dataSources : null;
    const dataIndex = storage ? storage.index : 0;

    if (dataSources && dataSources.length > 0) {
      this.setState({ dataSources, dataIndex: 0 });
    } else {
      console.log('setting demos');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: 0, dataSources: DEMOS }));
      this.setState({
        dataSources: DEMOS,
        dataIndex: 0
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
                                d.name === 'DEMO' ? null :
                                  <button className="remove" onClick={() => {
                                    this.state.dataSources.splice(i, 1);
                                    const storage = { index: this.state.dataIndex, dataSources: this.state.dataSources};
                                    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
                                    this.setState({
                                      dataSources: this.state.dataSources,
                                      dataIndex: this.state.dataIndex > i ? this.state.dataIndex - 1 : this.state.dataIndex
                                    });
                                  }}>
                                    delete
                              </button>
                              }
                              <button className="load" onClick={() => {
                                this.setState({
                                  dataIndex: i
                                });

                                const storage = {
                                  index: i,
                                  dataSources: this.state.dataSources
                                }
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
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

                      const storage = { 'index': dataSources.length - 1, 'dataSources': dataSources };
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
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
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const dataSources = storage ? storage.dataSources : null;
    const dataIndex = storage ? storage.index : 0;

    if (dataSources !== null && dataSources.length > 0 && dataIndex < dataSources.length) {
      return dataSources[dataIndex];
    } else {
      return null;
    }
  }
}
