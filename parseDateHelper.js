function parseOpDate(dateStr, timeStr) {
  let datePart = dateStr;
  if (dateStr.includes('/')) {
    // DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      datePart = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } else if (dateStr.includes('T')) {
    // ISO string
    datePart = dateStr.split('T')[0];
  }
  const t = timeStr || '00:00';
  return new Date(`${datePart}T${t}`).getTime();
}
console.log(parseOpDate("25/08/2026", "18:46"));
console.log(parseOpDate("2026-08-25T18:46:00.000Z", "18:46"));
console.log(parseOpDate("2026-08-25", "18:46"));
