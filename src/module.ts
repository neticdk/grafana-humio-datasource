import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './configuration/ConfigEditor';
import { HumioQueryEditor } from './components/HumioQueryEditor';
import { HumioQuery, HumioDataSourceOptions } from './types';
import { HumioExploreQueryEditor } from 'components/HumioExploreQueryEditor';

export const plugin = new DataSourcePlugin<DataSource, HumioQuery, HumioDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(HumioQueryEditor)
  .setExploreQueryField(HumioExploreQueryEditor);
