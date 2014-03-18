'use strict';

angular.module('dcModal', [])
    .service('dialogService',
        ['$q', '$http', '$templateCache', '$timeout',
            function dialogProvider($q, $http, $templateCache, $timeout) {
                var count = 0,
                    defaultTemplate = 'templates/default.html',
                    allModals = [],
                    openedModals = [];

                function getDialog(prop, value) {
                    for (var i = 0, iMax = allModals.length; i < iMax; i++) {
                        if (allModals[i][prop] == value) return allModals[i];
                    }
                    return null;
                }

                function destroyDialog() {
                    var that = this,
                        delay = this.animate ? 200 : 0;

                    $timeout(function () {
                        var thatIndex = allModals.indexOf(that);
                        if (thatIndex != -1) {
                            that.callStackArray('destroy');
                            that._ready = false;
                            allModals.splice(thatIndex, 1);
                        }
                    }, delay);
                }

                /**
                 * Modal constructor
                 * @param template
                 * @param options
                 * @constructor
                 */
                var DcomDialog = function (template, options) {
                    if (!template) return;

                    count++;
                    var dialog = this;

                    this.id = count;
                    this.name = template;
                    this.template = null;
                    this.controller = null;
                    this.className = null;
                    this.animate = true;

                    this._persistent = false;
                    this._backdropDisabled = false;
                    this._ready = false;
                    this._loadDirective = $q.defer();
                    this._originalTemplate = 'templates/' + template + '.html';

                    if (options && angular.isObject(options)) {
                        this.className = options.className;
                        this.animate = !(options.animate === false);
                        this._persistent = options.persistent;
                        this._backdropDisabled = options.backdrop === false;

                        if (angular.isObject(options.controller)) {
                            var ctrlFn = function ($scope) {
                                for (var prop in options.controller) {
                                    $scope[prop] = options.controller[prop]
                                }

                                dialog.$scope = $scope;
                            };
                            ctrlFn.$inject = ['$scope'];
                            this.controller = ctrlFn;
                        } else if (angular.isFunction(options.controller)) {
                            options.controller.$inject = ['$scope'];
                            this.controller = options.controller;
                        }
                    }

                    this._callStack = {
                        dismiss: [],
                        destroy: [],
                        ready: [],
                        open: []
                    };

                    allModals.push(this);

                    this.loadTemplate()
                        .then(function loadTmpSuccess(template) {
                            dialog.template = template;
                            dialog._loadDirective.promise.then(function () {
                                dialog._ready = true;
                                dialog.callStackArray('ready');
                            });
                        })
                        .catch(function loadTmpError(error) {
                            throw new Error(error)
                        });
                };

                /**
                 * Loads specified template
                 * (loads default template if an error occures during template loading)
                 * @returns {promise}
                 */
                DcomDialog.prototype.loadTemplate = function () {
                    this.deferLoad = $q.defer();

                    if (this._ready) {
                        this.deferLoad.resolve(this.template);
                    } else if (this._originalTemplate) {
                        var that = this;

                        $http.get(this._originalTemplate, {cache: $templateCache})
                            .success(function () {
                                that.deferLoad.resolve(that._originalTemplate)
                            })
                            .error(function () {
                                that.deferLoad.resolve(defaultTemplate)
                            });
                    } else {
                        this.deferLoad.reject();
                    }
                    return this.deferLoad.promise;
                };

                /**
                 * Opens the modal, or registers opening in 'onload' call stack
                 * @param {event} e
                 * @returns {promise}
                 */
                DcomDialog.prototype.open = function (e) {
                    e && e.preventDefault();

                    var openDefer = $q.defer(),
                        that = this,
                        openedIndex = openedModals.indexOf(this.id);

                    var openFunction = function () {
                        openedModals.unshift(that.id);
                        that.show();
                        openDefer.resolve();
                        that.callStackArray('open');
                    };

                    if (allModals.indexOf(this) === -1) {
                        openDefer.reject();
                        throw new Error('Dialog does not exist');
                    } else if (!this._ready) {
                        //if dialog is ready, open Modal, else register onReady stack
                        this.on('ready', openFunction);
                    } else if (openedIndex !== -1) {
                        if (openedIndex !== 0) {
                            openedModals.splice(openedIndex, 1);
                            openedModals.unshift(this.id);
                        }
                    } else {
                        openFunction();
                    }

                    return openDefer.promise;
                };

                /**
                 * Closes the modal, but keeps it in the DOM
                 * @param {event} e
                 * @returns {promise}
                 */
                DcomDialog.prototype.dismiss = function (e) {
                    e && e.preventDefault();

                    var dismissDefer = $q.defer(),
                        index = openedModals.indexOf(this.id);

                    if (!this._ready || (index === -1)) {
                        dismissDefer.reject();
                    } else {
                        this.hide();
                        openedModals.splice(index, 1);
                        this.callStackArray('dismiss');
                        dismissDefer.resolve();
                    }

                    return dismissDefer.promise;
                };

                /**
                 * Destroys modal - removes element from the DOM
                 */
                DcomDialog.prototype.destroy = function () {
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
                 * @param {function} fn
                 */
                DcomDialog.prototype.on = function (event, fn) {
                    if (!fn || !event || !angular.isFunction(fn)) return;

                    if (event in this._callStack) {
                        if (this._callStack[event].indexOf(fn) === -1) this._callStack[event].push(fn);
                    }
                };

                /**
                 * Calls all registered stack callbacks
                 * @param {string} stack
                 */
                DcomDialog.prototype.callStackArray = function (stack) {
                    var arr = this._callStack[stack] || [];

                    for (var j = 0, jMax = arr.length; j < jMax; j++) {
                        arr[j].call(this)
                    }
                };

                /**
                 * Closes modal with further DOM element destruction
                 * @param {event} e
                 */
                DcomDialog.prototype.close = function (e) {
                    this._persistent ? this.dismiss(e) : this.destroy();
                };

                /**
                 * Handles backdrop click
                 * @param {event} e
                 */
                DcomDialog.prototype.backdropClick = function (e) {
                    e && e.preventDefault();

                    if (!this._backdropDisabled) this.close(e);
                };

                return {
                    create: function (template, options) {
                        return new DcomDialog(template, options)
                    },
                    get: function (name) {
                        return getDialog('name', name)
                    },
                    getById: function (id) {
                        return getDialog('id', id)
                    },
                    allModals: allModals,
                    openedModals: openedModals
                }
            }])
    .directive('dcModalWidget',
        ['dialogService',
            function (dialogService) {
                return {
                    restrict: 'EA',
                    priority: 10,
                    replace: true,
                    templateUrl: 'src/spine.html',
                    link: function (scope, elem, attrs) {
                        scope.allModals = dialogService.allModals;
                        scope.openedModals = dialogService.openedModals;

                        // ESC key event closes the dialog
                        document.addEventListener('keyup', function (e) {
                            if (scope.openedModals.length) {
                                var topDialog = scope.openedModals[0];

                                scope.$apply(function () {
                                    e.keyCode == 27 && topDialog &&
                                    dialogService.getById(topDialog).close(e);
                                    e.preventDefault();
                                    e.stopPropagation();
                                });
                            }
                        });
                    }
                }
            }])
    .directive('dcModal',
        ['dialogService', '$timeout',
            function (dialogService, $timeout) {
                return {
                    restrict: 'EA',
                    priority: 200,
                    scope: {
                        modalId: '='
                    },
                    link: function (scope, elem, attrs) {
                        var dialog = dialogService.getById(scope.modalId);
                        dialog.show = function () {
                            $timeout(function () {
                                elem.addClass('revealed');
                            },10);
                        };
                        dialog.hide = function () {
                            $timeout(function () {
                                elem.removeClass('revealed');
                            });
                        };
                        dialog._loadDirective.resolve();
                    }
                }
            }])
    .directive('dcBackdrop',
        ['dialogService',
            function (dialogService) {
                return {
                    restrict: 'EA',
                    priority: 100,
                    replace: true,
                    template: '<div class="dc-modal-backdrop" ng-class="{shown: openedModals.length}"></div>',
                    link: function (scope, elem, attrs) {
                        //bind backdrop click event to dismiss function of the topmostDialog
                        elem[0].addEventListener('mouseup', function (e) {
                            scope.$apply(function () {
                                dialogService.getById(scope.openedModals[0]).backdropClick(e)
                            });
                        });
                    }
                }
            }])
    .run(['$compile', '$rootScope', '$timeout',
        function ($compile, $rootScope, $timeout) {
            // insert modal wrapper into the DOM
            $timeout(function () {
                angular.element(document.body)[0].appendChild($compile(angular.element('<dc-modal-widget />')[0])($rootScope)[0]);
            });
        }]);