/**
 * Advanced Zod Schema Introspection Utilities
 * 
 * Provides deep schema analysis to automatically generate form fields
 * with proper types, validation, and constraints.
 */

// Schema introspection using duck typing to avoid direct Zod imports
import { SchemaFormField } from './SchemaForm.js';

// Helper function to safely check Zod schema types
function isZodType(schema: any, typeName: string): boolean {
  return schema && schema._def && schema._def.typeName === typeName;
}

export interface SchemaIntrospectionResult {
  fields: SchemaFormField[];
  defaultValues: Record<string, any>;
  dependencies: Record<string, string[]>;
}

/**
 * Extract comprehensive field information from Zod schema
 */
export function introspectSchema(schema: any): SchemaIntrospectionResult {
  const fields: SchemaFormField[] = [];
  const defaultValues: Record<string, any> = {};
  const dependencies: Record<string, string[]> = {};

  if (isZodType(schema, 'ZodObject')) {
    const shape = schema.shape;
    
    Object.entries(shape).forEach(([key, fieldSchema]: [string, any]) => {
      const field = analyzeField(key, fieldSchema);
      
      // If the field is an object type, recursively flatten it
      if (field.type === 'object' && field.schema) {
        const nestedResult = introspectSchema(field.schema);
        
        // Add flattened fields with prefixed keys
        nestedResult.fields.forEach(nestedField => {
          const flattenedField = {
            ...nestedField,
            key: `${key}.${nestedField.key}`,
            label: `${field.label} - ${nestedField.label}`
          };
          fields.push(flattenedField);
        });
        
        // Handle nested default values
        if (Object.keys(nestedResult.defaultValues).length > 0) {
          defaultValues[key] = nestedResult.defaultValues;
        }
      } else {
        // Add non-object fields directly
        fields.push(field);
        
        if (field.defaultValue !== undefined) {
          defaultValues[key] = field.defaultValue;
        }
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
  while (isZodType(innerSchema, 'ZodOptional') || isZodType(innerSchema, 'ZodNullable')) {
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
  if (isZodType(schema, 'ZodString')) {
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
  
  else if (isZodType(schema, 'ZodNumber')) {
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
  
  else if (isZodType(schema, 'ZodBoolean')) {
    field.type = 'boolean';
    field.defaultValue = false;
  }
  
  else if (isZodType(schema, 'ZodEnum')) {
    field.type = 'enum';
    field.options = schema._def.values.map((value: any) => ({
      label: formatLabel(value.toString()),
      value: value
    }));
  }
  
  else if (isZodType(schema, 'ZodNativeEnum')) {
    field.type = 'enum';
    field.options = Object.entries(schema._def.values).map(([label, value]) => ({
      label: formatLabel(label),
      value: value
    }));
  }
  
  else if (isZodType(schema, 'ZodArray')) {
    field.type = 'array';
    field.defaultValue = [];
    
    // Analyze array element type for better UX
    const elementType = schema._def.type;
    
    if (isZodType(elementType, 'ZodObject')) {
      // This is an array of objects - store the element schema for structured rendering
      field.type = 'object-array';
      field.schema = elementType;
      field.placeholder = 'Array of structured objects';
    } else if (isZodType(elementType, 'ZodString')) {
      field.placeholder = 'Enter comma-separated text values';
    } else if (isZodType(elementType, 'ZodNumber')) {
      field.placeholder = 'Enter comma-separated numbers';
    } else {
      field.placeholder = 'Enter comma-separated values';
    }
  }
  
  else if (isZodType(schema, 'ZodObject')) {
    field.type = 'object';
    field.schema = schema;
  }
  
  else if (isZodType(schema, 'ZodUnion')) {
    // Handle union types - use first option as primary type
    const firstOption = schema._def.options[0];
    analyzeSchemaType(firstOption, field);
    
    // Create enum-like options if all union members are literals
    const allLiterals = schema._def.options.every((option: any) => 
      isZodType(option, 'ZodLiteral')
    );
    
    if (allLiterals) {
      field.type = 'enum';
      field.options = schema._def.options.map((option: any) => ({
        label: formatLabel(option._def.value.toString()),
        value: option._def.value
      }));
    }
  }
  
  else if (isZodType(schema, 'ZodLiteral')) {
    field.type = 'string';
    field.defaultValue = schema._def.value;
    field.placeholder = schema._def.value.toString();
  }
  
  else if (isZodType(schema, 'ZodDefault')) {
    field.defaultValue = schema._def.defaultValue();
    analyzeSchemaType(schema._def.innerType, field);
  }
}

/**
 * Check if schema is optional
 */
function isOptional(schema: any): boolean {
  return isZodType(schema, 'ZodOptional') || 
         isZodType(schema, 'ZodNullable') ||
         isZodType(schema, 'ZodDefault');
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
export function extractDefaultValues(schema: any): Record<string, any> {
  const defaults: Record<string, any> = {};
  
  if (isZodType(schema, 'ZodObject')) {
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
  if (isZodType(schema, 'ZodDefault')) {
    return schema._def.defaultValue();
  }
  
  if (isZodType(schema, 'ZodOptional') || isZodType(schema, 'ZodNullable')) {
    return extractFieldDefault(schema._def.innerType);
  }
  
  if (isZodType(schema, 'ZodBoolean')) {
    return false;
  }
  
  if (isZodType(schema, 'ZodArray')) {
    return [];
  }
  
  if (isZodType(schema, 'ZodObject')) {
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
  } catch (error: any) {
    // Check if it's a Zod error by examining structure
    if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
      return { 
        isValid: false, 
        error: error.errors[0]?.message || 'Invalid value' 
      };
    }
    return { isValid: false, error: 'Validation failed' };
  }
}