import { useState, useEffect } from 'react';

export default function BalanceTicker({ value, prefix = '₹', duration = 1000 }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const startValue = count;
        const endValue = parseFloat(value) || 0;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentCount = progress * (endValue - startValue) + startValue;
            setCount(currentCount);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value]);

    return (
        <span className="balance-ticker">
            {prefix}{count.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
}
