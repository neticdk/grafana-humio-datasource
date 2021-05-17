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
  guessFieldTypeFromValue,
} from '@grafana/data';

import { HumioQuery, HumioDataSourceOptions, HumioSearchResult, defaultQuery } from './types';

const TS_FIELD = '@timestamp';
const ID_FIELD = '@id';

export class HumioDataSource extends DataSourceApi<HumioQuery, HumioDataSourceOptions> {
  private ignoredFields = [
    'name',
    '@rawstring',
    'timestamp',
    '@ingesttimestamp',
    '@timestamp.nanos',
    '@timezone',
    '#repo',
    '#type',
  ];
  private messageField = 'message';

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

    const queries = options.targets.map((target) => {
      const query = defaults(target, defaultQuery);
      query.start = from;
      query.end = to;

      return this.search(query).pipe(
        map((result) => {
          const logQuery = result.events.some((ev) => TS_FIELD in ev);
          if (logQuery) {
            return result.events.map((event) => {
              const labels = Object.keys(event)
                .filter(
                  (v: string, i: number, a: any[]) =>
                    [...this.ignoredFields, TS_FIELD, ID_FIELD, this.messageField].indexOf(v) === -1
                )
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
                  { name: 'timestamp', type: FieldType.time },
                  { name: 'message', type: FieldType.string, labels: labels },
                  { name: 'id', type: FieldType.string },
                ],
              });
              dataFrame.add({ timestamp: event[TS_FIELD], message: event[this.messageField], id: event[ID_FIELD] });
              return dataFrame;
            });
          } else if (result.events.length === 0) {
            return [];
          } else {
            const fields = Object.keys(result.events[0]).map((key) => {
              return { name: key, type: guessFieldTypeFromValue(result.events[0][key]) };
            });
            const dataFrame = new MutableDataFrame({
              refId: query.refId,
              fields: fields,
            });
            result.events.forEach((event) => {
              dataFrame.add(event);
            });
            return [dataFrame];
          }
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
