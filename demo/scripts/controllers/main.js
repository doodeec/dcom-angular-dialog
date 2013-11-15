'use strict';

angular.module('angularDialogApp')
  .controller('MainCtrl',
    ['$scope','dialogService',
        function ($scope, dialogService) {

            $scope.oneDialog = function() {
                var dialog = dialogService.create('error','error');
                dialog.open();
            };

            $scope.twoDialogs = function() {
                var firstDialog = dialogService.create('info','info', null, false, true);
                firstDialog.open();
                var secondDialog = dialogService.create('error','error');
                secondDialog.open();
            };

            $scope.ctrlDialog = function() {
                var dialog = dialogService.create('ctrl','ctrl', {
                    message: "This is dialog message injected from code",
                    magicButton: function() {
                        this.message = "Whoa, message has changed";
                    }
                });
                dialog.open();
            };
  }]);
