// Autoextraído de src/data/demo-hub.js para separar catálogo, copy y reglas.
export function localText(value, lang = 'es') {
    if (value && typeof value === 'object' && ('es' in value || 'en' in value || 'val' in value)) {
        return value[lang] || value.es || '';
    }
    return value ?? '';
}
