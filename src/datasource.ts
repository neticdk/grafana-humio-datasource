import defaults from 'lodash/defaults';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BackendSrvRequest, FetchResponse, getBackendSrv } from '@grafana/runtime';
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  DataSourceApi,
  Labels,
} from '@grafana/data';

import { HumioQuery, HumioDataSourceOptions, HumioSearchResult, defaultQuery } from './types';

export class DataSource extends DataSourceApi<HumioQuery, HumioDataSourceOptions> {
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
          return { events: result.data } as HumioSearchResult;
        })
      );
  }

  query(options: DataQueryRequest<HumioQuery>): Observable<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // TODO: Configuration??
    const ignoredFields = ['name', '@rawstring', '@id'];

    const queries = options.targets.map((target) => {
      const query = defaults(target, defaultQuery);
      query.start = from;
      query.end = to;

      return this.search(query).pipe(
        map((result) => {
          // Validate the result - what if aggregate query??? like "count()":
          // [{"_count":"64"}]

          return result.events.map((event) => {
            const labels = Object.keys(event)
              .filter((v: string, i: number, a: any[]) => [...ignoredFields, '@timestamp', 'message'].indexOf(v) === -1)
              .reduce((acc, ev) => {
                acc[ev] = event[ev];
                return acc;
              }, {} as Labels);

            const dataFrame = new MutableDataFrame({
              refId: query.refId,
              meta: {
                preferredVisualisationType: 'logs',
              },
              fields: [
                { name: '@timestamp', type: FieldType.time },
                { name: 'message', type: FieldType.string, labels: labels },
                { name: 'id', type: FieldType.string },
              ],
            });

            event['id'] = event['@id'];
            ignoredFields.forEach((f) => {
              delete event[f];
            });
            dataFrame.add(event);

            return dataFrame;
          });
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
