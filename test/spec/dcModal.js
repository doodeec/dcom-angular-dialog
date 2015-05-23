'use strict';

describe('Modal:: DialogService', function () {

    beforeEach(module('dcModal'));

    var dialogService,
        $httpBackend,
        $timeout;

    beforeEach(inject(function ($injector) {
        dialogService = $injector.get('DialogService');
        $httpBackend = $injector.get('$httpBackend');
        $timeout = $injector.get('$timeout');
    }));

    it('should have all methods and getters defined', function () {
        expect(dialogService.get).toBeDefined();
        expect(dialogService.findById).toBeDefined();
        expect(dialogService.allModals).toBeDefined();
        expect(dialogService.openedModals).toBeDefined();
    });

    it('should create modals', function () {
        var first_modal = dialogService.get('error');
        expect(first_modal.id).toBe(1);
        expect(dialogService.allModals.length).toBe(1);

        var second_modal = dialogService.get('error');
        expect(second_modal.id).toBe(1);
        expect(dialogService.allModals.length).toBe(1);

        var third_modal = dialogService.get('error');
        expect(third_modal.id).toBe(1);
        expect(dialogService.allModals.length).toBe(1);
    });

    it('should destroy modal', function () {
        dialogService.get('error').close();

        $timeout(function () {
            expect(dialogService.allModals.length).toBe(0);
        }, 200);
    });

    it('should open modal', function () {
        dialogService.get('error').open();
        $timeout(function () {
            expect(dialogService.openedModals.length).toBe(1);
        });

        dialogService.get('info');
        dialogService.get('info').open();
        $timeout(function () {
            expect(dialogService.openedModals.length).toBe(2);
        });

        dialogService.get('warn');
        dialogService.findById(3).open();
        $timeout(function () {
            expect(dialogService.openedModals.length).toBe(3);
        });
    });

    it('should close opened modal', function () {
        var modal = dialogService.get('error');
        modal.open();
        $timeout(function () {
            modal.close();
            expect(dialogService.openedModals.length).toBe(0);
        });

        dialogService.get('info', {animate: false}).open();
        $timeout(function () {
            expect(dialogService.openedModals.length).toBe(1);
            //fake ESC keyup event
            var keyboardEvent = document.createEvent("KeyboardEvent");
            var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
            keyboardEvent[initMethod]("keyup", true, true, window, false, false, false, false, 27, 0);
            document.dispatchEvent(keyboardEvent);
            $timeout(function () {
                expect(dialogService.openedModals.length).toBe(0);
            });
        });
    });

    it('should be called once modal is opened', function () {
        var modal = dialogService.get('error'),
            array = [];
        modal.on('open', function () {
            array.push(1);
        });
        modal.open();
        expect(array.length).toBe(0);
        $timeout(function () {
            expect(array.length).toBe(1);
        });
    });

    it('should be called once modal is destroyed', function () {
        var modal = dialogService.get('error', {animate: false}),
            array = [];
        modal.on('destroy', function () {
            array.push(1);
        });
        modal.open();
        expect(array.length).toBe(0);
        $timeout(function () {
            modal.close();
            $timeout(function () {
                expect(array.length).toBe(1);
            });
        });
    });

    it('should attach controller inside the modal', function () {
        //TODO
    });
});

describe('Modal:: modal directive', function () {

    beforeEach(module('dcModal'));

    var dialogService,
        $httpBackend,
        $rootScope,
        scope,
        element;

    beforeEach(inject(function ($injector) {
        $rootScope = $injector.get('$rootScope');
        $httpBackend = $injector.get('$httpBackend');
        dialogService = $injector.get('DialogService');

        var $compile = $injector.get('$compile');
        scope = $rootScope.$new();
        scope.dialog = dialogService.get('info', {
            controller: {
                myData: 'My new Data',
                customFn: function() {
                    return 'custom'
                }
            }
        });

        element = angular.element('<div class="dc-modal {{dialog.className}}"' +
            'id="{{ dialog.name }}" dc-modal modal-id="dialog.id">' +
            '<div>' +
            '<modal-content ng-include ' +
            'src="dialog.template" ng-controller="dialog.controller">' +
            '</modal-content>' +
            '</div></div>');
        $compile(element)(scope);
    }));

    it('should create isolated scope', function () {
        scope.$digest();
        expect(element.isolateScope).toBeDefined();
        expect(element.isolateScope().modalId).toBe(1);
    });

    it('should create show and hide method', function () {
        scope.$digest();

        expect(scope.dialog.show).toBeDefined();
        expect(scope.dialog.hide).toBeDefined();
    });

    it('should have controller defined', function () {
        scope.$digest();
        var modalScope = element.find('modal-content').scope();

        expect(modalScope).toBeDefined();
        expect(modalScope.myData).toBe('My new Data');
        expect(modalScope.customFn).toBeDefined();
        expect(modalScope.customFn()).toBe('custom');
    });
});

