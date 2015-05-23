'use strict';

/**
 * Dialog Factory definition
 * Holds dialog definition, constructor, caller methods
 */
var $dialogService = ["$q", "$http", "$templateCache", "$timeout",
    function ($q, $http, $templateCache, $timeout) {
        var _idCount = 0,
            defaultTemplate = "DIALOG_DEFAULT",
            baseTemplatePath = "",
            allModals = [],
            openedModals = [];

        $templateCache.put(defaultTemplate,
            "<div class=\"dc-modal-body\"><p>{{message}}</p></div>");

        /**
         * @param {string} prop - property to search by
         * @param {*} value - value to search for
         * @returns {DcDialog|null}
         */
        function getDialog(prop, value) {
            for (var i = 0, iMax = allModals.length; i < iMax; i++) {
                if (allModals[i][prop] == value) return allModals[i];
            }
            return null;
        }

        function _destroyFn() {
            var thatIndex = allModals.indexOf(this);
            this.callStackArray("destroy");
            this._ready = false;
            allModals.splice(thatIndex, 1);
        }

        /**
         * Destroys dialog either with or without the timeout (for the close animation to take action)
         */
        function destroyDialog() {
            var delay = this.animate ? 300 : 0;

            if (delay > 0) {
                $timeout(_destroyFn.bind(this), delay);
            } else {
                _destroyFn.call(this);
            }
        }

        /**
         * Modal constructor
         * @param {string} name - dialog name
         * @param {object} [options] - dialog options
         * @param {string} options.className - css class name
         * @param {bool} options.animate - animate flag (when entering/leaving screen)
         * @param {bool} options.persistent - persistent flag (true not to destroy dialog when dismissing)
         * @param {bool} options.backdrop - backdrop flag (false to disable default backdrop)
         * @param {object|function} options.controller - dialog controller (with injected '$scope')
         * @param {string} options.template - path to dialog template
         * @constructor
         * @type DcDialog
         */
        function DcDialog(name, options) {
            this.id = ++_idCount;
            this.name = name;
            this.template = null;
            this.className = null;
            this.animate = true;
            this.controller = angular.noop;

            this._openDefer = null;
            this._persistent = false;
            this._backdropDisabled = false;
            this._ready = false;
            this._loadDirective = $q.defer();

            if (options && angular.isObject(options)) {
                if (angular.isDefined(options.template)) {
                    this._originalTemplate = baseTemplatePath + options.template;
                }
                this.className = options.className;
                this.animate = !(options.animate === false);
                this._persistent = options.persistent;
                this._backdropDisabled = options.backdrop === false;

                if (angular.isObject(options.controller)) {
                    // construct fake controller function where all properties will get copied
                    this.controller = function ($scope) {
                        for (var prop in options.controller) {
                            if (options.controller.hasOwnProperty(prop)) {
                                $scope[prop] = options.controller[prop];
                            }
                        }
                    };
                } else if (angular.isFunction(options.controller)) {
                    // use function as a controller directly
                    this.controller = options.controller;
                }
                // inject a $scope to make it work properly
                this.controller.$inject = ["$scope"];
            }

            this._callStack = {
                dismiss: [],
                destroy: [],
                ready: [],
                open: []
            };

            allModals.push(this);

            this._loadTemplate()
                .then(this._loadTmpSuccess.bind(this))
                .catch(this._loadTmpError.bind(this));
        }

        /**
         * Loads specified template
         * (loads default template if an error occurs during template loading)
         * @returns {promise} template loading promise
         * @private
         * @hide
         */
        DcDialog.prototype._loadTemplate = function () {
            this.deferLoad = $q.defer();

            if (this._ready) {
                this.deferLoad.resolve(this.template);
            } else if (this._originalTemplate) {
                var that = this;

                $http.get(this._originalTemplate, {cache: $templateCache})
                    .success(function () {
                        that.deferLoad.resolve(that._originalTemplate);
                    })
                    .error(function () {
                        that.deferLoad.resolve(defaultTemplate);
                    });
            } else {
                this.deferLoad.resolve(defaultTemplate);
            }
            return this.deferLoad.promise;
        };

        /**
         * @hide
         * @private
         */
        DcDialog.prototype._loadTmpSuccess = function (template) {
            this.template = template;
            this._loadDirective.promise.then(this._loadDirectiveSuccess.bind(this));
        };

        /**
         * @hide
         * @private
         */
        DcDialog.prototype._loadTmpError = function (error) {
            throw new Error(error);
        };

        /**
         * @hide
         * @private
         */
        DcDialog.prototype._loadDirectiveSuccess = function () {
            this._ready = true;
            this.callStackArray("ready");
        };

        /**
         * Opens the modal, or registers opening in 'onload' call stack
         * @param {object} [e] - mouse event
         * @returns {promise} open dialog promise
         */
        DcDialog.prototype.open = function (e) {
            e && e.preventDefault();

            if (this._openDefer === null) {
                this._openDefer = $q.defer();
                var that = this,
                    openedIndex = openedModals.indexOf(this.id);

                var openFunction = function () {
                    openedModals.unshift(that.id);
                    that.show();
                    that._openDefer.resolve();
                    that.callStackArray("open");
                    that._openDefer = null;
                };

                if (allModals.indexOf(this) === -1) {
                    this._openDefer.reject();
                    throw new Error("Dialog does not exist");
                } else if (!this._ready) {
                    //if dialog is ready, open Modal, else register onReady stack
                    this.on("ready", openFunction);
                } else if (this.isOpened()) {
                    if (openedIndex !== 0) {
                        openedModals.splice(openedIndex, 1);
                        openedModals.unshift(this.id);
                    }
                } else {
                    $timeout(openFunction);
                }
            }

            return this._openDefer.promise;
        };

        /**
         * Closes the modal, but keeps it in the DOM
         * @param {object} [e] - mouse event
         * @returns {promise} dialog dismiss promise
         */
        DcDialog.prototype.dismiss = function (e) {
            e && e.preventDefault();

            var dismissDefer = $q.defer(),
                index = openedModals.indexOf(this.id);

            if (!this._ready || !this.isOpened()) {
                dismissDefer.reject();
            } else {
                this.hide();
                openedModals.splice(index, 1);
                this.callStackArray("dismiss");
                dismissDefer.resolve();
            }

            return dismissDefer.promise;
        };

        /**
         * Destroys modal - removes element from the DOM
         */
        DcDialog.prototype.destroy = function () {
            var that = this;

            this.dismiss()
                .then(function () {
                    destroyDialog.call(that);
                })
                .catch(function () {
                    destroyDialog.call(that);
                });
        };

        /**
         * Registers stack to be called after some event
         * @param {string} event - event name
         * @param {function} fn - function to execute on this event
         */
        DcDialog.prototype.on = function (event, fn) {
            if (!fn || !event || !angular.isFunction(fn)) return;

            if (this._callStack.hasOwnProperty(event)) {
                if (this._callStack[event].indexOf(fn) === -1) this._callStack[event].push(fn);
            }
        };

        /**
         * Calls all registered stack callbacks
         * @param {string} stack - stack name
         */
        DcDialog.prototype.callStackArray = function (stack) {
            var arr = this._callStack[stack] || [];

            for (var j = 0, jMax = arr.length; j < jMax; j++) {
                arr[j].call(this);
            }
        };

        /**
         * Closes modal with further DOM element destruction
         * @param {object} [e] - mouse event
         */
        DcDialog.prototype.close = function (e) {
            this._persistent ? this.dismiss(e) : this.destroy();
        };

        /**
         * Handles backdrop click
         * @param {object} [e] - mouse event
         */
        DcDialog.prototype.backdropClick = function (e) {
            e && e.preventDefault();

            if (!this._backdropDisabled) this.close(e);
        };

        /**
         * Checks if dialog is opened
         * @returns {boolean} true if dialog is opened
         */
        DcDialog.prototype.isOpened = function () {
            return openedModals.indexOf(this.id) !== -1;
        };

        //noinspection JSUnusedGlobalSymbols
        return {
            /**
             * Gets dialog by its name
             *
             * When no dialog is found with given name, constructs new dialog and
             * uses optional second parameter as a config object
             * @param {string} name - template name
             * @param {object} [options] - dialog config
             * @returns {DcDialog}
             */
            get: function (name, options) {
                var dialog = getDialog("name", name);
                if (dialog !== null) {
                    return dialog;
                } else {
                    return new DcDialog(name, options);
                }
            },
            /**
             * Finds dialog by its id
             * @param {number} id - dialog id
             * @returns {DcDialog|null}
             */
            findById: function (id) {
                return getDialog("id", id);
            },
            /**
             * Sets default template for dialogs
             * This is used when dialog config has no 'template' property defined
             * @param {string} tmp - base path
             */
            setDefaultTemplate: function (tmp) {
                $templateCache.put(defaultTemplate, tmp);
            },
            /**
             *
             * @param path
             */
            setBaseTemplatePath: function (path) {
                baseTemplatePath = path;
            },
            allModals: allModals,
            openedModals: openedModals
        }
    }];

