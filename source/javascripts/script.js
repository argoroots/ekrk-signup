var PAGE_URL       = 'http://c3sregistration.studyitin.ee/'
var API_URL        = 'https://entu.keeleressursid.ee/api2/'
var API_USER       = 711
var API_KEY        = 's2SuDSy9Bx5Qowj492ThZSKgZ8yCL7B1qBW2D11qeBF9KivEDCkM8LBvlPoa0Ddb'
// var FLEEP_HOOK_URL = 'https://fleep.io/chat/iMYo7cQRSimxY0w9ieqQCQ'
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
        $scope.services = []

        $http({
                method : 'GET',
                url    : API_URL + 'entity',
                params   : getSignedData(API_USER, API_KEY, {
                    definition: 'service'
                })
            })
            .success(function(data) {
                for(i in data.result) {
                    $http({
                            method : 'GET',
                            url    : API_URL + 'entity-' + data.result[i].id,
                            params   : getSignedData(API_USER, API_KEY, {})
                        })
                        .success(function(data) {
                            var v = {
                                id: data.result.id,
                                fleep: [],
                                checked: false
                            }
                            if(data.result.properties.name.values) v.name = data.result.properties.name.values[0].value
                            if(data.result.properties.url.values) v.url = data.result.properties.url.values[0].value
                            if(data.result.properties.description.values) v.description = data.result.properties.description.values[0].value
                            if(data.result.properties.fleep.values) {
                                for(f in data.result.properties.fleep.values) {
                                    v.fleep.push(data.result.properties.fleep.values[f].value)
                                }
                            }
                            $scope.services.push(v)
                        })
                        .error(function(data) {
                            cl(data.error)
                        })
                }
            })
            .error(function(data) {
                cl(data.error)
            })




        $scope.checkData = function() {
            if(!$scope.application) return false
            if(!$scope.application.forename || !$scope.application.surname || !$scope.application.email || !$scope.services) return false

            var services = []
            for(i in $scope.services) {
                if($scope.services[i].checked) return true
            }

            return false
        }

        $scope.sendLink = function() {
            // if(!$scope.application.forename) return
            // if(!$scope.application.surname) return
            // if(!$scope.application.email) return

            $scope.sending = true

            var services = []
            for(i in $scope.services) {
                if($scope.services[i].checked) services.push($scope.services[i].id)
            }
            cl(services.join(','))

            $http({
                    method : 'POST',
                    url    : API_URL + 'entity-682',
                    data   : getSignedData(API_USER, API_KEY, {
                        'definition': 'person',
                        'person-forename': $scope.application.forename,
                        'person-surname': $scope.application.surname,
                        'person-email': $scope.application.email,
                        'person-company': $scope.application.company
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
                            var tasks = []
                            for(i in $scope.services) {
                                if($scope.services[i].checked) {
                                    $http({
                                        method : 'PUT',
                                        url    : API_URL + 'entity-' + $scope.id,
                                        data   : getSignedData(API_USER, API_KEY, {
                                            'person-service': $scope.services[i].id
                                        })
                                    })
                                    .success(function(data) {
                                        for(f in $scope.services[i].fleep) {
                                            if (tasks.indexOf($scope.services[i].fleep[f]) == -1) tasks.push($scope.services[i].fleep[f])
                                        }
                                    })
                                    .error(function(data) {
                                        cl(data.error)
                                        $scope.sending = false
                                    })
                                }
                            }
                            for(f in tasks) {
                                $http({
                                        method : 'POST',
                                        url    : FLEEP_HOOK_URL,
                                        data   : {
                                            'message': '/taskto @' + tasks[f] + ' https://entu.keeleressursid.ee/entity/person/' + $scope.id
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
                            }
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
