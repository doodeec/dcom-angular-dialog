angular.module('angularDialogApp')
    .service('dialogService',
        ['$q','$http','$templateCache','$document', '$timeout',
            function dialogService($q, $http, $templateCache, $document, $timeout) {

                var dialogCount = 0;
                var defaultTemplate = '../templates/mp_gen_notif.html';
                var allDialogs = [];
                var openedDialogs = [];

                /**
                 * Dialog constructor, returns newly created Dialog object
                 * @param template {mandatory}
                 * @param className
                 * @param ctrl
                 * @param persistent
                 * @constructor
                 */
                var Dialog = function(template, className, ctrl, persistent) {
                    if (!template) return;

                    dialogCount++;
                    var dialog = this;

                    this.id = dialogCount;
                    this.name = template;
                    this.template = null;
                    this.className = className;
                    this.controller = null;
                    this._persistent = persistent || false;
                    this._ready = false;
                    this._linkDefer = $q.defer();
                    this._originalTemplate = '../templates/' +template+ '.html';

                    if (angular.isObject(ctrl)) {
                        function ctrlFn($scope){
                            for (var prop in ctrl){
                                $scope[prop] = ctrl[prop];
                            }

                            ctrlFn.$inject = ['$scope'];
                            this.$scope = $scope;
                        }
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
                        dialog._linkDefer.promise.then(function() {
                            dialog._ready = true;
                            dialog.callStackArray('ready');
                        });
                    }, function loadTmpError() {
                        debug.error("Dialog template not specified");
                    });
                };

                /**
                 * Returns promise of template load
                 * @returns {promise|*|Function}
                 */
                Dialog.prototype.loadTemplate = function() {
                    this.deferLoad = $q.defer();

                    if (this._ready) {
                        this.deferLoad.resolve(this.template);
                    } else if (this._originalTemplate) {
                        var that = this;

                        $http.get(this._originalTemplate, {cache: $templateCache})
                            .success(function() {
                                that.deferLoad.resolve(that._originalTemplate);
                            })
                            .error(function() {
                                that.deferLoad.resolve(defaultTemplate);
                            });
                    } else {
                        this.deferLoad.reject();
                    }

                    return this.deferLoad.promise;
                };

                /**
                 * Opens dialog
                 * If dialog is not ready, it registers callStack on 'ready' event
                 * @param e
                 * @returns {promise|*|Function}
                 */
                Dialog.prototype.open = function(e) {
                    e && e.preventDefault();

                    var openDefer = $q.defer(),
                        that = this;

                    var openFunction = function() {
                        that.showModal();
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
                };

                /**
                 * Hides dialog, but leaves the template in DOM
                 * @param e
                 * @returns {promise|*|Function}
                 */
                Dialog.prototype.dismiss = function(e) {
                    e && e.preventDefault();

                    var dismissDefer = $q.defer(),
                        index = openedDialogs.indexOf(this.id);
                    if (!this._ready || (index === -1)) {
                        dismissDefer.reject();
                    } else {
                        this.hideModal();
                        openedDialogs.splice(index,1);
                        this.callStackArray('dismiss');
                        dismissDefer.resolve();
                    }

                    return dismissDefer.promise;
                };

                /**
                 * Destroys dialog completely, with removal from DOM
                 */
                Dialog.prototype.destroy = function() {
                    var that = this;

                    this.dismiss().then(function() {
                        destroyDialog.call(that);
                    }, function() {
                        destroyDialog.call(that);
                    });
                };

                /**
                 * Registers callStack actions
                 * @param event
                 * @param fn
                 */
                Dialog.prototype.on = function(event, fn) {
                    if (!fn || !event || !angular.isFunction(fn)) return;

                    if (event in this._callStack) {
                        this._callStack[event].push(fn);
                    }
                };

                /**
                 * Calls registered callStack actions
                 * @param stack
                 */
                Dialog.prototype.callStackArray = function(stack) {
                    var arr = this._callStack[stack] || [];

                    for (var j=0, jMax=arr.length; j<jMax; j++) {
                        arr[j].call(this);
                    }
                };

                /**
                 * Close the dialog, hide or remove
                 */
                Dialog.prototype.close = function() {
                    this._persistent ? this.dismiss() : this.destroy();
                };

                /**
                 * Returns dialog object
                 * @param prop
                 * @param value
                 * @returns {*}
                 */
                function getDialog(prop, value) {
                    for (var i=0, iMax=allDialogs.length; i < iMax; i++) {
                        if (allDialogs[i][prop] == value) {
                            return allDialogs[i];
                        }
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

                //Service public methods
                this.create = function(template, className, ctrl, persistent) {
                    return new Dialog(template, className, ctrl, persistent);
                };
                this.get = function(name) {
                    return getDialog('name', name);
                };
                this.getByClass = function(className) {
                    return getDialog('className', className);
                };
                this.getById = function(id) {
                    return getDialog('id', id);
                };
                this.allDialogs = function() {
                    return allDialogs;
                };
                this.openedDialogs = function() {
                    return openedDialogs;
                };

                return this;
    }])
    .directive('dcomDialogWidget',
        ['dialogService','$document',
            function(dialogService,$document) {
                return {
                    priority: 10,
                    replace: true,
                    templateUrl: '../src/spine.html',
                    link: function(scope, elem, attrs) {
                        scope.allDialogs = dialogService.allDialogs;
                        scope.openedDialogs = dialogService.openedDialogs;

                        // register onESC key event
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

                        dialog.showModal = function() {
                            elem.modal(modalOpt);
                        };

                        dialog.hideModal = function() {
                            elem.modal('hide');
                        };

                        dialog._linkDefer.resolve();
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
                        scope.showBackdrop = function() {
                            return scope.openedDialogs().length;
                        };

                        //bind backdrop click event to dismiss function of the topmostDialog
                        elem.on('click', function(e) {
                            scope.$apply(function() {
                                dialogService.getById(scope.openedDialogs()[0]).close(e);
                            });
                        });
                    }
                }
    }]);