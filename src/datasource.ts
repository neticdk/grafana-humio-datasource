import defaults from 'lodash/defaults';
import { forkJoin, interval, Observable } from 'rxjs';
import { exhaustMap, last, map, skipWhile, switchMap, take } from 'rxjs/operators';
import { BackendSrvRequest, FetchResponse, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { DataQueryRequest, DataQueryResponse, DataSourceInstanceSettings, DataSourceApi } from '@grafana/data';

import {
  HumioQuery,
  HumioDataSourceOptions,
  HumioSearchResult,
  defaultQuery,
  HumioQueryJobData,
  HumioQueryResponse,
} from './types';
import { HumioQueryResult } from 'query_result';

export class HumioDataSource extends DataSourceApi<HumioQuery, HumioDataSourceOptions> {
  constructor(private instanceSettings: DataSourceInstanceSettings<HumioDataSourceOptions>) {
    super(instanceSettings);
  }

  private queryJobCreate(query: HumioQuery): BackendSrvRequest {
    return {
      url: `${this.instanceSettings.url}/api/v1/repositories/${this.instanceSettings.jsonData.repository}/queryjobs`,
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
  }

  private queryJobPoll(id: string): BackendSrvRequest {
    return {
      url: `${this.instanceSettings.url}/api/v1/repositories/${this.instanceSettings.jsonData.repository}/queryjobs/${id}`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    };
  }

  private search(query: HumioQuery): Observable<HumioSearchResult> {
    return getBackendSrv()
      .fetch<HumioQueryJobData>(this.queryJobCreate(query))
      .pipe(
        switchMap((response) => interval(500).pipe(map((_) => response.data.id))),
        exhaustMap((id) => getBackendSrv().fetch<HumioQueryResponse>(this.queryJobPoll(id))),
        map((response) => {
          if (response.data.cancelled) {
            throw new Error('Humio query job has been cancelled');
          }
          return response.data;
        }),
        skipWhile((response) => !response.done),
        take(1),
        map(
          (response) =>
            new HumioQueryResult(response.events, query.refId, this.instanceSettings.jsonData.derivedFields ?? [])
        ),
        last()
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
