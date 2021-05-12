import defaults from 'lodash/defaults';

import React, { PureComponent } from 'react';
import { QueryField } from '@grafana/ui';
import { ExploreQueryFieldProps } from '@grafana/data';
import { DataSource } from 'datasource';
import { defaultQuery, HumioDataSourceOptions, HumioQuery } from 'types';

type Props = ExploreQueryFieldProps<DataSource, HumioQuery, HumioDataSourceOptions>;

export class HumioExploreQueryEditor extends PureComponent<Props> {
  onChangeQuery = (value: string, override?: boolean) => {
    const { query, onChange, onRunQuery } = this.props;
    if (onChange) {
      onChange({ ...query, queryString: value });
      if (override && onRunQuery) {
        onRunQuery();
      }
    }
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
