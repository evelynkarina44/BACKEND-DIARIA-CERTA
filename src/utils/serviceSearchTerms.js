// O mesmo parser é usado na validação e na consulta, sem confundir uma lista com um nome.
export function serviceSearchTerms(value = '') {
  const unique = new Map();
  for (const part of value.split(/[,;\n]+/)) {
    const term = part.trim();
    if (term) unique.set(term.toLocaleLowerCase('pt-BR'), term);
  }
  return [...unique.values()];
}
