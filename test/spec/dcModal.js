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
        var modal = dialogService.create('error');

        modal.close();
        $timeout(function() {
            expect(dialogService.allModals.length).toBe(0);
        },200);
    });

    it('should open modal', function () {
        $httpBackend.expectGET('templates/error')
            .respond('<div></div>');

        var modal = dialogService.create('error');
        modal.open();
        $timeout(function() {
            expect(dialogService.openedModals.length).toBe(1);
        });
    });

    it('should close opened modal', function () {
        $httpBackend.expectGET('templates/error')
            .respond('<div></div>');

        var modal = dialogService.create('error');
        modal.open();
        $timeout(function() {
            modal.close();
            expect(dialogService.openedModals.length).toBe(0);
        });
    });

    it('should be called once modal is opened', function () {
        $httpBackend.expectGET('templates/error')
            .respond('<div></div>');

        var modal = dialogService.create('error'),
            array = [];
        modal.on('open', function() {
            array.push(1);
        });
        modal.open();
        expect(array.length).toBe(0);
        $timeout(function() {
            expect(array.length).toBe(1);
        });
    });

    it('should be called once modal is destroyed', function () {
        $httpBackend.expectGET('templates/error')
            .respond('<div></div>');

        var modal = dialogService.create('error', {animate: false}),
            array = [];
        modal.on('destroy', function() {
            array.push(1);
        });
        modal.open();
        expect(array.length).toBe(0);
        $timeout(function() {
            modal.close();
            $timeout(function() {
                expect(array.length).toBe(1);
            });
        });
    });
});
