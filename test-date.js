function parseOpDate(dateStr, timeStr) {
  let parsedDate;
  if (dateStr.includes('/')) {
    // DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      parsedDate = dateStr;
    }
  } else {
    // YYYY-MM-DD or ISO
    parsedDate = dateStr.split('T')[0];
  }
  const t = timeStr || '00:00';
  return new Date(`${parsedDate}T${t}`).getTime();
}

console.log(parseOpDate("25/08/2026", "18:46"));
console.log(parseOpDate("2026-08-25", "18:30"));
console.log(parseOpDate("2026-08-25T18:30:00.000Z", "18:30"));
