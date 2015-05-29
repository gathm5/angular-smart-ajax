'use strict';

if (typeof angular !== 'undefined') {
    angular.module('ngSmartAjax', ['ngStorage'])
        .provider('$smartAjax', [
            function () {
                var endPoint = document.location.protocol + '//' + document.location.host + document.location.pathname, urlSuffix = '';
                var endpoints = {};

                function NetworkObject(config) {
                    if (config) {
                        this.link = config.link || '';
                        this.method = config.method || 'GET';
                        this.contentType = config.contentType || 'application/json';
                        this.cache = !!config.cache;
                        if (this.cache) {
                            this.cachePersistent = !!this.cachePersistent;
                            this.cacheTimeout = this.cacheTimeout || 0;
                        }
                    }
                }

                return {
                    endpoint: function (appEndpoint) {
                        endPoint = appEndpoint;
                    },
                    configure: function (appEndpoints) {
                        for (var end in appEndpoints) {
                            endpoints[end] = new NetworkObject(appEndpoints[end]);
                        }
                    },
                    suffix: function (appSuffix) {
                        urlSuffix = appSuffix;
                    },
                    $get: [
                        '$http',
                        '$q',
                        '$sessionStorage',
                        '$localStorage',
                        function ($http, $q, $sessionStorage, $localStorage) {
                            return {
                                call: function (mode, params) {
                                    var deferred = $q.defer();
                                    var url = endPoint + urlSuffix;
                                    var getParams = '';
                                    var postParams = '';
                                    var cachedData;
                                    url = url.replace(/\/?$/, '/');
                                    if (params) {
                                        if (params.get) {
                                            getParams = '?' + params.get;
                                        }
                                        if (params.post) {
                                            postParams = params.post;
                                        }
                                    }
                                    url = url + endpoints[mode].link + getParams;
                                    url = url.replace(/\/\//g, '/').replace(':/', '://');
                                    var req = {
                                        url: url,
                                        method: endpoints[mode].method || 'get',
                                        data: postParams,
                                        headers: {
                                            'content-type': endpoints[mode].contentType
                                        }
                                    };

                                    if (endpoints[mode].cache) {
                                        if (endpoints[mode].cachePersistent) {
                                            cachedData = $localStorage[url];
                                        }
                                        else {
                                            cachedData = $sessionStorage[url];
                                        }
                                        if (cachedData) {
                                            deferred.resolve(cachedData);
                                            return deferred.promise;
                                        }
                                    }

                                    $http(req)
                                        .success(function (data) {
                                            deferred.resolve(data);
                                            if (endpoints[mode].cache) {
                                                if (endpoints[mode].cachePersistent) {
                                                    $localStorage[url] = data;
                                                }
                                                else {
                                                    $sessionStorage[url] = data;
                                                }
                                            }
                                        })
                                        .error(function (reason) {
                                            deferred.reject(reason);
                                        });
                                    return deferred.promise;
                                }
                            };
                        }
                    ]
                };
            }
        ]);
}