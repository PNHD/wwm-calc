import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import RootRouter from './RootRouter.tsx';
import './index.css';
import './workbench.css';
import './rebuild-v2.css';
import './product/product.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
