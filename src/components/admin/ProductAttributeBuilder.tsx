'use client';

import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Input } from '@/components/ui';

export interface ProductAttribute {
  key: string;
  value: string | number | boolean;
  type?: 'string' | 'number' | 'boolean';
}

interface ProductAttributeBuilderProps {
  attributes: Record<string, any>;
  onChange: (attributes: Record<string, any>) => void;
  categoryId?: string;
  className?: string;
}

interface AttributeTemplate {
  key: string;
  displayLabel: string;
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
  options?: string[];
  required: boolean;
  helpText?: string;
  displayOrder?: number;
}

interface ProductOptionGroup {
  name: string;
  values: string[];
  required: boolean;
}

export function ProductAttributeBuilder({
  attributes = {},
  onChange,
  categoryId,
  className = '',
}: ProductAttributeBuilderProps) {
  const [templates, setTemplates] = useState<AttributeTemplate[]>([]);
  const [customAttributes, setCustomAttributes] = useState<ProductAttribute[]>([]);
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([]);
  const [optionValueDrafts, setOptionValueDrafts] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert attributes object to array for custom attributes
  useEffect(() => {
    const templateKeys = templates.map(t => t.key);
    const custom = Object.entries(attributes)
      .filter(([key]) => !templateKeys.includes(key) && key !== 'options')
      .map(([key, value]) => ({
        key,
        value,
        type: inferType(value),
      }));
    setCustomAttributes(custom);
  }, [attributes, templates]);

  useEffect(() => {
    const rawOptions = (attributes as { options?: unknown }).options;
    const normalized = Array.isArray(rawOptions)
      ? rawOptions
          .map((option) => {
            if (!option || typeof option !== 'object') return null;
            const name = (option as { name?: unknown }).name;
            const values = (option as { values?: unknown }).values;
            const required = (option as { required?: unknown }).required;
            if (typeof name !== 'string' || !Array.isArray(values)) return null;
            return {
              name,
              values: values.filter((value) => typeof value === 'string') as string[],
              required: required === true,
            };
          })
          .filter((option): option is ProductOptionGroup => Boolean(option))
      : [];

    setOptionGroups((prev) => {
      const previousSerialized = JSON.stringify(prev);
      const nextSerialized = JSON.stringify(normalized);
      return previousSerialized === nextSerialized ? prev : normalized;
    });
    setOptionValueDrafts((prev) => {
      if (normalized.length === prev.length) return prev;
      return normalized.map((_, index) => prev[index] ?? '');
    });
  }, [attributes]);

  // Fetch templates when category changes
  useEffect(() => {
    if (!categoryId) {
      setTemplates([]);
      return;
    }

    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        // TODO: Implement API call when backend is ready
        // const response = await apiClient.get(`/store/categories/${categoryId}/attributes`);
        // setTemplates(response.data.data || []);

        // For now, provide smart defaults based on common categories
        const smartDefaults = getSmartDefaults(categoryId);
        setTemplates(smartDefaults);
      } catch (error) {
        console.error('Failed to fetch attribute templates', error);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [categoryId]);

  const inferType = (value: any): 'string' | 'number' | 'boolean' => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'string';
  };

  const getSmartDefaults = (categoryId: string): AttributeTemplate[] => {
    // Smart defaults for common categories (will be replaced by backend templates)
    const defaults: Record<string, AttributeTemplate[]> = {
      laptops: [
        { key: 'brand', displayLabel: 'Brand', dataType: 'STRING', required: true, displayOrder: 1 },
        { key: 'ram', displayLabel: 'RAM', dataType: 'SELECT', options: ['4GB', '8GB', '16GB', '32GB', '64GB'], required: true, displayOrder: 2 },
        { key: 'storage', displayLabel: 'Storage', dataType: 'SELECT', options: ['128GB', '256GB', '512GB', '1TB', '2TB'], required: true, displayOrder: 3 },
        { key: 'processor', displayLabel: 'Processor', dataType: 'STRING', required: false, displayOrder: 4 },
        { key: 'color', displayLabel: 'Color', dataType: 'STRING', required: false, displayOrder: 5 },
      ],
      smartphones: [
        { key: 'brand', displayLabel: 'Brand', dataType: 'STRING', required: true, displayOrder: 1 },
        { key: 'storage', displayLabel: 'Storage', dataType: 'SELECT', options: ['64GB', '128GB', '256GB', '512GB', '1TB'], required: true, displayOrder: 2 },
        { key: 'ram', displayLabel: 'RAM', dataType: 'SELECT', options: ['4GB', '6GB', '8GB', '12GB', '16GB'], required: false, displayOrder: 3 },
        { key: 'color', displayLabel: 'Color', dataType: 'STRING', required: false, displayOrder: 4 },
        { key: 'screenSize', displayLabel: 'Screen Size', dataType: 'STRING', required: false, displayOrder: 5 },
      ],
      clothing: [
        { key: 'brand', displayLabel: 'Brand', dataType: 'STRING', required: true, displayOrder: 1 },
        { key: 'material', displayLabel: 'Material', dataType: 'STRING', required: false, displayOrder: 2 },
        { key: 'sizes', displayLabel: 'Available Sizes', dataType: 'STRING', helpText: 'e.g., S, M, L, XL', required: false, displayOrder: 3 },
        { key: 'color', displayLabel: 'Color', dataType: 'STRING', required: false, displayOrder: 4 },
      ],
    };

    // Return empty if no defaults found
    return defaults[categoryId] || [];
  };

  const updateTemplateAttribute = (key: string, value: any) => {
    onChange({
      ...attributes,
      [key]: value,
    });
  };

  const addCustomAttribute = () => {
    const newAttr: ProductAttribute = {
      key: '',
      value: '',
      type: 'string',
    };
    setCustomAttributes([...customAttributes, newAttr]);
  };

  const updateOptionsAttribute = (nextOptions: ProductOptionGroup[]) => {
    const nextAttributes = { ...attributes };
    if (nextOptions.length > 0) {
      nextAttributes.options = nextOptions;
    } else {
      delete nextAttributes.options;
    }
    onChange(nextAttributes);
  };

  const addOptionGroup = () => {
    const next = [...optionGroups, { name: '', values: [], required: false }];
    setOptionGroups(next);
    setOptionValueDrafts((prev) => [...prev, '']);
    updateOptionsAttribute(next);
  };

  const updateOptionGroup = (index: number, field: 'name' | 'values' | 'required', value: string | boolean) => {
    const next = [...optionGroups];
    const current = next[index];
    if (!current) return;

    if (field === 'values' && typeof value === 'string') {
      const values = value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      next[index] = { ...current, values };
    } else if (field === 'required' && typeof value === 'boolean') {
      next[index] = { ...current, required: value };
    } else if (field === 'name' && typeof value === 'string') {
      next[index] = { ...current, name: value };
    }

    setOptionGroups(next);
    updateOptionsAttribute(next);
  };

  const removeOptionGroup = (index: number) => {
    const next = optionGroups.filter((_, i) => i !== index);
    setOptionGroups(next);
    setOptionValueDrafts((prev) => prev.filter((_, i) => i !== index));
    updateOptionsAttribute(next);
  };

  const updateOptionValueDraft = (index: number, value: string) => {
    setOptionValueDrafts((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addOptionValue = (index: number) => {
    const draft = optionValueDrafts[index]?.trim();
    if (!draft) return;
    const next = [...optionGroups];
    const current = next[index];
    if (!current) return;
    const values = current.values.includes(draft) ? current.values : [...current.values, draft];
    next[index] = { ...current, values };
    setOptionGroups(next);
    setOptionValueDrafts((prev) => {
      const nextDrafts = [...prev];
      nextDrafts[index] = '';
      return nextDrafts;
    });
    updateOptionsAttribute(next);
  };

  const removeOptionValue = (groupIndex: number, value: string) => {
    const next = [...optionGroups];
    const current = next[groupIndex];
    if (!current) return;
    next[groupIndex] = { ...current, values: current.values.filter((v) => v !== value) };
    setOptionGroups(next);
    updateOptionsAttribute(next);
  };

  const updateCustomAttribute = (index: number, field: 'key' | 'value' | 'type', value: any) => {
    const updated = [...customAttributes];
    const previous = updated[index];
    updated[index] = { ...updated[index], [field]: value };
    setCustomAttributes(updated);

    const newKey = updated[index].key;
    const newValue = updated[index].value;
    const newType = updated[index].type;

    const newAttrs = { ...attributes };

    // If key changed, remove old key from attributes.
    if (field === 'key' && previous.key && previous.key !== newKey) {
      delete newAttrs[previous.key];
    }

    if (newKey) {
      let processedValue: string | number | boolean = newValue as string;

      if (newType === 'number') {
        processedValue = newValue === '' ? '' : Number(newValue);
      } else if (newType === 'boolean') {
        processedValue = newValue === 'true' || newValue === true;
      }

      newAttrs[newKey] = processedValue;
    }

    onChange(newAttrs);
  };

  const removeCustomAttribute = (index: number) => {
    const attrKey = customAttributes[index].key;
    const updated = customAttributes.filter((_, i) => i !== index);
    setCustomAttributes(updated);

    // Remove from attributes object
    if (attrKey) {
      const newAttrs = { ...attributes };
      delete newAttrs[attrKey];
      onChange(newAttrs);
    }
  };

  const renderTemplateField = (template: AttributeTemplate) => {
    const value = attributes[template.key] || '';
    const hasError = false; // Removed strict validation - specs are optional

    switch (template.dataType) {
      case 'SELECT':
        return (
          <div key={template.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {template.displayLabel}
            </label>
            <select
              value={value}
              onChange={(e) => updateTemplateAttribute(template.key, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Select {template.displayLabel}</option>
              {template.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {template.helpText && (
              <p className="text-xs text-gray-500">{template.helpText}</p>
            )}
          </div>
        );

      case 'NUMBER':
        return (
          <div key={template.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {template.displayLabel}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => updateTemplateAttribute(template.key, Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {template.helpText && (
              <p className="text-xs text-gray-500">{template.helpText}</p>
            )}
          </div>
        );

      case 'BOOLEAN':
        return (
          <div key={template.key} className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id={template.key}
              checked={value === true}
              onChange={(e) => updateTemplateAttribute(template.key, e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor={template.key} className="text-sm font-medium text-gray-700">
              {template.displayLabel}
            </label>
            {template.helpText && (
              <span className="text-xs text-gray-500 ml-2">({template.helpText})</span>
            )}
          </div>
        );

      default: // STRING
        return (
          <div key={template.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {template.displayLabel}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => updateTemplateAttribute(template.key, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {template.helpText && (
              <p className="text-xs text-gray-500">{template.helpText}</p>
            )}
          </div>
        );
    }
  };

  const baseAttributesCount = Object.keys(attributes).filter((key) => key !== 'options').length;
  const totalSummaryCount = baseAttributesCount + (optionGroups.length > 0 ? 1 : 0);
  const hasAnyAttributes = templates.length > 0 || customAttributes.length > 0 || optionGroups.length > 0 || totalSummaryCount > 0;

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">
            Product Specifications
          </h3>
          <span className="text-xs text-gray-500 font-normal">(Optional)</span>
          {hasAnyAttributes && !isExpanded && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {totalSummaryCount} added
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-6 border-t border-gray-100">
          {loadingTemplates && (
            <div className="text-sm text-gray-500">Loading templates...</div>
          )}

          {!categoryId && !loadingTemplates && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> Select a category above to see recommended specifications.
              </p>
            </div>
          )}

          {/* Template-based attributes */}
          {templates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Suggested Specifications
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map((template) => renderTemplateField(template))}
              </div>
            </div>
          )}

          {/* Product options */}
          <div className={templates.length > 0 ? 'border-t pt-4 mt-4' : ''}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Product Options</h4>
                <p className="text-xs text-gray-500">
                  Add selectable options like size, color, material, or capacity.
                </p>
              </div>
            </div>

            {optionGroups.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-xs text-gray-600 mb-2">No options added</p>
                <Button onClick={addOptionGroup} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option Group
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {optionGroups.map((option, index) => (
                  <div key={index} className="space-y-3 rounded-lg border border-gray-200 p-3 bg-white">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Option name (e.g., Size)"
                        value={option.name}
                        onChange={(e) => updateOptionGroup(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={option.required === true}
                          onChange={(e) => updateOptionGroup(index, 'required', e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => removeOptionGroup(index)}
                        className="p-2 text-gray-400 hover:text-error transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add a value (e.g., Medium)"
                        value={optionValueDrafts[index] || ''}
                        onChange={(e) => updateOptionValueDraft(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addOptionValue(index);
                          }
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => addOptionValue(index)}>
                        Add
                      </Button>
                    </div>
                    {option.values.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => (
                          <span
                            key={value}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => removeOptionValue(index, value)}
                              className="text-gray-400 hover:text-error"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Add at least one value.</p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOptionGroup}
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  Add Another Option
                </button>
              </div>
            )}
          </div>

          {/* Custom attributes */}
          <div className={(templates.length > 0 || optionGroups.length > 0) ? 'border-t pt-4 mt-4' : ''}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Additional Specifications</h4>
                <p className="text-xs text-gray-500">
                  Add any extra details about your product
                </p>
              </div>
            </div>

          {customAttributes.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-xs text-gray-600 mb-2">No additional specifications</p>
              <Button onClick={addCustomAttribute} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Specification
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {customAttributes.map((attr, index) => (
                <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                  <input
                    type="text"
                    placeholder="Name (e.g., Warranty)"
                    value={attr.key}
                    onChange={(e) => updateCustomAttribute(index, 'key', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type={attr.type === 'number' ? 'number' : 'text'}
                    placeholder="Value (e.g., 2 years)"
                    value={typeof attr.value === 'boolean' ? String(attr.value) : attr.value}
                    onChange={(e) => updateCustomAttribute(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={attr.type || 'string'}
                    onChange={(e) => updateCustomAttribute(index, 'type', e.target.value)}
                    className="w-24 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeCustomAttribute(index)}
                    className="p-2 text-gray-400 hover:text-error transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addCustomAttribute}
                className="w-full px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Add Another
              </button>
            </div>
          )}

          {/* Inline Summary - only show if has specs */}
          {totalSummaryCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-xs font-medium text-blue-900 mb-2">
                {totalSummaryCount} specification{totalSummaryCount !== 1 ? 's' : ''} added
              </h5>
              <div className="flex flex-wrap gap-2">
                {Object.entries(attributes)
                  .filter(([key]) => key !== 'options')
                  .slice(0, 5)
                  .map(([key, value]) => (
                  <span key={key} className="text-xs bg-white px-2 py-1 rounded border border-blue-200">
                    <span className="font-medium text-gray-700">{key}:</span>{' '}
                    <span className="text-gray-600">{String(value).substring(0, 20)}</span>
                  </span>
                ))}
                {optionGroups.length > 0 && (
                  <span className="text-xs bg-white px-2 py-1 rounded border border-blue-200">
                    <span className="font-medium text-gray-700">options:</span>{' '}
                    <span className="text-gray-600">{optionGroups.length} group{optionGroups.length !== 1 ? 's' : ''}</span>
                  </span>
                )}
                {baseAttributesCount > 5 && (
                  <span className="text-xs text-blue-700">+{baseAttributesCount - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}
