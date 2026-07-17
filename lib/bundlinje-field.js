const BUNDLINJE_FIELD_KEY = 'opportunity.bundlinje';

function normalizeFieldKey(fieldKey) {
  return String(fieldKey || '').trim().toLowerCase();
}

function isBundlinjeField(customField, profitFieldId = null) {
  if (!customField) return false;

  const fieldKey = normalizeFieldKey(customField.fieldKey);
  if (
    fieldKey === BUNDLINJE_FIELD_KEY
    || fieldKey === 'bundlinje'
    || fieldKey.endsWith('.bundlinje')
  ) {
    return true;
  }

  if (profitFieldId && customField.id === profitFieldId) return true;

  return /bundlinje/i.test(String(customField.name || ''));
}

function resolveBundlinjeFieldId(customFieldDefinitions = []) {
  const match = customFieldDefinitions.find((field) =>
    normalizeFieldKey(field.fieldKey) === BUNDLINJE_FIELD_KEY
    || /bundlinje/i.test(String(field.name || ''))
    || /bundlinje/i.test(String(field.fieldKey || '')),
  );
  return match?.id || null;
}

function buildCustomFieldDefinitionMap(customFieldDefinitions = []) {
  const map = new Map();
  for (const field of customFieldDefinitions) {
    if (field?.id) map.set(field.id, field);
  }
  return map;
}

function enrichOpportunityCustomFields(opportunities, customFieldDefinitions = []) {
  if (!customFieldDefinitions.length) return opportunities;

  const definitionMap = buildCustomFieldDefinitionMap(customFieldDefinitions);

  return opportunities.map((opportunity) => {
    const customFields = (opportunity.customFields || []).map((field) => {
      const definition = definitionMap.get(field.id);
      if (!definition) return field;

      return {
        ...field,
        name: field.name || definition.name || null,
        fieldKey: field.fieldKey || definition.fieldKey || null,
      };
    });

    return customFields.length ? { ...opportunity, customFields } : opportunity;
  });
}

function findBundlinjeField(customFields = [], profitFieldId = null) {
  return (customFields || []).find((field) => isBundlinjeField(field, profitFieldId)) || null;
}

module.exports = {
  BUNDLINJE_FIELD_KEY,
  buildCustomFieldDefinitionMap,
  enrichOpportunityCustomFields,
  findBundlinjeField,
  isBundlinjeField,
  normalizeFieldKey,
  resolveBundlinjeFieldId,
};
