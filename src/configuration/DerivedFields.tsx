import React from 'react';
import { css } from '@emotion/css';
import { Button, stylesFactory, useTheme } from '@grafana/ui';
import { GrafanaTheme, VariableOrigin, DataLinkBuiltInVars } from '@grafana/data';
import { DerivedFieldConfig } from '../types';
import { DerivedField } from './DerivedField';

const getStyles = stylesFactory((theme: GrafanaTheme) => ({
  infoText: css`
    padding-bottom: ${theme.spacing.md};
    color: ${theme.colors.textWeak};
  `,
  derivedField: css`
    margin-bottom: ${theme.spacing.sm};
  `,
}));

type Props = {
  value?: DerivedFieldConfig[];
  onChange: (value: DerivedFieldConfig[]) => void;
};

export const DerivedFields = (props: Props) => {
  const { value, onChange } = props;
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <>
      <h3 className="page-heading">Derived fields</h3>

      <div className={styles.infoText}>
        Derived fields can be used to extract new fields from a log message and create a link from its value.
      </div>
      <div className="gf-form-group">
        {value &&
          value.map((field, index) => {
            return (
              <DerivedField
                className={styles.derivedField}
                key={index}
                value={field}
                onChange={(newField) => {
                  const newDerivedFields = [...value];
                  newDerivedFields.splice(index, 1, newField);
                  onChange(newDerivedFields);
                }}
                onDelete={() => {
                  const newDerivedFields = [...value];
                  newDerivedFields.splice(index, 1);
                  onChange(newDerivedFields);
                }}
                suggestions={[
                  {
                    value: DataLinkBuiltInVars.valueRaw,
                    label: 'Raw value',
                    documentation: 'Exact string captured by the regular expression',
                    origin: VariableOrigin.Value,
                  },
                ]}
              />
            );
          })}
        <div>
          <Button
            variant="secondary"
            className={css`
              margin-right: 10px;
            `}
            icon="plus"
            onClick={(event) => {
              event.preventDefault();
              const newDerivedFields = [...(value || []), { name: '', matcherRegex: '' }];
              onChange(newDerivedFields);
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </>
  );
};
