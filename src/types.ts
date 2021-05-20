import { DataFrame, DataQuery, DataSourceJsonData, LoadingState } from '@grafana/data';

/**
 * Structure of a query for Humio data
 */
export interface HumioQuery extends DataQuery {
  queryString: string;
  start: number;
  end: number;
}

/**
 * Default query is the empty query
 */
export const defaultQuery: Partial<HumioQuery> = {
  queryString: '',
};

/**
 * Configuration options for the Humio data source
 */
export interface HumioDataSourceOptions extends DataSourceJsonData {
  repository: string;
  derivedFields?: DerivedFieldConfig[];
}

/**
 * Secure configuration options for the Humio data source
 */
export interface HumioSecureJsonData {
  apiToken: string;
}

/**
 * Definition of search result structure
 */
export interface HumioSearchResult {
  events: any[];
  state: LoadingState;

  toDataFrames(): DataFrame[];
}

/**
 * Configuration of derived fields to be used for data links - this is modelled similar to the Loki derived fields configuration
 */
export type DerivedFieldConfig = {
  matcherRegex: string;
  name: string;
  url?: string;
  datasourceUid?: string;
};

/**
 * Response when creating a new query job in Humio
 */
export interface HumioQueryJobData {
  id: string;
  queryOnView: string;
}

export interface HumioQueryResponse {
  cancelled: boolean;
  done: boolean;
  events: any[];
  metaData: {
    costs: any;
    eventCount: number;
    extraData: any;
    fieldOrder?: string[];
    filterQuery: any;
    isAggregate: boolean;
    pollAfter: number;
    processedBytes: number;
    processedEvents: number;
    queryStart: number;
    queryEnd: number;
    resultBufferSize: number;
    timeMillis: number;
    totalWork: number;
    warnings: any[];
    workDone: number;
  };
  queryEventDistribution?: any;
}
