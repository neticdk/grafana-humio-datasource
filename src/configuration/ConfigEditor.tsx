import React, { ChangeEvent, PureComponent } from 'react';
import { DataSourceHttpSettings, LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { HumioDataSourceOptions, HumioSecureJsonData } from '../types';

const { SecretFormField, FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<HumioDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onHttpSettingsChange = (config: DataSourceSettings) => {
    const { onOptionsChange } = this.props;
    const options = config as DataSourceSettings<HumioDataSourceOptions>;
    onOptionsChange({ ...options });
  };

  onRepositoryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      repository: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
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
    const { options } = this.props;
    const { jsonData, secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as HumioSecureJsonData;

    return (
      <>
        <DataSourceHttpSettings
          defaultUrl={'http://localhost:3100'}
          dataSourceConfig={options}
          showAccessOptions={false}
          onChange={this.onHttpSettingsChange}
        />

        <div className="gf-form-group">
          <div className="gf-form">
            <FormField
              label="Repository"
              labelWidth={6}
              inputWidth={20}
              onChange={this.onRepositoryChange}
              value={jsonData.repository || ''}
              placeholder="Humio repository containing log data"
            />
          </div>

          <div className="gf-form-inline">
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
        </div>
      </>
    );
  }
}
