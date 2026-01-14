import React from 'react';

interface IconProps {
    className?: string;
}

// Material Symbols does not include trademarked logos. 
// We use semantic equivalents: Public (World) for FB, Photo Camera for IG, Chat for WhatsApp.

export const FacebookIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`material-symbols-outlined ${className} !text-2xl`}>public</span>
);

export const InstagramIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`material-symbols-outlined ${className} !text-2xl`}>photo_camera</span>
);

export const WhatsappIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`material-symbols-outlined ${className} !text-2xl`}>chat</span>
);