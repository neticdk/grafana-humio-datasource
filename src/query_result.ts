import {
  DataFrame,
  DataLink,
  FieldType,
  guessFieldTypeFromValue,
  Labels,
  LoadingState,
  MutableDataFrame,
} from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { groupBy } from 'lodash';
import { DerivedFieldConfig, HumioSearchResult } from 'types';

const TS_FIELD = '@timestamp';
const ID_FIELD = '@id';

export class HumioQueryResult implements HumioSearchResult {
  private ignoredFields = [
    'name',
    '@rawstring',
    'timestamp',
    '@ingesttimestamp',
    '@timestamp.nanos',
    '@timezone',
    '#repo',
    '#type',
    TS_FIELD,
    ID_FIELD,
  ];
  private messageField = 'message';

  constructor(
    public events: any[],
    private aggregate: boolean,
    private refId: string,
    private derivedFields: DerivedFieldConfig[],
    public state: LoadingState
  ) {}

  toDataFrames(): DataFrame[] {
    if (this.events.length === 0) {
      return [];
    }

    if (!this.aggregate) {
      return this.toLogFrames();
    } else {
      return this.toMetricFrame();
    }
  }

  private toLogFrames(): DataFrame[] {
    return this.events.map((event) => {
      const labels = Object.keys(event)
        .filter((v: string, i: number, a: any[]) => [...this.ignoredFields, this.messageField].indexOf(v) === -1)
        .reduce((acc, ev) => {
          acc[ev] = event[ev];
          return acc;
        }, {} as Labels);

      const derived = this.deriveFields(event[this.messageField]);
      const dataFrame = new MutableDataFrame({
        refId: this.refId,
        meta: {
          preferredVisualisationType: 'logs',
        },
        fields: [
          { name: 'timestamp', type: FieldType.time },
          { name: 'message', type: FieldType.string, labels: labels },
          { name: 'id', type: FieldType.string },
          ...derived.fields,
        ],
      });
      dataFrame.add({
        timestamp: event[TS_FIELD],
        message: event[this.messageField],
        id: event[ID_FIELD],
        ...derived.values,
      });

      return dataFrame;
    });
  }

  private toMetricFrame(): DataFrame[] {
    const fields = Object.keys(this.events[0]).map((key) => {
      return { name: key, type: guessFieldTypeFromValue(this.events[0][key]) };
    });
    const dataFrame = new MutableDataFrame({
      refId: this.refId,
      fields: fields,
    });
    this.events.forEach((event) => {
      dataFrame.add(event);
    });
    return [dataFrame];
  }

  private deriveFields(message: string): { fields: any[]; values: any[] } {
    if (this.deriveFields.length === 0) {
      return { fields: [], values: [] };
    }

    const derivedFieldsGrouped = groupBy(this.derivedFields, 'name');
    const dataSourceSrv = getDataSourceSrv();

    const data = Object.values(derivedFieldsGrouped).reduce(
      (data, config: DerivedFieldConfig[]) => {
        const match = message.match(config[0].matcherRegex);
        if (match && match[1]) {
          const dataLinks = config.reduce((links, fieldConfig) => {
            if (fieldConfig.datasourceUid) {
              const dsSettings = dataSourceSrv.getInstanceSettings(fieldConfig.datasourceUid);
              links.push({
                title: '',
                url: '',
                // This is hardcoded for Jaeger or Zipkin - no way right now to specify datasource specific query object
                internal: {
                  query: { query: fieldConfig.url },
                  datasourceUid: fieldConfig.datasourceUid,
                  datasourceName: dsSettings?.name ?? 'Data source not found',
                },
              });
            } else if (fieldConfig.url) {
              links.push({
                // We do not know what title to give here so we count on presentation layer to create a title from metadata.
                title: '',
                // This is hardcoded for Jaeger or Zipkin - no way right now to specify datasource specific query object
                url: fieldConfig.url,
              });
            }
            return links;
          }, [] as DataLink[]);

          data.fields.push({
            name: config[0].name,
            config: {
              links: dataLinks,
            },
            type: FieldType.string,
          });
          data.values[config[0].name] = match[1];
        }

        return data;
      },
      { fields: [] as any[], values: {} as any }
    );
    return data;
  }
}
