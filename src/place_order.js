import 'regenerator-runtime/runtime'; // this import is neccesary to the whole transpiling business
import PlaceOrder from "./components/PlaceOrder";

const el = document.getElementById('app');
ReactDOM.render(<PlaceOrder />, el);