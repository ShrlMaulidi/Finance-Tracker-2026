import React, { useState, useEffect } from 'react';

export default function CurrencyInput({ value, onValueChange, className, ...props }) {
    const [displayValue, setDisplayValue] = useState('');

    // Normalize value from database decimals (e.g. "10000.00"), numbers, or formatted strings
    const normalizeValue = (val) => {
        if (val === undefined || val === null || val === '') return '';

        // If it's already a number
        if (typeof val === 'number') {
            return isNaN(val) ? '' : Math.round(val);
        }

        const str = val.toString().trim();
        if (!str) return '';

        // Database decimal string format: e.g. "10000.00" or "500.5"
        // (single period followed by 1 or 2 digits, without multiple thousand dots)
        if (/^\d+\.\d{1,2}$/.test(str)) {
            const num = parseFloat(str);
            return isNaN(num) ? '' : Math.round(num);
        }

        // Indonesian thousand dots (e.g. "10.000") or plain digits ("10000")
        const digits = str.replace(/\D/g, '');
        if (!digits) return '';
        return parseInt(digits, 10);
    };

    const formatNumber = (val) => {
        const num = normalizeValue(val);
        if (num === '' || isNaN(num)) return '';
        return new Intl.NumberFormat('id-ID').format(num);
    };

    useEffect(() => {
        if (value !== undefined && value !== null && value !== '') {
            setDisplayValue(formatNumber(value));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleChange = (e) => {
        if (props.readOnly || props.disabled) return;
        const rawValue = e.target.value.replace(/\D/g, '');
        if (!rawValue) {
            setDisplayValue('');
            if (onValueChange) onValueChange('');
            return;
        }

        const numeric = parseInt(rawValue, 10);
        setDisplayValue(new Intl.NumberFormat('id-ID').format(numeric));
        if (onValueChange) {
            onValueChange(numeric);
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
