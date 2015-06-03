var PAGE_URL       = 'http://c3sregistration.studyitin.ee/'
var API_URL        = 'https://entu.keeleressursid.ee/api2/'
var API_USER       = 711
var API_KEY        = 's2SuDSy9Bx5Qowj492ThZSKgZ8yCL7B1qBW2D11qeBF9KivEDCkM8LBvlPoa0Ddb'
var FLEEP_HOOK_URL = 'https://fleep.io/hook/abypGACaReaTyC6PGvw1SQ'

function cl(d) {
    console.log(d)
}

function getSignedData(user, key, data) {
    if(!user || !key) return

    var conditions = []
    for(k in data) {
        conditions.push({k: data[k]})
    }

    var expiration = new Date()
    expiration.setMinutes(expiration.getMinutes() + 10)

    data['user'] = user
    data['policy'] = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify({expiration: expiration.toISOString(), conditions: conditions})))
    data['signature'] = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(data['policy'], key))

    return data
}



angular.module('ekrkApp', ['ngRoute', 'ngResource'])



// ROUTER
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        // $locationProvider.html5Mode(true)
        $routeProvider
            .when('/', {
                templateUrl: 'start',
                controller: 'startCtrl'
            })
            .otherwise({
                redirectTo: '/'
            })
    }])


// START
    .controller('startCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.checkData = function() {
            if(!$scope.application) return
            return $scope.application.forename && $scope.application.surname && $scope.application.email
        }

        $scope.sendLink = function() {
            if(!$scope.application.forename) return
            if(!$scope.application.surname) return
            if(!$scope.application.email) return

            $scope.sending = true
            $http({
                    method : 'POST',
                    url    : API_URL + 'entity-682',
                    data   : getSignedData(API_USER, API_KEY, {
                        'definition': 'person',
                        'person-forename': $scope.application.forename,
                        'person-surname': $scope.application.surname,
                        'person-email': $scope.application.email,
                        'person-company': $scope.application.company,
                        'person-access-entu': $scope.application.access.entu,
                        'person-access-metashare': $scope.application.access.metashare,
                        'person-access-gitlab': $scope.application.access.gitlab,
                        'person-access-hosting': $scope.application.access.hosting,
                        'person-access-www': $scope.application.access.www,
                    })
                })
                .success(function(data) {
                    $scope.id = data.result.id
                    $http({
                            method : 'POST',
                            url    : API_URL + 'entity-' + $scope.id + '/rights',
                            data   : getSignedData(API_USER, API_KEY, {
                                'entity': API_USER
                            })
                        })
                        .success(function(data) {
                            $http({
                                    method : 'POST',
                                    url    : FLEEP_HOOK_URL,
                                    data   : {
                                        'message': 'https://entu.keeleressursid.ee/entity/person/' + $scope.id
                                    }
                                })
                                .success(function(data) {
                                    $scope.sending = false
                                    $scope.sent = true
                                })
                                .error(function(data) {
                                    cl(data.error)
                                    $scope.sending = false
                                })
                        })
                        .error(function(data) {
                            cl(data.error)
                            $scope.sending = false
                        })
                })
                .error(function(data) {
                    cl(data.error)
                    $scope.sending = false
                })
        }
    }])
