import { DataSourcePlugin } from '@grafana/data';
import { HumioDataSource } from './datasource';
import { ConfigEditor } from './configuration/ConfigEditor';
import { HumioQueryEditor } from './components/HumioQueryEditor';
import { HumioQuery, HumioDataSourceOptions } from './types';
import { HumioExploreQueryEditor } from 'components/HumioExploreQueryEditor';

export const plugin = new DataSourcePlugin<HumioDataSource, HumioQuery, HumioDataSourceOptions>(HumioDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(HumioQueryEditor)
  .setExploreQueryField(HumioExploreQueryEditor);
