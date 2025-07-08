/**
 * Schema-Driven Form Generator
 * 
 * Automatically generates forms from Zod schemas with validation,
 * error handling, and success feedback.
 */

import React, { useState, useEffect } from 'react';
// Note: Zod validation is handled through duck typing to avoid direct imports
import { Input } from '../Input/Input.js';
import { Button } from '../Button/Button.js';
import { Badge } from '../Badge/Badge.js';
import { Card } from '../Card/Card.js';
import { introspectSchema } from './schema-introspection.js';
import styles from './SchemaForm.module.css';

export interface SchemaFormField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'object-array';
  description?: string;
  defaultValue?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  schema?: any; // ZodSchema
  min?: number;
  max?: number;
  placeholder?: string;
}

export type SchemaFormMode = 'form' | 'json' | 'hybrid';

export interface SchemaFormProps {
  title: string;
  description?: string;
  schema: any; // ZodSchema - avoiding direct import
  initialValues?: Record<string, any>;
  onSubmit: (values: any, isValid: boolean) => void | Promise<void>;
  onChange?: (values: any, isValid: boolean) => void;
  onCancel?: () => void;
  onReset?: () => void;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
  showResetButton?: boolean;
  showCancelButton?: boolean;
  realTimeValidation?: boolean;
  mode?: SchemaFormMode;
  defaultMode?: 'form' | 'json';
  compact?: boolean;
}

