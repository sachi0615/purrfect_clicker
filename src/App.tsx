import Buttons from './components/Buttons';
import Log from './components/Log';
import Pills from './components/Pills';
import Shop from './components/Shop';

function App() {
  return (
    <div className="app">
      <div className="column column--main">
        <Pills />
        <div className="game-panel card">
          <Buttons />
          <Log />
        </div>
      </div>
      <div className="column column--shop card">
        <Shop />
      </div>
    </div>
  );
}

export default App;
