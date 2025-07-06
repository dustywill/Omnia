import React, { useState } from 'react';
import { Input } from '../Input/Input.js';
import { Button } from '../Button/Button.js';
import { Badge } from '../Badge/Badge.js';
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
  const [values, setValues] = useState<Record<string, any>>(
    fields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, any>)
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [mode, setMode] = useState<'form' | 'json'>(defaultMode);
  const [jsonValue, setJsonValue] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  const handleChange = (key: string, value: any) => {
    setValues(prev => {
      const newValues = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(newValues) !== JSON.stringify(
        fields.reduce((acc, field) => {
          acc[field.key] = field.value;
          return acc;
        }, {} as Record<string, any>)
      ));
      return newValues;
    });
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = values[field.key];
      
      // Required validation
      if (field.required && (!value || value === '')) {
        newErrors[field.key] = `${field.label} is required`;
        return;
      }
      
      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.key] = error;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'form') {
      if (validateForm()) {
        onSave(values);
      }
    } else {
      const { isValid, values: parsedValues } = validateJsonMode();
      if (isValid && parsedValues) {
        onSave(parsedValues);
      }
    }
  };
  
  const handleReset = () => {
    const originalValues = fields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, any>);
    
    setValues(originalValues);
    setErrors({});
    setHasChanges(false);
    if (mode === 'json') {
      setJsonValue(JSON.stringify(originalValues, null, 2));
    }
  };

  const handleModeToggle = () => {
    if (mode === 'form') {
      // Convert form values to JSON
      setJsonValue(JSON.stringify(values, null, 2));
      setJsonError(null);
      setMode('json');
    } else {
      // Convert JSON to form values
      try {
        const parsedValues = JSON.parse(jsonValue);
        setValues(parsedValues);
        setJsonError(null);
        setMode('form');
        
        // Update hasChanges state
        const originalValues = fields.reduce((acc, field) => {
          acc[field.key] = field.value;
          return acc;
        }, {} as Record<string, any>);
        setHasChanges(JSON.stringify(parsedValues) !== JSON.stringify(originalValues));
      } catch (error) {
        setJsonError('Invalid JSON format');
      }
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    setJsonError(null);
    
    // Try to parse and update hasChanges
    try {
      const parsedValues = JSON.parse(value);
      const originalValues = fields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {} as Record<string, any>);
      setHasChanges(JSON.stringify(parsedValues) !== JSON.stringify(originalValues));
    } catch {
      // Invalid JSON, keep hasChanges as true if there's content
      setHasChanges(value.trim() !== '');
    }
  };

  const validateJsonMode = () => {
    try {
      const parsedValues = JSON.parse(jsonValue);
      setJsonError(null);
      return { isValid: true, values: parsedValues };
    } catch (error) {
      setJsonError('Invalid JSON format');
      return { isValid: false, values: null };
    }
  };

  // Initialize JSON value when component mounts or mode changes
  React.useEffect(() => {
    if (mode === 'json' && jsonValue === '') {
      setJsonValue(JSON.stringify(values, null, 2));
    }
  }, [mode, values, jsonValue]);
  
  return (
    <div className={`${styles.settingsForm} ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-theme-primary">{title}</h2>
          {enableJsonToggle && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-theme-secondary">Form</span>
              <button
                type="button"
                onClick={handleModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  mode === 'json' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    mode === 'json' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-theme-secondary">JSON</span>
            </div>
          )}
        </div>
        {hasChanges && (
          <Badge variant="warning" size="sm">
            Unsaved changes
          </Badge>
        )}
        {jsonError && (
          <Badge variant="danger" size="sm" className="ml-2">
            {jsonError}
          </Badge>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'form' ? (
          // Form mode - render form fields
          fields.map(field => (
            <div key={field.key} className={styles.fieldGroup}>
              {field.type === 'boolean' ? (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={field.key}
                    checked={values[field.key] || false}
                    onChange={(e) => handleChange(field.key, e.target.checked)}
                    className={styles.checkbox}
                  />
                  <label htmlFor={field.key} className="text-sm font-medium text-theme-primary">
                    {field.label}
                    {field.required && <span className="text-danger ml-1">*</span>}
                  </label>
                </div>
              ) : field.type === 'select' ? (
                <div>
                  <label htmlFor={field.key} className="block text-sm font-medium text-theme-primary mb-1">
                    {field.label}
                    {field.required && <span className="text-danger ml-1">*</span>}
                  </label>
                  <select
                    id={field.key}
                    value={values[field.key] || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange(field.key, e.target.value)}
                    className={`w-full px-4 py-2 bg-theme-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-action/20 ${
                      errors[field.key] ? 'border-danger' : 'border-theme'
                    }`}
                  >
                    <option value="">Select an option</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : field.type === 'textarea' ? (
                <div>
                  <label htmlFor={field.key} className="block text-sm font-medium text-theme-primary mb-1">
                    {field.label}
                    {field.required && <span className="text-danger ml-1">*</span>}
                  </label>
                  <textarea
                    id={field.key}
                    value={values[field.key] || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(field.key, e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-2 bg-theme-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-action/20 resize-vertical ${
                      errors[field.key] ? 'border-danger' : 'border-theme'
                    }`}
                  />
                </div>
              ) : (
                <Input
                  label={field.label}
                  type={field.type}
                  value={values[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  error={errors[field.key]}
                  helperText={field.description}
                  required={field.required}
                />
              )}
              
              {field.description && field.type === 'boolean' && (
                <p className="text-sm text-theme-secondary mt-1">{field.description}</p>
              )}
              
              {errors[field.key] && field.type !== 'text' && field.type !== 'number' && (
                <p className="text-sm text-danger mt-1">{errors[field.key]}</p>
              )}
            </div>
          ))
        ) : (
          // JSON mode - render JSON editor
          <div className="space-y-4">
            <label className="block text-sm font-medium text-theme-primary mb-2">
              JSON Configuration
            </label>
            <textarea
              value={jsonValue}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={Math.max(12, Math.min(30, jsonValue.split('\n').length + 2))}
              className={`w-full px-4 py-3 bg-theme-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-action/20 font-mono text-sm resize-vertical ${
                jsonError ? 'border-danger' : 'border-theme'
              }`}
              placeholder="Enter JSON configuration..."
              spellCheck={false}
            />
            {jsonError && (
              <p className="text-sm text-danger mt-1">{jsonError}</p>
            )}
            <p className="text-xs text-theme-secondary">
              Edit the configuration in JSON format. The editor will validate syntax as you type.
            </p>
          </div>
        )}
        
        <div className={`${styles.formActions} pt-6 border-t border-theme`}>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={!hasChanges || loading || (mode === 'json' && !!jsonError)}
              className="min-w-24"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={!hasChanges || loading}
            >
              Reset
            </Button>
            
            {onCancel && (
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
          
          {hasChanges && (
            <p className="text-sm text-theme-secondary">
              You have unsaved changes
            </p>
          )}
        </div>
      </form>
    </div>
  );
}