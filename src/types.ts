import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface HumioQuery extends DataQuery {
  queryString: string;
  start: number;
  end: number;
}

export const defaultQuery: Partial<HumioQuery> = {
  queryString: '',
};

/**
 * These are options configured for each DataSource instance
 */
export interface HumioDataSourceOptions extends DataSourceJsonData {
  repository: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface HumioSecureJsonData {
  apiToken: string;
}

export interface HumioSearchResult {
  events: any[];
}
