/* global ClientMVC */

var TestRouter = ClientMVC.Router.extend({

    name : 'my router',
    
    init : function(options) {
        ClientMVC.history.start();
    },
    
    routes: [
        new ClientMVC.Router.Route('search/:query/p:num', function(query, num) {
            alert(query);
        	alert(num);
        }, 'searchRoute'),
        new ClientMVC.Router.Route('home', function() {
            alert('You are home');
        }, 'homeRoute'),
        new ClientMVC.Router.Route('away', function() {
            alert('You are away');
        }, 'awayRoute'),
        new ClientMVC.Router.Route('*action', function(action) {
            alert('You are at ' + action);
        }, 'defaultRoute')
    ]
    
});

var router = new TestRouter();