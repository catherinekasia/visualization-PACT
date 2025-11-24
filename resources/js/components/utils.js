function formatNumber(num) {
    if (!num) return '--';
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(num);
}
