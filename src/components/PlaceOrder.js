import React, { Component } from "react";
import Pizza from "../classes/Pizza";
import Order from "../classes/Order";
import { ToppingList, Topping } from "./Toppings";
import { ErrorMessage } from "./ErrorMessage";
import { PizzaItem } from "./PizzaItem";
// either useful prototype functions or regular functions that don't have any relation to the component
import "../helper_functions";
import getCookie from "../helper_functions"; // this is just for readability, it's already imported up here

export default class PlaceOrder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            first_name: '',
            last_name: '',
            sizes: [{id: 1, name: '', price: 0.00}], // sizes received from backend in template: {id, name, price}
            selected_size: {id: 1, name: '', price: 0.00}, // size object
            toppings: [], // toppings received from backend in template: {id, name, price}
            selected_toppings: [],
            pizzas: [], // array of Pizza objects
            error: {
                message: '',
                isOn: false
            }
        };
    }

    /******* Computed properties *******/
    /* memoize-one could be used for some of these functions,
    but the processes are not that complex so I guess it's fine for now */

    size_price() {
        return this.state.selected_size.price;
    }

    /* Maybe this method would be worth using memoize-one on, if you assumed someone
    ordered an insane amount of pizzas */
    order_total() {
        let total = 0.00;
        this.state.pizzas.forEach(pizza => {
            total += pizza.getTotal();
        });
        return total;
    }
    /***********************************/

    /**
     * handle input change and set state according to given key
     * @param {event} event 
     * @param {string} key 
     */
    handleChange(event, key) {
        // maybe I should define a shouldComponentUpdate() so render() isn't called
        // everytime a user types something on <input />? for optimization purposes.
        let new_state = {};
        new_state[key] = event.target.value;
        this.setState(new_state);
    }

    onSelectSize(event) {
        let size = this.state.sizes.find(size => size.id == event.target.value);
        this.setState({selected_size: size});
    }

    /******* Component methods *********/
    addTopping(id) {
        let topping = this.state.toppings.find(topping => topping.id == id);
        this.setState(prevState => ({selected_toppings: [...prevState.selected_toppings, topping]}));
    }

    removeToppingFromSelected(index) {
        let selected_toppings = Array.from(this.state.selected_toppings); // get shallow copy
        selected_toppings.splice(index, 1);
        this.setState({ selected_toppings });
    }

    addPizza() {
        let toppings_copy = Array.from(this.state.selected_toppings); // get shallow copy
        let pizza = new Pizza(this.state.selected_size, toppings_copy);
        this.setState(prevState => ({ pizzas: [...prevState.pizzas, pizza]}));
    }

    removePizza(index) {
        let pizzas = Array.from(this.state.pizzas); // get shallow copy
        pizzas.splice(index, 1);
        this.setState({ pizzas });
    }

    /**
     * Send a POST request to the server with the pizzas that are going to be stored in the DB
     */
    async placeOrder(event) {
        event.prevenDefault();
        let pizzas_copy = Array.from(this.state.pizzas);
        const order = new Order(this.state.first_name, this.state.last_name, pizzas_copy);

        try {
            let response = await fetch('/order', {
                method: 'POST',
                mode: 'same-origin',
                body: JSON.stringify(order),
                headers: {
                'Content-Type': 'application/json',
                'X-CSRFTOKEN': getCookie('csrftoken')
                }
            });

            // fetch has a flaw when errors come in, it's weird
            if(response.status != 200) { // throw error to handle it inside catch(){}
                let error_message = await response.text();
                throw new Error(error_message);
            }

            let res_message = await response.text();
            console.log(res_message); // the response was successful
            window.location.href = '/order/confirm'; // redirect to confirmation view (try to do this from flask instead)
        } catch(e) {
            console.log(e);
            this.setState({ error: { message: e, isOn: true }});
        }
    }

    deleteErrorMessage() {
        this.setState({ error: { isOn: false } });
    }
    /***********************************/

    componentDidMount() {
        fetch('/api/order')
            .then(res => {
                console.log(res);
                return res.json();
            })
            .then(data => {
                this.setState({ sizes: data.sizes, selected_size: data.sizes[0], toppings: data.toppings });
            })
            .catch(e => {
                console.log(e);
            })
    }

    shouldComponentUpdate(nextProps, nextState) {
        // state variables that often change on input return false
        if (nextState.first_name !== this.state.first_name) {
            return false;
        }
        if (nextState.last_name !== this.state.last_name) {
            return false;
        }

        return true;
    }

    render() {
        const { first_name, last_name, error, sizes, pizzas, toppings, selected_toppings } = this.state;

        return (
            <div>
                {/* error message when a validation error occurs */}
                {error.isOn && <ErrorMessage message={error.message} deleteErrorMessage={this.deleteErrorMessage} />}
                <h4 className="title is-4">Fill the data to order!</h4>
                <hr />
                <form onSubmit={(e) => this.placeOrder(e)}>
                    {/* {% csrf_token %} */}
                    <div className="columns">
                        <div className="column">
                            <div className="field is-horizontal is-pulled-left">
                                <div className="field-label is-normal">
                                    <label className="label">Client:</label>
                                </div>
                                <div className="field-body">
                                    <div className="field">
                                        <p className="control is-expanded">
                                            <input value={first_name} onChange={(e) => this.handleChange(e, 'first_name')} name="first_name" className="input" type="text" placeholder="Name" required />
                                        </p>
                                    </div>
                                    <div className="field">
                                        <p className="control is-expanded">
                                            <input value={last_name} onChange={(e) => this.handleChange(e, 'last_name')} name="last_name" className="input" type="text" placeholder="Last Name" required />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h4 className="title is-4">Customize your pizza</h4>
                    <hr />

                    <div className="columns">
                        <div className="column">
                            <div className="field has-addons is-horizontal is-pulled-left">
                                <div className="field-label is-normal">
                                    <label className="label">Sizes:</label>
                                </div>
                                <div className="field-body">
                                    <div className="control">
                                        <div className="select">
                                            <select className="select" onChange={(e) => this.onSelectSize(e)}>
                                                {/* size options from database */}
                                                {sizes.map(size => 
                                                    <option key={size.id} value={size.id}>{ size.name.capitalize() }</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="control">
                                        {/* size.price when a size is selected */}
                                        <a className="button is-static">{ this.size_price().currency() }</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="columns">
                        <div className="column">
                            <h6 className="title is-6">Toppings:</h6>      
                            <div className="field is-grouped is-grouped-multiline">
                                {/* selected tags go here */}
                                {selected_toppings.map((topping, index) => 
                                    <div key={index} className="control">
                                        <div className="tags has-addons">
                                            <span className="tag">{ topping.name }</span>
                                            <a onClick={() => this.removeToppingFromSelected(index)} className="tag is-delete"></a>
                                        </div>
                                    </div>)}
                            </div>
                        </div>
                        <div className="column">
                            <h6 className="title is-6 has-text-centered">Select your toppings:</h6>
                            <ToppingList>
                                {/* topping tags are generated here */}
                                {toppings.map(topping => <Topping key={topping.id} topping={topping} addTopping={this.addTopping.bind(this)} />)}
                            </ToppingList>
                        </div>
                    </div>

                    <div className="field">
                        <div className="control">
                            <button type="button" onClick={() => this.addPizza()} className="button">+Add Pizza</button>
                        </div>
                    </div>

                    <hr />
                    <h4 className="title is-4">Pizzas:</h4>
                    {(pizzas.length > 0) 
                        ? 
                        <ul>
                            {/* pizza items go here */}
                            {pizzas.map((pizza, index) => 
                                <PizzaItem key={index} pizza={pizza} index={index} removePizza={this.removePizza.bind(this)} />)}
                        </ul>
                        : 
                        <div className="content has-text-centered">
                            <p className="is-size-5 has-text-weight-light">There are no pizzas yet</p>
                        </div>
                    }

                    <hr />
                    
                    {pizzas.length > 0 && 
                        <div className="content" style={{display: 'flex', justifyContent: 'space-between'}}>
                            <input type="submit" value="Order" className="button is-info" />
                            <p><b>Order total:</b>&nbsp;{ this.order_total().currency() }</p>
                        </div>
                    }
                </form>
            </div>
        );
    }
}