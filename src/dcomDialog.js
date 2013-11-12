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
                    $timeout(function(){
                        that.callStackArray('destroy');
                        allDialogs.splice(allDialogs.indexOf(that),1);
                    });
                }

                var Dialog = function(template, className, ctrl, persistent) {
                    if (!template) return;

                    count++;
                    var dialog = this;

                    this.id = count;
                    this.name = template;
                    this.template = null;
                    this.className = className;
                    this.controller = null;
                    this._persistent = persistent || false;
                    this._ready = false;
                    this._loadDirective = $q.defer();
                    this._originalTemplate = 'templates/' +template+ '.html';

                    if (angular.isObject(ctrl)) {
                        var ctrlFn = function($scope){
                            for (var prop in ctrl){ $scope[prop] = ctrl[prop] }
                            ctrlFn.$inject = ['$scope'];
                            this.$scope = $scope;
                        };
                        this.controller = ctrlFn;
                    } else if (angular.isFunction(ctrl)) {
                        this.controller = ctrl;
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

                Dialog.prototype = {
                    loadTemplate: function() {
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
                    },
                    open: function(e) {
                        e && e.preventDefault();

                        var openDefer = $q.defer(),
                            that = this;

                        var openFunction = function() {
                            that.show();
                            openedDialogs.unshift(that.id);
                            openDefer.resolve();
                            that.callStackArray('open');
                        };

                        //if dialog is ready, open Modal, else register onReady stack
                        if (!this._ready || openedDialogs.indexOf(this.id) !== -1) {
                            this.on('ready', openFunction);
                        } else {
                            openFunction();
                        }

                        return openDefer.promise;
                    },
                    dismiss: function(e) {
                        e && e.preventDefault();

                        var dismissDefer = $q.defer(),
                            index = openedDialogs.indexOf(this.id);
                        if (!this._ready || (index === -1)) {
                            dismissDefer.reject();
                        } else {
                            this.hide();
                            openedDialogs.splice(index,1);
                            this.callStackArray('dismiss');
                            dismissDefer.resolve();
                        }

                        return dismissDefer.promise;
                    },
                    destroy: function() {
                        var that = this;

                        this.dismiss().then(function() {
                            destroyDialog.call(that);
                        }, function() {
                            destroyDialog.call(that);
                        });
                    },
                    on: function(event, fn) {
                        if (!fn || !event || !angular.isFunction(fn)) return;

                        if (event in this._callStack) this._callStack[event].push(fn);
                    },
                    callStackArray: function(stack) {
                        var arr = this._callStack[stack] || [];

                        for (var j=0, jMax=arr.length; j<jMax; j++) { arr[j].call(this) }
                    },
                    close: function() {
                        this._persistent ? this.dismiss() : this.destroy();
                    }
                };



                return {
                    create: function(template, className, ctrl, persistent) { return new Dialog(template, className, ctrl, persistent) },
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
                                    dialogService.getById(topDialog).dismiss(e) &&
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
                            scope.$apply(function() { dialogService.getById(scope.openedDialogs()[0]).close(e) });
                        });
                    }
                }
            }]);