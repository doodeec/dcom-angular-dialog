'use strict';

angular.module('dcomDialog', [])
    .service('dialogService',
        ['$q','$http','$templateCache','$document', '$timeout',
            function dialogProvider($q, $http, $templateCache, $document, $timeout) {

                var count = 0;
                var defaultTemplate = 'templates/default.html';
                var allDialogs = [];
                var openedDialogs = [];

                function getDialog(prop, value) {
                    for (var i=0, iMax=allDialogs.length; i < iMax; i++) {
                        if (allDialogs[i][prop] == value) return allDialogs[i];
                    }
                    return null;
                }

                function destroyDialog() {
                    var that = this;
                    // because of bootstrap's detecting of transitions, timeout is needed to prevent
                    // disabling scrollbar on body
                    $timeout(function(){
                        var thatIndex = allDialogs.indexOf(that);
                        if (thatIndex != -1) {
                            that.callStackArray('destroy');
                            that._ready = false;
                            allDialogs.splice(thatIndex,1);
                        }
                    },200);
                }

                var DcomDialog = function(template, options) {
                    if (!template) return;

                    count++;
                    var dialog = this;

                    this.id = count;
                    this.name = template;
                    this.template = null;
                    this.controller = null;
                    this.className = null;
                    this._persistent = false;
                    this._backdropDisabled = false;
                    this._ready = false;
                    this._loadDirective = $q.defer();
                    this._originalTemplate = 'templates/' +template+ '.html';

                    if (options && angular.isObject(options)) {
                        this.className = options.className;
                        this._persistent = options.persistent;
                        this._backdropDisabled = options.backdrop === false;

                        if (angular.isObject(options.controller)) {
                            var ctrlFn = function($scope){
                                for (var prop in options.controller){ $scope[prop] = options.controller[prop] }

                                dialog.$scope = $scope;
                            };
                            ctrlFn.$inject = ['$scope'];
                            this.controller = ctrlFn;
                        } else if (angular.isFunction(options.controller)) {
                            this.controller = options.controller;
                        }
                    }

                    this._callStack = {
                        dismiss: [],
                        destroy: [],
                        ready: [],
                        open: []
                    };

                    allDialogs.push(this);

                    this.loadTemplate().then(function loadTmpSuccess(template) {
                        dialog.template = template;
                        dialog._loadDirective.promise.then(function() {
                            dialog._ready = true;
                            dialog.callStackArray('ready');
                        });
                    }, function loadTmpError() { console.error("Template not specified") });
                };

                DcomDialog.prototype.loadTemplate = function() {
                    this.deferLoad = $q.defer();

                    if (this._ready) {
                        this.deferLoad.resolve(this.template);
                    } else if (this._originalTemplate) {
                        var that = this;

                        $http.get(this._originalTemplate, {cache: $templateCache})
                            .success(function() { that.deferLoad.resolve(that._originalTemplate) })
                            .error(function() { that.deferLoad.resolve(defaultTemplate) });
                    } else {
                        this.deferLoad.reject();
                    }
                    return this.deferLoad.promise;
                };

                DcomDialog.prototype.open = function(e) {
                    e && e.preventDefault();

                    var openDefer = $q.defer(),
                        that = this,
                        openedIndex = openedDialogs.indexOf(this.id);

                    var openFunction = function() {
                        that.show();
                        openedDialogs.unshift(that.id);
                        openDefer.resolve();
                        that.callStackArray('open');
                    };

                    if (allDialogs.indexOf(this) === -1) {
                        openDefer.reject();
                        console.warn('Dialog does not exist');
                    } else if (!this._ready) {
                        //if dialog is ready, open Modal, else register onReady stack
                        this.on('ready', openFunction);
                    } else if (openedIndex !== -1) {
                        if (openedIndex !== 0) {
                            openedDialogs.splice(openedIndex,1);
                            openedDialogs.unshift(this.id);
                        }
                    } else {
                        openFunction();
                    }

                    return openDefer.promise;
                };

                DcomDialog.prototype.dismiss = function(e) {
                    e && e.preventDefault();

                    var dismissDefer = $q.defer(),
                        index = openedDialogs.indexOf(this.id),
                        that = this;

                    if (!this._ready || (index === -1)) {
                        dismissDefer.reject();
                    } else {
                        this.hide();
                        openedDialogs.splice(index,1);
                        this.callStackArray('dismiss');
                        dismissDefer.resolve();
                    }

                    return dismissDefer.promise;
                };

                DcomDialog.prototype.destroy = function() {
                    var that = this;

                    this.dismiss().then(function() {
                        destroyDialog.call(that);
                    }, function() {
                        destroyDialog.call(that);
                    });
                };

                DcomDialog.prototype.on = function(event, fn) {
                    if (!fn || !event || !angular.isFunction(fn)) return;

                    if (event in this._callStack) {
                        if (this._callStack[event].indexOf(fn) === -1) this._callStack[event].push(fn);
                    }
                };

                DcomDialog.prototype.callStackArray = function(stack) {
                    var arr = this._callStack[stack] || [];

                    for (var j=0, jMax=arr.length; j<jMax; j++) { arr[j].call(this) }
                };

                DcomDialog.prototype.close = function(e) {
                    this._persistent ? this.dismiss(e) : this.destroy();
                };

                DcomDialog.prototype.backdropClick = function(e) {
                    e && e.preventDefault();

                    if (!this._backdropDisabled) this.close();
                };



                return {
                    create: function(template, options) {
                        return new DcomDialog(template, options)
                    },
                    get: function(name) { return getDialog('name', name) },
                    getById: function(id) { return getDialog('id', id) },
                    allDialogs: function() { return allDialogs },
                    openedDialogs: function() { return openedDialogs }
                }
            }])
    .directive('dcomDialogWidget',
        ['dialogService','$document',
            function(dialogService,$document) {
                return {
                    priority: 10,
                    replace: true,
                    templateUrl: 'src/spine.html',
                    link: function(scope, elem, attrs) {
                        scope.allDialogs = dialogService.allDialogs;
                        scope.openedDialogs = dialogService.openedDialogs;

                        // ESC key event closes the dialog
                        $document.keyup(function(e) {
                            var topDialog = dialogService.openedDialogs()[0];

                            scope.$apply(function(){
                                e.keyCode == 27 && topDialog &&
                                    dialogService.getById(topDialog).close(e) &&
                                e.preventDefault();
                            });
                        });
                    }
                }
            }])
    .directive('dcomDialog',
        ['dialogService',
            function(dialogService) {
                return {
                    priority: 200,
                    link: function(scope, elem, attrs) {
                        var modalOpt = {
                            show: true,
                            backdrop: false,
                            keyboard: false
                        };

                        var dialog = dialogService.getById(scope.dialog.id);
                        dialog.show = function() { elem.modal(modalOpt) };
                        dialog.hide = function() { elem.modal('hide') };
                        dialog._loadDirective.resolve();
                    }
                }
            }])
    .directive('dcomDialogBackdrop',
        ['dialogService',
            function(dialogService) {
                return {
                    priority: 100,
                    replace: true,
                    template: '<div class="dcomDialogBackdrop" ng-class="{shown: showBackdrop()}"></div>',
                    link: function(scope, elem, attrs) {
                        scope.showBackdrop = function() { return scope.openedDialogs().length };

                        //bind backdrop click event to dismiss function of the topmostDialog
                        elem.on('click', function(e) {
                            scope.$apply(function() { dialogService.getById(scope.openedDialogs()[0]).backdropClick(e) });
                        });
                    }
                }
            }]);