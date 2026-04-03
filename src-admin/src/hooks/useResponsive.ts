import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useResponsive(): { isMobile: boolean } {
    const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

    useEffect(() => {
        const handleResize = (): void => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        window.addEventListener('resize', handleResize);
        return (): void => window.removeEventListener('resize', handleResize);
    }, []);

    return { isMobile };
}
