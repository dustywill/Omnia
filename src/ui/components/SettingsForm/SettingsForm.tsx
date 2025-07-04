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
}

export function SettingsForm({ 
  title, 
  fields, 
  onSave, 
  onCancel, 
  className = '', 
  loading = false 
}: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, any>>(
    fields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, any>)
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
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
    
    if (validateForm()) {
      onSave(values);
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
  };
  
  return (
    <div className={`${styles.settingsForm} ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-theme-primary mb-2">{title}</h2>
        {hasChanges && (
          <Badge variant="warning" size="sm">
            Unsaved changes
          </Badge>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map(field => (
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
        ))}
        
        <div className={`${styles.formActions} pt-6 border-t border-theme`}>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={!hasChanges || loading}
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