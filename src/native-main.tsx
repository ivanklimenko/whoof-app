import React from 'react';
import ReactDOM from 'react-dom/client';
import Prototype from './Prototype';
import {NativeProvider} from './native';
import './styles.css';
import './prototype.css';
import './native/native.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><NativeProvider><Prototype/></NativeProvider></React.StrictMode>);