export function SchemaForm({
  title,
  description,
  schema,
  initialValues = {},
  onSubmit,
  onChange,
  onCancel,
  onReset,
  submitLabel = 'Save',
  loading = false,
  className = '',
  showResetButton = true,
  showCancelButton = false,
  realTimeValidation = true,
  mode = 'form',
  defaultMode = 'form',
  compact = false
}: SchemaFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [fields, setFields] = useState<SchemaFormField[]>([]);
  
  // Mode management
  const [currentMode, setCurrentMode] = useState<'form' | 'json'>(defaultMode);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Parse schema to extract field definitions
  useEffect(() => {
    const introspectionResult = introspectSchema(schema);
    setFields(introspectionResult.fields);
    
    // Set default values if no initial values provided
    if (Object.keys(initialValues).length === 0) {
      setValues(introspectionResult.defaultValues);
    }
  }, [schema, initialValues]);

  // Sync JSON text with values when switching to JSON mode
  useEffect(() => {
    if (currentMode === 'json') {
      setJsonText(JSON.stringify(values, null, 2));
    }
  }, [currentMode, values]);

  // Initialize JSON text with initial values
  useEffect(() => {
    setJsonText(JSON.stringify(initialValues, null, 2));
  }, [initialValues]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(values) !== JSON.stringify(initialValues);
    setHasChanges(changed);
  }, [values, initialValues]);

  // Real-time validation and onChange callback
  useEffect(() => {
    if (realTimeValidation) {
      validateForm().then(formIsValid => {
        onChange?.(values, formIsValid);
      });
    } else {
      onChange?.(values, isValid);
    }
  }, [values, realTimeValidation, onChange, isValid]);

  // Validate when switching from JSON to form mode
  useEffect(() => {
    if (currentMode === 'form' && realTimeValidation) {
      validateForm();
    }
  }, [currentMode, realTimeValidation]);

  const validateForm = async () => {
    try {
      schema.parse(values);
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error) {
      // Check if it's a Zod error by examining structure
      if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
        setIsValid(false);
        return false;
      }
      setIsValid(false);
      return false;
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setValues(prev => {
      // Handle nested field keys like "appSettings.theme"
      if (fieldKey.includes('.')) {
        const [parentKey, childKey] = fieldKey.split('.');
        return {
          ...prev,
          [parentKey]: {
            ...prev[parentKey],
            [childKey]: value
          }
        };
      } else {
        // Handle simple field keys
        return {
          ...prev,
          [fieldKey]: value
        };
      }
    });

    // Clear field error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formIsValid = await validateForm();
    await onSubmit(values, formIsValid);
  };

  const handleReset = () => {
    setValues(initialValues);
    setErrors({});
    setHasChanges(false);
    setJsonText(JSON.stringify(initialValues, null, 2));
    setJsonError(null);
    onReset?.();
  };

  const handleModeSwitch = (newMode: 'form' | 'json') => {
    if (newMode === 'json' && currentMode === 'form') {
      // Switching to JSON mode - sync current values to JSON
      setJsonText(JSON.stringify(values, null, 2));
      setJsonError(null);
    } else if (newMode === 'form' && currentMode === 'json') {
      // Switching to form mode - parse JSON and update values
      try {
        const parsedValues = JSON.parse(jsonText);
        setValues(parsedValues);
        setJsonError(null);
      } catch (error) {
        setJsonError('Invalid JSON format');
        return; // Don't switch modes if JSON is invalid
      }
    }
    setCurrentMode(newMode);
  };

  const handleJsonChange = (newJsonText: string) => {
    setJsonText(newJsonText);
    
    // Try to parse and validate JSON in real-time
    try {
      const parsedValues = JSON.parse(newJsonText);
      
      // Validate against schema
      const result = schema.safeParse(parsedValues);
      if (result.success) {
        setJsonError(null);
        setValues(parsedValues);
      } else {
        setJsonError(result.error?.errors?.[0]?.message || 'Schema validation failed');
      }
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const renderField = (field: SchemaFormField) => {
    const { key, label, type, description, required, options, placeholder, min, max } = field;
    
    // Handle nested field keys like "appSettings.theme"
    const getValue = (fieldKey: string) => {
      if (fieldKey.includes('.')) {
        const [parentKey, childKey] = fieldKey.split('.');
        return values[parentKey]?.[childKey] ?? field.defaultValue ?? '';
      } else {
        return values[fieldKey] ?? field.defaultValue ?? '';
      }
    };
    
    const value = getValue(key);
    const error = errors[key];

    switch (type) {
      case 'boolean':
        return (
          <div key={key} className={styles.fieldGroup}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={key}
                checked={value || false}
                onChange={(e) => handleFieldChange(key, e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor={key} className="text-sm font-medium text-theme-primary">
                {label}
                {required && <span className="text-danger ml-1">*</span>}
              </label>
            </div>
            {description && (
              <p className="text-sm text-theme-secondary mt-1">{description}</p>
            )}
            {error && (
              <p className="text-sm text-danger mt-1">{error}</p>
            )}
          </div>
        );

      case 'enum':
        return (
          <div key={key} className={styles.fieldGroup}>
            <label htmlFor={key} className="block text-sm font-medium text-theme-primary mb-1">
              {label}
              {required && <span className="text-danger ml-1">*</span>}
            </label>
            <select
              id={key}
              value={value}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className={`w-full px-4 py-2 bg-theme-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-action/20 ${
                error ? 'border-danger' : 'border-theme'
              }`}
            >
              <option value="">Select an option</option>
              {options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {description && (
              <p className="text-sm text-theme-secondary mt-1">{description}</p>
            )}
            {error && (
              <p className="text-sm text-danger mt-1">{error}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={key} className={styles.fieldGroup}>
            <Input
              label={label}
              type="number"
              value={value?.toString() || ''}
              onChange={(e) => handleFieldChange(key, e.target.value ? Number(e.target.value) : undefined)}
              error={error}
              helperText={description}
              required={required}
              placeholder={placeholder}
              min={min}
              max={max}
            />
          </div>
        );

      case 'object-array':
        return (
          <div key={key} className={styles.fieldGroup}>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              {label}
              {required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className={styles.objectArrayField}>
              {description && (
                <p className="text-sm text-theme-secondary mb-3">{description}</p>
              )}
              
              {/* Array items */}
              {Array.isArray(value) && value.map((item, index) => (
                <div key={index} className="bg-theme-surface border border-theme rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-theme-primary">
                      {label} #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newArray = [...(value || [])];
                        newArray.splice(index, 1);
                        handleFieldChange(key, newArray);
                      }}
                      className="text-danger hover:text-danger-dark text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {/* Render object fields inline */}
                  {field.schema && field.schema.shape && Object.entries(field.schema.shape).map(([subKey, subSchema]: [string, any]) => {
                    const subField = analyzeSubField(subKey, subSchema);
                    const subValue = item?.[subKey] ?? '';
                    
                    return (
                      <div key={subKey} className="mb-3 last:mb-0">
                        <Input
                          label={subField.label}
                          type={subField.type === 'number' ? 'number' : 'text'}
                          value={typeof subValue === 'object' ? JSON.stringify(subValue) : (subValue?.toString() || '')}
                          onChange={(e) => {
                            const newArray = [...(value || [])];
                            const newValue = subField.type === 'number' ? Number(e.target.value) : 
                                           subField.type === 'boolean' ? e.target.checked :
                                           e.target.value;
                            newArray[index] = { ...newArray[index], [subKey]: newValue };
                            handleFieldChange(key, newArray);
                          }}
                          placeholder={subField.placeholder}
                          helperText={subField.description}
                          required={subField.required}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
              
              {/* Add new item button */}
              <button
                type="button"
                onClick={() => {
                  const newItem: Record<string, any> = {};
                  // Initialize with default values if available
                  if (field.schema && field.schema.shape) {
                    Object.entries(field.schema.shape).forEach(([subKey, subSchema]: [string, any]) => {
                      if (subSchema._def?.defaultValue) {
                        newItem[subKey] = typeof subSchema._def.defaultValue === 'function' 
                          ? subSchema._def.defaultValue() 
                          : subSchema._def.defaultValue;
                      }
                    });
                  }
                  const newArray = [...(value || []), newItem];
                  handleFieldChange(key, newArray);
                }}
                className="w-full px-4 py-2 border-2 border-dashed border-theme text-theme-secondary hover:border-action hover:text-action rounded-lg transition-colors"
              >
                + Add {label.slice(0, -1)} {/* Remove 's' from plural label */}
              </button>
              
              {error && (
                <p className="text-sm text-danger mt-2">{error}</p>
              )}
            </div>
          </div>
        );

      case 'array':
        return (
          <div key={key} className={styles.fieldGroup}>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              {label}
              {required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className={styles.arrayField}>
              <Input
                type="text"
                value={Array.isArray(value) ? value.join(', ') : ''}
                onChange={(e) => {
                  const arrayValue = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                  handleFieldChange(key, arrayValue);
                }}
                placeholder="Enter comma-separated values"
                helperText={description}
                error={error}
              />
              {Array.isArray(value) && value.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {value.map((item, index) => (
                    <Badge key={index} variant="neutral" size="sm">
                      {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'object':
        return (
          <div key={key} className={styles.fieldGroup}>
            <label htmlFor={key} className="block text-sm font-medium text-theme-primary mb-1">
              {label}
              {required && <span className="text-danger ml-1">*</span>}
            </label>
            <textarea
              id={key}
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
              onChange={(e) => {
                try {
                  const parsedValue = JSON.parse(e.target.value);
                  handleFieldChange(key, parsedValue);
                } catch {
                  // If it's not valid JSON, store as string for now
                  handleFieldChange(key, e.target.value);
                }
              }}
              className={`w-full px-4 py-2 bg-theme-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-action/20 ${
                error ? 'border-danger' : 'border-theme'
              }`}
              rows={4}
              placeholder={placeholder || 'Enter JSON object'}
            />
            {description && (
              <p className="text-sm text-theme-secondary mt-1">{description}</p>
            )}
            {error && (
              <p className="text-sm text-danger mt-1">{error}</p>
            )}
          </div>
        );

      default: // string
        return (
          <div key={key} className={styles.fieldGroup}>
            <Input
              label={label}
              type="text"
              value={typeof value === 'object' ? JSON.stringify(value) : (value?.toString() || '')}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              error={error}
              helperText={description}
              required={required}
              placeholder={placeholder}
            />
          </div>
        );
    }
  };

  // Helper function to analyze sub-fields for object arrays
  const analyzeSubField = (key: string, fieldSchema: any) => {
    const field = {
      key,
      label: formatLabel(key),
      type: 'string',
      required: !isOptional(fieldSchema),
      placeholder: '',
      description: ''
    };

    // Unwrap optional and nullable schemas
    let innerSchema = fieldSchema;
    while (innerSchema?._def?.typeName === 'ZodOptional' || innerSchema?._def?.typeName === 'ZodNullable') {
      innerSchema = innerSchema._def.innerType;
    }

    // Extract description
    if (fieldSchema._def?.description) {
      field.description = fieldSchema._def.description;
    }

    // Determine field type
    if (innerSchema?._def?.typeName === 'ZodString') {
      field.type = 'string';
      if (innerSchema._def.checks) {
        innerSchema._def.checks.forEach((check: any) => {
          if (check.kind === 'email') field.placeholder = 'example@domain.com';
          if (check.kind === 'url') field.placeholder = 'https://example.com';
        });
      }
    } else if (innerSchema?._def?.typeName === 'ZodNumber') {
      field.type = 'number';
    } else if (innerSchema?._def?.typeName === 'ZodBoolean') {
      field.type = 'boolean';
    }

    return field;
  };

  // Helper function to check if schema is optional
  const isOptional = (schema: any): boolean => {
    return schema?._def?.typeName === 'ZodOptional' || 
           schema?._def?.typeName === 'ZodNullable' ||
           schema?._def?.typeName === 'ZodDefault';
  };

  // Helper function to format field labels
  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const showModeToggle = mode === 'hybrid';
  const effectiveMode = mode === 'hybrid' ? currentMode : mode;

  return (
    <Card className={`${styles.schemaForm} ${className}`}>
      <div className={compact ? "mb-4" : "mb-6"}>
        <div className="flex items-center justify-between mb-2">
          <h2 className={compact ? "text-lg font-bold text-theme-primary" : "text-2xl font-bold text-theme-primary"}>
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="warning" size="sm">
                Unsaved changes
              </Badge>
            )}
            {showModeToggle && (
              <div className="flex bg-theme-background rounded-lg p-1 border border-theme">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('form')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentMode === 'form'
                      ? 'bg-action text-white'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  Form
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('json')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentMode === 'json'
                      ? 'bg-action text-white'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  JSON
                </button>
              </div>
            )}
          </div>
        </div>
        {description && (
          <p className="text-theme-secondary">{description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {effectiveMode === 'form' ? (
          // Form Mode
          fields.map(renderField)
        ) : (
          // JSON Mode
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                JSON Configuration
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                className={`w-full h-80 px-4 py-3 font-mono text-sm bg-theme-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-action/20 resize-vertical ${
                  jsonError ? 'border-danger' : 'border-theme'
                }`}
                placeholder="Enter valid JSON configuration..."
                spellCheck={false}
              />
              {jsonError && (
                <p className="text-sm text-danger mt-2">{jsonError}</p>
              )}
              <p className="text-xs text-theme-secondary mt-2">
                Edit the JSON directly. Changes are validated in real-time against the schema.
              </p>
            </div>
          </div>
        )}

        <div className={`${styles.formActions} pt-6 border-t border-theme`}>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={(!realTimeValidation && !hasChanges) || loading || (effectiveMode === 'json' && !!jsonError)}
              className="min-w-24"
            >
              {loading ? 'Saving...' : submitLabel}
            </Button>

            {showResetButton && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={!hasChanges || loading}
              >
                Reset
              </Button>
            )}

            {showCancelButton && onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="text-sm text-theme-secondary">
            {effectiveMode === 'json' && jsonError && (
              <span className="text-danger">Please fix JSON errors</span>
            )}
            {effectiveMode === 'form' && !isValid && Object.keys(errors).length > 0 && (
              <span className="text-danger">Please fix validation errors</span>
            )}
            {hasChanges && isValid && !jsonError && (
              <span>Ready to save</span>
            )}
            {!hasChanges && (
              <span>No changes</span>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}

