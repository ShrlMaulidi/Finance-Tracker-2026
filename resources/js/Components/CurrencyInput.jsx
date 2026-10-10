import React, { useState, useEffect } from 'react';

export default function CurrencyInput({ value, onValueChange, className, ...props }) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value !== undefined && value !== null && value !== '') {
            setDisplayValue(formatNumber(value.toString()));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const formatNumber = (val) => {
        // Remove all non-digits
        const digits = val.replace(/\D/g, '');
        if (!digits) return '';
        // Format with thousand separators
        return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10));
    };

    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        setDisplayValue(formatNumber(rawValue));
        if (onValueChange) {
            onValueChange(rawValue ? parseInt(rawValue, 10) : '');
        }
    };

    return (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            className={className}
        />
    );
}