/**
 * Wrapper directive for all dialogs
 * Singleton
 */
var $dialogWidgetDirective = ["DialogService", "$document",
    function (DialogService, $document) {
        return {
            restrict: "EA",
            priority: 10,
            templateUrl: "src/modalWidgetLayout.html",
            link: function (scope) {
                scope.allModals = DialogService.allModals;
                scope.openedModals = DialogService.openedModals;

                /**
                 * @param {object} e - keyboard event
                 */
                var keyUpListenerFn = function (e) {
                    if (scope.openedModals.length > 0) {
                        var topDialogId = scope.openedModals[0];

                        if (e.keyCode == 27 && topDialogId) {
                            scope.$apply(function () {
                                DialogService.findById(topDialogId).close(e);
                            });
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                };

                // ESC key event closes the dialog
                $document.bind("keyup", keyUpListenerFn);
                scope.$on('$destroy', function () {
                    $document.unbind("keyup", keyUpListenerFn);
                });
            }
        };
    }];

/**
 * Single modal directive
 * For each shown modal one directive with isolated scope is created
 */
var $dialogDirective = ["DialogService", "$timeout",
    function (DialogService, $timeout) {
        return {
            restrict: "EA",
            priority: 200,
            scope: {
                modalId: "="
            },
            link: function (scope, elem) {
                var dialog = DialogService.findById(scope.modalId);
                dialog.show = function () {
                    $timeout(function () {
                        elem.addClass("revealed");
                    }, 10);  //delay is for firefox to properly animate jump-in
                };
                dialog.hide = function () {
                    $timeout(function () {
                        elem.removeClass("revealed");
                    });
                };
                dialog._loadDirective.resolve();
            }
        };
    }];

/**
 * Backdrop directive
 * Singleton
 * Shown behind modal when there is at least one which is opened
 * Clicking the backdrop causes dialog dismiss (top dialog only)
 */
var $dialogBackdropDirective = ["DialogService",
    function (DialogService) {
        return {
            restrict: "EA",
            priority: 100,
            link: function (scope, elem) {
                /**
                 * Handles clicking on the backdrop
                 * Closes top dialog if there is any
                 * @param {object} e - mouse event
                 */
                function clickBackdrop(e) {
                    if (scope.openedModals.length > 0) {
                        scope.$apply(function () {
                            DialogService.findById(scope.openedModals[0]).backdropClick(e);
                        });
                    }
                }

                elem.bind("click", clickBackdrop);
                scope.$on('$destroy', function () {
                    elem.unbind("click", checkPosition);
                });
            }
        }
    }];

/**
 * Adds dialog widget to the DOM automatically
 */
var $dialogWidgetRunInit = ["$compile", "$rootScope", "$timeout",
    function ($compile, $rootScope, $timeout) {
        // insert modal wrapper into the DOM
        $timeout(function () {
            angular.element(document.body)[0].appendChild($compile(angular.element("<dc-modal-widget></dc-modal-widget>")[0])($rootScope)[0]);
        });
    }];


// wrap all definitions in single angular module
var dcModalModule = angular.module("dcModal", []);
dcModalModule.factory("DialogService", $dialogService);
dcModalModule.directive("dcModalWidget", $dialogWidgetDirective);
dcModalModule.directive("dcModal", $dialogDirective);
dcModalModule.directive("dcBackdrop", $dialogBackdropDirective);
dcModalModule.run($dialogWidgetRunInit);