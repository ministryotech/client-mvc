/* global $ */
/* global define */

/*
    CLIENT MVC JS 0.6.0
    -------------------
    Lightweight MVC framework for Javascript with it's roots in Backbone.
    The opposite of my similar backbone-ribs project, the intention is to create a framework without the strict REST model
    dependencies of Backbone that is focussed on view management, leaving data access up to the framework user
    to do as they see fit. Models in CLIENT MVC JS are regarded as simple dumb objects for the most part and can be basic JSON responses,
    the implementation of which is in your hands.

    Author: Keith Jackson
    Company: The Ministry of Technology
    Date: May 2015
    Last Updated: May 2015
    GitHub: https://github.com/ministryotech/client-mvc
 
    Extend method lifted from backbone wholesale.
    Routing and History almost entirely lifted from backbone.
    
    Backbone found at https://github.com/jashkenas/backbone
    
    NOTE: This is still a heavy beta project 
*/

(function(root, factory) {

    // Set up appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global ClientMVC (in the same way as Backbone does).
            root.ClientMVC = factory(root, exports, _, $);
        });

        // Next for Node.js or CommonJS.
    } else if (typeof exports !== 'undefined') {
        var _ = require('underscore', 'jquery');
        factory(root, exports, _, $);

        // Finally, as a browser global.
    } else {
        root.ClientMVC = factory(root, {}, root._, root.$);
    }

}(this, function(root, ClientMVC, _, $) {

    // Set up interrogation function helpers on Object.
    Object.hasValue = function(obj) {
        return obj !== undefined && obj !== null && obj !== '';
    };
    Object.exists = function(obj) {
        return obj !== undefined && obj !== null;
    };
    Object.isTruthy = function(obj) {
        return obj !== undefined && obj !== null && obj === true;
    };
    Object.isFunction = function(functionToCheck) {
        if (!Object.exists(functionToCheck)) return false;
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    };

    // Set up basic model extensions where needed for older browsers
    if (!String.prototype.trim) {
        String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
        String.prototype.ltrim = function() { return this.replace(/^\s+/, ''); };
        String.prototype.rtrim = function() { return this.replace(/\s+$/, ''); };
        String.prototype.fulltrim = function() { return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '); };
    }

    // Set up string replace functions
    if (!String.prototype.escapeRegExp) {
        String.prototype.escapeRegExp = function() { return this.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"); };
    }
    if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function(find, replace) { return this.replace(new RegExp(find.escapeRegExp(), 'g'), replace); };
    }
    
    // The .bind method from Prototype.js 
if (!Function.prototype.bind) { // check if native implementation available
  Function.prototype.bind = function(){ 
    var fn = this, args = Array.prototype.slice.call(arguments),
        object = args.shift(); 
    return function(){ 
      return fn.apply(object, 
        args.concat(Array.prototype.slice.call(arguments))); 
    }; 
  };
}

    /*
        Extend method.
        --------------
        Lifted from Backbone-js.
        This accurately maps pure class elements and prototype elements to the child class.
    */
    var extend = function(protoProps, staticProps) {
        var parent = this;
        var child;
        
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){ return parent.apply(this, arguments); };
        }
        
        _.extend(child, parent, staticProps);
        
        var Surrogate = function(){ this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();
        
        if (protoProps) _.extend(child.prototype, protoProps);
        
        child.__super__ = parent.prototype;
        return child;
    };
    


    /*
        REGION: The region.
        ------------------------------------------------------
        A Region is a fundamental part of a Client MVC project. When you create your SPA, the content tat your application renders
        will sit inside of a container. A region represents this container and any other containers within the application, with a
        custom region defined for each.
        
        A Region is responsible for the rendering of any views within itself and triggering the binding and unbinding of any events.
        
        A sample region could look like this...
        
            var coreRegion = MVC.Region.extend({
            
                name : 'core region',
                container: '#app-wrapper',
                
            });
            
        All of the properties of the base region defined here can be overridden as indicated in the sample region defined above. Each of
        these properties has a specific purpose...
        
        name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where
               errors occur far easier.
        container: The jQuery selector representing the containing element that the region represents.
        parentRegion: The Region object representing the parent region. Null for the master region.
        parentView: The View object representing the parent view that the Region's selector is rendered in. Null for the master region.
        currentView: The View object currently rendered within the region.
        
        isAvailable(): Indicates if a region is available for rendering into.
        renderView(): Renders the specified view into the region. If the region container does not exist then this will trigger up the parent
                      stack until an item is found and the items will render up to a point to allow the view to be rendered within this region.
                      Once the view is rendered then the view's 'bindEvents()' method is triggered.
        disposeView(): Clears the current region and unbinds all events for the attached view. Disposal is important to avoid any memory leaks.
        
        extend(): This method is added to most of the key super classes in Client MVC and allows them to be extended and elements overridden and
                  added to.
                  
        ClientMVC.DefaultRegion: The namespace exposes a DefaultRegion instance. This should represent the region at the uppermost level of your
                                 SPA. This is set to a standard region by default, so if you create a simple HTML page with a div on it with an ID
                                 of 'app' then that is where the base region for the app will be - you can customise and override this as you like
                                 in your app initialisation.
    */
    ClientMVC.Region = function() {};
        
    _.extend(ClientMVC.Region.prototype, {
    
        name : 'region',
        container : '#app',
        parentRegion : null,
        parentView : null,
        currentView: null,
            
        isAvailable : function() {
            return $(this.container).length > 0;
        },
            
        renderView : function(view) {
            if (this.currentView !== null) {
                this.disposeView();
            }
            
            if (!this.isAvailable()) {
                if (this.parentRegion !== null && this.parentView !== null) {
                    this.parentRegion.renderView(this.parentView);
                }  
            }
            
            $(this.container).html(view.renderContent());
            view.postRender();
            view.bindEvents();
            this.currentView = view;
            return this.currentView;
        },
        
        disposeView : function() {
            this.currentView.clearEvents();
            $(this.container).html();
            this.currentView = null;
        }
    });
    
    ClientMVC.Region.extend = extend;
    ClientMVC.DefaultRegion = new ClientMVC.Region();


    /*
        CONTROLLER: The controller.
        ------------------------------------------------------
        A Controller is where your application's core logic, or the entry points to it, should be located.
        
        In Client MVC a controller is reponsible for managing the content of a given region (or regions).
        
        A sample controller could look like this...
        
            var coreController = MVC.Controller.extend({
            
                name : 'core controller',
            
                init : function() {
                    ClientMVC.Controller.prototype.init(new CoreView(), new CoreRegion());
                }
                
                showAltView : function() {
                    ClientMVC.Controller.prototype.showView(new AltCoreView());
                }
                
            });
            
        All of the properties of the base controller defined here can be overridden as indicated in the sample region defined above. Each of
        these properties has a specific purpose...
        
        name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where
               errors occur far easier.
        region: The linked region object currently in use. THIS SHOULD NOT BE OVERRIDDEN (see init()).
        view: The linked view object currently in use. THIS SHOULD NOT BE OVERRIDDEN (see init()).
        
        init(): Initiates a controller - This sets the initial view and region and calls the 'showView()' method.
        showView(): Renders the specified view into the controller's region. If a view is not specified then the controller's initialView will
                    be used.
    */
    ClientMVC.Controller = function() { };
        
    _.extend(ClientMVC.Controller.prototype, {
        
        name : 'controller',
        
        // These should not be overridden - use init() instead.
        region : null,
        view : null,
    
        init : function(initialView, initialRegion) {
            this.region = initialRegion || ClientMVC.DefaultRegion;
            this.view = initialView;
            this.showView();
        },
        
        showView : function(view) {
            if (view !== undefined && view !== null) {
                this.view = view;
            }
            
            return this.region.renderView(this.view);
        }
    });
    
    ClientMVC.Controller.extend = extend;
    
    
    /*
        AUTH CONTROLLER: A special controller that manages authentication.
        ------------------------------------------------------------------
        An auth controller needs to implement an isAuthenticated() method and optionally log in and log out features. It is responsible
        for handling the authentication of users and generating cookies and session data to ensure users are logged in.
        
        A sample controller could look something like this...
        
            var loginController = ClientMVC.AuthController.extend({
     
               currentSession : null,
                
                init : function() {
                    ClientMVC.AuthController.prototype.init(new myView(), new myRegion())
                    if (this.isAuthenticated()) {
                        var hash = CookieManager.getSessionData().split(' ')[1];
                        this.currentSession = new UserSession(hash);
                    }
                },
                
                isAuthenticated : function() {
                    var authData = CookieManager.getSessionData();
                    return authData != undefined && authData != null && authData.length > 0;
                },
                
                logIn : function() {},
                logOut : function() {}
                
            });
            
        All of the properties of the base controller defined here can be overridden as indicated in the sample controller defined above. The
        'isAuthenticated()' method MUST be overridden. Each of these properties has a specific purpose...
        
        name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where
               errors occur far easier.
        
        init(): Initiates a controller - This sets the initial view and region but DOES NOT call the showView() method.
        isAuthenticated(): Determines whether the site has a currently logged in user.
    */
    ClientMVC.AuthController = ClientMVC.Controller.extend({
            
        name : 'auth controller',
        
        init : function(initialView, initialRegion) {
            this.region = initialRegion;
            this.view = initialView;
        },
            
        isAuthenticated : function() {
            throw new Error('The isAuthenticated() method of the auth controller has not been implemented!');
        }
        
    });
    

    /*
        SECURED CONTROLLER: A special controller that is protected by authentication.
        -----------------------------------------------------------------------------
        A secured controller is a special type of controller that requires that an Auth Controller (above) has been authenticated against
        in order to load. If authentication has failed or has not yet been made then the Secured Controller will redirect to the auth
        controller automatically.
        
        A sample controller could look something like this...
        
            var secureController = ClientMVC.SecuredController.extend({
            
                name : 'my secure controller',
                
                init : function() {
                    ClientMVC.SecuredController.prototype.init(new myView(), new myRegion(), MYAPP.Controllers.MyAuthController);
                }
                
            });
            
        All of the properties of the base controller defined here can be overridden as indicated in the sample defined above.
        
        name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where
               errors occur far easier.
        
        init(): Initiates a controller - This either calls through to the base controller init method or shows the auth controller view
                if the auth controller has not yet been authenticated.
    */
    ClientMVC.SecuredController = ClientMVC.Controller.extend({
            
        name : 'secured controller',
        
        // Takes an auth controller.
        init : function(initialView, initialRegion, authController) {
            if (!authController.isAuthenticated()) {
                this.region = initialRegion || ClientMVC.DefaultRegion;
                this.view = initialView;
                authController.showView();
            } else {
                ClientMVC.Controller.prototype.init(initialView, initialRegion);
            }
        }
        
    });
    
    
    /*
        VIEW: The view.
        ------------------------------------------------------
        A view represents a visual element of the application and is always associated with a Template. A view implementation will
        contain key elements defined below and map elements through jQuery selectors to the associated template.
        
        A sample view could look something like this...
        
            var myView = ClientMVC.View.extend({
                
                name : 'my view',
                template: TemplateSource,
                
            });
            
            myView.prototype.logOut = function(e) {
                e.preventDefault();
                MYAPP.Controllers.Auth.logOut();
            };
            
            myView.prototype.events = [
                new ClientMVC.View.Event($('#logout-button'), 'click', myView.prototype.logOut)
            ];
            
        All of the properties of the base view defined here can be overridden as indicated in the sample view defined above. If the
        template needs to be processed with data then the 'renderContent()' method must be replaced in the child class.
        
        name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where
               errors occur far easier.
        template: This is the template content for the view to process. This could be a piece of static HTML or it could be a fragment
                  in a file, using a templating engine like Mustache or Handlebars.
        events: This is an array of ClientMVC.View.Event objects (see below) which map defined elements in the template.
        
        bindEvents(): Goes through any events defined and binds them to the template. This method is called automatically by a region when
                      it renders the view.
        clearEvents(): Removes any existing event bindings on the view. This method is called automatically by a region when disposing of
                       a view;
        renderContent(): By default, this returns the template content as it stands. This is fine if the template is static HTML. If you need
                         to process data with your view then this method should be overridden.
        postRender(): By default, this does nothing but when overridden this is called by the rendering view after render has completed.
                         
        ClientMVC.View.Elements: This namespace is created here so that elements for each view can be appended to it for reference elsewhere
                                 in the custom view code. Elements would potentially look like this but are entirely optional...
                                 
                                    ClientMVC.View.Elements.MyView = {
                                        username : '#email',
                                        password : '#password',
                                        loginButton : '#form input[type=submit]'
                                    };
    */
    ClientMVC.View = function() {};
    
    _.extend(ClientMVC.View.prototype, {
        
        name : 'view',
        template : '<p>This is the default template - You will want to override this!</p>',
        data : null,
        
        elements : {},
        
        events : [],
        
        bindEvents : function () {
            var idx = 0;
            for (idx = 0; idx < this.events.length; ++idx) {
                this.events[idx].bindEvent(this);
            }
        },
        
        clearEvents : function () {
            var idx = 0;
            for (idx = 0; idx < this.events.length; ++idx) {
                this.events[idx].clearEvent();
            }
        },
        
        getDataObject : function() {
            // data could be an object or a function depending on when it needs to be accessed.
            if (Object.exists(this.data)) {
                if (Object.isFunction(this.data)) {
                    return this.data();
                } else {
                    return this.data;
                }
            }
        },
            
        renderContent : function() {
            return this.template;
        },
        
        postRender : function() {
            
        }
    });
    
    ClientMVC.View.extend = extend;
    ClientMVC.View.Elements = ClientMVC.Elements || {};
    
    
    /*
        VIEW.EVENT: An event for a view.
        ------------------------------------------------------
        An event represents an event handler for an item on the template, wrapping a jQuery style event.
        
        A sample event can be seen in the view documentation above. Unlike most of the other elements of Client MVC, events
        are not overridden they are just created using 'new ClientMVC.View.Event()' and passing in a jQuery selector for the item, 
        the name of the event and the function to execute when the event occurs.
            
        An event has methods for bindEvent and clearEvent. These methods are called by the view that the event belongs to automatically by the
        view's bind and clear methods (which are, in turn, called by the region).
    */
    ClientMVC.View.Event = function(selector, eventName, eventFunc) {
        this.selector = selector;
        this.eventName = eventName;
        this.eventFunc = eventFunc;
    };
    
    _.extend(ClientMVC.View.Event.prototype, {
        
        bindEvent : function (context) {
            if (Object.exists(context)) {
                $(this.selector).on(this.eventName, this.eventFunc.bind(context));
            } else {
                $(this.selector).on(this.eventName, this.eventFunc);
            }
        },
        
        clearEvent : function () {
            $(this.selector).off(this.eventName);
        }
    });
    
    
    /*
        ROUTER: The routing system.
        -----------------------------------------------------
        Routers map faux-URLs to actions, and fire events when routes are matched..
        
        The router and history sections are largely lifted from Backbone but are almost entirely untested at this stage. Feedback is welcome.
        
        A sample router could look something like this...
        
            var router = ClientMVC.Router.extend({
            
                name : 'my router',
                
                init : function() {
                    // Do some auth stuff here
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
    */
    ClientMVC.Router = function(options) {
        options || (options = {});
        if (options.routes) this.routes = options.routes;
        this._bindRoutes();
        this.init(options);
    };

    // Cached regular expressions for matching named param parts and splatted parts of route strings.
    var routex = {
        optionalParam : /\((.*?)\)/g,
        namedParam    : /(\(\?)?:\w+/g,
        splatParam    : /\*\w+/g,
        escapeRegExp  : /[\-{}\[\]+?.,\\\^$|#\s]/g,
    };

    // Set up all inheritable ClientMVC.Router properties and methods.
    _.extend(ClientMVC.Router.prototype, {
        
        name: 'router',
    
        // Init is an empty function by default. Override it with your own initialization logic.
        init: function(){
        },
        
        // Manually bind a single named route to a callback. For example:
        //     this.route(new ClientMVC.Router.Route('search/:query/p:num', function(query, num) {
        //       ...
        //     }, 'searchRoute');
        route: function(routeObj) {
            if (!_.isRegExp(routeObj.route)) routeObj.route = this._routeToRegExp(routeObj.route);
            if (!Object.exists(routeObj.callback)) throw 'No route destination defined';
            var router = this;
            ClientMVC.history.route(routeObj.route, function(fragment) {
                var args = router._extractParameters(routeObj.route, fragment);
                router.execute(routeObj.callback, args, name);
            });
            return this;
        },
        
        // Execute a route handler with the provided parameters.  This is an excellent place to do pre-route setup or post-route cleanup.
        execute: function(callback, args, name) {
          if (callback) { 
              callback.apply(this, args);
              return true;
          } else {
              return false;
          }
        },
        
        // Simple proxy to `ClientMVC.history` to save a fragment into the history.
        navigate: function(fragment, options) {
          ClientMVC.history.navigate(fragment, options);
          return this;
        },
        
        // Bind all defined routes to `ClientMVC.history`. We have to reverse the order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRoutes: function() {
            if (!this.routes) return;
            this.routes = _.result(this, 'routes');
            var route, routes = _.keys(this.routes);
            while ((route = routes.pop()) != null) {
                this.route(this.routes[route]);
            }
        },
        
        // Convert a route string into a regular expression, suitable for matching against the current location hash.
        _routeToRegExp: function(route) {
            route = route.replace(routex.escapeRegExp, '\\$&')
                       .replace(routex.optionalParam, '(?:$1)?')
                       .replace(routex.namedParam, function(match, optional) {
                         return optional ? match : '([^/?]+)';
                       })
                       .replace(routex.splatParam, '([^?]*?)');
            return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
        },
        
        // Given a route, and a URL fragment that it matches, return the array of extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        _extractParameters: function(route, fragment) {
            var params = route.exec(fragment).slice(1);
            return _.map(params, function(param, i) {
                // Don't decode the search params.
                if (i === params.length - 1) return param || null;
                return param ? decodeURIComponent(param) : null;
            });
        }
    
    });
    
    ClientMVC.Router.extend = extend;
    
    
    /*
        ROUTE: The routes to feed the routing system
        -----------------------------------------------------
        ClientMVC routes are simple objects like events are that the router uses for mapping.
    */
    ClientMVC.Router.Route = function(route, callback, name) {
        this.name = name || '';
        this.route = route;
        this.callback = callback;
    };
    
    
    /*
        HISTORY: The history system.
        -----------------------------------------------------
        Handles cross-browser history management, based on either [pushState](http://diveintohtml5.info/history.html) and real URLs, or
        [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange) and URL fragments. If the browser supports neither (old IE, natch),
        falls back to polling.
        
        The router and history sections are largely lifted from Backbone but are almost entirely untested at this stage. Feedback is welcome.
    */

    ClientMVC.History = function() {
        this.handlers = [];
        this.checkUrl = _.bind(this.checkUrl, this);
        
        // Has the history handling already been started?
        this.started = false;
        
        // Ensure that `History` can be used outside of the browser.
        if (typeof window !== 'undefined') {
            this.location = window.location;
            this.history = window.history;
        }
    };
    
    // Cached regex for stripping a leading hash/slash and trailing space.
    var histex = {
        routeStripper : /^[#\/]|\s+$/g,
        rootStripper : /^\/+|\/+$/g,
        pathStripper : /#.*$/
    };
    
    // Set up all inheritable ClientMVC.History properties and methods.
    _.extend(ClientMVC.History.prototype, {
        
        name: 'history',
        
        // The default interval to poll for hash changes, if necessary, is twenty times a second.
        interval: 50,
        
        // Are we at the app root?
        atRoot: function() {
            var path = this.location.pathname.replace(/[^\/]$/, '$&/');
            return path === this.root && !this.getSearch();
        },
        
        // Does the pathname match the root?
        matchRoot: function() {
            var path = this.decodeFragment(this.location.pathname);
            var root = path.slice(0, this.root.length - 1) + '/';
            return root === this.root;
        },
        
        // Unicode characters in `location.pathname` are percent encoded so they're decoded for comparison. `%25` should not be decoded since it may be part
        // of an encoded parameter.
        decodeFragment: function(fragment) {
            return decodeURI(fragment.replace(/%25/g, '%2525'));
        },
        
        // In IE6, the hash fragment and search params are incorrect if the fragment contains `?`.
        getSearch: function() {
            var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
            return match ? match[0] : '';
        },
        
        // Gets the true hash value. Cannot use location.hash directly due to bug in Firefox where location.hash will always be decoded.
        getHash: function(window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },
        
        // Get the pathname and search params, without the root.
        getPath: function() {
            var path = this.decodeFragment(
                this.location.pathname + this.getSearch()
            ).slice(this.root.length - 1);
            return path.charAt(0) === '/' ? path.slice(1) : path;
        },
        
        // Get the cross-browser normalized URL fragment from the path or hash.
        getFragment: function(fragment) {
            if (fragment == null) {
                if (this._usePushState || !this._wantsHashChange) {
                    fragment = this.getPath();
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(histex.routeStripper, '');
        },
        
        // Start the hash change handling, returning `true` if the current URL matches an existing route, and `false` otherwise.
        start: function(options) {
            if (ClientMVC.History.started) throw new Error('ClientMVC.history has already been started');
            ClientMVC.History.started = true;
            
            // Figure out the initial configuration. Do we need an iframe? Is pushState desired ... is it available?
            this.options          = _.extend({root: '/'}, this.options, options);
            this.root             = this.options.root;
            this._wantsHashChange = this.options.hashChange !== false;
            this._hasHashChange   = 'onhashchange' in window;
            this._useHashChange   = this._wantsHashChange && this._hasHashChange;
            this._wantsPushState  = !!this.options.pushState;
            this._hasPushState    = !!(this.history && this.history.pushState);
            this._usePushState    = this._wantsPushState && this._hasPushState;
            this.fragment         = this.getFragment();
            
            // Normalize root to always include a leading and trailing slash.
            this.root = ('/' + this.root + '/').replace(histex.rootStripper, '/');
            
            // Transition from hashChange to pushState or vice versa if both are requested.
            if (this._wantsHashChange && this._wantsPushState) {
                if (!this._hasPushState && !this.atRoot()) {
                    // If we've started off with a route from a `pushState`-enabled browser, but we're currently in a browser that doesn't support it...
                    var root = this.root.slice(0, -1) || '/';
                    this.location.replace(root + '#' + this.getPath());
                    // Return immediately as browser will do redirect to new url
                    return true;
                } else if (this._hasPushState && this.atRoot()) {
                    // Or if we've started out with a hash-based route, but we're currently in a browser where it could be `pushState`-based instead...
                    this.navigate(this.getHash(), {replace: true});
                }
            }
        
            // Proxy an iframe to handle location events if the browser doesn't support the `hashchange` event, HTML5 history, or the user wants
            // `hashChange` but not `pushState`.
            if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
                this.iframe = document.createElement('iframe');
                this.iframe.src = 'javascript:0';
                this.iframe.style.display = 'none';
                this.iframe.tabIndex = -1;
                var body = document.body;
                // Using `appendChild` will throw on IE < 9 if the document is not ready.
                var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
                iWindow.document.open();
                iWindow.document.close();
                iWindow.location.hash = '#' + this.fragment;
            }
        
            // Add a cross-platform `addEventListener` shim for older browsers.
            var addEventListener = window.addEventListener || function (eventName, listener) {
                return attachEvent('on' + eventName, listener);
            };
        
            // Depending on whether we're using pushState or hashes, and whether 'onhashchange' is supported, determine how we check the URL state.
            if (this._usePushState) {
                addEventListener('popstate', this.checkUrl, false);
            } else if (this._useHashChange && !this.iframe) {
                addEventListener('hashchange', this.checkUrl, false);
            } else if (this._wantsHashChange) {
                this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
            }
            
            if (!this.options.silent) return this.loadUrl();
        },
        
        // Disable ClientMVC.history, perhaps temporarily. Not useful in a real app, but possibly useful for unit testing Routers.
        stop: function() {
            // Add a cross-platform `removeEventListener` shim for older browsers.
            var removeEventListener = window.removeEventListener || function (eventName, listener) {
                return detachEvent('on' + eventName, listener);
            };
        
            // Remove window listeners.
            if (this._usePushState) {
                removeEventListener('popstate', this.checkUrl, false);
            } else if (this._useHashChange && !this.iframe) {
                removeEventListener('hashchange', this.checkUrl, false);
            }
        
            // Clean up the iframe if necessary.
            if (this.iframe) {
                document.body.removeChild(this.iframe);
                this.iframe = null;
            }
        
            // Some environments will throw when clearing an undefined interval.
            if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
            ClientMVC.History.started = false;
        },
        
        // Add a route to be tested when the fragment changes. Routes added later may override previous routes.
        route: function(route, callback) {
            this.handlers.unshift({ route : route, callback : callback });
        },
        
        // Checks the current URL to see if it has changed, and if it has, calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl: function(e) {
            var current = this.getFragment();
            
            // If the user pressed the back button, the iframe's hash will have changed and we should use that for comparison.
            if (current === this.fragment && this.iframe) {
                current = this.getHash(this.iframe.contentWindow);
            }
            
            if (current === this.fragment) return false;
            if (this.iframe) this.navigate(current);
            this.loadUrl();
        },
        
        // Attempt to load the current URL fragment. If a route succeeds with a match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl: function(fragment) {
            // If the root doesn't match, no routes can match either.
            if (!this.matchRoot()) return false;
            fragment = this.fragment = this.getFragment(fragment);
            return _.some(this.handlers, function(handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
        },
        
        // Save a fragment into the hash history, or replace the URL state if the 'replace' option is passed. You are responsible for properly URL-encoding
        // the fragment in advance.
        //
        // The options object can contain `trigger: true` if you wish to have the route callback be fired (not usually desirable), or `replace: true`, if
        // you wish to modify the current URL without adding an entry to the history.
        navigate: function(fragment, options) {
            if (!ClientMVC.History.started) return false;
            if (!options || options === true) options = {trigger: !!options};
            
            // Normalize the fragment.
            fragment = this.getFragment(fragment || '');
            
            // Don't include a trailing slash on the root.
            var root = this.root;
            if (fragment === '' || fragment.charAt(0) === '?') {
                root = root.slice(0, -1) || '/';
            }
            var url = root + fragment;
            
            // Strip the hash and decode for matching.
            fragment = this.decodeFragment(fragment.replace(histex.pathStripper, ''));
            
            if (this.fragment === fragment) return;
            this.fragment = fragment;
            
            if (this._usePushState) {
                // If pushState is available, we use it to set the fragment as a real URL.
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);    
            } else if (this._wantsHashChange) {
                // If hash changes haven't been explicitly disabled, update the hash fragment to store history.
                this._updateHash(this.location, fragment, options.replace);
                if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
                    var iWindow = this.iframe.contentWindow;
                
                    // Opening and closing the iframe tricks IE7 and earlier to push a history entry on hash-tag change.  When replace is true, we don't
                    // want this.
                    if (!options.replace) {
                        iWindow.document.open();
                        iWindow.document.close();
                    }
                
                    this._updateHash(iWindow.location, fragment, options.replace);
                }
            } else {
                // If you've told us that you explicitly don't want fallback hashchange-based history, then `navigate` becomes a page refresh.
                return this.location.assign(url);
            }
            
            if (options.trigger) return this.loadUrl(fragment);
        },
        
        // Update the hash location, either replacing the current entry, or adding a new one to the browser history.
        _updateHash: function(location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + '#' + fragment);
            } else {
                // Some browsers require that `hash` contains a leading #.
                location.hash = '#' + fragment;
            }
        }
    });
    

    // Create the default History.
    ClientMVC.history = new ClientMVC.History;


    // Version
    ClientMVC.VERSION = "0.6.0";

    return ClientMVC;
}));