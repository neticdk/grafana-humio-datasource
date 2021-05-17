import { DataFrame, FieldType, guessFieldTypeFromValue, Labels, MutableDataFrame } from "@grafana/data";
import { HumioSearchResult } from "types";

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
  ];
  private messageField = 'message';

  constructor(public events: any[], private refId: string){}

  toDataFrames(): DataFrame[] {
    const logQuery = this.events.some((ev) => TS_FIELD in ev);
    if (logQuery) {
      return this.events.map((event) => {
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
          refId: this.refId,
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
    } else if (this.events.length === 0) {
      return [];
    } else {
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
  }
  
}
