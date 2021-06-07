import defaults from 'lodash/defaults';

import React, { PureComponent } from 'react';
import { QueryField } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { HumioDataSource } from '../datasource';
import { defaultQuery, HumioDataSourceOptions, HumioQuery } from '../types';

type Props = QueryEditorProps<HumioDataSource, HumioQuery, HumioDataSourceOptions>;

export class HumioQueryEditor extends PureComponent<Props> {
  onChangeQuery = (value: string) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryString: value });
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    return (
      <div className="gf-form">
        <QueryField
          query={query.queryString}
          onChange={this.onChangeQuery}
          onBlur={this.props.onBlur}
          onRunQuery={this.props.onRunQuery}
          placeholder="Enter a Humio query (run with Shift+Enter)"
          portalOrigin="humio"
        />
      </div>
    );
  }
}
