import React, { ChangeEvent, PureComponent } from 'react';
import { DataSourceHttpSettings, LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { HumioDataSourceOptions, HumioSecureJsonData } from '../types';
import { DerivedFields } from './DerivedFields';

const { SecretFormField, FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<HumioDataSourceOptions> {}

interface State {}

const makeJsonUpdater =
  <T extends any>(field: keyof HumioDataSourceOptions) =>
  (options: DataSourceSettings<HumioDataSourceOptions>, value: T): DataSourceSettings<HumioDataSourceOptions> => {
    return {
      ...options,
      jsonData: {
        ...options.jsonData,
        [field]: value,
      },
    };
  };

const setRepository = makeJsonUpdater('repository');
const setDerivedFields = makeJsonUpdater('derivedFields');

export class ConfigEditor extends PureComponent<Props, State> {
  onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        apiToken: event.target.value,
      },
    });
  };

  onResetAPIKey = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiToken: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        apiToken: '',
      },
    });
  };

  render() {
    const { options, onOptionsChange } = this.props;
    const { jsonData, secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as HumioSecureJsonData;

    return (
      <>
        <DataSourceHttpSettings
          defaultUrl={'http://localhost:3100'}
          dataSourceConfig={options}
          showAccessOptions={false}
          onChange={(config) => onOptionsChange(config as DataSourceSettings<HumioDataSourceOptions>)}
        />

        <div className="gf-form-group">
          <div className="gf-form">
            <FormField
              label="Repository"
              labelWidth={6}
              inputWidth={20}
              onChange={(event) => onOptionsChange(setRepository(options, event.target.value))}
              value={jsonData.repository || ''}
              placeholder="Humio repository containing log data"
            />
          </div>

          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.apiToken) as boolean}
              value={secureJsonData.apiToken || ''}
              label="API Key"
              placeholder="api token for Humio"
              labelWidth={6}
              inputWidth={20}
              onReset={this.onResetAPIKey}
              onChange={this.onAPIKeyChange}
            />
          </div>
        </div>

        <DerivedFields
          value={options.jsonData.derivedFields}
          onChange={(value) => onOptionsChange(setDerivedFields(options, value))}
        />
      </>
    );
  }
}
