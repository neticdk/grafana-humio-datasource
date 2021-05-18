import defaults from 'lodash/defaults';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BackendSrvRequest, FetchResponse, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { DataQueryRequest, DataQueryResponse, DataSourceInstanceSettings, DataSourceApi } from '@grafana/data';

import { HumioQuery, HumioDataSourceOptions, HumioSearchResult, defaultQuery } from './types';
import { HumioQueryResult } from 'query_result';

export class HumioDataSource extends DataSourceApi<HumioQuery, HumioDataSourceOptions> {
  constructor(private instanceSettings: DataSourceInstanceSettings<HumioDataSourceOptions>) {
    super(instanceSettings);
  }

  private search(query: HumioQuery): Observable<HumioSearchResult> {
    const options: BackendSrvRequest = {
      url: `${this.instanceSettings.url}/api/v1/repositories/${this.instanceSettings.jsonData.repository}/query`,
      method: 'POST',
      data: {
        queryString: query.queryString,
        start: query.start,
        end: query.end,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    return getBackendSrv()
      .fetch<any[]>(options)
      .pipe(
        map((result) => {
          return new HumioQueryResult(result.data, query.refId, this.instanceSettings.jsonData.derivedFields ?? []);
        })
      );
  }

  query(options: DataQueryRequest<HumioQuery>): Observable<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    const queries = options.targets
      .filter((target) => !target.hide)
      .map((target) => ({
        ...target,
        queryString: getTemplateSrv().replace(target.queryString, options.scopedVars, 'regex'),
      }))
      .map((target) => {
        const query = defaults(target, defaultQuery);
        query.start = from;
        query.end = to;

        return this.search(query).pipe(
          map((result) => {
            return result.toDataFrames();
          })
        );
      });

    return forkJoin(queries).pipe(
      map((results) => {
        return { data: results.flat() };
      })
    );
  }

  modifyQuery(query: HumioQuery, action: any): HumioQuery {
    let queryString = query.queryString;
    switch (action.type) {
      case 'ADD_FILTER': {
        queryString = queryString + ' | "' + action.key + '" = "' + action.value + '"';
        break;
      }
      case 'ADD_FILTER_OUT': {
        queryString = queryString + ' | "' + action.key + '" != "' + action.value + '"';
        break;
      }
      default:
        break;
    }
    return { ...query, queryString };
  }

  testDatasource() {
    const options: BackendSrvRequest = {
      url: `${this.instanceSettings.url}/api/v1/status`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    };
    return getBackendSrv()
      .fetch<any>(options)
      .pipe(
        map((result: FetchResponse<any>) => {
          return {
            status: result.status === 200 ? 'success' : 'error',
            message: result.statusText,
          };
        })
      )
      .toPromise();
  }
}
