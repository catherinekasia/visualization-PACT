function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '--';
    // Handle string numbers with commas (e.g., "47,222,613")
    if (typeof num === 'string') {
        num = num.replace(/,/g, '');
    }
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return '--';
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(parsed);
}
