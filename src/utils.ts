export function getFormattedDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function validateDate(date: string, dateRegex = /^\d{4}-\d{2}-\d{2}$/) {
    return !dateRegex.test(date)
}