import React, { useEffect, useState, useRef, useCallback } from 'react';
import { loadNodeModule } from '../../node-module-loader.js';
import type { ZodType } from 'zod';
import { Button } from '../Button/Button.js';
import styles from './JsonEditor.module.css';

export type JsonEditorProps = {
  initialContent: string;
  schema?: ZodType<unknown>;
  onChange?: (content: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  compact?: boolean;
  showLineNumbers?: boolean;
  showValidationErrors?: boolean;
  height?: string;
  label?: string;
  description?: string;
};

export const JsonEditor: React.FC<JsonEditorProps> = ({
  initialContent,
  schema,
  onChange,
  onValidationChange,
  placeholder = 'Enter JSON content...',
  readOnly = false,
  compact = false,
  showLineNumbers = true,
  showValidationErrors = true,
  height = '400px',
  label,
  description,
}) => {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  // Update content when initialContent changes
  useEffect(() => {
    if (content !== initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const parseJson = async (text: string) => {
    try {
      const JSON5 = await loadNodeModule<any>('json5');
      return JSON5.parse(text);
    } catch {
      // Fallback to regular JSON
      return JSON.parse(text);
    }
  };

  const prettifyJson = useCallback(async () => {
    try {
      const parsed = await parseJson(content);
      const prettified = JSON.stringify(parsed, null, 2);
      setContent(prettified);
    } catch (err) {
      // Don't change content if parsing fails
      console.warn('Cannot prettify invalid JSON:', err);
    }
  }, [content]);

  const validateContent = useCallback(async (text: string) => {
    const errors: string[] = [];
    let parsed: any = null;
    let jsonValid = true;

    // Skip validation for empty content
    const trimmed = text.trim();
    if (!trimmed) {
      setError(null);
      setValidationErrors([]);
      setIsValid(true);
      onValidationChange?.(true);
      return;
    }

    // Check JSON syntax
    try {
      parsed = await parseJson(trimmed);
    } catch (err) {
      jsonValid = false;
      errors.push(err instanceof Error ? err.message : 'Invalid JSON syntax');
    }

    // Check schema validation if provided
    if (schema && parsed !== null && jsonValid) {
      try {
        const result = schema.safeParse(parsed);
        if (!result.success) {
          const schemaErrors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
          errors.push(...schemaErrors);
        }
      } catch (err) {
        errors.push('Schema validation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }

    const valid = errors.length === 0;
    setError(errors.length > 0 ? errors[0] : null);
    setValidationErrors(errors);
    setIsValid(valid);
    onValidationChange?.(valid, errors.length > 0 ? errors[0] : undefined);
  }, [schema, onValidationChange]);

  useEffect(() => {
    const lines = content.split('\n').length;
    setLineCount(lines);
    validateContent(content);
    onChange?.(content);
  }, [content, validateContent, onChange]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  const containerClasses = [
    styles.jsonEditor,
    compact ? styles.jsonEditorCompact : ''
  ].filter(Boolean).join(' ');

  const editorContainerClasses = [
    styles.editorContainer,
    focused ? styles.editorContainerFocused : '',
    error ? styles.editorContainerError : ''
  ].filter(Boolean).join(' ');

  const toolbarClasses = [
    styles.toolbar,
    compact ? styles.toolbarCompact : ''
  ].filter(Boolean).join(' ');

  const statusClasses = [
    styles.status,
    compact ? styles.statusCompact : ''
  ].filter(Boolean).join(' ');

  const validationClasses = [
    styles.validationIndicator,
    isValid ? styles.validationIndicatorValid : styles.validationIndicatorInvalid
  ].filter(Boolean).join(' ');

  const editorClasses = [
    styles.editor,
    compact ? styles.editorCompact : ''
  ].filter(Boolean).join(' ');

  const lineNumbersClasses = [
    styles.lineNumbers,
    compact ? styles.lineNumbersCompact : ''
  ].filter(Boolean).join(' ');

  const errorClasses = [
    styles.errorContainer,
    compact ? styles.errorContainerCompact : ''
  ].filter(Boolean).join(' ');

  const labelClasses = [
    styles.label,
    compact ? styles.labelCompact : ''
  ].filter(Boolean).join(' ');

  const descriptionClasses = [
    styles.description,
    compact ? styles.descriptionCompact : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <div>
          <label className={labelClasses}>
            {label}
          </label>
          {description && (
            <p className={descriptionClasses}>
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={editorContainerClasses}>
        {!readOnly && (
          <div className={toolbarClasses}>
            <div className={statusClasses}>
              <span>Lines: {lineCount}</span>
              <span>Characters: {content.length}</span>
              <div className={validationClasses}>
                {isValid ? '✓ Valid' : '✗ Invalid'}
              </div>
            </div>
            <div className={styles.actions}>
              <Button
                onClick={prettifyJson}
                variant="ghost"
                size="sm"
                disabled={!isValid}
                style={{ fontSize: '12px' }}
              >
                Prettify
              </Button>
            </div>
          </div>
        )}
        
        <div className={editorClasses} style={{ height }}>
          {showLineNumbers && (
            <div className={lineNumbersClasses}>
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1}>{i + 1}</div>
              ))}
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck={false}
            wrap="off"
            aria-label={label || 'JSON Editor'}
            aria-describedby={error ? 'json-editor-error' : undefined}
          />
        </div>
      </div>

      {showValidationErrors && validationErrors.length > 0 && (
        <div className={errorClasses} id="json-editor-error">
          <div className={styles.errorTitle}>Validation Errors:</div>
          {validationErrors.map((err, index) => (
            <div key={index} className={styles.errorItem}>• {err}</div>
          ))}
        </div>
      )}
    </div>
  );
};