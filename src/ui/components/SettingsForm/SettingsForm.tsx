import { useState, useEffect } from 'react';
import { SchemaForm } from '../SchemaForm/SchemaForm.js';
import { loadNodeModule } from '../../node-module-loader.js';
import styles from './SettingsForm.module.css';

export interface SettingsField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  value: any;
  required?: boolean;
  options?: { label: string; value: any }[];
  description?: string;
  validation?: (value: any) => string | null;
}

// Convert SettingsField[] to Zod schema
const createSchemaFromFields = async (fields: SettingsField[]) => {
  const z = await loadNodeModule<any>('zod');
  if (!z) {
    throw new Error('Zod not available');
  }
  
  const schemaShape: Record<string, any> = {};
  
  for (const field of fields) {
    let fieldSchema: any;
    
    switch (field.type) {
      case 'text':
      case 'textarea':
        fieldSchema = z.string();
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        } else {
          fieldSchema = fieldSchema.optional();
        }
        break;
        
      case 'number':
        fieldSchema = z.number();
        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
        break;
        
      case 'boolean':
        fieldSchema = z.boolean();
        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
        break;
        
      case 'select':
        if (field.options && field.options.length > 0) {
          const enumValues = field.options.map(opt => opt.value);
          fieldSchema = z.enum(enumValues);
        } else {
          fieldSchema = z.string();
        }
        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
        break;
        
      default:
        fieldSchema = z.string();
        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
    }
    
    // Add custom validation if provided
    if (field.validation) {
      fieldSchema = fieldSchema.refine(
        (value: any) => {
          const error = field.validation!(value);
          return error === null;
        },
        (value: any) => {
          const error = field.validation!(value);
          return { message: error || 'Validation failed' };
        }
      );
    }
    
    schemaShape[field.key] = fieldSchema;
  }
  
  return z.object(schemaShape);
};

export interface SettingsFormProps {
  title: string;
  fields: SettingsField[];
  onSave: (values: Record<string, any>) => void;
  onCancel?: () => void;
  className?: string;
  loading?: boolean;
  enableJsonToggle?: boolean;
  defaultMode?: 'form' | 'json';
}

export function SettingsForm({ 
  title, 
  fields, 
  onSave, 
  onCancel, 
  className = '', 
  loading = false,
  enableJsonToggle = false,
  defaultMode = 'form'
}: SettingsFormProps) {
  const [schema, setSchema] = useState<any>(null);
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  const [schemaError, setSchemaError] = useState<string | null>(null);
  
  // Convert fields to schema and initial values
  useEffect(() => {
    const setupSchema = async () => {
      try {
        const zodSchema = await createSchemaFromFields(fields);
        setSchema(zodSchema);
        
        const values = fields.reduce((acc, field) => {
          acc[field.key] = field.value;
          return acc;
        }, {} as Record<string, any>);
        setInitialValues(values);
        setSchemaError(null);
      } catch (error) {
        console.error('Failed to create schema from fields:', error);
        setSchemaError(error instanceof Error ? error.message : 'Failed to create schema');
      }
    };
    
    setupSchema();
  }, [fields]);
  
  const handleSubmit = async (values: any, isValid: boolean) => {
    if (isValid) {
      await onSave(values);
    }
  };
  
  // Show error state if schema creation failed
  if (schemaError) {
    return (
      <div className={`${styles.settingsForm} ${className}`}>
        <div className="p-4 bg-danger-surface text-danger border border-danger rounded-lg">
          <h3 className="font-semibold mb-2">Configuration Error</h3>
          <p>{schemaError}</p>
        </div>
      </div>
    );
  }
  
  // Show loading state while schema is being created
  if (!schema) {
    return (
      <div className={`${styles.settingsForm} ${className}`}>
        <div className="p-4 text-center">
          <p className="text-theme-secondary">Loading configuration...</p>
        </div>
      </div>
    );
  }
  
  // Render SchemaForm once schema is ready
  return (
    <SchemaForm
      title={title}
      schema={schema}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      loading={loading}
      className={className}
      mode={enableJsonToggle ? 'hybrid' : 'form'}
      defaultMode={defaultMode}
      showCancelButton={!!onCancel}
      submitLabel="Save"
    />
  );
  
}