// Expose React on `window` so the design's original JSX (which uses
// `React.useState`, `React.useEffect`, etc. without explicit imports)
// keeps working after the move from Babel-standalone to Vite ESM.
import * as React from 'react';

if (typeof window !== 'undefined') {
    window.React = React;
}

export default React;
