import { CoreApp, DataQuery, DataQueryRequest, dateTime, FieldType, MutableDataFrame } from '@grafana/data';
import { HumioDataSource } from 'datasource';
import { HumioQuery } from 'types';
import { TestScheduler } from 'rxjs/testing';
import { of } from 'rxjs';

const mockFetch = jest.fn();
// @ts-ignore
const backendSrv = { fetch: mockFetch };

const mockReplace = jest.fn();
// @ts-ignore
const templateSrv = { replace: mockReplace };

jest.mock('@grafana/runtime', () => ({
  // @ts-ignore
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => backendSrv,
  getTemplateSrv: () => templateSrv,
}));

describe('HumioDatasource', () => {
  let scheduler: TestScheduler;

  beforeEach(
    () =>
      (scheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected);
      }))
  );

  describe('when querying', () => {
    it('should return series for logs query', () => {
      const instanceSettings: any = {
        jsonData: {
          repository: 'main-repo',
        },
      };
      const ds = new HumioDataSource(instanceSettings);
      const options: DataQueryRequest<HumioQuery> = getQueryOptions({
        targets: [{ refId: 'A', queryString: '', start: 0, end: 0 }],
      });

      const event = { '@timestamp': 1620646839343, message: 'Some message', '@id': 'unique' };
      mockFetch.mockImplementationOnce(
        fetchResponse({
          id: 'xxx',
        })
      );
      mockFetch.mockImplementationOnce(
        fetchResponse({
          done: false,
          events: [],
          metaData: {
            isAggregate: false,
          },
        })
      );
      mockFetch.mockImplementationOnce(
        fetchResponse({
          done: true,
          events: [event],
          metaData: {
            isAggregate: false,
          },
        })
      );

      const result = new MutableDataFrame({
        refId: 'A',
        meta: {
          preferredVisualisationType: 'logs',
        },
        fields: [
          { name: 'timestamp', type: FieldType.time },
          { name: 'message', type: FieldType.string, labels: {} },
          { name: 'id', type: FieldType.string },
        ],
      });
      result.add({ timestamp: event['@timestamp'], message: event['message'], id: event['@id'] });

      scheduler.run(({ expectObservable }) => {
        expectObservable(ds.query(options)).toBe('500ms a 499ms (b|)', {
          a: { data: [], key: 'A' },
          b: { data: [result], key: 'A' },
        });
      });
    });
  });
});

function fetchResponse(data: any): (...args: any) => any {
  return () => {
    return of({
      data: data,
      status: 200,
      url: 'http://localhost:3000/api/tsdb/query',
      config: { url: 'http://localhost:3000/api/tsdb/query' },
      type: 'basic',
      statusText: 'Ok',
      redirected: false,
      headers: {} as unknown as Headers,
      ok: true,
    });
  };
}

function getQueryOptions<TQuery extends DataQuery>(
  options: Partial<DataQueryRequest<TQuery>>
): DataQueryRequest<TQuery> {
  const raw = { from: 'now', to: 'now-1h' };
  const range = { from: dateTime(), to: dateTime(), raw: raw };

  const defaults: DataQueryRequest<TQuery> = {
    requestId: 'TEST',
    app: CoreApp.Dashboard,
    range: range,
    targets: [],
    scopedVars: {},
    timezone: 'browser',
    panelId: 1,
    dashboardId: 1,
    interval: '60s',
    intervalMs: 60000,
    maxDataPoints: 500,
    startTime: 0,
  };

  Object.assign(defaults, options);

  return defaults;
}
