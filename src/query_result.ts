import {
  ArrayVector,
  DataFrame,
  DataLink,
  Field,
  FieldType,
  guessFieldTypeFromValue,
  Labels,
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

  constructor(public events: any[], private refId: string, private derivedFields: DerivedFieldConfig[]) {}

  toDataFrames(): DataFrame[] {
    if (this.events.length === 0) {
      return [];
    }

    if (this.events.some((ev) => TS_FIELD in ev)) {
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
          ...derived,
        ],
      });
      dataFrame.add({
        timestamp: event[TS_FIELD],
        message: event[this.messageField],
        id: event[ID_FIELD],
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

  private deriveFields(message: string): Field[] {
    if (this.deriveFields.length === 0) {
      return [];
    }

    const derivedFieldsGrouped = groupBy(this.derivedFields, 'name');
    const dataSourceSrv = getDataSourceSrv();

    const fields = Object.values(derivedFieldsGrouped).reduce((fields, config: DerivedFieldConfig[]) => {
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

        fields.push({
          name: config[0].name,
          config: {
            links: dataLinks,
          },
          type: FieldType.string,
          values: new ArrayVector([match[1]]),
        });
      }

      return fields;
    }, [] as Field[]);

    return fields;
  }
}
