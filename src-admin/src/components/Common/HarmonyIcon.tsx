import React from 'react';
import { Box } from '@mui/material';

interface HarmonyIconProps {
    src: string;
    alt?: string;
    size?: number;
}

export function HarmonyIcon({ src, alt = '', size = 32 }: HarmonyIconProps): React.JSX.Element {
    return (
        <Box
            sx={{
                width: size,
                height: size,
                minWidth: size,
                borderRadius: '50%',
                bgcolor: 'grey.800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            <img
                src={src}
                alt={alt}
                style={{
                    width: size * 0.7,
                    height: size * 0.7,
                    objectFit: 'contain',
                }}
            />
        </Box>
    );
}
