/* global $ */
/* global define */

/*
    CLIENT MVC JS 0.5.4
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
    
    NOTE: Currently routing is not supported - If you want a routed SPA I recommend checking out Backbone along with my Backbone Ribs
    project for a view state managed implementation of backbone.
    
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
        
        events : [],
        
        bindEvents : function () {
            var idx = 0;
            for (idx = 0; idx < this.events.length; ++idx) {
                this.events[idx].bind();
            }
        },
        
        clearEvents : function () {
            var idx = 0;
            for (idx = 0; idx < this.events.length; ++idx) {
                this.events[idx].clear();
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
            
        An event has methods for bind and clear. These methods are called by the view that the event belongs to automatically by the
        view's bind and clear methods (which are, in turn, called by the region).
    */
    ClientMVC.View.Event = function(selector, eventName, eventFunc) {
        this.selector = selector;
        this.eventName = eventName;
        this.eventFunc = eventFunc;
    };
    
    _.extend(ClientMVC.View.Event.prototype, {
        
        bind : function () {
            $(this.selector).on(this.eventName, this.eventFunc);
        },
        
        clear : function () {
            $(this.selector).off(this.eventName);
        }
    });


    // Version
    ClientMVC.VERSION = "0.5.4";

    return ClientMVC;
}));