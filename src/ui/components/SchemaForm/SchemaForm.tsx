/**
 * Schema-Driven Form Generator
 * 
 * Automatically generates forms from Zod schemas with validation,
 * error handling, and success feedback.
 */

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '../Input/Input.js';
import { Button } from '../Button/Button.js';
import { Badge } from '../Badge/Badge.js';
import { Card } from '../Card/Card.js';
import { introspectSchema } from './schema-introspection.js';
import styles from './SchemaForm.module.css';

export interface SchemaFormField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';
  description?: string;
  defaultValue?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  schema?: z.ZodSchema<any>;
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface SchemaFormProps {
  title: string;
  description?: string;
  schema: z.ZodSchema<any>;
  initialValues?: Record<string, any>;
  onSubmit: (values: any, isValid: boolean) => void | Promise<void>;
  onCancel?: () => void;
  onReset?: () => void;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
  showResetButton?: boolean;
  showCancelButton?: boolean;
  realTimeValidation?: boolean;
}

export function SchemaForm({
  title,
  description,
  schema,
  initialValues = {},
  onSubmit,
  onCancel,
  onReset,
  submitLabel = 'Save',
  loading = false,
  className = '',
  showResetButton = true,
  showCancelButton = false,
  realTimeValidation = true
}: SchemaFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [fields, setFields] = useState<SchemaFormField[]>([]);

  // Parse schema to extract field definitions
  useEffect(() => {
    const introspectionResult = introspectSchema(schema);
    setFields(introspectionResult.fields);
    
    // Set default values if no initial values provided
    if (Object.keys(initialValues).length === 0) {
      setValues(introspectionResult.defaultValues);
    }
  }, [schema, initialValues]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(values) !== JSON.stringify(initialValues);
    setHasChanges(changed);
  }, [values, initialValues]);

  // Real-time validation
  useEffect(() => {
    if (realTimeValidation) {
      validateForm();
    }
  }, [values, realTimeValidation]);

  const validateForm = () => {
    try {
      schema.parse(values);
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
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
    setValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));

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
    
    const formIsValid = validateForm();
    await onSubmit(values, formIsValid);
  };

  const handleReset = () => {
    setValues(initialValues);
    setErrors({});
    setHasChanges(false);
    onReset?.();
  };

  const renderField = (field: SchemaFormField) => {
    const { key, label, type, description, required, options, placeholder, min, max } = field;
    const value = values[key] ?? field.defaultValue ?? '';
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
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default: // string
        return (
          <div key={key} className={styles.fieldGroup}>
            <Input
              label={label}
              type="text"
              value={value?.toString() || ''}
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

  return (
    <Card className={`${styles.schemaForm} ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-theme-primary">{title}</h2>
          {hasChanges && (
            <Badge variant="warning" size="sm">
              Unsaved changes
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-theme-secondary">{description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map(renderField)}

        <div className={`${styles.formActions} pt-6 border-t border-theme`}>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={(!realTimeValidation && !hasChanges) || loading}
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
            {!isValid && Object.keys(errors).length > 0 && (
              <span className="text-danger">Please fix validation errors</span>
            )}
            {hasChanges && isValid && (
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

