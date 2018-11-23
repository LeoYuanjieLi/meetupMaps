import React from 'react'; //{ Component } from 'react';
import './app.css';
import ContestPreview from './components/ContestPreview';
// import ReactImage from './react.png';

import Header from './components/Header';

class App extends React.Component {

  state = {
    pageHeader: 'Happy Thanksgiving and Black Friday, Yeah!'
  }

  componentDidMount() {
    console.log(this.props);
    // timers, listeners, ajax calls...
  }

  componentWillUnmount() {
    console.log('will unMount!');
    // clean timers, listeners
  }

  render(){
    return (
      <div className="App">
          <Header message={this.state.pageHeader} />
          <div>
            {this.props.contests.map(contest => 
              <ContestPreview {...contest} />
            )}
          </div> 
      </div>
 
  );
  }
};

export default App


// export default class App extends Component {
//   state = { username: null };

//   componentDidMount() {
//     fetch('/api/getUsername')
//       .then(res => res.json())
//       .then(user => this.setState({ username: user.username }));
//   }

//   render() {
//     const { username } = this.state;
//     return (
//       <div>
//         {username ? <h1>{`Hello ${username}`}</h1> : <h1>Loading.. please wait!</h1>}
//         <img src={ReactImage} alt="react" />
//       </div>
//     );
//   }
// }
