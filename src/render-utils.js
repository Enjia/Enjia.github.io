export function encodeJsonScriptData(value) {
  return JSON.stringify(value).replaceAll('</script', '<\\/script');
}

export function decodeJsonScriptData(value) {
  return JSON.parse(value.replaceAll('<\\/script', '</script'));
}
