export function getFormattedDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function validateDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
        throw new Error('Not a valid date');
    }
}

export function customDateValidation(value: string, property?: string) {
    if (value === '') {
        value = new Date().toISOString().split('T')[0];
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Invalid date format, property: ${property}, must be yyyy-mm-dd`);
    }

    validateDate(value)

    return true;

}