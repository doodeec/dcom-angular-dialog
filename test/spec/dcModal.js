'use strict';

describe('Modal:: dialogService', function () {

    beforeEach(module('dcModal'));

    var dialogService,
        $httpBackend,
        $timeout;

    beforeEach(inject(function ($injector) {
        dialogService = $injector.get('dialogService');
        $httpBackend = $injector.get('$httpBackend');
        $timeout = $injector.get('$timeout');
    }));

    it('should have all methods and getters defined', function () {
        expect(dialogService.create).toBeDefined();
        expect(dialogService.get).toBeDefined();
        expect(dialogService.getById).toBeDefined();
        expect(dialogService.allModals).toBeDefined();
        expect(dialogService.openedModals).toBeDefined();
    });

    it('should create modals', function () {
        var first_modal = dialogService.create('error');
        expect(first_modal.id).toBe(1);
        expect(dialogService.allModals.length).toBe(1);

        var second_modal = dialogService.create('error');
        expect(second_modal.id).toBe(2);
        expect(dialogService.allModals.length).toBe(2);

        var third_modal = dialogService.create('error');
        expect(third_modal.id).toBe(3);
        expect(dialogService.allModals.length).toBe(3);
    });

    it('should destroy modal', function () {
        dialogService.create('error').close();

        $timeout(function () {
            expect(dialogService.allModals.length).toBe(0);
        }, 200);
    });

    it('should open modal', function () {
        $httpBackend.expectGET('templates/error')
            .respond('<div></div>');
        $httpBackend.expectGET('templates/info')
            .respond('<div></div>');
        $httpBackend.expectGET('templates/warn')
            .respond('<div></div>');

        dialogService.create('error').open();
        $timeout(function () {
            expect(dialogService.openedModals.length).toBe(1);
        });

        dialogService.create('info');
        dialogService.get('info').open();
        $timeout(function () {
            expect(dialogService.openedModals.length).toBe(2);
        });

        dialogService.create('warn');
        dialogService.getById(3).open();
        $timeout(function () {
            expect(dialogService.openedModals.length).toBe(3);
        });
    });

    it('should close opened modal', function () {
        $httpBackend.expectGET('templates/error')
            .respond('<div></div>');
        $httpBackend.expectGET('templates/info')
            .respond('<div></div>');

        var modal = dialogService.create('error');
        modal.open();
        $timeout(function () {
            modal.close();
            expect(dialogService.openedModals.length).toBe(0);
        });

        dialogService.create('info', {animate: false}).open();
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
        $httpBackend.expectGET('templates/error')
            .respond('<div></div>');

        var modal = dialogService.create('error'),
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
        $httpBackend.expectGET('templates/error')
            .respond('<div></div>');

        var modal = dialogService.create('error', {animate: false}),
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
        dialogService = $injector.get('dialogService');

        $httpBackend.expectGET('templates/info.html')
            .respond('<div><modal-header>{{ myData }}</modal-header>' +
                '<modal-body></modal-body>' +
                '<modal-footer></modal-footer>' +
                '</div>');

        var $compile = $injector.get('$compile');
        scope = $rootScope.$new();
        scope.dialog = dialogService.create('info', {
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

        $httpBackend.flush();
    });

    it('should create show and hide method', function (done) {
        scope.$digest();
        $httpBackend.flush();

        expect(scope.dialog.show).toBeDefined();
        expect(scope.dialog.hide).toBeDefined();
    });

    it('should create modal directive with template', function (done) {
        scope.$digest();
        $httpBackend.flush();

        expect(element.find('modal-header')[0]).toBeDefined();
        expect(element.find('modal-body')[0]).toBeDefined();
        expect(element.find('modal-footer')[0]).toBeDefined();
    });

    it('should have controller defined', function (done) {
        scope.$digest();
        $httpBackend.flush();
        var modalScope = element.find('modal-content').scope();

        expect(modalScope).toBeDefined();
        expect(modalScope.myData).toBe('My new Data');
        expect(modalScope.customFn).toBeDefined();
        expect(modalScope.customFn()).toBe('custom');
    });
});

