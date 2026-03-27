// AngularJS Application Module
angular.module('cineScopePro', [])
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }])
    .run(['$rootScope', function($rootScope) {
        $rootScope.appName = 'CineScope Pro';
        $rootScope.version = '3.0.0';
    }]);