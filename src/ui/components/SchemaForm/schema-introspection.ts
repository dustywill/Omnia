/**
 * Advanced Zod Schema Introspection Utilities
 * 
 * Provides deep schema analysis to automatically generate form fields
 * with proper types, validation, and constraints.
 */

import { z } from 'zod';
import { SchemaFormField } from './SchemaForm.js';

export interface SchemaIntrospectionResult {
  fields: SchemaFormField[];
  defaultValues: Record<string, any>;
  dependencies: Record<string, string[]>;
}

/**
 * Extract comprehensive field information from Zod schema
 */
export function introspectSchema(schema: z.ZodSchema<any>): SchemaIntrospectionResult {
  const fields: SchemaFormField[] = [];
  const defaultValues: Record<string, any> = {};
  const dependencies: Record<string, string[]> = {};

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    
    Object.entries(shape).forEach(([key, fieldSchema]: [string, any]) => {
      const field = analyzeField(key, fieldSchema);
      fields.push(field);
      
      if (field.defaultValue !== undefined) {
        defaultValues[key] = field.defaultValue;
      }
    });
  }

  return { fields, defaultValues, dependencies };
}

/**
 * Analyze individual Zod field schema
 */
function analyzeField(key: string, fieldSchema: any): SchemaFormField {
  const field: SchemaFormField = {
    key,
    label: formatLabel(key),
    type: 'string',
    required: !isOptional(fieldSchema)
  };

  // Unwrap optional and nullable schemas
  let innerSchema = fieldSchema;
  while (innerSchema instanceof z.ZodOptional || innerSchema instanceof z.ZodNullable) {
    innerSchema = innerSchema._def.innerType;
  }

  // Extract description and default value
  if (fieldSchema._def.description) {
    field.description = fieldSchema._def.description;
  }

  // Analyze schema type and constraints
  analyzeSchemaType(innerSchema, field);
  
  return field;
}

/**
 * Analyze schema type and set field properties
 */
function analyzeSchemaType(schema: any, field: SchemaFormField): void {
  if (schema instanceof z.ZodString) {
    field.type = 'string';
    
    // Extract string constraints
    if (schema._def.checks) {
      schema._def.checks.forEach((check: any) => {
        switch (check.kind) {
          case 'min':
            field.min = check.value;
            break;
          case 'max':
            field.max = check.value;
            break;
          case 'email':
            field.placeholder = 'example@domain.com';
            break;
          case 'url':
            field.placeholder = 'https://example.com';
            break;
        }
      });
    }
  }
  
  else if (schema instanceof z.ZodNumber) {
    field.type = 'number';
    
    // Extract number constraints
    if (schema._def.checks) {
      schema._def.checks.forEach((check: any) => {
        switch (check.kind) {
          case 'min':
            field.min = check.value;
            break;
          case 'max':
            field.max = check.value;
            break;
          case 'int':
            field.placeholder = 'Enter an integer';
            break;
        }
      });
    }
  }
  
  else if (schema instanceof z.ZodBoolean) {
    field.type = 'boolean';
    field.defaultValue = false;
  }
  
  else if (schema instanceof z.ZodEnum) {
    field.type = 'enum';
    field.options = schema._def.values.map((value: any) => ({
      label: formatLabel(value.toString()),
      value: value
    }));
  }
  
  else if (schema instanceof z.ZodNativeEnum) {
    field.type = 'enum';
    field.options = Object.entries(schema._def.values).map(([label, value]) => ({
      label: formatLabel(label),
      value: value
    }));
  }
  
  else if (schema instanceof z.ZodArray) {
    field.type = 'array';
    field.defaultValue = [];
    
    // Analyze array element type for better UX
    const elementType = schema._def.type;
    if (elementType instanceof z.ZodString) {
      field.placeholder = 'Enter comma-separated text values';
    } else if (elementType instanceof z.ZodNumber) {
      field.placeholder = 'Enter comma-separated numbers';
    }
  }
  
  else if (schema instanceof z.ZodObject) {
    field.type = 'object';
    field.schema = schema;
  }
  
  else if (schema instanceof z.ZodUnion) {
    // Handle union types - use first option as primary type
    const firstOption = schema._def.options[0];
    analyzeSchemaType(firstOption, field);
    
    // Create enum-like options if all union members are literals
    const allLiterals = schema._def.options.every((option: any) => 
      option instanceof z.ZodLiteral
    );
    
    if (allLiterals) {
      field.type = 'enum';
      field.options = schema._def.options.map((option: any) => ({
        label: formatLabel(option._def.value.toString()),
        value: option._def.value
      }));
    }
  }
  
  else if (schema instanceof z.ZodLiteral) {
    field.type = 'string';
    field.defaultValue = schema._def.value;
    field.placeholder = schema._def.value.toString();
  }
  
  else if (schema instanceof z.ZodDefault) {
    field.defaultValue = schema._def.defaultValue();
    analyzeSchemaType(schema._def.innerType, field);
  }
}

/**
 * Check if schema is optional
 */
function isOptional(schema: any): boolean {
  return schema instanceof z.ZodOptional || 
         schema instanceof z.ZodNullable ||
         (schema instanceof z.ZodDefault);
}

/**
 * Format field key into human-readable label
 */
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract default values from schema with defaults
 */
export function extractDefaultValues(schema: z.ZodSchema<any>): Record<string, any> {
  const defaults: Record<string, any> = {};
  
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    
    Object.entries(shape).forEach(([key, fieldSchema]: [string, any]) => {
      const defaultValue = extractFieldDefault(fieldSchema);
      if (defaultValue !== undefined) {
        defaults[key] = defaultValue;
      }
    });
  }
  
  return defaults;
}

/**
 * Extract default value from individual field schema
 */
function extractFieldDefault(schema: any): any {
  if (schema instanceof z.ZodDefault) {
    return schema._def.defaultValue();
  }
  
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return extractFieldDefault(schema._def.innerType);
  }
  
  if (schema instanceof z.ZodBoolean) {
    return false;
  }
  
  if (schema instanceof z.ZodArray) {
    return [];
  }
  
  if (schema instanceof z.ZodObject) {
    return extractDefaultValues(schema);
  }
  
  return undefined;
}

/**
 * Validate if a value matches the expected schema type
 */
export function validateFieldValue(value: any, fieldSchema: any): { isValid: boolean; error?: string } {
  try {
    fieldSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        error: error.errors[0]?.message || 'Invalid value' 
      };
    }
    return { isValid: false, error: 'Validation failed' };
  }
}