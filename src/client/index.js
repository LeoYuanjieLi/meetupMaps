import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import data from './testData';

console.log(data);


ReactDOM.render(
    <App contests={data.contests} />, document.getElementById('root')

);

// setTimeout(() => {
//     ReactDOM.render(
//         <h1 className="text-center">And Christmas is coming!</h1>,
//         document.getElementById('root')
//     );
// }, 4000);