import React from "react";

export const SunFilledIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height="1em"
        role="presentation"
        viewBox="0 0 24 24"
        width="1em"
        {...props}
    >
        <path
            d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            fill="currentColor"
        ></path>
        <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
    </svg>
);

export const MoonFilledIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height="1em"
        role="presentation"
        viewBox="0 0 24 24"
        width="1em"
        {...props}
    >
        <path
            d="M12 3a9 9 0 00-9 9c0 4.96 4.04 9 9 9 1.5 0 2.9-.38 4.15-1.05A8.99 8.001 0 0012 3zm0 16c-3.87 0-7-3.13-7-7 0-3.15 2.07-5.83 4.95-6.73A7.99 7.99 0 0112 19z"
            fill="currentColor"
        ></path>
    </svg>
);

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="24px"
        height="24px"
        {...props}
    >
        <path d="M0 0h24v24H0z" fill="none"></path>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path>
    </svg>
);