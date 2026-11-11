const calendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

// Data civil, sem aproximar 18 anos por uma quantidade fixa de dias.
export function getBirthDateError(value, now = new Date()) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'Informe uma data de nascimento válida.';
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (year < 1000 || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return 'Informe uma data de nascimento válida.';
  }
  const parts = Object.fromEntries(calendar.formatToParts(now).map((part) => [part.type, part.value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  if (value > today) return 'A data de nascimento não pode estar no futuro.';
  let age = Number(parts.year) - year;
  if (Number(parts.month) < month || (Number(parts.month) === month && Number(parts.day) < day)) age--;
  if (age < 18) return 'É necessário ter pelo menos 18 anos para se cadastrar.';
  return null;
}
